import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, asc } from 'drizzle-orm';
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// Define database schema inline for serverless functions
const phrases = pgTable("phrases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const appConfig = pgTable("app_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentPhraseIndex: integer("current_phrase_index").notNull().default(0),
  dailyRequestCount: integer("daily_request_count").notNull().default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
});

// Initialize database connection for local PostgreSQL
let db: any = null;

function getDb() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/frase_app',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    db = drizzle(pool, { schema: { phrases, appConfig } });
  }
  return db;
}

// Rate limiting constants
const DAILY_LIMIT = 100;

async function getAppConfig() {
  const database = getDb();
  const [config] = await database.select().from(appConfig);
  
  if (!config) {
    // Create initial config if it doesn't exist
    const [newConfig] = await database
      .insert(appConfig)
      .values({
        currentPhraseIndex: 0,
        dailyRequestCount: 0,
        lastResetDate: new Date(),
      })
      .returning();
    return newConfig;
  }
  
  return config;
}

async function shouldResetDailyCount() {
  const config = await getAppConfig();
  const today = new Date();
  const lastReset = new Date(config.lastResetDate);
  
  return today.toDateString() !== lastReset.toDateString();
}

async function resetDailyRequestCount() {
  const database = getDb();
  const config = await getAppConfig();
  await database
    .update(appConfig)
    .set({ 
      dailyRequestCount: 0,
      lastResetDate: new Date()
    })
    .where(eq(appConfig.id, config.id));
}

async function updateCurrentPhraseIndex(index: number) {
  const database = getDb();
  const config = await getAppConfig();
  await database
    .update(appConfig)
    .set({ currentPhraseIndex: index })
    .where(eq(appConfig.id, config.id));
}

async function incrementDailyRequestCount() {
  const database = getDb();
  const config = await getAppConfig();
  const newCount = config.dailyRequestCount + 1;
  
  await database
    .update(appConfig)
    .set({ dailyRequestCount: newCount })
    .where(eq(appConfig.id, config.id));
  
  return newCount;
}

async function getPhraseByIndex(index: number) {
  const database = getDb();
  const allPhrases = await database.select().from(phrases).orderBy(asc(phrases.createdAt));
  return allPhrases[index] || undefined;
}

async function getTotalPhrasesCount() {
  const database = getDb();
  const result = await database.select({ count: phrases.id }).from(phrases);
  return result.length;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    // Check if we need to reset daily count
    if (await shouldResetDailyCount()) {
      await resetDailyRequestCount();
    }

    // Check rate limit
    const config = await getAppConfig();
    if (config.dailyRequestCount >= DAILY_LIMIT) {
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).send('Rate limit exceeded. Maximum 100 requests per day.');
    }

    // Get total phrases count
    const totalPhrases = await getTotalPhrasesCount();
    if (totalPhrases === 0) {
      return res.status(404).send('No phrases available. Please add some phrases first.');
    }

    // Get current phrase by index (sequential n+1 pattern)
    const currentIndex = config.currentPhraseIndex % totalPhrases;
    const phrase = await getPhraseByIndex(currentIndex);
    
    if (!phrase) {
      return res.status(404).send('Phrase not found.');
    }

    // Update index for next request and increment daily count
    const nextIndex = (currentIndex + 1) % totalPhrases;
    await updateCurrentPhraseIndex(nextIndex);
    const newDailyCount = await incrementDailyRequestCount();

    // Set rate limit headers
    res.setHeader('X-RateLimit-Remaining', String(DAILY_LIMIT - newDailyCount));
    res.setHeader('X-RateLimit-Limit', String(DAILY_LIMIT));

    // Return plain text response
    res.setHeader('Content-Type', 'text/plain');
    res.send(phrase.content);
  } catch (error) {
    console.error('Error fetching phrase:', error);
    res.status(500).send('Internal server error');
  }
}
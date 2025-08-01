import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { phrases, appConfig, type Phrase, type AppConfig } from '../../shared/schema';
import { eq, asc } from 'drizzle-orm';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Rate limiting constants
const DAILY_LIMIT = 100;

async function getAppConfig(): Promise<AppConfig> {
  const [config] = await db.select().from(appConfig);
  
  if (!config) {
    // Create initial config if it doesn't exist
    const [newConfig] = await db
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

async function shouldResetDailyCount(): Promise<boolean> {
  const config = await getAppConfig();
  const today = new Date();
  const lastReset = new Date(config.lastResetDate);
  
  return today.toDateString() !== lastReset.toDateString();
}

async function resetDailyRequestCount(): Promise<void> {
  const config = await getAppConfig();
  await db
    .update(appConfig)
    .set({ 
      dailyRequestCount: 0,
      lastResetDate: new Date()
    })
    .where(eq(appConfig.id, config.id));
}

async function updateCurrentPhraseIndex(index: number): Promise<void> {
  const config = await getAppConfig();
  await db
    .update(appConfig)
    .set({ currentPhraseIndex: index })
    .where(eq(appConfig.id, config.id));
}

async function incrementDailyRequestCount(): Promise<number> {
  const config = await getAppConfig();
  const newCount = config.dailyRequestCount + 1;
  
  await db
    .update(appConfig)
    .set({ dailyRequestCount: newCount })
    .where(eq(appConfig.id, config.id));
  
  return newCount;
}

async function getPhraseByIndex(index: number): Promise<Phrase | undefined> {
  const allPhrases = await db.select().from(phrases).orderBy(asc(phrases.createdAt));
  return allPhrases[index] || undefined;
}

async function getTotalPhrasesCount(): Promise<number> {
  const result = await db.select({ count: phrases.id }).from(phrases);
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
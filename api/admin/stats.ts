import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const database = getDb();
    
    // Get app config
    const [config] = await database.select().from(appConfig);
    
    // Get total phrases count
    const allPhrases = await database.select({ count: phrases.id }).from(phrases);
    const totalPhrases = allPhrases.length;
    
    res.json({
      totalPhrases,
      currentIndex: config?.currentPhraseIndex || 0,
      dailyRequests: config?.dailyRequestCount || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
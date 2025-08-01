import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { asc } from 'drizzle-orm';
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

// Define database schema inline for serverless functions
const phrases = pgTable("phrases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

let db: any = null;

function getDb() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/frase_app',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    db = drizzle(pool, { schema: { phrases } });
  }
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const database = getDb();
  
  try {
    if (req.method === 'GET') {
      // Get all phrases
      const allPhrases = await database.select().from(phrases).orderBy(asc(phrases.createdAt));
      return res.json(allPhrases);
    }

    if (req.method === 'DELETE') {
      // Delete all phrases
      await database.delete(phrases);
      return res.json({ message: 'All phrases deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in phrases endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
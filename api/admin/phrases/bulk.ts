import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { z } from 'zod';
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Define database schema inline for serverless functions
const phrases = pgTable("phrases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const insertPhraseSchema = createInsertSchema(phrases).pick({
  content: true,
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phrases: phrasesText } = req.body;
    
    if (!phrasesText || typeof phrasesText !== "string") {
      return res.status(400).json({ error: "Phrases text is required" });
    }

    // Split by semicolon and clean up
    const phraseContents = phrasesText
      .split(";")
      .map((phrase: string) => phrase.trim())
      .filter((phrase: string) => phrase.length > 0);

    if (phraseContents.length === 0) {
      return res.status(400).json({ error: "No valid phrases found" });
    }

    // Validate each phrase
    for (const content of phraseContents) {
      insertPhraseSchema.parse({ content });
    }

    // Insert phrases
    const database = getDb();
    const phrasesToInsert = phraseContents.map(content => ({ content }));
    const addedPhrases = await database
      .insert(phrases)
      .values(phrasesToInsert)
      .returning();

    res.json({ 
      message: `${addedPhrases.length} phrases added successfully`,
      count: addedPhrases.length 
    });
  } catch (error) {
    console.error("Error adding bulk phrases:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid phrase data" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { phrases, insertPhraseSchema } from '../../../../shared/schema';
import { z } from 'zod';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

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
    const phrasesToInsert = phraseContents.map(content => ({ content }));
    const addedPhrases = await db
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
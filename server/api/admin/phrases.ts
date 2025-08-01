import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { phrases } from '../../../shared/schema';
import { asc } from 'drizzle-orm';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Get all phrases
      const allPhrases = await db.select().from(phrases).orderBy(asc(phrases.createdAt));
      return res.json(allPhrases);
    }

    if (req.method === 'DELETE') {
      // Delete all phrases
      await db.delete(phrases);
      return res.json({ message: 'All phrases deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in phrases endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
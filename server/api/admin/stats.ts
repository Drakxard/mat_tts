import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { phrases, appConfig } from '../../../shared/schema';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get app config
    const [config] = await db.select().from(appConfig);
    
    // Get total phrases count
    const allPhrases = await db.select({ count: phrases.id }).from(phrases);
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
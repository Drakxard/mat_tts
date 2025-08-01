import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { asc } from 'drizzle-orm';
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

// Define database schema inline for serverless functions
const phrases = pgTable("phrases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = globalThis.WebSocket || require('ws');

let db: any = null;

function getDb() {
  if (!db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
  }
  return db;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const format = req.query.format as string || "txt";
    const database = getDb();
    const allPhrases = await database.select().from(phrases).orderBy(asc(phrases.createdAt));

    if (format === "csv") {
      const csvContent = ["ID,Content,Created At"]
        .concat(allPhrases.map(p => `"${p.id}","${p.content.replace(/"/g, '""')}","${p.createdAt}"`))
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=phrases.csv");
      res.send(csvContent);
    } else {
      const txtContent = allPhrases.map(p => p.content).join("\n");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=phrases.txt");
      res.send(txtContent);
    }
  } catch (error) {
    console.error("Error exporting phrases:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
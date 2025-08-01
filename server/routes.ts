import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPhraseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting constants
  const DAILY_LIMIT = 100;

  // GET /api/frase - Returns sequential phrases in plain text
  app.get("/api/frase", async (req, res) => {
    try {
      // Check if we need to reset daily count
      if (await storage.shouldResetDailyCount()) {
        await storage.resetDailyRequestCount();
      }

      // Check rate limit
      const config = await storage.getAppConfig();
      if (config.dailyRequestCount >= DAILY_LIMIT) {
        res.status(429);
        res.set("X-RateLimit-Remaining", "0");
        return res.send("Rate limit exceeded. Maximum 100 requests per day.");
      }

      // Get total phrases count
      const totalPhrases = await storage.getTotalPhrasesCount();
      if (totalPhrases === 0) {
        res.status(404);
        return res.send("No phrases available. Please add some phrases first.");
      }

      // Get current phrase by index (sequential n+1 pattern)
      const currentIndex = config.currentPhraseIndex % totalPhrases;
      const phrase = await storage.getPhraseByIndex(currentIndex);
      
      if (!phrase) {
        res.status(404);
        return res.send("Phrase not found.");
      }

      // Update index for next request and increment daily count
      const nextIndex = (currentIndex + 1) % totalPhrases;
      await storage.updateCurrentPhraseIndex(nextIndex);
      const newDailyCount = await storage.incrementDailyRequestCount();

      // Set rate limit headers
      res.set("X-RateLimit-Remaining", String(DAILY_LIMIT - newDailyCount));
      res.set("X-RateLimit-Limit", String(DAILY_LIMIT));

      // Return plain text response
      res.set("Content-Type", "text/plain");
      res.send(phrase.content);
    } catch (error) {
      console.error("Error fetching phrase:", error);
      res.status(500).send("Internal server error");
    }
  });

  // GET /api/admin/stats - Get admin statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const config = await storage.getAppConfig();
      const totalPhrases = await storage.getTotalPhrasesCount();
      
      res.json({
        totalPhrases,
        currentIndex: config.currentPhraseIndex,
        dailyRequests: config.dailyRequestCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/phrases - Get all phrases
  app.get("/api/admin/phrases", async (req, res) => {
    try {
      const phrases = await storage.getAllPhrases();
      res.json(phrases);
    } catch (error) {
      console.error("Error fetching phrases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/admin/phrases/bulk - Add phrases in bulk
  app.post("/api/admin/phrases/bulk", async (req, res) => {
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

      const addedPhrases = await storage.addPhrases(phraseContents);
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
  });

  // DELETE /api/admin/phrases - Delete all phrases
  app.delete("/api/admin/phrases", async (req, res) => {
    try {
      await storage.deleteAllPhrases();
      res.json({ message: "All phrases deleted successfully" });
    } catch (error) {
      console.error("Error deleting phrases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/admin/phrases/:id - Delete specific phrase
  app.delete("/api/admin/phrases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePhraseById(id);
      res.json({ message: "Phrase deleted successfully" });
    } catch (error) {
      console.error("Error deleting phrase:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/export - Export phrases
  app.get("/api/admin/export", async (req, res) => {
    try {
      const format = req.query.format as string || "txt";
      const phrases = await storage.getAllPhrases();

      if (format === "csv") {
        const csvContent = ["ID,Content,Created At"]
          .concat(phrases.map(p => `"${p.id}","${p.content.replace(/"/g, '""')}","${p.createdAt}"`))
          .join("\n");

        res.set("Content-Type", "text/csv");
        res.set("Content-Disposition", "attachment; filename=phrases.csv");
        res.send(csvContent);
      } else {
        const txtContent = phrases.map(p => p.content).join("\n");
        res.set("Content-Type", "text/plain");
        res.set("Content-Disposition", "attachment; filename=phrases.txt");
        res.send(txtContent);
      }
    } catch (error) {
      console.error("Error exporting phrases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

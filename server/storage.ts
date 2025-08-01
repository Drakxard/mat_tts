import { 
  users, 
  phrases, 
  appConfig,
  type User, 
  type InsertUser, 
  type Phrase, 
  type InsertPhrase,
  type AppConfig,
  type InsertAppConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Phrase management
  getAllPhrases(): Promise<Phrase[]>;
  addPhrase(phrase: InsertPhrase): Promise<Phrase>;
  addPhrases(phraseContents: string[]): Promise<Phrase[]>;
  deleteAllPhrases(): Promise<void>;
  deletePhraseById(id: string): Promise<void>;
  getPhraseByIndex(index: number): Promise<Phrase | undefined>;
  getTotalPhrasesCount(): Promise<number>;
  
  // App configuration
  getAppConfig(): Promise<AppConfig>;
  updateCurrentPhraseIndex(index: number): Promise<void>;
  incrementDailyRequestCount(): Promise<number>;
  resetDailyRequestCount(): Promise<void>;
  shouldResetDailyCount(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllPhrases(): Promise<Phrase[]> {
    return await db.select().from(phrases).orderBy(asc(phrases.createdAt));
  }

  async addPhrase(phrase: InsertPhrase): Promise<Phrase> {
    const [newPhrase] = await db
      .insert(phrases)
      .values(phrase)
      .returning();
    return newPhrase;
  }

  async addPhrases(phraseContents: string[]): Promise<Phrase[]> {
    if (phraseContents.length === 0) return [];
    
    const phrasesToInsert = phraseContents.map(content => ({ content }));
    return await db
      .insert(phrases)
      .values(phrasesToInsert)
      .returning();
  }

  async deleteAllPhrases(): Promise<void> {
    await db.delete(phrases);
    // Reset the phrase index when all phrases are deleted
    await this.updateCurrentPhraseIndex(0);
  }

  async deletePhraseById(id: string): Promise<void> {
    await db.delete(phrases).where(eq(phrases.id, id));
  }

  async getPhraseByIndex(index: number): Promise<Phrase | undefined> {
    const allPhrases = await db.select().from(phrases).orderBy(asc(phrases.createdAt));
    return allPhrases[index] || undefined;
  }

  async getTotalPhrasesCount(): Promise<number> {
    const result = await db.select({ count: phrases.id }).from(phrases);
    return result.length;
  }

  async getAppConfig(): Promise<AppConfig> {
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

  async updateCurrentPhraseIndex(index: number): Promise<void> {
    const config = await this.getAppConfig();
    await db
      .update(appConfig)
      .set({ currentPhraseIndex: index })
      .where(eq(appConfig.id, config.id));
  }

  async incrementDailyRequestCount(): Promise<number> {
    const config = await this.getAppConfig();
    const newCount = config.dailyRequestCount + 1;
    
    await db
      .update(appConfig)
      .set({ dailyRequestCount: newCount })
      .where(eq(appConfig.id, config.id));
    
    return newCount;
  }

  async resetDailyRequestCount(): Promise<void> {
    const config = await this.getAppConfig();
    await db
      .update(appConfig)
      .set({ 
        dailyRequestCount: 0,
        lastResetDate: new Date()
      })
      .where(eq(appConfig.id, config.id));
  }

  async shouldResetDailyCount(): Promise<boolean> {
    const config = await this.getAppConfig();
    const today = new Date();
    const lastReset = new Date(config.lastResetDate);
    
    // Check if it's a new day
    return today.toDateString() !== lastReset.toDateString();
  }
}

export const storage = new DatabaseStorage();

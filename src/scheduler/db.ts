import type { CardReviewState, DailyStats, SchedulerSettings, StoredReviewLog } from "./types";
import { DEFAULT_SCHEDULER_SETTINGS } from "./types";

const DB_NAME = "anki-review-db";
const DB_VERSION = 1;

/**
 * IndexedDB wrapper for persisting review state
 */
export class ReviewDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  /**
   * Initialize the database
   */
  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for card review states
        if (!db.objectStoreNames.contains("cards")) {
          const cardStore = db.createObjectStore("cards", { keyPath: "cardId" });
          cardStore.createIndex("deckId", "deckId", { unique: false });
          cardStore.createIndex("due", "sm2State.due", { unique: false });
        }

        // Store for review logs
        if (!db.objectStoreNames.contains("reviewLogs")) {
          const logStore = db.createObjectStore("reviewLogs", { keyPath: "timestamp" });
          logStore.createIndex("cardId", "cardId", { unique: false });
          logStore.createIndex("date", "timestamp", { unique: false });
        }

        // Store for daily statistics
        if (!db.objectStoreNames.contains("dailyStats")) {
          db.createObjectStore("dailyStats", { keyPath: "date" });
        }

        // Store for settings
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "deckId" });
        }
      };
    });
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureInit(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  /**
   * Get review state for a card
   */
  async getCard(cardId: string): Promise<CardReviewState | null> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cards"], "readonly");
      const store = transaction.objectStore("cards");
      const request = store.get(cardId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save or update card review state
   */
  async saveCard(card: CardReviewState): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cards"], "readwrite");
      const store = transaction.objectStore("cards");
      const request = store.put(card);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cards for a deck
   */
  async getCardsForDeck(deckId: string): Promise<CardReviewState[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cards"], "readonly");
      const store = transaction.objectStore("cards");
      const index = store.index("deckId");
      const request = index.getAll(deckId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all card IDs for a deck (lightweight)
   */
  async getCardIdsForDeck(deckId: string): Promise<string[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cards"], "readonly");
      const store = transaction.objectStore("cards");
      const index = store.index("deckId");
      const request = index.getAllKeys(deckId);

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a review log entry
   */
  async saveReviewLog(log: StoredReviewLog): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["reviewLogs"], "readwrite");
      const store = transaction.objectStore("reviewLogs");
      const request = store.put(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get review logs for a card
   */
  async getReviewLogsForCard(cardId: string): Promise<StoredReviewLog[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["reviewLogs"], "readonly");
      const store = transaction.objectStore("reviewLogs");
      const index = store.index("cardId");
      const request = index.getAll(cardId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(date: string): Promise<DailyStats | null> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["dailyStats"], "readonly");
      const store = transaction.objectStore("dailyStats");
      const request = store.get(date);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save daily statistics
   */
  async saveDailyStats(stats: DailyStats): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["dailyStats"], "readwrite");
      const store = transaction.objectStore("dailyStats");
      const request = store.put(stats);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get scheduler settings for a deck
   */
  async getSettings(deckId: string): Promise<SchedulerSettings> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const request = store.get(deckId);

      request.onsuccess = () =>
        resolve(request.result?.settings || DEFAULT_SCHEDULER_SETTINGS);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save scheduler settings for a deck
   */
  async saveSettings(deckId: string, settings: SchedulerSettings): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.put({ deckId, settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all review data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["cards", "reviewLogs", "dailyStats", "settings"],
        "readwrite",
      );

      const stores = ["cards", "reviewLogs", "dailyStats", "settings"];
      let completed = 0;

      for (const storeName of stores) {
        const request = transaction.objectStore(storeName).clear();
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      }
    });
  }
}

/**
 * Singleton instance
 */
export const reviewDB = new ReviewDB();

/**
 * In-memory semantic vector store.
 * Stores input text, embedding, execution policy, and output for future retrieval.
 */

import type { ExecutionPolicy } from "./policy.js";
import { cosine } from "./similarity.js";
import { embed } from "./embed.js";

export interface MemoryEntry {
  /** Original input text */
  input: string;
  /** Embedding vector */
  embedding: number[];
  /** Execution policy used */
  policy: ExecutionPolicy;
  /** Output produced */
  output: string;
  /** Timestamp when the entry was stored */
  timestamp: number;
}

export interface RetrievalResult {
  /** The best matching memory entry, or null if store is empty */
  entry: MemoryEntry | null;
  /** Cosine similarity score (0–1+) */
  similarity: number;
}

/**
 * Minimum similarity threshold for a match to be considered "similar".
 * Below this, we treat it as no useful match.
 */
const SIMILARITY_THRESHOLD = 0.50;

/**
 * In-memory semantic store.
 */
class SemanticMemoryStore {
  private store: MemoryEntry[] = [];

  /**
   * Store a new memory entry.
   */
  add(input: string, policy: ExecutionPolicy, output: string): MemoryEntry {
    const entry: MemoryEntry = {
      input,
      embedding: embed(input),
      policy,
      output,
      timestamp: Date.now(),
    };
    this.store.push(entry);

    // Limit store size to prevent unbounded memory growth
    if (this.store.length > 1000) {
      this.store.shift();
    }

    return entry;
  }

  /**
   * Retrieve the most similar past memory entry for the given input.
   */
  retrieveSimilar(input: string): RetrievalResult {
    if (this.store.length === 0) {
      return { entry: null, similarity: 0 };
    }

    const inputEmbedding = embed(input);
    let bestMatch: MemoryEntry | null = null;
    let bestSimilarity = -1;

    for (const entry of this.store) {
      const sim = cosine(inputEmbedding, entry.embedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = entry;
      }
    }

    if (bestSimilarity < SIMILARITY_THRESHOLD) {
      return { entry: null, similarity: bestSimilarity };
    }

    return { entry: bestMatch, similarity: bestSimilarity };
  }

  /**
   * Get the total number of stored entries.
   */
  get size(): number {
    return this.store.length;
  }

  /**
   * Clear all stored memories.
   */
  clear(): void {
    this.store = [];
  }
}

/** Singleton memory store instance */
export const memoryStore = new SemanticMemoryStore();

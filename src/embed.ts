/**
 * Lightweight deterministic embedding function.
 * Produces a fixed-length numeric vector (length 128) from arbitrary text
 * using character trigram + word n-gram hashing.
 * Same input always produces the same output.
 * No external ML models required.
 */

const EMBEDDING_DIM = 128;

/**
 * Normalize a vector to unit length (L2 normalization).
 */
function normalize(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vec;
  return vec.map((v) => v / magnitude);
}

/**
 * FNV-1a hash — deterministic, good distribution, returns 32-bit unsigned integer.
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Add a hashed token contribution to the raw vector.
 * The contribution decreases with token index (position weighting).
 */
function contribute(
  raw: number[],
  token: string,
  index: number,
  weight: number,
): void {
  const hash = fnv1a(token);
  const dim = hash % EMBEDDING_DIM;

  // Position weight: earlier tokens matter more
  const positionWeight = 1 / Math.log2(index + 2);

  // Strength from hash distribution
  const strength = ((hash / 0xffffffff) * 0.5 + 0.5) * positionWeight * weight;

  raw[dim] += strength;
}

/**
 * Tokenize text into lowercased words, preserving alphanumeric sequences.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 0);
}

/**
 * Generate character-level trigrams from text.
 * These capture sub-word similarity (e.g., "login" and "log_in" share "log" + "ogi").
 */
function charTrigrams(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const trigrams: string[] = [];
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.push(normalized.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Generate a deterministic embedding vector of length EMBEDDING_DIM from input text.
 *
 * Algorithm:
 *   1. Tokenize input into words and extract character trigrams
 *   2. Hash each word (unigram) into vector dimensions
 *   3. Hash adjacent word bigrams for phrase-level signal
 *   4. Hash character trigrams for sub-word signal (captures typos, alternate forms)
 *   5. L2-normalize the final vector
 *
 * This multi-level hashing ensures similar topics cluster while unrelated
 * topics spread across different dimension subspaces.
 */
export function embed(text: string): number[] {
  if (!text.trim()) return new Array(EMBEDDING_DIM).fill(0);

  const raw = new Array(EMBEDDING_DIM).fill(0);
  const tokens = tokenize(text);

  // Level 1: Word unigrams
  for (let i = 0; i < tokens.length; i++) {
    contribute(raw, tokens[i], i, 1.0);
  }

  // Level 2: Word bigrams (captures phrases like "rest api", "jwt auth")
  for (let i = 0; i < tokens.length - 1; i++) {
    contribute(raw, `w:${tokens[i]}:${tokens[i + 1]}`, i, 0.9);
  }

  // Level 3: Word trigrams (captures longer phrases)
  for (let i = 0; i < tokens.length - 2; i++) {
    contribute(raw, `t:${tokens[i]}:${tokens[i + 1]}:${tokens[i + 2]}`, i, 0.7);
  }

  // Level 4: Character trigrams (sub-word level similarity)
  const cTrigrams = charTrigrams(text);
  for (let i = 0; i < cTrigrams.length; i++) {
    contribute(raw, `c:${cTrigrams[i]}`, i, 0.3);
  }

  return normalize(raw);
}

export { EMBEDDING_DIM };

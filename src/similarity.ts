/**
 * Cosine similarity computation between two numeric vectors.
 */

/**
 * Compute the dot product of two equal-length vectors.
 */
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Compute the L2 magnitude of a vector.
 */
function magnitude(vec: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

/**
 * Compute cosine similarity between two numeric vectors.
 *
 * cos(a, b) = dot(a, b) / (|a| * |b|)
 *
 * Returns a value between -1 and 1, where:
 *   1  = identical direction
 *   0  = orthogonal (no similarity)
 *  -1  = opposite direction
 *
 * If either vector has zero magnitude, returns 0.
 */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) return 0;

  return dot(a, b) / (magA * magB);
}

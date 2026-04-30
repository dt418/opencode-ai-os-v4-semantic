/**
 * Adaptive semantic execution engine — the main orchestrator.
 *
 * Flow:
 *   1. Retrieve similar past memory
 *   2. Generate semantic execution policy
 *   3. Execute planner → coder → (optional reviewer) pipeline
 *   4. Store result into memory
 *   5. Return result + policy + similarity score
 */

import { memoryStore } from "./memory.js";
import type { RetrievalResult } from "./memory.js";
import { synthesizePolicy } from "./policy.js";
import type { ExecutionPolicy } from "./policy.js";
import { planner, coder, reviewer } from "./exec.js";
import type {
  PlanResult,
  CodeResult,
  ReviewResult,
  ExecutionResult,
} from "./exec.js";

export interface AdaptiveResult {
  /** The execution result (plan, code, review) */
  execution: ExecutionResult;
  /** The policy that was synthesized for this request */
  policy: ExecutionPolicy;
  /** Similarity score to the best past match (0 if no match) */
  similarity: number;
  /** Whether a similar past memory was found */
  memoryHit: boolean;
  /** Number of entries in the memory store after this execution */
  memorySize: number;
}

/**
 * Main adaptive engine entry point.
 *
 * @param input - The user's input / task description
 * @returns Full execution result with policy and memory metadata
 */
export function adaptiveEngine(input: string): AdaptiveResult {
  // 1. Retrieve similar memory
  const retrieval: RetrievalResult = memoryStore.retrieveSimilar(input);

  // 2. Generate semantic policy
  const policy: ExecutionPolicy = synthesizePolicy(input, retrieval);

  // 3. Execute pipeline
  const plan: PlanResult = planner(input, policy);
  const code: CodeResult = coder(plan, policy);

  let review: ReviewResult | null = null;
  if (policy.reasoningDepth >= 3) {
    review = reviewer(code, policy);
  }

  const execution: ExecutionResult = { plan, code, review };

  // 4. Store result into memory
  const outputSummary = JSON.stringify({
    planSummary: plan.summary,
    phaseCount: plan.phases.length,
    reviewPassed: review?.passed ?? null,
    reviewScore: review?.score ?? null,
  });

  memoryStore.add(input, policy, outputSummary);

  // 5. Return full result
  return {
    execution,
    policy,
    similarity: retrieval.similarity,
    memoryHit: retrieval.entry !== null,
    memorySize: memoryStore.size,
  };
}

/**
 * Get the current memory store state (for inspection).
 */
export function getMemoryState(): {
  size: number;
  entries: Array<{ input: string; policy: ExecutionPolicy; similarity?: number }>;
} {
  return {
    size: memoryStore.size,
    entries: [], // Don't leak full embeddings in state inspection
  };
}

/**
 * Policy synthesizer — replaces all hardcoded modes (FAST/DEEP/MCP).
 * Dynamically generates an execution policy based on input analysis
 * and similarity to past tasks.
 */

import type { RetrievalResult } from "./memory.js";

export interface ExecutionPolicy {
  /** Number of execution pipeline steps (1–5) */
  steps: number;
  /** Tool usage level */
  toolUsage: "none" | "light" | "full";
  /** Reasoning depth (1–10) */
  reasoningDepth: number;
  /** Async / parallelization level (1–5) */
  asyncLevel: number;
}

/**
 * Default policy used when no similar memory is found.
 */
const DEFAULT_POLICY: ExecutionPolicy = {
  steps: 3,
  toolUsage: "full",
  reasoningDepth: 5,
  asyncLevel: 2,
};

/**
 * Analyze input text to estimate complexity.
 * Complexity drives the base policy before similarity adjustment.
 */
function analyzeComplexity(input: string): number {
  const len = input.length;
  const words = input.split(/\s+/).length;
  const hasCode = /`|```|function|class|import|export|const|let|var|def |fn /.test(
    input
  );
  const hasMultipleRequirements =
    (input.match(/(?:shall|must|should|need|require)/gi)?.length ?? 0) > 2;
  const hasConstraints =
    /must not|cannot|restricted|strict|only|no /i.test(input);

  let complexity = 0.5; // baseline

  if (len > 500) complexity += 0.15;
  if (len > 1000) complexity += 0.1;
  if (words > 50) complexity += 0.1;
  if (hasCode) complexity += 0.1;
  if (hasMultipleRequirements) complexity += 0.1;
  if (hasConstraints) complexity += 0.05;

  return Math.min(complexity, 1.0);
}

/**
 * Synthesize an execution policy based on the input and the
 * most similar past memory entry.
 *
 * Rules:
 * - Higher similarity → reuse/inherit previous policy more strongly
 * - Lower similarity → increase exploration (more steps, deeper reasoning)
 */
export function synthesizePolicy(
  input: string,
  retrieval: RetrievalResult
): ExecutionPolicy {
  const complexity = analyzeComplexity(input);
  const similarity = retrieval.similarity;
  const hasMatch = retrieval.entry !== null;

  if (!hasMatch) {
    // No similar memory — generate from scratch based on complexity
    return generateFromComplexity(complexity);
  }

  // Blend previous policy with complexity-driven adjustments
  const prev = retrieval.entry!.policy;

  // Similarity weight: how much to reuse previous policy
  const reuseWeight = Math.max(0, similarity);
  const exploreWeight = 1 - reuseWeight;

  // Base from previous policy, adjusted by complexity and similarity
  const baseSteps = Math.round(
    prev.steps * reuseWeight + (complexity * 5) * exploreWeight
  );

  const steps = clamp(Math.round(baseSteps), 1, 5);

  const reasoningDepth = clamp(
    Math.round(
      prev.reasoningDepth * reuseWeight + (complexity * 10) * exploreWeight
    ),
    1,
    10
  );

  const asyncLevel = clamp(
    Math.round(prev.asyncLevel * reuseWeight + (complexity * 3) * exploreWeight),
    1,
    5
  );

  let toolUsage: "none" | "light" | "full";
  if (steps <= 1) {
    toolUsage = "none";
  } else if (steps <= 3) {
    toolUsage = "light";
  } else {
    toolUsage = "full";
  }

  return { steps, toolUsage, reasoningDepth, asyncLevel };
}

/**
 * Generate a policy solely from complexity analysis (no similar memory).
 */
function generateFromComplexity(complexity: number): ExecutionPolicy {
  if (complexity < 0.3) {
    return { steps: 1, toolUsage: "none", reasoningDepth: 1, asyncLevel: 1 };
  }
  if (complexity < 0.5) {
    return { steps: 2, toolUsage: "light", reasoningDepth: 3, asyncLevel: 2 };
  }
  if (complexity < 0.7) {
    return { steps: 3, toolUsage: "full", reasoningDepth: 5, asyncLevel: 3 };
  }
  if (complexity < 0.9) {
    return { steps: 4, toolUsage: "full", reasoningDepth: 7, asyncLevel: 4 };
  }
  return { steps: 5, toolUsage: "full", reasoningDepth: 10, asyncLevel: 5 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export { DEFAULT_POLICY };

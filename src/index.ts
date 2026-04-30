/**
 * OpenCode plugin entry: opencode-ai-os-v4-semantic
 *
 * An adaptive semantic AI execution engine that learns from past tasks
 * and dynamically generates execution policy without hardcoded modes.
 *
 * Hooks into OpenCode's request pipeline:
 *   - Intercepts incoming requests
 *   - Runs the adaptive semantic engine
 *   - Attaches results to ctx.meta
 *   - Passes control to the next handler
 */

import { adaptiveEngine } from "./engine.js";
import type { AdaptiveResult } from "./engine.js";

/**
 * Expected shape of the OpenCode plugin context.
 */
interface OpenCodeContext {
  input: string;
  meta: Record<string, unknown>;
}

interface OpenCodeHooks {
  onRequest: (
    handler: (ctx: OpenCodeContext, next: () => Promise<void>) => Promise<void>
  ) => void;
}

interface OpenCodeAPI {
  hooks: OpenCodeHooks;
  version: string;
}

/**
 * Plugin definition — exported as default per OpenCode convention.
 */
export default function plugin(opencode: OpenCodeAPI): void {
  opencode.hooks.onRequest(async (ctx, next) => {
    const input = ctx.input ?? "";

    if (!input.trim()) {
      await next();
      return;
    }

    const result: AdaptiveResult = adaptiveEngine(input);

    // Attach semantic engine results to context metadata
    ctx.meta.semanticEngine = {
      policy: result.policy,
      similarity: result.similarity,
      memoryHit: result.memoryHit,
      memorySize: result.memorySize,
      plan: result.execution.plan,
      review: result.execution.review,
      code: result.execution.code,
    };

    await next();
  });
}

// Re-export public API for consumers
export { adaptiveEngine } from "./engine.js";
export { embed, EMBEDDING_DIM } from "./embed.js";
export { cosine } from "./similarity.js";
export { memoryStore } from "./memory.js";
export { synthesizePolicy } from "./policy.js";
export { planner, coder, reviewer } from "./exec.js";
export type { MemoryEntry, RetrievalResult } from "./memory.js";
export type { ExecutionPolicy } from "./policy.js";
export type { PlanResult, CodeResult, ReviewResult, ExecutionResult } from "./exec.js";
export type { AdaptiveResult } from "./engine.js";

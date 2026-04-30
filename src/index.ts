/**
 * OpenCode plugin: opencode-ai-os-v4-semantic
 *
 * An adaptive semantic AI execution engine that learns from past tasks
 * and dynamically generates execution policy without hardcoded modes.
 *
 * ## Plugin usage (auto-loaded by OpenCode)
 *
 * Add to opencode.json:
 *   { "plugin": ["opencode-ai-os-v4-semantic"] }
 *
 * The plugin hooks into `message.updated` events, runs the adaptive
 * semantic engine on user messages, logs the synthesized policy, and
 * injects semantic context into the session.
 *
 * ## Programmatic usage
 *
 *   import { adaptiveEngine, embed, cosine, memoryStore } from "opencode-ai-os-v4-semantic"
 */

import { adaptiveEngine } from "./engine.js"

interface PluginContext {
  client: {
    app: {
      log(params: {
        body: {
          service: string
          level: "debug" | "info" | "warn" | "error"
          message: string
          extra?: Record<string, unknown>
        }
      }): Promise<void>
    }
    session: {
      prompt(params: {
        path: { id: string }
        body: {
          noReply: boolean
          parts: Array<{ type: "text"; text: string }>
        }
      }): Promise<unknown>
    }
  }
}

interface PluginEvent {
  type: string
  properties?: Record<string, unknown>
}

/**
 * OpenCode plugin entry point.
 *
 * Hooks into `message.updated` events to intercept user messages,
 * run the adaptive semantic engine, and inject context.
 */
export const SemanticPlugin = async ({ client }: PluginContext) => {
  return {
    event: async ({ event }: { event: PluginEvent }) => {
      if (event.type !== "message.updated") return

      const props = event.properties ?? {}
      const message = props.message as
        | { info?: { role?: string }; parts?: Array<{ type?: string; text?: string }> }
        | undefined

      if (!message || message.info?.role !== "user") return

      // Extract all text parts from the user message
      const textParts = message.parts?.filter((p) => p.type === "text") ?? []
      const input = textParts.map((p) => p.text ?? "").join("\n")

      if (!input.trim()) return

      // Run the adaptive semantic engine
      const result = adaptiveEngine(input)

      // Log the synthesized policy + memory state
      await client.app.log({
        body: {
          service: "opencode-ai-os-v4-semantic",
          level: "info",
          message:
            `steps=${result.policy.steps} tool=${result.policy.toolUsage} ` +
            `depth=${result.policy.reasoningDepth} async=${result.policy.asyncLevel} ` +
            `sim=${result.similarity.toFixed(2)} mem=${result.memorySize}`,
          extra: {
            policy: result.policy,
            similarity: result.similarity,
            memoryHit: result.memoryHit,
            memorySize: result.memorySize,
          },
        },
      })

      // Inject semantic context into the session (best-effort)
      const sessionId = props.sessionId as string | undefined
      if (sessionId) {
        try {
          await client.session.prompt({
            path: { id: sessionId },
            body: {
              noReply: true,
              parts: [
                {
                  type: "text",
                  text:
                    `[Semantic Engine] Adaptive policy synthesized: ` +
                    `steps=${result.policy.steps}, toolUsage=${result.policy.toolUsage}, ` +
                    `reasoningDepth=${result.policy.reasoningDepth}. ` +
                    (result.memoryHit
                      ? `Similar past task found (similarity: ${result.similarity.toFixed(2)}), ` +
                        `reusing proven approach.`
                      : `No similar past task found, exploring from scratch.`),
                },
              ],
            },
          })
        } catch {
          // Session prompt injection is best-effort; ignore failures
        }
      }
    },
  }
}

// Re-export public API for programmatic consumers
export { adaptiveEngine, getMemoryState } from "./engine.js"
export { embed, EMBEDDING_DIM } from "./embed.js"
export { cosine } from "./similarity.js"
export { memoryStore } from "./memory.js"
export { synthesizePolicy } from "./policy.js"
export { planner, coder, reviewer } from "./exec.js"
export type { MemoryEntry, RetrievalResult } from "./memory.js"
export type { ExecutionPolicy } from "./policy.js"
export type { PlanResult, CodeResult, ReviewResult, ExecutionResult } from "./exec.js"
export type { AdaptiveResult } from "./engine.js"

# opencode-ai-os-v4-semantic

An adaptive semantic AI execution engine for OpenCode that learns from past tasks and dynamically generates execution policy — **no hardcoded modes**.

## How It Works

```
Input -> Embed -> Memory Retrieval -> Policy Synthesis -> Planner -> Coder -> (Reviewer) -> Output
                                                                                            |
                                                      +--- Store in semantic memory <------+
```

Every request is embedded into a 32-dimension vector, compared against past task memories via cosine similarity, and used to synthesize a dynamic execution policy that controls pipeline depth, tool usage, and reasoning intensity.

## Core Design

- **NO Redis** — fully in-process
- **NO queue system** — synchronous pipeline
- **NO external APIs** — deterministic embedding via character distribution
- **NO FAST/DEEP/MCP modes** — policy is synthesized per-request

## Install

```bash
npm install opencode-ai-os-v4-semantic
```

## Usage (as an OpenCode plugin)

The plugin hooks into OpenCode's request pipeline automatically:

```ts
// In your OpenCode config
import semanticPlugin from "opencode-ai-os-v4-semantic";

export default {
  plugins: [semanticPlugin],
};
```

Every request passes through the semantic engine. Results are attached to `ctx.meta.semanticEngine`.

## Programmatic API

```ts
import {
  adaptiveEngine,
  embed,
  cosine,
  memoryStore,
} from "opencode-ai-os-v4-semantic";

// Run the full adaptive engine
const result = adaptiveEngine("Build a REST API for user profiles");
console.log(result.policy); // { steps: 3, toolUsage: "full", ... }
console.log(result.similarity); // 0.92 (if similar to past task)

// Check memory state
console.log(memoryStore.size); // number of stored memories
```

## Policy Object

```ts
interface ExecutionPolicy {
  steps: number;          // 1-5 execution steps
  toolUsage: "none" | "light" | "full";
  reasoningDepth: number; // 1-10
  asyncLevel: number;     // 1-5
}
```

## File Structure

```
src/
  index.ts      — Plugin entry, hooks into OpenCode
  engine.ts     — Adaptive engine orchestrator
  embed.ts      — Deterministic embedding (32-dim)
  similarity.ts — Cosine similarity computation
  memory.ts     — In-memory semantic vector store
  policy.ts     — Policy synthesizer (replaces hardcoded modes)
  exec.ts       — Planner, coder, reviewer pipeline
```

## License

MIT

# opencode-ai-os-v4-semantic

An adaptive semantic AI execution engine for OpenCode that learns from past tasks and dynamically generates execution policy — **no hardcoded modes**.

**Audience**: OpenCode users who want context-aware AI assistance that improves over time.
**Prerequisites**: OpenCode CLI installed, basic TypeScript knowledge for programmatic API use.

## How It Works

```text

  Input  →  Embed  →  Memory Retrieval  →  Policy Synthesis  →  Planner  →  Coder
                                                                              │
                                                Reasoning depth >= 3 ? ◄──────┘
                                               ╱ Yes              No ╲
                                              ▼                      ▼
                                          Reviewer                 Output
                                              ╲                      ╱
                                               ╲                    ╱
                                                ╲                  ╱
                                                  ▼                ▼
                                                    Output
                                                       │
                                                       ▼
                                                Semantic Memory
                                                       │
                                                       └─── next request ───┐
                                                                              │
                                                                                               Memory Retrieval ◄─────────────┘
```

Every request is embedded into a 128-dimension vector, compared against past task memories via cosine similarity, and used to synthesize a dynamic execution policy that controls pipeline depth, tool usage, and reasoning intensity.

The engine uses deterministic FNV-1a hashing for embeddings and in-memory cosine similarity retrieval with an LRU cap at 1,000 entries — no external APIs or services required.

## Core Design

- **NO Redis** — fully in-process
- **NO queue system** — synchronous pipeline
- **NO external APIs** — deterministic embedding via character distribution
- **NO FAST/DEEP/MCP modes** — policy is synthesized per-request

With zero external runtime dependencies, the plugin operates entirely within your machine.

## Install

```bash
npm install opencode-ai-os-v4-semantic
```

Once installed, configure OpenCode to load the plugin.

## Usage (as an OpenCode plugin)

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["opencode-ai-os-v4-semantic"]
}
```

OpenCode will auto-load the plugin at startup. It hooks into `message.updated` events, runs the adaptive semantic engine on every user message, and injects the resulting policy + memory context into the session.

Results are also logged via OpenCode's structured logging system (visible with debug-level logging).

Additionally, the core engine is available for direct import in TypeScript/JavaScript projects.

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

The engine returns a synthesized policy object that controls execution behavior.

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

```text
src/
  index.ts      — Plugin entry, hooks into OpenCode events
  engine.ts     — Adaptive engine orchestrator
  embed.ts      — Deterministic embedding (128-dim)
  similarity.ts — Cosine similarity computation
  memory.ts     — In-memory semantic vector store
  policy.ts     — Policy synthesizer (replaces hardcoded modes)
  exec.ts       — Planner, coder, reviewer pipeline
```

## Contributing

Issues and contributions are welcome.

- [Bug reports & feature requests](https://github.com/dt418/opencode-ai-os-v4-semantic/issues/new/choose) — structured issue templates
- [Changelog](CHANGELOG.md) — release history and changes

## License

MIT

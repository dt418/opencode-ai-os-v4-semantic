# Changelog

## 1.0.5

*Apr 30, 2026*

### Documentation

- **GitHub issue templates**: Added bug report and feature request templates to `.github/ISSUE_TEMPLATE/`. Users can now file structured issues directly from the repository.

---

## 1.0.4

*Apr 30, 2026*

### Documentation

- **Changelog backfill**: Added missing v1.0.2 and v1.0.3 entries to CHANGELOG.md.

---

## 1.0.3

*Apr 30, 2026*

### Fixes

- **ASCII art README diagram**: Replaced the Mermaid flowchart in the README with clean ASCII art for compatibility with npm's markdown renderer. The pipeline diagram now renders correctly on the package page.

---

## 1.0.2

*Apr 30, 2026*

### Improvements

- **CHANGELOG.md**: Added this changelog with human-readable release notes covering v1.0.0 (initial release) and v1.0.1 (plugin rewrite).

---

## 1.0.1

*Apr 30, 2026*

### Improvements

- **Real OpenCode plugin API**: Replaced the previous SDK-based plugin interface with the official OpenCode event hooks system. The plugin now uses `message.updated` events to automatically intercept user messages and run the adaptive semantic engine — no manual wiring needed.

- **Automatic session context injection**: When a similar past task is found, the plugin injects the synthesized policy and memory context directly into your OpenCode session, helping the AI make better decisions.

- **Structured logging**: Policy results (steps, tool usage, reasoning depth, similarity scores) are logged through OpenCode's built-in logging system for easy debugging and observability.

- **Mermaid architecture diagram**: The README now includes a proper Mermaid flowchart showing the full pipeline from input through embedding, memory retrieval, policy synthesis, planning, coding, review, and memory storage.

### Changes

- Updated plugin config format: add `"opencode-ai-os-v4-semantic"` to the `plugin` array in your `opencode.json`
- Re-exported `getMemoryState()` for programmatic API consumers
- Corrected embedding dimension documentation (128-dim, not 32-dim)
- Added `@opencode-ai/plugin` as an optional peer dependency for TypeScript users

---

## 1.0.0

*Initial release*

### Features

- **Adaptive semantic engine**: Dynamically generates execution policy per request — no hardcoded FAST/DEEP/MCP modes
- **Deterministic 128-dim embedding**: Character trigram + word n-gram hashing via FNV-1a — zero external dependencies
- **In-memory vector store**: Cosine similarity retrieval with LRU cap (1000 entries)
- **Policy synthesizer**: Blends complexity analysis with similarity-weighted memory reuse
- **Execution pipeline**: Planner → Coder → Reviewer (gate controlled by reasoning depth)
- **Full TypeScript strict mode**: Zero external runtime dependencies
- **33/33 verification tests passing**

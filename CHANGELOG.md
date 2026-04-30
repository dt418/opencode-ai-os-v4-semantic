# Changelog

## 1.0.11

*Released 2026-04-30*

### Documentation

- **Fixed flowchart**: Replaced broken ASCII diagram with clean box-drawing layout showing the full pipeline with branching depth gate and memory feedback loop.

---

## 1.0.10

*Released 2026-04-30*

### Documentation

- **Changelog backfill**: Added entries for v1.0.6 (contributing links), v1.0.7 (CI + lefthook + markdownlint), v1.0.8 (commitlint), and v1.0.9 (readability improvements).

---

## 1.0.9

*Released 2026-04-30*

### Documentation

- **Readability improvements**: Added audience and prerequisites line, transition sentences between major sections (How It Works → Core Design, Install → Usage, Usage → Programmatic API), and plain-language explanations of FNV-1a hashing and LRU cap.

---

## 1.0.8

*Released 2026-04-30*

### CI/CD

- **Commitlint**: Added `@commitlint/cli` with `@commitlint/config-conventional` to enforce conventional commit message format via lefthook's `commit-msg` hook.

---

## 1.0.7

*Released 2026-04-30*

### CI/CD

- **GitHub Actions CI**: Added `ci.yml` workflow running typecheck, build, and test on Node 18, 20, and 22 for every push and pull request.

### Chores

- **Lefthook pre-commit hooks**: Typecheck, markdownlint, and test all run automatically before every commit.
- **Markdownlint config**: Added project-wide markdown linting with relaxed rules for changelog style (no-duplicate-heading, no-emphasis-as-heading disabled).

---

## 1.0.6

*Released 2026-04-30*

### Documentation

- **Changelog sync**: Backfilled v1.0.4 and v1.0.5 entries in CHANGELOG.md.
- **Contributing links**: Added README section linking to issue templates and changelog.

---

## 1.0.5

*Released 2026-04-30*

### Documentation

- **GitHub issue templates**: Added bug report and feature request templates to `.github/ISSUE_TEMPLATE/`. Users can now file structured issues directly from the repository.

---

## 1.0.4

*Released 2026-04-30*

### Documentation

- **Changelog backfill**: Added missing v1.0.2 and v1.0.3 entries to CHANGELOG.md.

---

## 1.0.3

*Released 2026-04-30*

### Fixes

- **ASCII art README diagram**: Replaced the Mermaid flowchart in the README with clean ASCII art for compatibility with npm's markdown renderer. The pipeline diagram now renders correctly on the package page.

---

## 1.0.2

*Released 2026-04-30*

### Improvements

- **CHANGELOG.md**: Added this changelog with human-readable release notes covering v1.0.0 (initial release) and v1.0.1 (plugin rewrite).

---

## 1.0.1

*Released 2026-04-30*

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

Initial release

### Features

- **Adaptive semantic engine**: Dynamically generates execution policy per request — no hardcoded FAST/DEEP/MCP modes
- **Deterministic 128-dim embedding**: Character trigram + word n-gram hashing via FNV-1a — zero external dependencies
- **In-memory vector store**: Cosine similarity retrieval with LRU cap (1000 entries)
- **Policy synthesizer**: Blends complexity analysis with similarity-weighted memory reuse
- **Execution pipeline**: Planner → Coder → Reviewer (gate controlled by reasoning depth)
- **Full TypeScript strict mode**: Zero external runtime dependencies
- **33/33 verification tests passing**

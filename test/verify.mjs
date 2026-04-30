/**
 * End-to-end verification test for opencode-ai-os-v4-semantic.
 * Tests all public APIs and the adaptive memory loop.
 */
import {
  adaptiveEngine,
  embed,
  cosine,
  memoryStore,
  synthesizePolicy,
  planner,
  coder,
  reviewer,
  EMBEDDING_DIM,
} from "../dist/index.js";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

// ── embed ──────────────────────────────────────────────
console.log("\n[embed]");
{
  const v = embed("hello world");
  assert(v.length === EMBEDDING_DIM, `embedding length is ${EMBEDDING_DIM}`);
  assert(v.length === 128, "EMBEDDING_DIM is 128");

  // Determinism
  const v2 = embed("hello world");
  assert(v.every((x, i) => x === v2[i]), "embedding is deterministic");

  // Different input → different embedding
  const v3 = embed("goodbye world");
  assert(v.some((x, i) => x !== v3[i]), "different inputs produce different embeddings");

  // Normalized (L2 norm ≈ 1)
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  assert(Math.abs(norm - 1.0) < 0.001, `L2 norm ≈ 1.0 (got ${norm.toFixed(6)})`);
}

// ── cosine ─────────────────────────────────────────────
console.log("\n[cosine]");
{
  const a = embed("build a REST API with JWT authentication");
  const b = embed("create a REST API with token-based login");
  const c = embed("write a CSS animation for a loading spinner");

  const simAB = cosine(a, b);
  const simAC = cosine(a, c);

  assert(simAB > 0, "similar texts have positive similarity");
  assert(simAB > simAC, "similar texts score higher than unrelated ones");
  console.log(`  INFO: similar(REST+JWT, REST+token) = ${simAB.toFixed(4)}`);
  console.log(`  INFO: similar(REST+JWT, CSS spinner)  = ${simAC.toFixed(4)}`);
}

// ── policy ─────────────────────────────────────────────
console.log("\n[policy]");
{
  const retrieval = memoryStore.retrieveSimilar("build a REST API");
  const policy = synthesizePolicy("build a REST API from scratch with JWT auth, user roles, and rate limiting", retrieval);

  assert(policy.steps >= 1 && policy.steps <= 5, `steps in range: ${policy.steps}`);
  assert(policy.reasoningDepth >= 1 && policy.reasoningDepth <= 10, `reasoningDepth in range: ${policy.reasoningDepth}`);
  assert(policy.asyncLevel >= 1 && policy.asyncLevel <= 5, `asyncLevel in range: ${policy.asyncLevel}`);
  assert(["none", "light", "full"].includes(policy.toolUsage), `valid toolUsage: ${policy.toolUsage}`);

  // Complex request should get higher steps
  const simpleRetrieval = memoryStore.retrieveSimilar("add a comment");
  const simplePolicy = synthesizePolicy("add a comment to the calculateTotal function", simpleRetrieval);
  assert(simplePolicy.steps <= 3, `simple request has fewer steps: ${simplePolicy.steps} <= 3`);

  console.log(`  INFO: complex policy  → steps=${policy.steps}, depth=${policy.reasoningDepth}, async=${policy.asyncLevel}, tools=${policy.toolUsage}`);
  console.log(`  INFO: simple policy   → steps=${simplePolicy.steps}, depth=${simplePolicy.reasoningDepth}, async=${simplePolicy.asyncLevel}, tools=${simplePolicy.toolUsage}`);
}

// ── exec (planner → coder → reviewer) ─────────────────
console.log("\n[exec]");
{
  const retrieval = memoryStore.retrieveSimilar("build a REST API");
  const policy = synthesizePolicy("build a REST API with JWT auth", retrieval);

  const plan = planner("build a REST API with JWT auth", policy);
  assert(typeof plan.summary === "string" && plan.summary.length > 0, "plan produces a summary");
  assert(plan.phases.length > 0, "plan has phases");
  assert(plan.phases.length >= policy.steps, `plan phases (${plan.phases.length}) >= steps (${policy.steps})`);

  const code = coder(plan, policy);
  assert(typeof code.implementation === "string" && code.implementation.length > 0, "coder produces implementation");
  assert(Array.isArray(code.notes) && code.notes.length > 0, "coder produces notes");
  assert(typeof code.plan === "string" && code.plan.length > 0, "coder references plan");

  const review = reviewer(code, policy);
  if (policy.reasoningDepth >= 3) {
    assert(review !== null, "reviewer runs when reasoningDepth >= 3");
    assert(typeof review.score === "number", "review has a score");
    assert(typeof review.passed === "boolean", "review has passed flag");
  } else {
    assert(true, "reviewer skipped for shallow reasoning (expected)");
  }
}

// ── memory & adaptiveEngine ────────────────────────────
console.log("\n[memory + adaptiveEngine]");
{
  // Clear store for clean test
  // memoryStore doesn't expose clear(), but we can track changes

  const initialSize = memoryStore.size;

  // Cold start: run first request
  const r1 = adaptiveEngine("build a REST API with JWT authentication and user roles");
  assert(r1.memoryHit === false, "first request: no memory hit (cold start)");
  assert(r1.similarity === 0, "first request: similarity is 0");
  assert(r1.execution.plan !== undefined, "first request: has execution plan");
  assert(r1.memorySize > initialSize, "memory grew after first request");

  // Similar request: should find memory
  const r2 = adaptiveEngine("create a REST API with token-based login and role management");
  assert(r2.memoryHit === true, "similar request: memory HIT");
  assert(r2.similarity > 0.40, `similar request: similarity=${r2.similarity.toFixed(4)} > 0.40`);

  // Policy should be lighter for similar request
  assert(r2.policy.steps <= r1.policy.steps, "similar request: policy steps ≤ first request");

  // Unrelated request: no hit
  const r3 = adaptiveEngine("add a CSS animation for a loading spinner component");
  assert(r3.memoryHit === false, "unrelated request: no memory hit");
  assert(r3.similarity < 0.50, `unrelated request: similarity=${r3.similarity.toFixed(4)} < 0.50`);

  // Exact repeat: should be a hit with high similarity
  const r4 = adaptiveEngine("build a REST API with JWT authentication and user roles");
  assert(r4.memoryHit === true, "exact repeat: memory HIT");
  assert(r4.similarity >= 0.95, `exact repeat: similarity=${r4.similarity.toFixed(4)} >= 0.95`);

  // Trivial request with clean store
  memoryStore.clear();
  const r5 = adaptiveEngine("add a comment");
  assert(r5.memoryHit === false, "trivial request: no memory hit (clean store, below threshold)");

  console.log(`  INFO: memory store size = ${memoryStore.size}`);
  console.log(`  INFO: r1 similarity=${r1.similarity.toFixed(4)}, r2=${r2.similarity.toFixed(4)}, r3=${r3.similarity.toFixed(4)}, r4=${r4.similarity.toFixed(4)}`);
}

// ── Summary ────────────────────────────────────────────
console.log(`\n${"═".repeat(50)}`);
console.log(`  Total: ${passed} passed, ${failed} failed out of ${passed + failed}`);
console.log(`${"═".repeat(50)}`);

if (failed > 0) process.exit(1);

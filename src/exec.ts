/**
 * Execution engine — implements planner, coder, reviewer pipeline.
 * Respects the execution policy (steps, toolUsage, reasoningDepth).
 */

import type { ExecutionPolicy } from "./policy.js";

export interface PlanResult {
  summary: string;
  phases: string[];
  estimatedComplexity: string;
  risks: string[];
}

export interface CodeResult {
  plan: string;
  implementation: string;
  notes: string[];
}

export interface ReviewResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}

export interface ExecutionResult {
  plan: PlanResult;
  code: CodeResult;
  review: ReviewResult | null;
}

/**
 * Planner — generates a structured execution plan from input.
 * Policy affects the depth of planning.
 */
export function planner(input: string, policy: ExecutionPolicy): PlanResult {
  const depth = policy.reasoningDepth;

  const phases: string[] = [];
  const risks: string[] = [];

  if (depth >= 1) {
    phases.push("Analyze input requirements and constraints");
  }
  if (depth >= 3) {
    phases.push("Identify core domain objects and their relationships");
  }
  if (depth >= 5) {
    phases.push("Design data flow and component interfaces");
  }
  if (depth >= 7) {
    phases.push("Map out edge cases, error states, and recovery paths");
  }
  if (depth >= 9) {
    phases.push(
      "Evaluate tradeoffs: performance vs simplicity, coupling vs cohesion"
    );
  }

  if (depth >= 4) {
    risks.push("Ambiguity in input may lead to incorrect assumptions");
  }
  if (depth >= 6) {
    risks.push("Missing constraints may surface during implementation");
  }
  if (depth >= 8) {
    risks.push("Integration with existing codebase requires careful analysis");
  }

  const complexityLabels: Record<number, string> = {
    1: "trivial",
    2: "simple",
    3: "moderate",
    4: "complex",
    5: "highly complex",
  };

  return {
    summary: `Semantic execution plan for: "${input.slice(0, 100)}${input.length > 100 ? "..." : ""}"`,
    phases: phases.slice(0, policy.steps),
    estimatedComplexity:
      complexityLabels[policy.steps] ?? "unknown",
    risks,
  };
}

/**
 * Coder — simulates code generation based on the plan.
 * Policy controls how much tool interaction is expected.
 */
export function coder(plan: PlanResult, policy: ExecutionPolicy): CodeResult {
  const notes: string[] = [];

  let implementation = `// Generated implementation for: ${plan.summary}\n`;

  if (policy.toolUsage === "none") {
    implementation += "// Tool usage disabled — inline reasoning only.\n";
    notes.push("Tool usage is none; implementation is minimal.");
  } else if (policy.toolUsage === "light") {
    implementation += "// Light tool usage — read/search operations allowed.\n";
    notes.push("Light tool usage: prefer reading/searching over editing.");
  } else {
    implementation += "// Full tool usage — all operations available.\n";
    notes.push("Full tool usage enabled: read, write, edit, search, execute.");
  }

  implementation += `\n// Execution phases (${plan.phases.length}):\n`;
  for (const phase of plan.phases) {
    implementation += `// - ${phase}\n`;
  }

  implementation += "\n";
  implementation += generateCodeStub(plan);

  if (plan.risks.length > 0) {
    notes.push(`Risks identified: ${plan.risks.join("; ")}`);
  }

  notes.push(`Reasoning depth: ${policy.reasoningDepth}/10`);
  notes.push(`Async level: ${policy.asyncLevel}/5`);

  return { plan: plan.summary, implementation, notes };
}

function generateCodeStub(plan: PlanResult): string {
  const lines: string[] = [];

  for (const phase of plan.phases) {
    const varName = phase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    lines.push(`const ${varName} = () => { /* TODO: ${phase} */ };`);
  }

  if (lines.length === 0) {
    lines.push("// No phases generated — insufficient reasoning depth.");
  }

  lines.push("");
  lines.push("// Main execution entry point");
  lines.push("async function main() {");
  for (let i = 0; i < plan.phases.length; i++) {
    const varName = plan.phases[i]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    lines.push(`  await ${varName}();`);
  }
  lines.push("}");
  lines.push("");
  lines.push("main().catch(console.error);");

  return lines.join("\n");
}

/**
 * Reviewer — evaluates generated code.
 * Only invoked when policy indicates deeper reasoning is needed.
 */
export function reviewer(
  code: CodeResult,
  policy: ExecutionPolicy
): ReviewResult | null {
  // Only review if reasoning depth warrants it
  if (policy.reasoningDepth < 3) {
    return null;
  }

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!code.implementation.includes("TODO")) {
    issues.push("No TODO markers found — verify all phases are complete.");
  }

  if (code.notes.length === 0) {
    issues.push("No implementation notes provided.");
  }

  if (policy.steps > 3 && code.implementation.split("\n").length < 20) {
    issues.push(
      `Policy expects ${policy.steps} steps but implementation appears thin.`
    );
  }

  suggestions.push("Add unit tests for each phase function.");
  suggestions.push("Consider adding input validation at the entry point.");
  suggestions.push("Document the async flow if asyncLevel > 2.");

  const score =
    issues.length === 0
      ? 10
      : Math.max(1, 10 - issues.length * 2 - suggestions.length * 0.5);

  return {
    passed: issues.length === 0,
    issues,
    suggestions,
    score: Math.round(score),
  };
}

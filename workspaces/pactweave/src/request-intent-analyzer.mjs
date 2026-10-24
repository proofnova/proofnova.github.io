import { assert, clone, digest } from "./shared.mjs";
export async function analyzeRequest(input) {
  const spec = typeof input === "string" ? { request: input } : input;
  assert(spec && typeof spec === "object", "A request object is required");
  assert(
    typeof spec.request === "string" && spec.request.trim().length > 0,
    "Non-empty original request required",
  );
  assert(spec.request.length <= 100000, "Request exceeds 100000 characters");
  const task = spec.task || {};
  const questions = [];
  if (!task.adapter && !Array.isArray(task.jobs))
    questions.push({
      id: "task.adapter",
      type: "string",
      required: true,
      prompt: "Choose an installed adapter or provide an explicit jobs DAG.",
    });
  if (task.adapter && !Object.hasOwn(task, "input"))
    questions.push({
      id: "task.input",
      type: "object",
      required: true,
      prompt: "Provide structured adapter input.",
    });
  if (
    !Array.isArray(spec.acceptance_criteria) ||
    !spec.acceptance_criteria.length
  )
    questions.push({
      id: "acceptance_criteria",
      type: "array",
      required: true,
      prompt:
        "Provide observable outcome checks; execution alone is insufficient.",
    });
  const constraints = clone(spec.constraints || []),
    forbidden = clone(spec.forbidden_actions || []),
    permitted = clone(
      spec.permitted_actions || ["local.compute", "local.read"],
    );
  const conflicts = permitted
    .filter((x) => forbidden.includes(x))
    .map((action) => ({
      action,
      reason: "An action is both requested and forbidden; forbidden wins.",
    }));
  const required = clone(spec.required_inputs || []);
  for (const item of required) {
    if (
      typeof item === "object" &&
      item.id &&
      item.required !== false &&
      item.value === undefined
    )
      questions.push({
        id: `required.${item.id}`,
        type: item.type || "string",
        required: true,
        prompt: item.prompt || `Provide ${item.id}.`,
      });
  }
  return {
    original_request: spec.request,
    original_request_digest: await digest(spec.request),
    interpreted_intent: spec.request.trim(),
    interpretation_method: "rules-only; no unstated semantic completion",
    desired_artifacts: clone(spec.desired_artifacts || []),
    explicit_requirements: constraints,
    implicit_requirement_candidates: [],
    constraints,
    forbidden_actions: forbidden,
    approval_actions: permitted.filter(
      (x) => !["local.compute", "local.read"].includes(x),
    ),
    task: clone(task),
    task_type: spec.task_type || "structured-workflow",
    domain: spec.domain || "unspecified",
    environment: clone(spec.environment || {}),
    verification_conditions: clone(spec.acceptance_criteria || []),
    missing_inputs: questions.map((q) => q.id),
    unresolved_questions: questions,
    uncertain_assumptions: clone(spec.assumptions || []),
    conflicts,
  };
}

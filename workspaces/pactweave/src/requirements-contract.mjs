import { assert, canonical, clone, digest, getPath } from "./shared.mjs";
const operators = new Set(["equals", "exists", "gte", "lte", "includes"]);
export function contractIdentity(c) {
  return {
    original_request: c.original_request,
    original_request_digest: c.original_request_digest,
    interpreted_intent: c.interpreted_intent,
    task_type: c.task_type,
    constraints: c.constraints,
    assumptions: c.assumptions,
    required_inputs: c.required_inputs,
    acceptance_criteria: c.acceptance_criteria,
    verification_method: c.verification_method,
    permitted_actions: c.permitted_actions,
    forbidden_actions: c.forbidden_actions,
    allowed_adapters: c.allowed_adapters,
  };
}
export async function computeContractDigest(c) {
  return digest(contractIdentity(c));
}
export async function createContract(spec, analysis) {
  const task = clone(spec.task || {});
  const c = {
    schema_version: 1,
    original_request: analysis.original_request,
    original_request_digest: analysis.original_request_digest,
    interpreted_intent: analysis.interpreted_intent,
    task_type: analysis.task_type,
    task,
    constraints: clone(spec.constraints || []),
    assumptions: clone(spec.assumptions || []),
    required_inputs: clone(spec.required_inputs || []),
    acceptance_criteria: clone(spec.acceptance_criteria || []),
    verification_method:
      "deterministic outcome checks plus execution/input/output/digest invariants",
    permitted_actions: clone(
      spec.permitted_actions || ["local.compute", "local.read"],
    ),
    forbidden_actions: clone(spec.forbidden_actions || []),
    allowed_adapters: task.adapter
      ? [task.adapter]
      : [...new Set((task.jobs || []).map((x) => x.adapter))],
    unresolved_questions: clone(analysis.unresolved_questions || []),
    conflicts: clone(analysis.conflicts || []),
  };
  c.contract_digest = await computeContractDigest(c);
  return c;
}
export async function validateContract(c) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!c || typeof c !== "object")
    return {
      valid: false,
      errors: ["Contract required"],
      questions: [],
      findings: [],
    };
  if (typeof c.original_request !== "string" || !c.original_request.trim())
    fail("Missing original request");
  else if ((await digest(c.original_request)) !== c.original_request_digest)
    fail("Original request digest mismatch");
  try {
    if ((await computeContractDigest(c)) !== c.contract_digest)
      fail("Contract digest mismatch");
  } catch {
    fail("Invalid contract identity");
  }
  for (const k of [
    "constraints",
    "assumptions",
    "required_inputs",
    "permitted_actions",
    "forbidden_actions",
    "allowed_adapters",
    "acceptance_criteria",
    "unresolved_questions",
  ])
    if (!Array.isArray(c[k])) fail(`Invalid ${k}`);
  if (!Array.isArray(c.acceptance_criteria) || !c.acceptance_criteria.length)
    fail("Meaningful outcome criteria required");
  const ids = new Set();
  for (const a of c.acceptance_criteria || []) {
    if (!a || typeof a !== "object") {
      fail("Invalid criterion");
      continue;
    }
    if (
      typeof a.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,96}$/.test(a.id) ||
      ids.has(a.id)
    )
      fail("Criterion IDs must be unique safe identifiers");
    ids.add(a.id);
    if (
      typeof a.path !== "string" ||
      !/^(result\.[A-Za-z0-9_.-]+|jobs\.[A-Za-z0-9_-]+\.result\.[A-Za-z0-9_.-]+)$/.test(
        a.path,
      ) ||
      a.path
        .split(".")
        .some((x) => ["__proto__", "prototype", "constructor"].includes(x))
    )
      fail(`Criterion ${a.id} must address a concrete result outcome`);
    if (!operators.has(a.operator))
      fail(`Unsupported criterion operator ${a.operator}`);
    if (a.operator === "exists" && a.expected !== true)
      fail("exists requires expected:true");
    if (
      ["gte", "lte"].includes(a.operator) &&
      (typeof a.expected !== "number" || !Number.isFinite(a.expected))
    )
      fail("Numeric criterion requires finite expected number");
    if (a.operator !== "exists" && a.expected === undefined)
      fail("Criterion expected value required");
    if (a.critical === false)
      fail("Outcome checks are critical and cannot be averaged away");
  }
  const task = c.task || {};
  if (task.adapter && !c.allowed_adapters?.includes(task.adapter))
    fail("Adapter is outside contract scope");
  if (Array.isArray(task.jobs))
    for (const job of task.jobs)
      if (!c.allowed_adapters?.includes(job.adapter))
        fail("Job adapter outside contract scope");
  if ((c.conflicts || []).length)
    fail("Conflicting permitted/forbidden actions require resolution");
  const questions = clone(c.unresolved_questions || []);
  return {
    valid: !errors.length && !questions.some((q) => q.required),
    errors,
    questions,
    findings: errors.map((message) => ({ severity: "error", message })),
  };
}
export async function applyAnswers(contract, answers = {}) {
  assert(
    answers && typeof answers === "object" && !Array.isArray(answers),
    "Answers must be keyed by stable question IDs",
  );
  const c = clone(contract),
    allowed = new Map(c.unresolved_questions.map((q) => [q.id, q]));
  for (const [id, value] of Object.entries(answers)) {
    const q = allowed.get(id);
    assert(q, `Question is not unresolved: ${id}`);
    assert(
      q.type === "array"
        ? Array.isArray(value)
        : q.type === "object"
          ? value !== null && typeof value === "object" && !Array.isArray(value)
          : typeof value === q.type,
      `Wrong answer type for ${id}`,
    );
    if (id === "task.adapter") {
      assert(!c.task.adapter, "Confirmed adapter is immutable");
      c.task.adapter = value;
      c.allowed_adapters = [value];
    } else if (id === "task.input") c.task.input = clone(value);
    else if (id === "acceptance_criteria") c.acceptance_criteria = clone(value);
    else if (id.startsWith("required.")) {
      const item = c.required_inputs.find((x) => x.id === id.slice(9));
      assert(item, "Unknown required input");
      item.value = clone(value);
    } else throw new Error(`Unsupported answer ${id}`);
    c.unresolved_questions = c.unresolved_questions.filter((x) => x.id !== id);
  }
  if (
    c.task.adapter &&
    !Object.hasOwn(c.task, "input") &&
    !c.unresolved_questions.some((q) => q.id === "task.input")
  )
    c.unresolved_questions.push({
      id: "task.input",
      type: "object",
      required: true,
      prompt: "Provide structured adapter input.",
    });
  c.contract_digest = await computeContractDigest(c);
  return c;
}

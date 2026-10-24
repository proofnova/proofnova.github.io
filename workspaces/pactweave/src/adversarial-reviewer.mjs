import { canonical, digest, getPath } from "./shared.mjs";
import { validateContract } from "./requirements-contract.mjs";

export async function reviewOutput({
  contract,
  output,
  original_request_digest,
  executionEvidence = [],
}) {
  const checks = [],
    findings = [];
  const check = (id, passed, details) => {
    checks.push({ id, passed: !!passed, critical: true, ...details });
    if (!passed) findings.push({ id, severity: "error", ...details });
  };
  const validation = await validateContract(contract);
  check("contract.valid", validation.valid, { errors: validation.errors });
  check(
    "request.original",
    original_request_digest === contract.original_request_digest &&
      (await digest(contract.original_request)) === original_request_digest,
    { reason: "Immutable original request digest" },
  );
  check(
    "execution.actual",
    Array.isArray(executionEvidence) &&
      executionEvidence.length > 0 &&
      executionEvidence.every(
        (e) =>
          e.status === "completed" &&
          e.input_digest &&
          e.output_digest &&
          e.adapter &&
          e.contract_digest === contract.contract_digest,
      ),
    { reason: "Actual completed adapter execution bound to current contract" },
  );
  if (executionEvidence.length) {
    if (output?.jobs) {
      for (const [id, envelope] of Object.entries(output.jobs)) {
        const evidence = executionEvidence.find((e) => e.job_id === id);
        check(
          `evidence.${id}`,
          !!evidence && evidence.output_digest === (await digest(envelope)),
          { reason: "Output bytes match execution evidence" },
        );
        check(
          `evidence-input.${id}`,
          !!evidence &&
            envelope.resource === evidence.adapter &&
            envelope.input_sha256 === evidence.input_digest &&
            contract.allowed_adapters.includes(evidence.adapter),
          {
            reason:
              "Execution input and adapter match the returned envelope and contract",
          },
        );
      }
      check(
        "evidence.job-count",
        Object.keys(output.jobs).length === executionEvidence.length,
        { reason: "No missing or fabricated execution records" },
      );
    } else {
      check(
        "evidence.output",
        executionEvidence.length === 1 &&
          executionEvidence[0].output_digest === (await digest(output)),
        { reason: "Output bytes match execution evidence" },
      );
      check(
        "evidence.input",
        executionEvidence.length === 1 &&
          output?.resource === executionEvidence[0].adapter &&
          output?.input_sha256 === executionEvidence[0].input_digest &&
          contract.allowed_adapters.includes(executionEvidence[0].adapter),
        {
          reason:
            "Execution input and adapter match the returned envelope and contract",
        },
      );
    }
  }
  check(
    "criteria.nonempty",
    Array.isArray(contract.acceptance_criteria) &&
      contract.acceptance_criteria.length > 0,
    { reason: "User outcome criteria required" },
  );
  for (const criterion of contract.acceptance_criteria || []) {
    let actual,
      passed = false,
      error;
    try {
      actual = getPath(output, criterion.path);
      switch (criterion.operator) {
        case "equals":
          passed =
            actual !== undefined &&
            canonical(actual) === canonical(criterion.expected);
          break;
        case "exists":
          passed =
            criterion.expected === true &&
            actual !== undefined &&
            actual !== null;
          break;
        case "gte":
          passed =
            typeof actual === "number" &&
            Number.isFinite(actual) &&
            actual >= criterion.expected;
          break;
        case "lte":
          passed =
            typeof actual === "number" &&
            Number.isFinite(actual) &&
            actual <= criterion.expected;
          break;
        case "includes":
          passed = Array.isArray(actual)
            ? actual.some(
                (item) => canonical(item) === canonical(criterion.expected),
              )
            : typeof actual === "string" &&
              typeof criterion.expected === "string" &&
              actual.includes(criterion.expected);
          break;
        default:
          error = "Unsupported criterion operator";
      }
    } catch (err) {
      error = err.message;
    }
    check(`criterion.${criterion.id}`, passed, {
      path: criterion.path,
      operator: criterion.operator,
      expected: criterion.expected,
      actual: actual === undefined ? null : actual,
      ...(error ? { error } : {}),
    });
  }
  return {
    passed: checks.length > 0 && checks.every((item) => item.passed),
    checks,
    findings,
    review_type: "deterministic-adversarial",
    llm_review_performed: false,
  };
}

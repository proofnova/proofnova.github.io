import test from "node:test";
import strict from "node:assert/strict";
import { analyzeRequest } from "../src/request-intent-analyzer.mjs";
import {
  createContract,
  validateContract,
  applyAnswers,
} from "../src/requirements-contract.mjs";
import { preprocessContext } from "../src/context-preprocessor.mjs";
import { createPolicy, authorize } from "../src/security-policy.mjs";
import { canonical, digest, getPath } from "../src/shared.mjs";
import { readFile } from "node:fs/promises";
const example = JSON.parse(
  await readFile(new URL("../examples/invoice.json", import.meta.url)),
);
test("short ambiguous request creates data questions and preserves original bytes", async () => {
  const request = "  help\n도와줘  ";
  const a = await analyzeRequest({ request });
  strict.equal(a.original_request, request);
  strict.equal(
    a.interpretation_method,
    "rules-only; no unstated semantic completion",
  );
  strict.deepEqual(a.missing_inputs, ["task.adapter", "acceptance_criteria"]);
  strict.equal(a.original_request_digest, await digest(request));
});
test("unknown answer cannot expand authority; typed answers resume only missing data", async () => {
  const a = await analyzeRequest({ request: "reconcile" }),
    c = await createContract({ request: "reconcile" }, a);
  await strict.rejects(
    applyAnswers(c, { permitted_actions: ["process.execute"] }),
  );
  await strict.rejects(applyAnswers(c, { "task.adapter": 4 }));
  const d = await applyAnswers(c, {
    "task.adapter": "invoice-reconciliation",
    acceptance_criteria: example.acceptance_criteria,
  });
  strict.equal(d.original_request, c.original_request);
  strict.deepEqual(d.permitted_actions, ["local.compute", "local.read"]);
  strict.equal(d.unresolved_questions[0].id, "task.input");
  const e = await applyAnswers(d, { "task.input": example.task.input });
  strict.equal((await validateContract(e)).valid, true);
});
test("contract rejects forged digest, empty and trivial criteria and conflicting actions", async () => {
  const c = await createContract(example, await analyzeRequest(example));
  strict.equal((await validateContract(c)).valid, true);
  for (const patch of [
    { original_request: "different" },
    { acceptance_criteria: [] },
    {
      acceptance_criteria: [
        { id: "vacuous", path: "resource", operator: "exists", expected: true },
      ],
    },
  ])
    strict.equal((await validateContract({ ...c, ...patch })).valid, false);
  const conflicting = {
    ...example,
    permitted_actions: ["process.execute"],
    forbidden_actions: ["process.execute"],
  };
  strict.equal(
    (
      await validateContract(
        await createContract(conflicting, await analyzeRequest(conflicting)),
      )
    ).valid,
    false,
  );
});
test("preprocessing deduplicates supplemental records without losing immutable requirements", async () => {
  const c = await createContract(example, await analyzeRequest(example));
  const p = await preprocessContext({
    contract: c,
    sessionRecords: [
      { answer: "same" },
      { answer: "same" },
      { huge: "x".repeat(100) },
    ],
    maxChars: 30,
  });
  strict.equal(p.duplicates_removed, 1);
  strict.equal(p.omitted_records, 1);
  strict.equal(p.preserved.original_request, c.original_request);
  strict.deepEqual(p.preserved.constraints, c.constraints);
  strict.deepEqual(p.preserved.acceptance_criteria, c.acceptance_criteria);
});
test("host grants intersect contract scope and revoked grants fail closed", () => {
  const policy = createPolicy({
    grants: ["process.execute", "network.transfer"],
  });
  strict.equal(
    authorize("process.execute", policy, {
      contract: { permitted_actions: ["local.compute"], forbidden_actions: [] },
    }).allowed,
    false,
  );
  strict.equal(
    authorize("process.execute", policy, {
      contract: {
        permitted_actions: ["process.execute"],
        forbidden_actions: ["process.execute"],
      },
    }).allowed,
    false,
  );
  strict.equal(
    authorize("paid.call", createPolicy({ grants: ["paid.call"] })).allowed,
    false,
  );
  policy.revoked = true;
  strict.equal(authorize("network.transfer", policy).allowed, false);
});
test("canonical hashes avoid insertion-order misses and reject unsafe data", async () => {
  strict.equal(await digest({ a: 1, b: 2 }), await digest({ b: 2, a: 1 }));
  strict.throws(() => canonical({ x: Infinity }));
  strict.equal(getPath({ a: 1 }, "constructor.name"), undefined);
  strict.equal(
    getPath({ files: { "a.txt": "actual-content" } }, "files.a.txt"),
    "actual-content",
  );
  strict.equal(getPath({ a: { b: 1 }, "a.b": 2 }, "a.b"), 1);
  strict.equal(
    getPath({ files: JSON.parse('{"__proto__.x":1}') }, "files.__proto__.x"),
    undefined,
  );
  strict.throws(() => canonical(JSON.parse('{"__proto__":1}')));
});

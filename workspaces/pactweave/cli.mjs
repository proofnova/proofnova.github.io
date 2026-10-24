#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { run, resume, createNodeContext } from "./run.mjs";
import { analyzeRequest } from "./src/request-intent-analyzer.mjs";
import {
  createContract,
  validateContract,
} from "./src/requirements-contract.mjs";
import { reviewOutput } from "./src/adversarial-reviewer.mjs";
import { doctor } from "./src/host-runtime.mjs";
import { canonical, safeId } from "./src/shared.mjs";
import { createRegistry } from "./src/skill-router.mjs";
const commands = [
  "analyze",
  "plan",
  "run",
  "resume",
  "status",
  "verify",
  "explain",
  "cache",
  "wiki",
  "rag",
  "memory",
  "doctor",
  "stats",
  "export",
];
function parse(argv) {
  const args = [],
    flags = {};
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith("--")) {
      const key = s.slice(2);
      if (
        ![
          "json",
          "help",
          "allow-process",
          "delete",
          "include-sensitive",
          "state-root",
          "project-root",
          "command-config",
          "iterations",
          "project",
          "session",
          "task",
          "id",
        ].includes(key)
      )
        throw Error(`Unknown flag: --${key}`);
      if (
        [
          "json",
          "help",
          "allow-process",
          "delete",
          "include-sensitive",
        ].includes(key)
      )
        flags[key] = true;
      else {
        if (!argv[i + 1] || argv[i + 1].startsWith("--"))
          throw Error(`Missing value: ${s}`);
        flags[key] = argv[++i];
      }
    } else args.push(s);
  }
  return { args, flags };
}
async function input(value, { text = false } = {}) {
  if (!value) return {};
  let raw;
  if (value === "-") {
    raw = "";
    for await (const chunk of process.stdin) raw += chunk;
    if (raw.length > 4_000_000) throw Error("Input exceeds bounded size");
  } else {
    try {
      raw = await readFile(value, "utf8");
    } catch (e) {
      if (text && e.code === "ENOENT") return { request: value };
      throw e;
    }
  }
  if (raw.length > 4_000_000) throw Error("Input exceeds bounded size");
  return JSON.parse(raw);
}
function exitFor(result) {
  if (result.state === "PASS") return 0;
  if (result.state !== "BLOCKED") return 0;
  const reason =
    typeof result.reason === "string"
      ? result.reason
      : JSON.stringify(result.reason);
  if (/APPROVAL|permission|grant|authoriz/i.test(reason)) return 3;
  if (/BUDGET|TIMEOUT|CANCEL|OUTPUT_LIMIT/i.test(reason)) return 4;
  if (
    /INPUT|UNSUPPORTED|RUNTIME|QUESTION|PREREQUISITE|KNOWLEDGE_UNAVAILABLE|MODEL_UNAVAILABLE|TASK_EXISTS|missing|criteria|question/i.test(
      reason,
    )
  )
    return 2;
  return 1;
}
export async function main(argv = process.argv.slice(2)) {
  const { args, flags } = parse(argv),
    command = args[0];
  if (flags.help || !commands.includes(command)) {
    return {
      code: flags.help ? 0 : command ? 2 : 0,
      result: {
        name: "PactWeave",
        version: "0.1.0",
        commands,
        usage: "pactweave run examples/invoice.json --json",
        flags: {
          json: "One JSON document on stdout",
          project: "Project identifier",
          session: "Session identifier",
          task: "Saved task ID or explicit new ID for run",
          "state-root": "Private state directory",
          "command-config": "Trusted local Node test configuration JSON",
          "allow-process": "Explicit process execution grant",
          "project-root": "Approved test project directory",
          iterations: "Explicit iteration budget for run/resume",
          id: "Memory record ID",
          delete: "Erase selected local memory or session cache",
          "include-sensitive": "Opt in to raw export; review before sharing",
        },
        state_location: "Private user directory; use --state-root to override.",
      },
    };
  }
  const options = {
    stateRoot: flags["state-root"],
    policy: { grants: flags["allow-process"] ? ["process.execute"] : [] },
    projectRoot: flags["project-root"],
  };
  if (flags["command-config"]) {
    if (!flags["allow-process"])
      return {
        code: 3,
        result: {
          state: "BLOCKED",
          reason:
            "APPROVAL_REQUIRED: --allow-process is required for trusted test code.",
        },
      };
    options.projectCommand = await input(flags["command-config"]);
  }
  if (flags.iterations)
    options.budgets = { maxIterations: Number(flags.iterations) };
  if (command === "doctor")
    return {
      code: 0,
      result: { ...(await doctor()), adapters: createRegistry().list() },
    };
  if (["analyze", "plan", "run"].includes(command)) {
    const spec = await input(args[1], { text: command === "analyze" });
    if (flags.project) spec.project_id = flags.project;
    if (flags.session) spec.session_id = flags.session;
    if (flags.task) spec.task_id = flags.task;
    if (command === "run") {
      const result = await run(spec, options);
      return { code: exitFor(result), result };
    }
    const analysis = await analyzeRequest(spec);
    if (command === "analyze") return { code: 0, result: analysis };
    const contract = await createContract(spec, analysis),
      validation = await validateContract(contract);
    return {
      code: validation.valid ? 0 : 2,
      result: {
        state: validation.valid ? "PLAN" : "BLOCKED",
        contract,
        validation,
        notice: "Plan only; no adapter or model was executed.",
      },
    };
  }
  const project_id = safeId(flags.project || "default"),
    session_id = safeId(flags.session || "default");
  const context = await createNodeContext({ project_id }, options);
  const taskId = flags.task;
  if (["status", "resume", "verify", "explain"].includes(command)) {
    if (!taskId)
      return {
        code: 2,
        result: {
          reason: "Provide --task TASK_ID --project PROJECT --session SESSION",
          sessions: await context.store.list("Sessions", { session_id }),
        },
      };
    const previous = await context.store.get("Sessions", safeId(taskId), {
      session_id,
    });
    if (!previous)
      return {
        code: 2,
        result: {
          state: "BLOCKED",
          reason: "Saved task not found in this project/session.",
        },
      };
    if (command === "resume") {
      const spec = args[1] ? await input(args[1]) : {};
      const result = await resume(previous, spec, { ...options, context });
      return { code: exitFor(result), result };
    }
    if (command === "verify") {
      for (const [id, saved] of Object.entries(
        previous.source_versions || {},
      )) {
        const meta = context.registry.describe(id);
        if (!meta)
          return {
            code: 2,
            result: {
              passed: false,
              reason: `Required adapter unavailable: ${id}`,
            },
          };
        if (context.registry.verifySources)
          await context.registry.verifySources(id);
        const current = {
          version: meta.version,
          source_commit: meta.source_commit || "trusted-host",
          source_sha256:
            meta.files?.["browser.mjs"]?.sha256 ||
            meta.source_sha256 ||
            "host-registered",
        };
        if (canonical(current) !== canonical(saved))
          return {
            code: 1,
            result: { passed: false, reason: `Adapter source changed: ${id}` },
          };
      }
      const result = await reviewOutput({
        contract: previous.contract,
        output: previous.output,
        original_request_digest: previous.original_request_digest,
        executionEvidence: previous.evidence,
      });
      return { code: result.passed ? 0 : 1, result };
    }
    return {
      code: 0,
      result:
        command === "explain"
          ? {
              contract: previous.contract,
              plan: previous.plan,
              events: previous.events,
              evidence: previous.evidence,
              reason: previous.reason,
            }
          : previous,
    };
  }
  if (command === "cache") {
    if (flags.delete)
      return {
        code: 0,
        result: await context.cache.endSession(project_id, session_id),
      };
    return {
      code: 0,
      result: {
        ...context.cache.stats(),
        notice:
          "Live process counters; historical workflow counters are in stats/status. Cache data are separate from long-term Memory.",
      },
    };
  }
  if (command === "wiki" || command === "rag") {
    const query = await input(args[1]);
    const result = query.text
      ? await context.retriever.ingest({ ...query, kind: command })
      : await context.retriever.search({
          ...query,
          kind: command,
          needed: true,
        });
    return { code: 0, result };
  }
  if (command === "memory") {
    if (flags.delete) {
      if (!flags.id) return { code: 2, result: { reason: "--id is required" } };
      return {
        code: 0,
        result: await context.store.delete("Memory", safeId(flags.id)),
      };
    }
    if (args[1]) {
      const item = await input(args[1]);
      return {
        code: 0,
        result: await context.store.put("Memory", safeId(item.id), item.value),
      };
    }
    return { code: 0, result: await context.store.list("Memory") };
  }
  if (command === "stats") {
    const records = await context.store.list("Sessions", { session_id });
    return {
      code: 0,
      result: {
        project_id,
        session_id,
        tasks: records.map((r) => ({
          id: r.id,
          state: r.value.state,
          metrics: r.value.metrics,
          iterations: r.value.iterations,
        })),
        live_gateway: context.gateway.stats(),
        live_cache: context.cache.stats(),
      },
    };
  }
  if (command === "export")
    return {
      code: 0,
      result: await context.store.export({
        includeSensitive: !!flags["include-sensitive"],
      }),
    };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const json = process.argv.includes("--json");
  try {
    const { code, result } = await main();
    process.stdout.write(
      json
        ? JSON.stringify(result, null, 2) + "\n"
        : `${JSON.stringify(result, null, 2)}\n`,
    );
    process.exitCode = code;
  } catch (e) {
    const result = {
      state: "BLOCKED",
      reason: e.code || "VALIDATION",
      message: e.message,
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exitCode = /APPROVAL/.test(e.code || "")
      ? 3
      : /CANCEL|TIMEOUT|BUDGET/.test(e.code || "")
        ? 4
        : /ENOENT|RUNTIME|UNSUPPORTED/.test(e.code || "")
          ? 2
          : 1;
  }
}

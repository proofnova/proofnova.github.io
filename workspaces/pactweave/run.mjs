import { readFile, mkdir, open, unlink, lstat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { ContextStore, NodeFileCacheBackend } from "./src/context-store.mjs";
import { SessionLLMCache } from "./src/session-llm-cache.mjs";
import { KnowledgeRetriever } from "./src/knowledge-retriever.mjs";
import { LLMGateway } from "./src/llm-gateway.mjs";
import { createRegistry } from "./src/skill-router.mjs";
import { createPolicy } from "./src/security-policy.mjs";
import { createProjectTestAdapter } from "./src/host-runtime.mjs";
import { runWorkflow, resumeWorkflow } from "./src/pact-loop.mjs";
import { safeId, PactError } from "./src/shared.mjs";
export { runWorkflow, resumeWorkflow } from "./src/pact-loop.mjs";
export { analyzeRequest } from "./src/request-intent-analyzer.mjs";
export {
  createContract,
  validateContract,
} from "./src/requirements-contract.mjs";
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
export function defaultStateRoot() {
  return path.join(os.homedir(), ".pactweave");
}
async function withWorkflowLease(context, session_id, operation) {
  if (!context.stateRoot) return operation();
  const project = safeId(context.store.project_id),
    session = safeId(session_id || "default");
  const directory = path.join(
    path.resolve(context.stateRoot),
    "runner-locks",
    project,
  );
  let walk = path.parse(directory).root;
  for (const part of directory
    .slice(walk.length)
    .split(path.sep)
    .filter(Boolean)) {
    walk = path.join(walk, part);
    try {
      const stat = await lstat(walk);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        throw new PactError("Unsafe runner lock path", "PATH_UNSAFE");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      await mkdir(walk, { mode: 0o700 }).catch((e) => {
        if (e.code !== "EEXIST") throw e;
      });
    }
  }
  const lockFile = path.join(directory, `${session}.lock`);
  let handle;
  try {
    handle = await open(lockFile, "wx", 0o600);
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    const stat = await lstat(lockFile);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new PactError("Unsafe runner lock", "PATH_UNSAFE");
    let owner;
    try {
      owner = JSON.parse(await readFile(lockFile, "utf8"));
    } catch {
      throw new PactError(
        "Unverifiable runner lock; inspect private state before manual recovery",
        "STORE_CONFLICT",
      );
    }
    throw new PactError(
      `Session lease exists for PID ${Number.isSafeInteger(owner.pid) ? owner.pid : "unknown"}. Wait for the owner; after a crash, inspect the lock and remove only this session lock when no runner remains. Automatic stale-lock deletion is disabled.`,
      "STORE_CONFLICT",
    );
  }
  await handle.writeFile(
    JSON.stringify({
      pid: process.pid,
      project_id: project,
      session_id: session,
      created_at: new Date().toISOString(),
    }),
  );
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(lockFile);
  }
}
export async function createNodeContext(spec = {}, options = {}) {
  const project_id = spec.project_id || "default",
    root = options.stateRoot || defaultStateRoot();
  const store = new ContextStore({
    root: path.join(root, "context"),
    project_id,
  });
  await store.init();
  const backend = new NodeFileCacheBackend({
    root: path.join(root, "session-cache"),
    project_id,
  });
  if (backend.init) await backend.init();
  store.attachCache(backend);
  const cache = new SessionLLMCache({
    store: backend,
    ttlMs: options.cacheTtlMs,
  });
  const policy = createPolicy(options.policy || {});
  const additionalAdapters = [];
  if (options.projectCommand)
    additionalAdapters.push(
      await createProjectTestAdapter(options.projectCommand, {
        policy,
        root: options.projectRoot || process.cwd(),
      }),
    );
  const registry = createRegistry({
    sourceReader: (id, name) =>
      readFile(path.join(packageRoot, "vendor", id, name), "utf8"),
    additionalAdapters,
  });
  const retriever = new KnowledgeRetriever({
    store,
    policy,
    externalAdapter: options.externalAdapter,
  });
  const gateway = new LLMGateway({
    cache,
    policy,
    providers: options.providers,
    budget: options.llmBudget,
    sourceManifest: () => retriever.sourceManifest(),
  });
  return {
    store,
    cache,
    registry,
    retriever,
    gateway,
    policy,
    stateRoot: root,
  };
}
export async function run(spec, options = {}) {
  const context = options.context || (await createNodeContext(spec, options));
  for (const doc of spec.knowledge_documents || [])
    await context.retriever.ingest(doc);
  return withWorkflowLease(context, spec.session_id || "default", () =>
    runWorkflow(
      {
        ...spec,
        project_id: context.store.project_id,
        session_id: spec.session_id || "default",
      },
      {
        ...context,
        budgets: options.budgets,
        signal: options.signal,
        repair: options.repair,
        modelRequest: options.modelRequest,
      },
    ),
  );
}
export async function resume(previous, spec = {}, options = {}) {
  const context =
    options.context ||
    (await createNodeContext({ project_id: previous.project_id }, options));
  return withWorkflowLease(context, previous.session_id, () =>
    resumeWorkflow(previous, spec, {
      ...context,
      budgets: options.budgets,
      signal: options.signal,
      repair: options.repair,
      modelRequest: options.modelRequest,
    }),
  );
}

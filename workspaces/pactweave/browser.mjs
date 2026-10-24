import { MemoryContextStore } from "./src/memory-context-store.mjs";
import { createRegistry } from "./src/skill-router.mjs";
import { KnowledgeRetriever } from "./src/knowledge-retriever.mjs";
import {
  SessionLLMCache,
  MemoryCacheBackend,
} from "./src/session-llm-cache.mjs";
import { LLMGateway } from "./src/llm-gateway.mjs";
import { runWorkflow } from "./src/pact-loop.mjs";
import { createPolicy } from "./src/security-policy.mjs";
export { analyzeRequest } from "./src/request-intent-analyzer.mjs";
export { createRegistry } from "./src/skill-router.mjs";
export { MemoryContextStore } from "./src/memory-context-store.mjs";
export { KnowledgeRetriever } from "./src/knowledge-retriever.mjs";
export async function createBrowserContext(spec = {}) {
  const project_id = spec.project_id || "browser",
    store = new MemoryContextStore({ project_id });
  await store.init();
  const backend = new MemoryCacheBackend();
  store.attachCache(backend);
  const cache = new SessionLLMCache({ store: backend });
  const policy = createPolicy();
  const registry = createRegistry();
  const retriever = new KnowledgeRetriever({ store, policy });
  const gateway = new LLMGateway({ cache, policy });
  return {
    store,
    cache,
    policy,
    registry,
    retriever,
    gateway,
    capabilities: {
      durable_storage: false,
      process_execution: "Local CLI Required",
      host_models: "Local CLI Required",
      pure_adapters: 30,
    },
  };
}
export async function runBrowser(spec, options = {}) {
  const context = options.context || (await createBrowserContext(spec));
  for (const source of spec.knowledge_documents || [])
    await context.retriever.ingest(source);
  return runWorkflow(
    {
      ...spec,
      project_id: context.store.project_id,
      session_id: spec.session_id || "browser-session",
    },
    { ...context, budgets: options.budgets, signal: options.signal },
  );
}

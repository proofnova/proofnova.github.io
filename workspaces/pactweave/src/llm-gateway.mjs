import { clone, canonical, PactError } from "./shared.mjs";
import { authorize } from "./security-policy.mjs";
import { SessionLLMCache } from "./session-llm-cache.mjs";

export class LLMGateway {
  constructor({
    cache = new SessionLLMCache(),
    providers = {},
    policy = {},
    budget = {},
    now = () => Date.now(),
    sourceManifest,
  } = {}) {
    this.cache = cache;
    this.providers = providers;
    this.policy = policy;
    this.now = now;
    this.sourceManifest = sourceManifest;
    this.budget = {
      maxCalls: 0,
      maxTokens: 10000,
      maxRetries: 0,
      maxTimeMs: 15000,
      ...budget,
    };
    for (const [key, value] of Object.entries(this.budget))
      if (!Number.isFinite(value) || value < 0)
        throw new PactError(`Invalid gateway ${key}`, "INPUT_INVALID");
    if (this.budget.maxRetries > 2 || this.budget.maxTimeMs > 300000)
      throw new PactError("Gateway retry/time cap exceeded", "INPUT_LIMIT");
    this.inflight = new Map();
    this.counters = {
      actual_calls: 0,
      exact_cache_hits: 0,
      avoided_calls: 0,
      coalesced_calls: 0,
      context_only_matches: 0,
      tokens: 0,
      usage_unknown_calls: 0,
      failures: 0,
    };
    this.events = [];
  }
  async authority(provider, query) {
    if (query._deadline !== undefined && this.now() >= query._deadline)
      throw new PactError("Gateway time budget exhausted", "BUDGET_EXHAUSTED");
    if (query.signal?.aborted)
      throw new PactError("Model request cancelled", "CANCELLED");
    const actions = ["llm.call"];
    if (provider.kind === "paid") actions.push("paid.call");
    if (provider.network || provider.kind === "paid")
      actions.push("network.transfer");
    for (const action of actions) {
      const details = {
        model: query.model_identifier,
        project_id: query.project_id,
        session_id: query.session_id,
        contract: query.contract,
      };
      if (!authorize(action, this.policy, details).allowed)
        throw new PactError(
          `Model authority required: ${action}`,
          "APPROVAL_REQUIRED",
        );
      if (
        this.policy.check &&
        !(await this.bounded(
          this.policy.check(action, details),
          query,
          "Policy check",
        ))
      )
        throw new PactError("Model authority revoked", "APPROVAL_REQUIRED");
      if (
        this.policy.revoked ||
        query.signal?.aborted ||
        !authorize(action, this.policy, details).allowed
      )
        throw new PactError(
          "Model authority revoked or cancelled",
          query.signal?.aborted ? "CANCELLED" : "APPROVAL_REQUIRED",
        );
    }
  }
  event(value) {
    this.events.push({ ...value, at: new Date(this.now()).toISOString() });
    if (this.events.length > 200) this.events.shift();
  }
  async currentQuery(query) {
    return {
      ...query,
      source_versions: this.sourceManifest
        ? {
            engine: clone(query._engine_sources ?? query.source_versions ?? {}),
            knowledge: await this.bounded(
              this.sourceManifest(),
              query,
              "Source manifest",
            ),
          }
        : query.source_versions || {},
    };
  }
  async request(query) {
    query = {
      ...query,
      _engine_sources: clone(query?.source_versions || {}),
      _deadline: this.now() + this.budget.maxTimeMs,
    };
    if (
      query?.max_calls_remaining !== undefined &&
      (!Number.isInteger(query.max_calls_remaining) ||
        query.max_calls_remaining < 0)
    )
      throw new PactError(
        "Invalid remaining workflow call budget",
        "INPUT_INVALID",
      );
    if (!query?.needed)
      return {
        status: "skipped",
        response: null,
        evidence: { reason: "No model-required information gap" },
      };
    const provider = this.providers[query.model_identifier];
    if (
      !provider ||
      !["local", "host", "paid"].includes(provider.kind) ||
      typeof provider.call !== "function"
    )
      throw new PactError(
        "No explicitly configured model provider; deterministic operations remain available",
        "MODEL_UNAVAILABLE",
      );
    await this.authority(provider, query);
    query._session_generation = await this.cache.captureSession(query);
    const current = await this.currentQuery(query);
    await this.authority(provider, current);
    const cached = await this.cache.lookup(current);
    await this.authority(provider, current);
    const fresh = await this.currentQuery(query);
    if (canonical(fresh.source_versions) !== canonical(current.source_versions))
      throw new PactError(
        "Knowledge sources changed during cache lookup",
        "SOURCE_CHANGED",
      );
    if (cached.status === "exact") {
      await this.finalGuard(provider, current);
      this.returnAuthority(provider, current);
      this.counters.exact_cache_hits++;
      this.counters.avoided_calls++;
      this.event({ status: "cached", key: cached.key });
      return {
        status: "cached",
        response: cached.response,
        evidence: {
          cache_key: cached.key,
          actual_call: false,
          attempted_calls: 0,
        },
      };
    }
    if (cached.context.length) this.counters.context_only_matches++;
    const key = await this.cache.key(current);
    if (this.inflight.has(key)) {
      this.counters.coalesced_calls++;
      const result = await this.bounded(
        this.inflight.get(key),
        current,
        "Coalesced request",
      );
      await this.authority(provider, current);
      const after = await this.currentQuery(query);
      if (
        canonical(after.source_versions) !== canonical(current.source_versions)
      )
        throw new PactError(
          "Sources changed before coalesced return",
          "SOURCE_CHANGED",
        );
      await this.finalGuard(provider, current);
      this.returnAuthority(provider, current);
      return {
        ...clone(result),
        status: "coalesced",
        evidence: {
          ...result.evidence,
          actual_call: false,
          attempted_calls: 0,
          coalesced: true,
        },
      };
    }
    const promise = this.perform(provider, current, cached.context, key);
    this.inflight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }
  async perform(provider, query, priorContext, key) {
    const started = this.now(),
      deadline = query._deadline;
    let last;
    for (let attempt = 0; attempt <= this.budget.maxRetries; attempt++) {
      await this.authority(provider, query);
      await this.cache.assertSession(query, query._session_generation);
      if (
        attempt >= (query.max_calls_remaining ?? Infinity) ||
        this.counters.actual_calls >= this.budget.maxCalls ||
        this.counters.tokens >= this.budget.maxTokens ||
        this.now() >= deadline
      )
        throw new PactError("Gateway budget exhausted", "BUDGET_EXHAUSTED");
      this.counters.actual_calls++;
      const controller = new AbortController();
      const abort = () => controller.abort();
      query.signal?.addEventListener("abort", abort, { once: true });
      let timeout,
        admitted = false;
      try {
        const remaining = Math.max(1, deadline - this.now());
        const timeoutPromise = new Promise((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            reject(
              new PactError(
                "Model callback time limit exceeded",
                "BUDGET_EXHAUSTED",
              ),
            );
          }, remaining);
        });
        const payload = {
          request: query.request,
          context: clone(query.context ?? null),
          prior_responses: clone(priorContext),
          model_identifier: query.model_identifier,
          max_output_tokens: Math.max(
            0,
            this.budget.maxTokens - this.counters.tokens,
          ),
          signal: controller.signal,
        };
        const result = await this.bounded(
          Promise.race([
            Promise.resolve().then(() => provider.call(payload)),
            timeoutPromise,
          ]),
          query,
          "Model callback",
        );
        if (
          !result ||
          !Object.hasOwn(result, "response") ||
          canonical(result.response).length > 1_000_000
        )
          throw new PactError(
            "Invalid or oversized provider response",
            "MODEL_RESPONSE_INVALID",
          );
        await this.authority(provider, query);
        if (controller.signal.aborted || this.now() >= deadline)
          throw new PactError(
            "Model callback cancelled or expired",
            "BUDGET_EXHAUSTED",
          );
        const latest = await this.currentQuery(query);
        if (
          canonical(latest.source_versions) !== canonical(query.source_versions)
        )
          throw new PactError(
            "Sources changed during model call",
            "SOURCE_CHANGED",
          );
        const usage = result.usage;
        const tokens =
          usage?.total_tokens ??
          (Number.isFinite(usage?.input_tokens) &&
          Number.isFinite(usage?.output_tokens)
            ? usage.input_tokens + usage.output_tokens
            : null);
        if (tokens !== null && (!Number.isFinite(tokens) || tokens < 0))
          throw new PactError(
            "Invalid actual provider usage",
            "MODEL_RESPONSE_INVALID",
          );
        if (tokens === null) this.counters.usage_unknown_calls++;
        else this.counters.tokens += tokens;
        if (this.counters.tokens > this.budget.maxTokens)
          throw new PactError(
            "Provider exceeded token allowance",
            "BUDGET_EXHAUSTED",
          );
        await this.authority(provider, query);
        await this.cache.set(query, result.response, {
          assumptions: query.assumptions,
          session_generation: query._session_generation,
        });
        admitted = true;
        await this.authority(provider, query);
        const finalSources = await this.currentQuery(query);
        if (
          canonical(finalSources.source_versions) !==
          canonical(query.source_versions)
        )
          throw new PactError(
            "Sources changed before model result admission",
            "SOURCE_CHANGED",
          );
        await this.finalGuard(provider, query);
        this.returnAuthority(provider, query);
        this.event({
          status: "called",
          key,
          attempt: attempt + 1,
          tokens,
          usage_reported: tokens !== null,
        });
        return {
          status: "called",
          response: clone(result.response),
          usage: usage ? clone(usage) : null,
          evidence: {
            cache_key: key,
            actual_call: true,
            attempted_calls: attempt + 1,
            attempt: attempt + 1,
            elapsed_ms: this.now() - started,
            source_versions: clone(query.source_versions),
          },
        };
      } catch (error) {
        if (admitted)
          await this.cache.invalidate(key, error.code || "ADMISSION_REVOKED");
        last = error;
        this.counters.failures++;
        this.event({
          status: "failed",
          key,
          attempt: attempt + 1,
          reason: error.code || "PROVIDER_ERROR",
        });
        if (
          [
            "APPROVAL_REQUIRED",
            "CANCELLED",
            "BUDGET_EXHAUSTED",
            "SOURCE_CHANGED",
            "MODEL_RESPONSE_INVALID",
            "SESSION_ENDED",
          ].includes(error.code) ||
          attempt >= this.budget.maxRetries
        )
          throw error;
      } finally {
        clearTimeout(timeout);
        query.signal?.removeEventListener("abort", abort);
        controller.abort();
      }
    }
    throw last;
  }
  async bounded(promise, query, label) {
    let timeout;
    let abort;
    const remaining = Math.max(
      0,
      (query._deadline ?? this.now() + this.budget.maxTimeMs) - this.now(),
    );
    if (!remaining)
      throw new PactError(`${label} time budget exhausted`, "BUDGET_EXHAUSTED");
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new PactError(
                  `${label} time budget exhausted`,
                  "BUDGET_EXHAUSTED",
                ),
              ),
            remaining,
          );
          abort = () =>
            reject(new PactError(`${label} cancelled`, "CANCELLED"));
          if (query.signal?.aborted) abort();
          else query.signal?.addEventListener("abort", abort, { once: true });
        }),
      ]);
    } finally {
      clearTimeout(timeout);
      if (abort) query.signal?.removeEventListener("abort", abort);
    }
  }
  returnAuthority(provider, query) {
    if (query.signal?.aborted)
      throw new PactError("Model request cancelled", "CANCELLED");
    if (this.now() >= query._deadline)
      throw new PactError("Gateway time budget exhausted", "BUDGET_EXHAUSTED");
    const actions = ["llm.call"];
    if (provider.kind === "paid") actions.push("paid.call");
    if (provider.network || provider.kind === "paid")
      actions.push("network.transfer");
    for (const action of actions)
      if (
        !authorize(action, this.policy, {
          contract: query.contract,
          signal: query.signal,
        }).allowed
      )
        throw new PactError(
          "Model authority revoked before return",
          "APPROVAL_REQUIRED",
        );
  }
  async finalGuard(provider, query) {
    await this.authority(provider, query);
    await this.cache.assertSession(query, query._session_generation);
    this.returnAuthority(provider, query);
  }
  stats() {
    return {
      ...this.counters,
      cache: this.cache.stats(),
      events: clone(this.events),
    };
  }
}

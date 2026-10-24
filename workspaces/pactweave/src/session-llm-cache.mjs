import { canonical, digest, clone, PactError } from "./shared.mjs";
import { checkedId } from "./memory-context-store.mjs";

export class MemoryCacheBackend {
  constructor() {
    this.cache_backend = true;
    this.records = new Map();
    this.sessions = new Map();
  }
  async get(key) {
    return this.records.has(key) ? clone(this.records.get(key)) : null;
  }
  async set(key, value, { session_generation } = {}) {
    const state = this.sessions.get(
      `${value.project_id}/${value.session_id}`,
    ) || { generation: 0, closed: false };
    if (
      state.closed ||
      (session_generation !== undefined &&
        state.generation !== session_generation)
    )
      throw new PactError(
        "Session ended while cache response was pending",
        "SESSION_ENDED",
      );
    this.records.set(key, clone(value));
  }
  async sessionState(project, session) {
    checkedId(project);
    checkedId(session);
    return clone(
      this.sessions.get(`${project}/${session}`) || {
        generation: 0,
        closed: false,
      },
    );
  }
  async delete(key) {
    return this.records.delete(key);
  }
  async entries() {
    return [...this.records].map(([key, value]) => [key, clone(value)]);
  }
  async deleteSession(project, session) {
    checkedId(project);
    checkedId(session);
    const id = `${project}/${session}`,
      old = this.sessions.get(id) || { generation: 0, closed: false };
    this.sessions.set(id, { generation: old.generation + 1, closed: true });
    for (const [key, value] of this.records)
      if (value.project_id === project && value.session_id === session)
        this.records.delete(key);
  }
}

export async function cacheIdentity(query) {
  checkedId(query?.project_id, "project");
  checkedId(query?.session_id, "session");
  if (
    typeof query.request !== "string" ||
    !query.request.trim() ||
    typeof query.model_identifier !== "string" ||
    !query.model_identifier.trim()
  )
    throw new PactError(
      "Cache request and model are required",
      "INPUT_INVALID",
    );
  if (!query.requirements_digest || !query.permission_scope_digest)
    throw new PactError(
      "Cache requires contract and permission digests",
      "INPUT_INVALID",
    );
  if (
    query.request.length > 100000 ||
    canonical(query.context ?? null).length > 250000 ||
    canonical(query.source_versions || {}).length > 100000
  )
    throw new PactError(
      "LLM context identity exceeds bounded size",
      "INPUT_LIMIT",
    );
  return {
    project_id: query.project_id,
    session_id: query.session_id,
    request_digest: await digest(query.request),
    normalized_request: query.request.trim().replace(/\s+/g, " "),
    context_digest: await digest(query.context ?? null),
    model_identifier: query.model_identifier,
    source_versions: clone(query.source_versions || {}),
    requirements_digest: query.requirements_digest,
    permission_scope_digest: query.permission_scope_digest,
  };
}
export class SessionLLMCache {
  constructor({
    store = new MemoryCacheBackend(),
    ttlMs = 30 * 60 * 1000,
    now = () => Date.now(),
    maxEntries = 500,
  } = {}) {
    if (!store.cache_backend)
      throw new PactError(
        "Session responses require a separate cache backend, not a PactVault area",
        "CACHE_BACKEND_REQUIRED",
      );
    if (
      !Number.isFinite(ttlMs) ||
      ttlMs < 0 ||
      !Number.isInteger(maxEntries) ||
      maxEntries < 1 ||
      maxEntries > 10000
    )
      throw new PactError("Invalid cache bounds", "INPUT_INVALID");
    this.store = store;
    this.ttlMs = ttlMs;
    this.now = now;
    this.maxEntries = maxEntries;
    this.counters = {
      lookups: 0,
      exact_hits: 0,
      context_matches: 0,
      misses: 0,
      invalidations: 0,
      avoided_calls: 0,
    };
    this.events = [];
    this.writeQueue = Promise.resolve();
  }
  async key(query) {
    return digest(await cacheIdentity(query));
  }
  async captureSession(query) {
    const state = await this.store.sessionState(
      query.project_id,
      query.session_id,
    );
    if (state.closed)
      throw new PactError(
        "Session was ended; use a new session identity",
        "SESSION_ENDED",
      );
    return state.generation;
  }
  async assertSession(query, generation) {
    const state = await this.store.sessionState(
      query.project_id,
      query.session_id,
    );
    if (state.closed || state.generation !== generation)
      throw new PactError(
        "Session deletion invalidated pending work",
        "SESSION_ENDED",
      );
    return true;
  }
  recordEvent(event) {
    this.events.push({ ...event, at: new Date(this.now()).toISOString() });
    if (this.events.length > 100) this.events.shift();
  }
  async lookup(query) {
    const generation = await this.captureSession(query);
    const identity = await cacheIdentity(query),
      key = await digest(identity);
    this.counters.lookups++;
    const now = this.now(),
      record = await this.store.get(key);
    if (record) {
      if (
        record.validity_status === "valid" &&
        Date.parse(record.expires_at) > now &&
        canonical(record.identity) === canonical(identity)
      ) {
        this.counters.exact_hits++;
        this.counters.avoided_calls++;
        await this.assertSession(query, generation);
        return {
          status: "exact",
          key,
          response: clone(record.response),
          record: clone(record),
          context: [],
        };
      }
      await this.store.delete(key);
      this.counters.invalidations++;
      this.recordEvent({
        reason:
          Date.parse(record.expires_at) <= now
            ? "expired"
            : "identity_or_validity_changed",
        key,
      });
    }
    const context = [];
    for (const [entryKey, entry] of await this.store.entries()) {
      if (
        entry.project_id !== identity.project_id ||
        entry.session_id !== identity.session_id
      )
        continue;
      if (
        Date.parse(entry.expires_at) <= now ||
        entry.validity_status !== "valid"
      ) {
        await this.store.delete(entryKey);
        this.counters.invalidations++;
        this.recordEvent({ reason: "expired_or_invalid", key: entryKey });
        continue;
      }
      const prior = entry.identity;
      if (
        prior.model_identifier === identity.model_identifier &&
        prior.request_digest === identity.request_digest &&
        (prior.requirements_digest !== identity.requirements_digest ||
          prior.permission_scope_digest !== identity.permission_scope_digest ||
          canonical(prior.source_versions) !==
            canonical(identity.source_versions))
      ) {
        await this.store.delete(entryKey);
        this.counters.invalidations++;
        this.recordEvent({
          reason: "source_requirements_or_permission_changed",
          key: entryKey,
        });
        continue;
      }
      if (
        prior.model_identifier !== identity.model_identifier ||
        prior.permission_scope_digest !== identity.permission_scope_digest ||
        prior.requirements_digest !== identity.requirements_digest ||
        canonical(prior.source_versions) !== canonical(identity.source_versions)
      )
        continue;
      const currentWords = new Set(
        identity.normalized_request
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 2),
      );
      const overlap = prior.normalized_request
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => currentWords.has(word)).length;
      if (overlap > 0)
        context.push({
          response: canonical(entry.response).slice(0, 8000),
          truncated: canonical(entry.response).length > 8000,
          source_request: prior.normalized_request,
          provenance: "prior-session-response",
          trusted: false,
          key: entryKey,
          overlap,
        });
    }
    context.sort((a, b) => b.overlap - a.overlap);
    const selected = context.slice(0, 3);
    await this.assertSession(query, generation);
    if (selected.length) this.counters.context_matches++;
    this.counters.misses++;
    return {
      status: selected.length ? "context" : "miss",
      key,
      response: null,
      context: selected,
    };
  }
  async set(query, response, metadata = {}) {
    const session_generation =
      metadata.session_generation ?? (await this.captureSession(query));
    const next = this.writeQueue.then(() =>
      this.setLocked(query, response, { ...metadata, session_generation }),
    );
    this.writeQueue = next.catch(() => {});
    return next;
  }
  async setLocked(query, response, metadata = {}) {
    const identity = await cacheIdentity(query),
      key = await digest(identity);
    if (canonical(response).length > 1_000_000)
      throw new PactError("Cached response exceeds bound", "INPUT_LIMIT");
    const now = this.now();
    const record = {
      schema_version: 1,
      ...identity,
      identity,
      response: clone(response),
      assumptions: clone(metadata.assumptions || query.assumptions || []),
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + this.ttlMs).toISOString(),
      validity_status: "valid",
    };
    const entries = await this.store.entries();
    if (
      entries.length >= this.maxEntries &&
      !entries.some(([existing]) => existing === key)
    ) {
      entries.sort((a, b) => a[1].created_at.localeCompare(b[1].created_at));
      await this.store.delete(entries[0][0]);
      this.recordEvent({ reason: "capacity", key: entries[0][0] });
    }
    await this.assertSession(query, metadata.session_generation);
    await this.store.set(key, record, {
      session_generation: metadata.session_generation,
    });
    return { key, expires_at: record.expires_at };
  }
  async invalidate(filter, reason = "explicit") {
    let count = 0;
    let exactKey;
    if (filter?.request && filter.model_identifier)
      exactKey = await this.key(filter);
    for (const [key, record] of await this.store.entries()) {
      const match =
        typeof filter === "string"
          ? key === filter
          : exactKey
            ? key === exactKey
            : Object.entries(filter || {}).every(
                ([field, value]) =>
                  Object.hasOwn(record, field) &&
                  canonical(record[field]) === canonical(value),
              );
      if (match) {
        await this.store.delete(key);
        count++;
        this.recordEvent({ reason, key });
      }
    }
    this.counters.invalidations += count;
    return { invalidated: count, reason };
  }
  async endSession(project_id, session_id) {
    checkedId(project_id);
    checkedId(session_id);
    await this.store.deleteSession(project_id, session_id);
    this.recordEvent({ reason: "session-ended", project_id, session_id });
    return { deleted: true, project_id, session_id };
  }
  stats() {
    return { ...this.counters, events: clone(this.events) };
  }
}

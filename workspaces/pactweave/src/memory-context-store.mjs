import { canonical, digest, clone, redact, PactError } from "./shared.mjs";

export const AREAS = ["Resources", "Memory", "Skills", "Sessions"];
export function checkedId(value, label = "id") {
  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/.test(value) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value)
  )
    throw new PactError(`Invalid ${label}`, "SCOPE_INVALID");
  return value;
}
export function location(project, area, id, session_id) {
  checkedId(project, "project");
  if (!AREAS.includes(area))
    throw new PactError("Unknown PactVault area", "AREA_INVALID");
  checkedId(id);
  if (area === "Sessions" && !session_id)
    throw new PactError("Session scope required", "SCOPE_INVALID");
  if (session_id) checkedId(session_id, "session");
  return [area, session_id || "_shared", id].join("/");
}
export function privateValue(value) {
  const clean = redact(value);
  for (const record of clean.records || [])
    if (record.area === "Sessions") {
      const original = record.value;
      record.value =
        original && typeof original === "object" && !Array.isArray(original)
          ? Object.fromEntries(
              Object.keys(original).map((key) => [
                key,
                key === "state" &&
                [
                  "ANALYZE",
                  "PLAN",
                  "EXECUTE",
                  "REVIEW",
                  "REPAIR",
                  "PASS",
                  "BLOCKED",
                ].includes(original[key])
                  ? original[key]
                  : "[REDACTED]",
              ]),
            )
          : "[REDACTED_SESSION]";
    }
  return clean;
}
export function immutableOriginal(previous, value) {
  if (
    previous?.original_request !== undefined &&
    previous.original_request !== value?.original_request
  )
    throw new PactError("Original request is immutable", "ORIGINAL_CHANGED");
}
export async function makeRecord(
  project,
  area,
  id,
  value,
  { session_id, now = () => Date.now(), previous } = {},
) {
  location(project, area, id, session_id);
  const encoded = canonical(value);
  if (encoded.length > 4_000_000)
    throw new PactError("Record exceeds bounded size", "INPUT_LIMIT");
  immutableOriginal(previous?.value, value);
  const stamp = new Date(now()).toISOString();
  return {
    schema_version: 1,
    project_id: project,
    area,
    id,
    session_id: session_id || null,
    value: clone(value),
    hash: await digest(value),
    created_at: previous?.created_at || stamp,
    updated_at: stamp,
  };
}
export async function validateRecord(record, project, key) {
  if (record?.schema_version !== 1)
    throw new PactError("Unknown or corrupt record schema", "SCHEMA_INVALID");
  if (
    record.project_id !== project ||
    location(project, record.area, record.id, record.session_id) !== key ||
    record.hash !== (await digest(record.value))
  )
    throw new PactError("PactVault integrity failure", "STORE_CORRUPT");
  return record;
}
export class MemoryContextStore {
  constructor({ project_id = "default", now = () => Date.now() } = {}) {
    this.project_id = checkedId(project_id, "project");
    this.now = now;
    this.records = new Map();
    this.tombstones = new Set();
    this.cacheBackends = new Set();
    this.queue = Promise.resolve();
  }
  async mutation(fn) {
    const next = this.queue.then(fn);
    this.queue = next.catch(() => {});
    return next;
  }
  async init() {
    return this;
  }
  attachCache(backend) {
    this.cacheBackends.add(backend);
  }
  async put(area, id, value, options = {}) {
    return this.mutation(async () => {
      const key = location(this.project_id, area, id, options.session_id),
        previous = this.records.get(key);
      if (this.tombstones.has(key))
        throw new PactError(
          "Deleted PactVault identity cannot be reused; use a new record/session ID",
          "STORE_DELETED",
        );
      const record = await makeRecord(this.project_id, area, id, value, {
        ...options,
        now: this.now,
        previous,
      });
      if (previous?.hash === record.hash) return clone(previous.value);
      this.records.set(key, record);
      return clone(value);
    });
  }
  async get(area, id, { session_id } = {}) {
    const key = location(this.project_id, area, id, session_id),
      record = this.records.get(key);
    if (!record) return null;
    await validateRecord(record, this.project_id, key);
    return clone(record.value);
  }
  async list(area, { session_id } = {}) {
    if (!AREAS.includes(area))
      throw new PactError("Unknown area", "AREA_INVALID");
    if (area === "Sessions" && !session_id)
      throw new PactError("Session scope required", "SCOPE_INVALID");
    if (session_id) checkedId(session_id);
    const out = [];
    for (const [key, record] of this.records) {
      if (
        record.area !== area ||
        (record.session_id || null) !== (session_id || null)
      )
        continue;
      await validateRecord(record, this.project_id, key);
      out.push(clone(record));
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  }
  async delete(area, id, { session_id } = {}) {
    return this.mutation(async () => {
      const key = location(this.project_id, area, id, session_id);
      const existed = this.records.delete(key);
      this.tombstones.add(key);
      if (area === "Sessions")
        for (const cache of this.cacheBackends)
          await cache.deleteSession(this.project_id, session_id);
      return { deleted: existed, scope: key };
    });
  }
  async export({ includeSensitive = false } = {}) {
    const data = {
      schema_version: 1,
      project_id: this.project_id,
      records: [...this.records.values()].map(clone),
    };
    for (const record of data.records)
      await validateRecord(
        record,
        this.project_id,
        location(this.project_id, record.area, record.id, record.session_id),
      );
    if (includeSensitive) return data;
    const redacted = privateValue(data);
    for (const record of redacted.records)
      record.hash = await digest(record.value);
    return redacted;
  }
  async backup() {
    return this.export();
  }
  async recover() {
    return { recovered: 0, storage: "memory", durable: false };
  }
  async prune({ before, area, session_id } = {}) {
    const deadline = Date.parse(before);
    if (!Number.isFinite(deadline))
      throw new PactError("Valid retention date required", "INPUT_INVALID");
    let count = 0;
    for (const record of [...this.records.values()])
      if (
        (!area || record.area === area) &&
        (!session_id || record.session_id === session_id) &&
        Date.parse(record.updated_at) < deadline
      ) {
        await this.delete(record.area, record.id, {
          session_id: record.session_id,
        });
        count++;
      }
    return { deleted: count };
  }
  async reindex() {
    return { indexed: this.records.size };
  }
}

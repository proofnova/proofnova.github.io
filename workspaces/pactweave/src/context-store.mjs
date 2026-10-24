import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { canonical, digest, clone, PactError } from "./shared.mjs";
import {
  AREAS,
  checkedId,
  location,
  makeRecord,
  validateRecord,
  privateValue,
} from "./memory-context-store.mjs";

async function guardedDirectory(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const part of absolute
    .slice(parsed.root.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, part);
    try {
      const st = await fs.lstat(current);
      if (st.isSymbolicLink() || !st.isDirectory())
        throw new PactError(
          "PactVault rejects links/non-directories",
          "PATH_UNSAFE",
        );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      try {
        await fs.mkdir(current, { mode: 0o700 });
      } catch (createError) {
        if (createError.code !== "EEXIST") throw createError;
      }
      const st = await fs.lstat(current);
      if (st.isSymbolicLink() || !st.isDirectory())
        throw new PactError("Unsafe new directory", "PATH_UNSAFE");
    }
  }
  return absolute;
}
async function safeFile(file) {
  await guardedDirectory(path.dirname(file));
  try {
    const st = await fs.lstat(file);
    if (st.isSymbolicLink() || !st.isFile())
      throw new PactError("PactVault rejects links/non-files", "PATH_UNSAFE");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
async function atomic(file, value) {
  await safeFile(file);
  const temporary = path.join(path.dirname(file), `.tmp-${randomUUID()}`);
  const handle = await fs.open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value));
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(temporary, file);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
}
async function json(file) {
  await safeFile(file);
  let raw;
  try {
    const stat = await fs.stat(file);
    if (stat.size > 8_000_000)
      throw new PactError("Stored record exceeds bound", "STORE_CORRUPT");
    raw = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new PactError("Stored JSON is corrupt", "STORE_CORRUPT");
  }
}
async function unlink(file) {
  await safeFile(file);
  await fs.rm(file, { force: true });
}
async function names(directory) {
  await guardedDirectory(directory);
  const out = await fs.readdir(directory, { withFileTypes: true });
  if (out.length > 10000)
    throw new PactError("Store listing bound exceeded", "STORE_LIMIT");
  for (const item of out)
    if (item.isSymbolicLink())
      throw new PactError("PactVault rejects symlink entries", "PATH_UNSAFE");
  return out;
}
async function eraseTree(directory) {
  await guardedDirectory(directory);
  for (const entry of await names(directory)) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await eraseTree(file);
    else await unlink(file);
  }
  await fs.rmdir(directory);
}
async function lock(directory, fn) {
  await guardedDirectory(directory);
  const file = path.join(directory, ".write-lock");
  await safeFile(file);
  let handle;
  try {
    handle = await fs.open(file, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      throw new PactError(
        "Concurrent writer: retry after owner completes; stale locks require explicit operator review",
        "STORE_CONFLICT",
      );
    throw error;
  }
  try {
    await handle.writeFile(
      JSON.stringify({
        pid: process.pid,
        created_at: new Date().toISOString(),
      }),
    );
    return await fn();
  } finally {
    await handle.close();
    await unlink(file);
  }
}

export class ContextStore {
  constructor({
    root = ".pactweave",
    project_id = "default",
    now = () => Date.now(),
  } = {}) {
    this.root = path.resolve(root);
    this.project_id = checkedId(project_id, "project");
    this.project = path.join(this.root, this.project_id);
    this.now = now;
    this.cacheBackends = new Set();
    this.queue = Promise.resolve();
  }
  async init() {
    await guardedDirectory(this.project);
    for (const name of ["vault", "history", "tombstones", "quarantine"])
      await guardedDirectory(path.join(this.project, name));
    return this;
  }
  attachCache(backend) {
    this.cacheBackends.add(backend);
  }
  async mutation(fn) {
    const next = this.queue.then(() => lock(this.project, fn));
    this.queue = next.catch(() => {});
    return next;
  }
  recordFile(key) {
    return path.join(this.project, "vault", ...key.split("/")) + ".json";
  }
  async keyHash(key) {
    return digest(key);
  }
  async tombstone(key) {
    return json(
      path.join(this.project, "tombstones", `${await this.keyHash(key)}.json`),
    );
  }
  async readRecord(key) {
    const file = this.recordFile(key);
    let record;
    try {
      record = await json(file);
      if (record) await validateRecord(record, this.project_id, key);
      return record;
    } catch (error) {
      if (["STORE_CORRUPT", "SCHEMA_INVALID"].includes(error.code)) {
        await safeFile(file);
        try {
          await fs.rename(
            file,
            path.join(
              this.project,
              "quarantine",
              `${await this.keyHash(key)}-${randomUUID()}.json`,
            ),
          );
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
      }
      throw error;
    }
  }
  async put(area, id, value, options = {}) {
    const key = location(this.project_id, area, id, options.session_id);
    return this.mutation(async () => {
      await this.init();
      if (await this.tombstone(key))
        throw new PactError(
          "Deleted PactVault identity cannot be reused; use a new record/session ID",
          "STORE_DELETED",
        );
      const previous = await this.readRecord(key);
      const record = await makeRecord(this.project_id, area, id, value, {
        ...options,
        now: this.now,
        previous,
      });
      if (previous?.hash === record.hash) return clone(previous.value);
      const history = path.join(
        this.project,
        "history",
        await this.keyHash(key),
      );
      await guardedDirectory(history);
      await atomic(path.join(history, `${record.hash}.json`), record);
      await atomic(this.recordFile(key), record);
      return clone(value);
    });
  }
  async get(area, id, { session_id } = {}) {
    await this.init();
    const key = location(this.project_id, area, id, session_id);
    if (await this.tombstone(key)) return null;
    const record = await this.readRecord(key);
    return record ? clone(record.value) : null;
  }
  async allRecords() {
    await this.init();
    const records = [];
    for (const area of AREAS) {
      const directory = path.join(this.project, "vault", area);
      for (const scope of await names(directory)) {
        if (!scope.isDirectory())
          throw new PactError("Invalid scope entry", "STORE_CORRUPT");
        for (const entry of await names(path.join(directory, scope.name))) {
          if (!entry.isFile() || !entry.name.endsWith(".json"))
            throw new PactError("Invalid record entry", "STORE_CORRUPT");
          const id = entry.name.slice(0, -5),
            session = scope.name === "_shared" ? null : scope.name,
            key = location(this.project_id, area, id, session);
          if (await this.tombstone(key)) continue;
          const record = await this.readRecord(key);
          if (record) records.push(record);
        }
      }
    }
    return records;
  }
  async list(area, { session_id } = {}) {
    location(this.project_id, area, "validate", session_id);
    return (await this.allRecords())
      .filter(
        (record) =>
          record.area === area && record.session_id === (session_id || null),
      )
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  async deleteUnlocked(area, id, { session_id } = {}) {
    const key = location(this.project_id, area, id, session_id),
      hash = await this.keyHash(key),
      file = this.recordFile(key);
    const existed = !!(await this.readRecord(key));
    await atomic(path.join(this.project, "tombstones", `${hash}.json`), {
      schema_version: 1,
      key,
      deleted_at: new Date(this.now()).toISOString(),
    });
    await unlink(file);
    const history = path.join(this.project, "history", hash);
    try {
      await fs.lstat(history);
      await eraseTree(history);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    for (const entry of await names(path.join(this.project, "quarantine")))
      if (entry.name.startsWith(`${hash}-`))
        await unlink(path.join(this.project, "quarantine", entry.name));
    if (area === "Sessions") {
      const backend = new NodeFileCacheBackend({
        root: this.root,
        project_id: this.project_id,
      });
      await backend.deleteSession(this.project_id, session_id);
      for (const cache of this.cacheBackends)
        await cache.deleteSession(this.project_id, session_id);
    }
    await unlink(path.join(this.project, "index.json"));
    return { deleted: existed, scope: key };
  }
  async delete(area, id, options = {}) {
    return this.mutation(async () => {
      await this.init();
      return this.deleteUnlocked(area, id, options);
    });
  }
  async export({ includeSensitive = false } = {}) {
    const data = {
      schema_version: 1,
      project_id: this.project_id,
      records: await this.allRecords(),
    };
    if (includeSensitive) return data;
    const clean = privateValue(data);
    for (const record of clean.records)
      record.hash = await digest(record.value);
    return clean;
  }
  async backup(destination) {
    if (typeof destination !== "string")
      throw new PactError(
        "Explicit external backup filename required",
        "INPUT_INVALID",
      );
    const target = path.resolve(destination);
    if (target.startsWith(this.project + path.sep))
      throw new PactError(
        "Backup must be outside live project state",
        "PATH_UNSAFE",
      );
    const data = await this.export();
    await safeFile(target);
    try {
      await fs.lstat(target);
      throw new PactError("Backup target exists", "STORE_CONFLICT");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await atomic(target, data);
    return {
      file: target,
      records: data.records.length,
      redacted: true,
      erase_scope: "External backups are not erased by PactVault deletion",
    };
  }
  async reindex() {
    return this.mutation(async () => {
      const records = await this.allRecords(),
        index = {
          schema_version: 1,
          project_id: this.project_id,
          entries: records.map(
            ({ area, id, session_id, hash, updated_at }) => ({
              area,
              id,
              session_id,
              hash,
              updated_at,
            }),
          ),
        };
      await atomic(path.join(this.project, "index.json"), index);
      return { indexed: records.length };
    });
  }
  async prune({ before, area, session_id } = {}) {
    const timestamp = Date.parse(before);
    if (!Number.isFinite(timestamp) || (area && !AREAS.includes(area)))
      throw new PactError("Invalid retention query", "INPUT_INVALID");
    return this.mutation(async () => {
      const records = await this.allRecords();
      let count = 0;
      for (const record of records)
        if (
          (!area || record.area === area) &&
          (!session_id || record.session_id === session_id) &&
          Date.parse(record.updated_at) < timestamp
        ) {
          await this.deleteUnlocked(record.area, record.id, {
            session_id: record.session_id,
          });
          count++;
        }
      return { deleted: count };
    });
  }
  async recover() {
    return this.mutation(async () => {
      await this.init();
      let recovered = 0,
        skipped_deleted = 0;
      const failures = [];
      for (const entry of await names(path.join(this.project, "history"))) {
        if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name))
          throw new PactError("Invalid history entry", "STORE_CORRUPT");
        const versions = [];
        for (const revision of await names(
          path.join(this.project, "history", entry.name),
        )) {
          try {
            const record = await json(
              path.join(this.project, "history", entry.name, revision.name),
            );
            const key = location(
              this.project_id,
              record.area,
              record.id,
              record.session_id,
            );
            await validateRecord(record, this.project_id, key);
            if ((await this.keyHash(key)) !== entry.name)
              throw new PactError("History key mismatch", "STORE_CORRUPT");
            versions.push(record);
          } catch (error) {
            failures.push({
              history: entry.name,
              reason: error.code || "STORE_CORRUPT",
            });
          }
        }
        versions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        const latest = versions[0];
        if (!latest) continue;
        const key = location(
          this.project_id,
          latest.area,
          latest.id,
          latest.session_id,
        );
        if (await this.tombstone(key)) {
          skipped_deleted++;
          continue;
        }
        let current;
        try {
          current = await this.readRecord(key);
        } catch (error) {
          if (!["STORE_CORRUPT", "SCHEMA_INVALID"].includes(error.code))
            throw error;
        }
        if (!current) {
          await atomic(this.recordFile(key), latest);
          recovered++;
        }
      }
      return { recovered, skipped_deleted, failures };
    });
  }
}

export class NodeFileCacheBackend {
  constructor({ root = ".pactweave", project_id = "default" } = {}) {
    this.project_id = checkedId(project_id);
    this.directory = path.join(path.resolve(root), this.project_id, "cache");
    this.epochs = path.join(
      path.resolve(root),
      this.project_id,
      "cache-epochs",
    );
    this.cache_backend = true;
    this.queue = Promise.resolve();
  }
  async mutate(fn) {
    const next = this.queue.then(() => lock(this.directory, fn));
    this.queue = next.catch(() => {});
    return next;
  }
  file(key) {
    if (!/^[a-f0-9]{64}$/.test(key))
      throw new PactError("Invalid cache key", "INPUT_INVALID");
    return path.join(this.directory, `${key}.json`);
  }
  async get(key) {
    const file = this.file(key);
    const record = await json(file);
    if (!record) return null;
    if (
      record.schema_version !== 1 ||
      record.hash !== (await digest(record.value)) ||
      record.value?.project_id !== this.project_id
    )
      throw new PactError("Cache integrity failure", "CACHE_CORRUPT");
    return clone(record.value);
  }
  async set(key, value, { session_generation } = {}) {
    if (value.project_id !== this.project_id)
      throw new PactError("Cache project mismatch", "SCOPE_INVALID");
    return this.mutate(async () => {
      const state = await this.sessionState(this.project_id, value.session_id);
      if (
        state.closed ||
        (session_generation !== undefined &&
          state.generation !== session_generation)
      )
        throw new PactError(
          "Session ended before cache admission",
          "SESSION_ENDED",
        );
      return atomic(this.file(key), {
        schema_version: 1,
        hash: await digest(value),
        value,
      });
    });
  }
  async epochFile(project, session) {
    checkedId(project);
    checkedId(session);
    if (project !== this.project_id)
      throw new PactError("Cache project mismatch", "SCOPE_INVALID");
    return path.join(this.epochs, `${await digest({ project, session })}.json`);
  }
  async sessionState(project, session) {
    const value = await json(await this.epochFile(project, session));
    if (!value) return { generation: 0, closed: false };
    const { hash, ...body } = value;
    if (
      value.schema_version !== 1 ||
      value.project_id !== project ||
      value.session_id !== session ||
      !Number.isSafeInteger(value.generation) ||
      value.generation < 0 ||
      typeof value.closed !== "boolean" ||
      hash !== (await digest(body))
    )
      throw new PactError("Session epoch integrity failure", "CACHE_CORRUPT");
    return { generation: value.generation, closed: value.closed };
  }
  async delete(key) {
    return this.mutate(() => unlink(this.file(key)));
  }
  async entries() {
    const out = [];
    for (const entry of await names(this.directory)) {
      if (entry.name === ".write-lock" || entry.name.startsWith(".tmp-"))
        continue;
      if (!entry.isFile() || !/^[a-f0-9]{64}\.json$/.test(entry.name))
        throw new PactError("Unsafe cache entry", "CACHE_CORRUPT");
      const key = entry.name.slice(0, -5);
      out.push([key, await this.get(key)]);
    }
    return out;
  }
  async deleteSession(project, session) {
    if (project !== this.project_id)
      throw new PactError("Cache project mismatch", "SCOPE_INVALID");
    return this.mutate(async () => {
      const old = await this.sessionState(project, session);
      const epoch = {
        schema_version: 1,
        project_id: project,
        session_id: session,
        generation: old.generation + 1,
        closed: true,
      };
      await atomic(await this.epochFile(project, session), {
        ...epoch,
        hash: await digest(epoch),
      });
      for (const [key, value] of await this.entries())
        if (value.session_id === session) await unlink(this.file(key));
      for (const entry of await names(this.directory))
        if (entry.name.startsWith(".tmp-"))
          await unlink(path.join(this.directory, entry.name));
    });
  }
}

import { adapters } from "../vendor/inventory.mjs";
import { assert, clone, digest } from "./shared.mjs";
import { authorize, createPolicy } from "./security-policy.mjs";

export function listAdapters() {
  return clone(adapters);
}

export function createRegistry({ sourceReader, additionalAdapters = [] } = {}) {
  const descriptions = new Map(adapters.map((item) => [item.id, clone(item)]));
  const custom = new Map();
  const loaded = new Map();
  for (const { metadata, execute } of additionalAdapters) {
    assert(
      metadata &&
        typeof metadata.id === "string" &&
        typeof execute === "function",
      "Trusted adapter requires metadata and an executor",
    );
    assert(
      !descriptions.has(metadata.id),
      "An adapter cannot replace a pinned built-in",
    );
    assert(
      Array.isArray(metadata.capabilities) &&
        Array.isArray(metadata.side_effects),
      "Adapter authority metadata required",
    );
    descriptions.set(metadata.id, clone(metadata));
    custom.set(metadata.id, execute);
  }
  const registry = {
    list() {
      return [...descriptions.values()].map(clone);
    },
    describe(id) {
      return descriptions.has(id) ? clone(descriptions.get(id)) : null;
    },
    async verifySources(id) {
      const metadata = descriptions.get(id);
      assert(metadata, `Unsupported adapter: ${id}`, "UNSUPPORTED");
      if (!sourceReader || !metadata.files)
        return { status: "distribution-lock-only", version: metadata.version };
      const source = await sourceReader(id, "browser.mjs");
      assert(
        typeof source === "string" &&
          (await digest(source)) === metadata.files["browser.mjs"].sha256,
        `Pinned adapter source changed: ${id}`,
        "SOURCE_CHANGED",
      );
      return {
        status: "verified",
        source_sha256: metadata.files["browser.mjs"].sha256,
      };
    },
    async execute(id, input, context = {}) {
      const metadata = descriptions.get(id);
      assert(metadata, `Unsupported adapter: ${id}`, "UNSUPPORTED");
      assert(
        input && typeof input === "object" && !Array.isArray(input),
        "Adapter input must be an object",
        "INPUT_INVALID",
      );
      for (const key of metadata.required || [])
        assert(
          Object.hasOwn(input, key),
          `Missing required field: ${key}`,
          "INPUT_INVALID",
        );
      const checkAuthority = () => {
        assert(!context.signal?.aborted, "Execution cancelled", "CANCELLED");
        for (const action of [
          ...(metadata.capabilities || ["local.compute"]),
          ...(metadata.side_effects || []),
        ]) {
          const permitted = authorize(
            action,
            context.policy || createPolicy(),
            { contract: context.contract, signal: context.signal },
          );
          assert(permitted.allowed, permitted.reason, "APPROVAL_REQUIRED");
        }
      };
      checkAuthority();
      if (sourceReader && metadata.files) {
        await registry.verifySources(id);
        checkAuthority();
      }
      const snapshot = structuredClone(input),
        before = await digest(JSON.stringify(snapshot));
      let execute = custom.get(id);
      if (!execute) {
        if (!loaded.has(id))
          loaded.set(
            id,
            import(`../vendor/${id}/browser.mjs`).catch((error) => {
              loaded.delete(id);
              throw error;
            }),
          );
        execute = (await loaded.get(id)).execute;
        assert(
          typeof execute === "function",
          "Adapter export is missing",
          "UNSUPPORTED",
        );
      }
      checkAuthority();
      const output = await execute(snapshot, {
        ...context,
        metadata: clone(metadata),
      });
      checkAuthority();
      assert(
        (await digest(JSON.stringify(snapshot))) === before,
        "Adapter mutated its input",
        "INVARIANT_FAILED",
      );
      assert(
        output && typeof output === "object" && !Array.isArray(output),
        "Missing adapter output envelope",
        "INVARIANT_FAILED",
      );
      assert(
        output.resource === id &&
          output.version === metadata.version &&
          output.input_sha256 === before,
        "Adapter identity or input digest mismatch",
        "INVARIANT_FAILED",
      );
      assert(
        output.result &&
          typeof output.result === "object" &&
          !Array.isArray(output.result),
        "Adapter result must be an object",
        "INVARIANT_FAILED",
      );
      assert(
        output.result.summary && typeof output.result.summary === "object",
        "Adapter result summary missing",
        "INVARIANT_FAILED",
      );
      // Serializability rejects unsupported BigInt/circular output before evidence storage.
      assert(
        JSON.stringify(output, (_, value) => {
          assert(
            !(typeof value === "number" && !Number.isFinite(value)),
            "Non-finite adapter result",
            "INVARIANT_FAILED",
          );
          return value;
        }) !== undefined,
        "Output cannot be serialized",
        "INVARIANT_FAILED",
      );
      if (id === "invoice-reconciliation") {
        for (const row of Object.values(output.result.totals || {})) {
          assert(
            BigInt(row.received) ===
              BigInt(row.allocated) + BigInt(row.unallocated),
            "Invoice conservation invariant failed",
            "INVARIANT_FAILED",
          );
        }
      }
      return clone(output);
    },
  };
  return registry;
}

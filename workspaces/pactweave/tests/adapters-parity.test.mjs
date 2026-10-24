import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { adapters } from "../vendor/inventory.mjs";
import { createRegistry } from "../src/skill-router.mjs";
import { getPath, canonical } from "../src/shared.mjs";

const reader = (id, name) =>
  readFile(new URL(`../vendor/${id}/${name}`, import.meta.url), "utf8");
test("all thirty adapters cover exactly the six declared domains", () => {
  assert.equal(adapters.length, 30);
  assert.equal(new Set(adapters.map((item) => item.id)).size, 30);
  assert.equal(new Set(adapters.map((item) => item.domain)).size, 6);
  assert.equal(createRegistry().list().length, 30);
});
for (const metadata of adapters) {
  test(`${metadata.id}: pinned source files retain original hashes and first-party license`, async () => {
    for (const [name, expected] of Object.entries(metadata.files)) {
      const bytes = await readFile(
        new URL(`../vendor/${metadata.id}/${name}`, import.meta.url),
      );
      assert.equal(bytes.length, expected.bytes);
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        expected.sha256,
      );
    }
    assert.equal(metadata.license, "MIT");
    assert.match(await reader(metadata.id, "LICENSE"), /MIT License/);
  });
  test(`${metadata.id}: independent original Node/browser/registry parity on all public fixtures`, async () => {
    const original = await import(`../vendor/${metadata.id}/node.mjs`);
    const browser = await import(`../vendor/${metadata.id}/browser.mjs`);
    const registry = createRegistry({ sourceReader: reader });
    const cases = JSON.parse(await reader(metadata.id, "cases.json"));
    assert.ok(cases.length >= 2, "Preserve normal and evaluation fixtures");
    for (const fixture of cases) {
      const originalResult = original.execute(structuredClone(fixture.input));
      const browserResult = browser.execute(structuredClone(fixture.input));
      assert.deepEqual(browserResult, originalResult, fixture.name);
      const registryResult = await registry.execute(
        metadata.id,
        structuredClone(fixture.input),
      );
      // The registry's public contract is JSON; transport normalizes null-prototype maps.
      // Compare every serialized value against the independent original, not JS prototypes.
      assert.equal(
        canonical(registryResult),
        canonical(originalResult),
        fixture.name,
      );
      for (const [path, expected] of Object.entries(fixture.expect))
        assert.deepEqual(
          getPath(registryResult.result, path),
          expected,
          `${fixture.name}: ${path}`,
        );
    }
    for (const key of metadata.required) {
      const missing = structuredClone(cases[0].input);
      delete missing[key];
      let nodeError, browserError;
      try {
        original.execute(structuredClone(missing));
      } catch (error) {
        nodeError = error;
      }
      try {
        browser.execute(structuredClone(missing));
      } catch (error) {
        browserError = error;
      }
      assert.ok(nodeError && browserError, `Missing ${key} must be rejected`);
      assert.equal(browserError.code, nodeError.code);
      await assert.rejects(
        registry.execute(metadata.id, missing),
        /Missing required field/,
      );
    }
  });
}
test("runtime source reader rejects tampered source before adapter import", async () => {
  const registry = createRegistry({
    sourceReader: async (id, name) => `${await reader(id, name)}\n// tampered`,
  });
  const cases = JSON.parse(
    await reader("invoice-reconciliation", "cases.json"),
  );
  await assert.rejects(
    registry.execute("invoice-reconciliation", cases[0].input),
    (error) => error.code === "SOURCE_CHANGED",
  );
});
test("untrusted JSON cannot replace or register executable adapters", async () => {
  const registry = createRegistry();
  assert.equal(registry.describe("sh -c rm"), null);
  await assert.rejects(
    registry.execute("../../secrets", {}),
    (error) => error.code === "UNSUPPORTED",
  );
  assert.throws(
    () =>
      createRegistry({
        additionalAdapters: [{ metadata: adapters[0], execute() {} }],
      }),
    /cannot replace/,
  );
});

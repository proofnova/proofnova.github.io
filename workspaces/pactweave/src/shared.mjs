export class PactError extends Error {
  constructor(message, code = "VALIDATION", details) {
    super(message);
    this.name = "PactError";
    this.code = code;
    this.details = details;
  }
}
export function assert(condition, message, code = "VALIDATION") {
  if (!condition) throw new PactError(message, code);
}
export function canonical(value) {
  const seen = new Set();
  function visit(v) {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number") {
      assert(Number.isFinite(v), "Non-finite number");
      return v;
    }
    assert(
      typeof v === "object" && v !== undefined,
      "Only JSON values are accepted",
    );
    assert(!seen.has(v), "Cyclic JSON value");
    seen.add(v);
    let out;
    if (Array.isArray(v)) out = v.map(visit);
    else {
      assert(
        Object.getPrototypeOf(v) === Object.prototype ||
          Object.getPrototypeOf(v) === null,
        "Plain JSON object required",
      );
      out = {};
      for (const k of Object.keys(v).sort()) {
        assert(
          !["__proto__", "prototype", "constructor"].includes(k),
          "Unsafe object key",
        );
        if (v[k] !== undefined) out[k] = visit(v[k]);
      }
    }
    seen.delete(v);
    return out;
  }
  return JSON.stringify(visit(value));
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(
    typeof value === "string" ? value : canonical(value),
  );
  return [
    ...new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes)),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function clone(value) {
  return JSON.parse(canonical(value));
}
export function safeId(value, label = "identifier") {
  assert(
    typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,95}$/.test(value),
    `Invalid ${label}`,
  );
  return value;
}
export function getPath(value, path) {
  if (typeof path !== "string" || !path || path.length > 512) return undefined;
  const parts = path.split(".");
  if (
    parts.some(
      (part) =>
        !/^[A-Za-z0-9_-]+$/.test(part) ||
        ["__proto__", "prototype", "constructor"].includes(part),
    )
  )
    return undefined;
  let current = value;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (current === null || typeof current !== "object") return undefined;
    if (!Object.hasOwn(current, part)) {
      const literal = parts.slice(index).join(".");
      return Object.hasOwn(current, literal) ? current[literal] : undefined;
    }
    current = current[part];
  }
  return current;
}
export function words(text) {
  return (
    String(text)
      .toLowerCase()
      .normalize("NFKC")
      .match(/[\p{L}\p{N}_-]+/gu) || []
  );
}
export function redact(value) {
  function walk(v, key = "") {
    if (
      /password|secret|token|credential|authorization|api[_-]?key|private[_-]?key|original_request|response|normalized_request|context|input|output/i.test(
        key,
      )
    )
      return "[REDACTED]";
    if (typeof v === "string")
      return v.replace(
        /(?:Bearer\s+\S+|gh[pousr]_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{12,})/g,
        "[REDACTED]",
      );
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, walk(x, k)]),
      );
    return v;
  }
  return walk(clone(value));
}

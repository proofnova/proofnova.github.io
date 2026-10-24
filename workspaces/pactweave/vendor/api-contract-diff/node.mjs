// Proofnova — MIT. Bundled first-party source, no runtime dependencies.
import {createHash} from "node:crypto";
const __core=(()=>{

class InputError extends Error {
  constructor(message, code = "INPUT_INVALID") {
    super(message);
    this.code = code;
  }
}
const requireThat = (ok, message, code) => {
  if (!ok) throw new InputError(message, code);
};
const obj = (value, name = "input") => {
  requireThat(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${name} must be an object`,
  );
  return value;
};
const arr = (value, name = "items", max = 10000) => {
  requireThat(
    Array.isArray(value) && value.length <= max,
    `${name} must be an array of at most ${max} items`,
  );
  return value;
};
const str = (value, name = "value") => {
  requireThat(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= 1000000,
    `${name} must be nonempty text`,
  );
  return value;
};
const number = (
  value,
  name = "value",
  min = -Infinity,
  max = Infinity,
) => {
  requireThat(
    Number.isFinite(value) && value >= min && value <= max,
    `${name} must be a finite number in [${min},${max}]`,
  );
  return value;
};
const integer = (
  value,
  name = "value",
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) => {
  number(value, name, min, max);
  requireThat(Number.isSafeInteger(value), `${name} must be a safe integer`);
  return value;
};
const unique = (values, name = "IDs") => {
  requireThat(new Set(values).size === values.length, `${name} must be unique`);
  return values;
};
const sha = (value) =>
  createHash("sha256")
    .update(
      typeof value === "string" || value instanceof Uint8Array
        ? value
        : JSON.stringify(value),
    )
    .digest("hex");
const clone = (value) => structuredClone(value);
const order = (values) =>
  [...values].sort((a, b) => String(a).localeCompare(String(b), "en"));
const rowsById = (items, name = "items") => {
  arr(items, name);
  unique(
    items.map((item) => str(obj(item).id, `${name}.id`)),
    `${name} IDs`,
  );
  return new Map(items.map((item) => [item.id, item]));
};
function timestamp(value, name = "timestamp") {
  str(value, name);
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  requireThat(match, `${name} needs an explicit UTC offset and seconds`);
  const [, y, m, d, h, minute, second, zone] = match;
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  requireThat(
    date.getUTCFullYear() === +y &&
      date.getUTCMonth() === +m - 1 &&
      date.getUTCDate() === +d &&
      +h < 24 &&
      +minute < 60 &&
      +second < 60,
    `${name} has invalid calendar fields`,
  );
  if (zone !== "Z") {
    const [hours, minutes] = zone.slice(1).split(":").map(Number);
    requireThat(
      hours <= 14 && minutes < 60 && (hours < 14 || minutes === 0),
      `${name} has an invalid offset`,
    );
  }
  const result = Date.parse(value);
  requireThat(Number.isFinite(result), `${name} is invalid`);
  return result;
}
function minor(value, scale = 2) {
  integer(scale, "scale", 0, 6);
  requireThat(
    typeof value === "string" &&
      /^-?\d+(?:\.\d+)?$/.test(value) &&
      value.length <= 40,
    "Amounts must be exact decimal strings",
  );
  const sign = value.startsWith("-") ? -1n : 1n;
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  requireThat(
    fraction.length <= scale,
    `Amount has more than ${scale} fractional digits`,
  );
  return (
    sign *
    (BigInt(whole) * 10n ** BigInt(scale) +
      BigInt(fraction.padEnd(scale, "0") || "0"))
  );
}
function roundDiv(n, d) {
  requireThat(d > 0n, "Positive divisor required");
  const sign = n < 0n ? -1n : 1n;
  n = n < 0n ? -n : n;
  return sign * ((n + d / 2n) / d);
}
const stringMoney = (value) => String(value);
function topology(nodes, edges) {
  unique(nodes, "graph node IDs");
  const known = new Set(nodes);
  const outgoing = new Map(nodes.map((id) => [id, []]));
  const count = new Map(nodes.map((id) => [id, 0]));
  const seen = new Set();
  for (const edge of arr(edges, "edges")) {
    requireThat(
      Array.isArray(edge) &&
        edge.length === 2 &&
        edge.every((id) => known.has(id)),
      "Edge references unknown nodes",
    );
    const key = JSON.stringify(edge);
    if (seen.has(key)) continue;
    seen.add(key);
    outgoing.get(edge[0]).push(edge[1]);
    count.set(edge[1], count.get(edge[1]) + 1);
  }
  const queue = order(nodes.filter((id) => count.get(id) === 0)),
    sorted = [];
  while (queue.length) {
    const id = queue.shift();
    sorted.push(id);
    for (const next of order(outgoing.get(id))) {
      count.set(next, count.get(next) - 1);
      if (count.get(next) === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }
  requireThat(
    sorted.length === nodes.length,
    "Dependency cycle detected",
    "CYCLE_DETECTED",
  );
  return { sorted, outgoing };
}
function closure(seeds, adjacency) {
  const reached = new Set(seeds),
    queue = [...seeds];
  while (queue.length) {
    for (const item of adjacency.get(queue.shift()) ?? [])
      if (!reached.has(item)) {
        reached.add(item);
        queue.push(item);
      }
  }
  return reached;
}
const select = (record, keys) =>
  Object.fromEntries(keys.map((key) => [key, record[key]]));
const envelope = (resource, result, input) => ({
  resource,
  version: 1,
  input_sha256: sha(input),
  result,
});

function parseCSV(source) {
  requireThat(typeof source === "string", "CSV must be text");
  source = source.replace(/^\uFEFF/, "");
  const records = [];
  let row = [],
    cell = "",
    state = "start";
  const finishCell = () => {
    row.push(cell);
    cell = "";
    state = "start";
  };
  const finishRow = () => {
    finishCell();
    records.push(row);
    row = [];
  };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (state === "quoted") {
      if (c === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else state = "closed";
      } else cell += c;
      continue;
    }
    if (c === ",") {
      finishCell();
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && source[i + 1] === "\n") i++;
      finishRow();
      continue;
    }
    if (state === "closed")
      throw new InputError("Unexpected characters after quoted CSV field");
    if (c === '"') {
      requireThat(state === "start", "Quote in unquoted CSV field");
      state = "quoted";
    } else {
      cell += c;
      state = "plain";
    }
  }
  requireThat(state !== "quoted", "Unterminated CSV quote");
  if (cell.length || row.length || state === "closed") finishRow();
  requireThat(records.length > 0, "CSV is empty");
  const headers = records.shift();
  unique(headers, "CSV headers");
  return {
    headers,
    rows: records.map((values, index) => ({ values, row: index + 2 })),
  };
}

return {InputError,requireThat,obj,arr,str,number,integer,unique,sha,clone,order,rowsById,timestamp,minor,roundDiv,stringMoney,topology,closure,select,envelope,parseCSV};})();
const __diff=(()=>{
const { requireThat }=__core;
function lcs(a, b) {
  requireThat(
    a.length <= 2000 && b.length <= 2000 && a.length * b.length <= 1000000,
    "Diff exceeds bounded comparison size",
  );
  const dp = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i++, j++]);
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}
function wordDiff(a, b) {
  const x = a.match(/\s+|\S+/g) ?? [],
    y = b.match(/\s+|\S+/g) ?? [],
    pairs = [...lcs(x, y), [x.length, y.length]],
    result = [];
  let i = 0,
    j = 0;
  for (const [p, q] of pairs) {
    if (i < p) result.push({ op: "remove", text: x.slice(i, p).join("") });
    if (j < q) result.push({ op: "add", text: y.slice(j, q).join("") });
    if (p < x.length) result.push({ op: "equal", text: x[p] });
    i = p + 1;
    j = q + 1;
  }
  return result;
}

return {lcs,wordDiff};})();
const __icu=(()=>{
const { requireThat }=__core;
function parseICU(message) {
  requireThat(
    typeof message === "string" && message.length <= 100000,
    "ICU message must be bounded text",
  );
  let i = 0,
    depth = 0;
  const argumentsMap = new Map(),
    plurals = [];
  const whitespace = () => {
    while (/\s/.test(message[i] ?? "") && i < message.length) i++;
  };
  const token = () => {
    whitespace();
    const start = i;
    while (i < message.length && !/[\s{},]/.test(message[i])) i++;
    return message.slice(start, i);
  };
  function body(nested = false) {
    let quote = false;
    while (i < message.length) {
      const c = message[i];
      if (c === "'") {
        if (message[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (quote || message[i + 1] === "{" || message[i + 1] === "}") {
          quote = !quote;
          i++;
          continue;
        }
      }
      if (!quote && c === "{") {
        argument();
        continue;
      }
      if (!quote && c === "}") {
        requireThat(nested, "Unmatched ICU closing brace");
        i++;
        return;
      }
      i++;
    }
    requireThat(!nested, "Unclosed ICU option");
    requireThat(!quote, "Unclosed ICU quote");
  }
  function argument() {
    requireThat(++depth <= 30, "ICU nesting too deep");
    i++;
    const name = token();
    requireThat(
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(name),
      "Invalid ICU argument name",
    );
    whitespace();
    let type = "simple";
    if (message[i] === ",") {
      i++;
      type = token();
      requireThat(
        [
          "plural",
          "selectordinal",
          "select",
          "number",
          "date",
          "time",
        ].includes(type),
        "Unsupported ICU argument type",
      );
      whitespace();
    }
    const previous = argumentsMap.get(name);
    requireThat(
      !previous || previous === type,
      "Argument used with inconsistent types",
    );
    argumentsMap.set(name, type);
    if (["plural", "selectordinal", "select"].includes(type)) {
      requireThat(message[i] === ",", "ICU selector needs options");
      i++;
      const options = [];
      whitespace();
      if (type !== "select" && message.slice(i, i + 7) === "offset:") {
        i += 7;
        const offset = token();
        requireThat(/^\d+$/.test(offset), "Invalid plural offset");
      }
      let closed = false;
      while (i < message.length) {
        whitespace();
        if (message[i] === "}") {
          i++;
          closed = true;
          break;
        }
        const key = token();
        requireThat(
          key && !options.includes(key),
          "Invalid or duplicate ICU option",
        );
        if (type !== "select")
          requireThat(
            /^(zero|one|two|few|many|other|=\d+)$/.test(key),
            "Invalid plural category",
          );
        options.push(key);
        whitespace();
        requireThat(message[i] === "{", "ICU option needs a body");
        i++;
        body(true);
      }
      requireThat(closed, "Unclosed ICU selector");
      requireThat(options.includes("other"), "ICU selector requires other");
      if (type !== "select") plurals.push({ name, type, options });
    } else {
      if (message[i] === ",") {
        i++;
        while (i < message.length && message[i] !== "}") {
          requireThat(message[i] !== "{", "Nested formatter style unsupported");
          i++;
        }
      }
      requireThat(message[i] === "}", "Unclosed ICU argument");
      i++;
    }
    depth--;
  }
  body();
  return { arguments: Object.fromEntries(argumentsMap), plurals };
}

return {parseICU};})();
const __flow=(()=>{
const { integer, requireThat }=__core;
// Successive shortest augmenting paths; reverse arcs can undo an earlier greedy choice.
function minCostFlow(nodeCount, arcs, source, sink) {
  integer(nodeCount, "nodeCount", 2, 250);
  const graph = Array.from({ length: nodeCount }, () => []),
    tracked = [];
  for (const arc of arcs) {
    integer(arc.capacity, "capacity", 0, 10000000);
    integer(arc.cost, "cost", 0, 1000000);
    const forward = {
        to: arc.to,
        rev: graph[arc.to].length,
        capacity: arc.capacity,
        cost: arc.cost,
        original: arc.capacity,
      },
      back = {
        to: arc.from,
        rev: graph[arc.from].length,
        capacity: 0,
        cost: -arc.cost,
      };
    graph[arc.from].push(forward);
    graph[arc.to].push(back);
    tracked.push({ arc, forward });
  }
  let flow = 0,
    cost = 0,
    rounds = 0;
  while (true) {
    requireThat(++rounds <= 10000, "Flow search exceeded bound");
    const distance = Array(nodeCount).fill(Infinity),
      previous = Array(nodeCount).fill(null);
    distance[source] = 0;
    for (let pass = 0; pass < nodeCount - 1; pass++) {
      let changed = false;
      for (let u = 0; u < nodeCount; u++)
        if (Number.isFinite(distance[u]))
          for (let e = 0; e < graph[u].length; e++) {
            const edge = graph[u][e];
            if (
              edge.capacity > 0 &&
              distance[u] + edge.cost < distance[edge.to]
            ) {
              distance[edge.to] = distance[u] + edge.cost;
              previous[edge.to] = [u, e];
              changed = true;
            }
          }
      if (!changed) break;
    }
    if (!previous[sink]) break;
    let amount = Infinity;
    for (let v = sink; v !== source;) {
      const [u, e] = previous[v];
      amount = Math.min(amount, graph[u][e].capacity);
      v = u;
    }
    for (let v = sink; v !== source;) {
      const [u, e] = previous[v],
        edge = graph[u][e];
      edge.capacity -= amount;
      graph[v][edge.rev].capacity += amount;
      v = u;
    }
    flow += amount;
    cost += amount * distance[sink];
    requireThat(Number.isSafeInteger(cost), "Flow cost overflow");
  }
  return {
    flow,
    cost,
    arcs: tracked.map(({ arc, forward }) => ({
      ...arc,
      flow: forward.original - forward.capacity,
    })),
  };
}

return {minCostFlow};})();
const __resource=(()=>{const { obj, requireThat, order }=__core;
function run(input) {
  obj(input);
  const before = obj(input.before),
    after = obj(input.after),
    findings = [],
    unsupported = [];
  const supported = new Set(["type","enum","required","properties","items","minimum","maximum","minLength","maxLength","minItems","maxItems","additionalProperties","description","title","default","examples"]);
  const inspect = (schema,path,depth=0) => {
    requireThat(depth <= 20, "Schema nesting exceeds bound");obj(schema);
    if (Object.keys(schema).some(key=>!supported.has(key))) unsupported.push(path);
    if (schema.type !== undefined && !["string","number","integer","boolean","object","array","null"].includes(schema.type)) unsupported.push(path);
    if (schema.enum !== undefined) {
      requireThat(Array.isArray(schema.enum) && schema.enum.length > 0, "Enum must be a nonempty array");
      if (schema.enum.some(value=>value!==null && typeof value === "object")) unsupported.push(path);
    }
    if (schema.required !== undefined) requireThat(Array.isArray(schema.required) && schema.required.every(name=>typeof name === "string"), "Required must contain property names");
    if (schema.additionalProperties !== undefined && typeof schema.additionalProperties !== "boolean") unsupported.push(path);
    for (const key of ["minimum","maximum","minLength","maxLength","minItems","maxItems"]) if (schema[key] !== undefined) requireThat(Number.isFinite(schema[key]), "Schema bounds must be finite");
    if (schema.properties !== undefined) for (const [name,child] of Object.entries(obj(schema.properties))) inspect(child,path+"."+name,depth+1);
    if (schema.items !== undefined) inspect(schema.items,path+"[]",depth+1);
  };
  for (const routes of [before,after]) for (const [route,contract] of Object.entries(routes)) {
    obj(contract);for (const direction of ["request","response"]) if (contract[direction] !== undefined) inspect(contract[direction],route+"."+direction);
  }
  const compare = (a, b, path, direction) => {
    for (const schema of [a, b])
      if (
        schema &&
        Object.keys(schema).some((k) =>
          !["type", "enum", "required", "properties", "items", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems", "additionalProperties", "description", "title", "default", "examples"].includes(k) || (k === "additionalProperties" && typeof schema[k] !== "boolean"),
        )
      )
        unsupported.push(path);
    if (a?.type !== b?.type)
      findings.push({ path, code: "TYPE_CHANGED", breaking: true });
    if (a?.enum || b?.enum) {
      const lost = a.enum?.filter((x) => b.enum && !b.enum.includes(x)) ?? [],
        added = b.enum?.filter((x) => a.enum && !a.enum.includes(x)) ?? [];
      if (direction === "request" ? (!a.enum && !!b.enum) || lost.length : (!!a.enum && !b.enum) || added.length)
        findings.push({ path, code: "ENUM_CONTRACT_CHANGED", breaking: true });
    }
    if (a?.additionalProperties !== false && b?.additionalProperties === false && direction === "request") findings.push({path, code:"INPUT_EXTRAS_DISALLOWED", breaking:true});
    if (a?.additionalProperties === false && b?.additionalProperties !== false && direction === "response") findings.push({path, code:"OUTPUT_EXTRAS_ALLOWED", breaking:true});
    const oldRequired = new Set(a?.required ?? []),
      newRequired = new Set(b?.required ?? []);
    const affected =
      direction === "request"
        ? [...newRequired].filter((k) => !oldRequired.has(k))
        : [...oldRequired].filter((k) => !newRequired.has(k));
    for (const name of affected)
      findings.push({
        path: `${path}.${name}`,
        code:
          direction === "request"
            ? "NEW_REQUIRED_INPUT"
            : "RESPONSE_NO_LONGER_REQUIRED",
        breaking: true,
      });
    for (const name of order(
      new Set([
        ...Object.keys(a?.properties ?? {}),
        ...Object.keys(b?.properties ?? {}),
      ]),
    )) {
      const x = a?.properties?.[name],
        y = b?.properties?.[name];
      if (!x && y) {
        if (direction === "request" && a.additionalProperties === false)
          findings.push({
            path: `${path}.${name}`,
            code: "NEW_INPUT_FIELD",
            breaking: false,
          });
        continue;
      }
      if (x && !y) {
        findings.push({
          path: `${path}.${name}`,
          code: "PROPERTY_REMOVED",
          breaking:
            direction === "response" || b.additionalProperties === false,
        });
        continue;
      }
      compare(x, y, `${path}.${name}`, direction);
    }
    if (a?.type === "array" && b?.type === "array")
      compare(a.items ?? {}, b.items ?? {}, `${path}[]`, direction);
    for (const key of ["minimum", "minLength", "minItems"]) {
      if (a?.[key] !== b?.[key]) {
        const old = a?.[key] ?? -Infinity;
        const next = b?.[key] ?? -Infinity;
        findings.push({
          path,
          code: `BOUND_${key}`,
          breaking: direction === "request" ? next > old : next < old,
        });
      }
    }
    for (const key of ["maximum", "maxLength", "maxItems"]) {
      if (a?.[key] !== b?.[key]) {
        const old = a?.[key] ?? Infinity;
        const next = b?.[key] ?? Infinity;
        findings.push({
          path,
          code: `BOUND_${key}`,
          breaking: direction === "request" ? next < old : next > old,
        });
      }
    }
  };
  for (const [route, old] of Object.entries(before)) {
    if (!Object.hasOwn(after,route)) {
      findings.push({ path: route, code: "ENDPOINT_REMOVED", breaking: true });
      continue;
    }
    for (const direction of ["request", "response"])
      if (old[direction] || after[route][direction])
        compare(
          old[direction] ?? {},
          after[route][direction] ?? {},
          `${route}.${direction}`,
          direction,
        );
  }
  const uniqueUnsupported = order(new Set(unsupported));
  return {
    compatible: !findings.some((f) => f.breaking) && !uniqueUnsupported.length,
    findings,
    unsupported: uniqueUnsupported,
    summary: {
      breaking: findings.filter((f) => f.breaking).length,
      changes: findings.length,
      unsupported: uniqueUnsupported.length,
    },
    scope:
      "Explicit endpoint-schema subset; unsupported composition is held for full-schema tooling.",
  };
}

return {run};})();
export function run(input){ __core.obj(input); for(const key of ["before","after"]) __core.requireThat(Object.hasOwn(input,key),'Missing required field: '+key); return __resource.run(input); }
export function execute(input){return __core.envelope("api-contract-diff",run(input),input);}

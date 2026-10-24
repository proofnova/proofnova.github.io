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
const __resource=(()=>{const { obj, str, requireThat, sha }=__core;
function safe(file) {
  if (file === "/dev/null") return null;
  file = file.replace(/^[ab]\//, "").split("\t")[0];
  requireThat(
    file &&
      !file.startsWith("/") &&
      !file.includes("\\") &&
      !file.includes("\0") &&
      !file.includes('"') &&
      !file.split("/").some((x) => x === ".." || x === ""),
    "Unsafe patch path",
  );
  return file;
}
function run(input) {
  const files = { ...obj(obj(input).files) },
    lines = str(input.patch, "patch").replace(/\r\n/g, "\n").split("\n"),
    changes = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i] || /^(diff --git |index )/.test(lines[i])) {
      i++;
      continue;
    }
    requireThat(lines[i].startsWith("--- "), "Unsupported patch header");
    const old = safe(lines[i++].slice(4));
    requireThat(lines[i]?.startsWith("+++ "), "Missing new-file header");
    const next = safe(lines[i++].slice(4));
    requireThat(old || next, "Both paths cannot be null");
    requireThat(!old || !next || old === next, "Renames are not supported");
    const name = next ?? old;
    requireThat(
      old ? typeof files[old] === "string" : !Object.hasOwn(files, name),
      old ? "Patch source missing" : "New patch file already exists",
    );
    const original = old ? files[old] : "",
      newline = original.includes("\r\n") ? "\r\n" : "\n";
    requireThat(
      !original.replaceAll("\r\n", "").includes("\r"),
      "Unsupported bare carriage return",
    );
    const trailing = original.endsWith("\n");
    const source = original ? original.split(/\r?\n/) : [];
    if (trailing) source.pop();
    let cursor = 0,
      output = [],
      hunks = 0,
      newNoNewline = false;
    while (i < lines.length && lines[i].startsWith("@@")) {
      const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(
        lines[i++],
      );
      requireThat(match, "Malformed hunk header");
      const oldStart = +match[1],
        oldCount = match[2] === undefined ? 1 : +match[2],
        newStart = +match[3],
        newCount = match[4] === undefined ? 1 : +match[4],
        position = oldCount === 0 ? oldStart : oldStart - 1;
      requireThat(
        position >= cursor && position <= source.length,
        "Hunk offset outside source",
      );
      output.push(...source.slice(cursor, position));
      cursor = position;
      requireThat(
        newStart === (newCount === 0 ? output.length : output.length + 1),
        "New hunk position mismatch",
      );
      let removed = 0,
        added = 0,
        lastPrefix = "";
      while (
        i < lines.length &&
        !lines[i].startsWith("@@") &&
        !lines[i].startsWith("--- ") &&
        !lines[i].startsWith("diff --git ")
      ) {
        const line = lines[i];
        if (line === "" && i === lines.length - 1) {
          i++;
          break;
        }
        if (line === "\\ No newline at end of file") {
          if (lastPrefix !== "-") newNoNewline = true;
          i++;
          continue;
        }
        const prefix = line[0],
          body = line.slice(1);
        requireThat([" ", "-", "+"].includes(prefix), "Unsupported hunk line");
        if (prefix !== "+") {
          requireThat(
            source[cursor] === body,
            "Hunk context does not match exact source",
          );
          cursor++;
          removed++;
        }
        if (prefix !== "-") {
          output.push(body);
          added++;
        }
        lastPrefix = prefix;
        i++;
      }
      requireThat(
        removed === oldCount && added === newCount,
        "Hunk line counts do not match header",
      );
      hunks++;
    }
    requireThat(hunks > 0, "Patch needs a hunk");
    output.push(...source.slice(cursor));
    if (!next) {
      requireThat(output.length === 0, "Deletion patch leaves content");
      delete files[name];
    } else
      files[name] =
        output.join(newline) +
        (output.length && !newNoNewline && (trailing || !old) ? newline : "");
    changes.push({
      path: name,
      kind: !old ? "add" : !next ? "delete" : "modify",
      hunks,
      before_sha256: sha(original),
      after_sha256: next ? sha(files[name]) : null,
    });
  }
  requireThat(changes.length, "No supported changes");
  return {
    files,
    changes,
    summary: {
      files: changes.length,
      hunks: changes.reduce((n, c) => n + c.hunks, 0),
    },
  };
}

return {run};})();
export function run(input){ __core.obj(input); for(const key of ["files","patch"]) __core.requireThat(Object.hasOwn(input,key),'Missing required field: '+key); return __resource.run(input); }
export function execute(input){return __core.envelope("patch-preflight",run(input),input);}

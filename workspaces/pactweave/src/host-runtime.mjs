import { spawn } from "node:child_process";
import { access, realpath, lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { authorize } from "./security-policy.mjs";
import { assert, digest, PactError } from "./shared.mjs";
const runtimes = {
  node: ["node", "--version"],
  python: ["python", "--version"],
  java: ["java", "-version"],
  go: ["go", "version"],
  rust: ["rustc", "--version"],
  shell: ["sh", "--version"],
  powershell: ["pwsh", "--version"],
  sql: ["sqlite3", "--version"],
  docker: ["docker", "--version"],
  kubernetes: ["kubectl", "version", "--client=true"],
};
export async function findExecutable(name) {
  const dirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32" ? [".exe", ""] : [""];
  for (const dir of dirs)
    for (const ext of extensions) {
      const f = path.resolve(dir, name + ext);
      try {
        await access(f, constants.X_OK);
        if ((await lstat(f)).isFile()) return realpath(f);
      } catch {}
    }
  return null;
}
function boundedProcess(
  executable,
  args,
  { cwd, signal, timeoutMs = 10000, maxOutput = 65536 } = {},
) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new PactError("Cancelled", "CANCELLED"));
    const env = {
      PATH: path.dirname(executable),
      ...(process.platform === "win32"
        ? {
            SystemRoot: process.env.SystemRoot || "C:\\Windows",
            WINDIR: process.env.WINDIR || "C:\\Windows",
          }
        : {}),
      NO_COLOR: "1",
    };
    const child = spawn(executable, args, {
      cwd,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "",
      err = "",
      bytes = 0,
      finished = false,
      reason = null;
    const stop = (why) => {
      reason = why;
      if (process.platform === "win32" && child.pid) {
        const killer = spawn(
          path.join(
            process.env.SystemRoot || "C:\\Windows",
            "System32",
            "taskkill.exe",
          ),
          ["/PID", String(child.pid), "/T", "/F"],
          { shell: false, windowsHide: true, stdio: "ignore" },
        );
        killer.on("error", () => child.kill("SIGKILL"));
      } else {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }
    };
    const timer = setTimeout(() => stop("TIMEOUT"), timeoutMs);
    const abort = () => stop("CANCELLED");
    signal?.addEventListener("abort", abort, { once: true });
    const append = (key) => (buf) => {
      bytes += buf.length;
      if (bytes > maxOutput) {
        stop("OUTPUT_LIMIT");
        return;
      }
      if (key === "out") out += buf.toString();
      else err += buf.toString();
    };
    child.stdout.on("data", append("out"));
    child.stderr.on("data", append("err"));
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    child.on("error", (e) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new PactError(e.message, "RUNTIME"));
    });
    child.on("close", (code, sig) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve({
        exit_code: code,
        signal: sig,
        stdout: out,
        stderr: err,
        termination: reason,
        command: executable,
        args,
      });
    });
  });
}
export async function doctor() {
  const detected = {};
  for (const [id, [cmd, ...args]] of Object.entries(runtimes)) {
    const executable =
      id === "node" ? process.execPath : await findExecutable(cmd);
    if (!executable) {
      detected[id] = {
        installed: false,
        remedy: `Install ${cmd} separately if your task requires it; automatic downloads are disabled.`,
      };
      continue;
    }
    try {
      const r = await boundedProcess(executable, args, {
        timeoutMs: 5000,
        maxOutput: 8192,
      });
      detected[id] = {
        installed: r.exit_code === 0,
        executable,
        version: (r.stdout || r.stderr).trim().slice(0, 500),
        exit_code: r.exit_code,
      };
    } catch (e) {
      detected[id] = { installed: false, error: e.message };
    }
  }
  return {
    node_supported: Number(process.versions.node.split(".")[0]) >= 22,
    platform: process.platform,
    runtimes: detected,
    notice:
      "Runtime detection does not provide autonomous language execution. Only explicitly registered adapters execute tasks.",
  };
}
export async function createProjectTestAdapter(config, { policy, root }) {
  assert(
    config &&
      config.runtime === "node" &&
      Array.isArray(config.files) &&
      config.files.length > 0 &&
      config.files.length <= 30,
    "Only explicit Node test files are supported by this host adapter",
  );
  const project = await realpath(root);
  let cursor = path.resolve(root);
  while (true) {
    assert(
      !(await lstat(cursor)).isSymbolicLink(),
      "Symlink project roots are rejected",
    );
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  const files = [];
  for (const file of config.files) {
    assert(
      typeof file === "string" &&
        !path.isAbsolute(file) &&
        !file.startsWith("-"),
      "Test file must be a relative path",
    );
    const resolved = await realpath(path.resolve(project, file));
    assert(
      resolved.startsWith(project + path.sep),
      "Test file escapes project",
    );
    assert(
      /\.(?:mjs|cjs|js)$/.test(resolved),
      "Node test file extension required",
    );
    let part = path.resolve(project, file);
    while (part !== project) {
      assert(
        !(await lstat(part)).isSymbolicLink(),
        "Symlink test paths rejected",
      );
      part = path.dirname(part);
    }
    files.push(resolved);
  }
  const timeoutMs = config.timeout_ms || 15000;
  assert(
    Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000,
    "Invalid process timeout",
  );
  const approvedSources = {};
  for (const file of files)
    approvedSources[path.relative(project, file)] = await digest(
      await readFile(file, "utf8"),
    );
  const sourceDigest = await digest(approvedSources);
  return {
    metadata: {
      id: "project-test",
      title: "Approved local Node test files",
      domain: "software",
      required: [],
      side_effects: ["process.execute"],
      capabilities: ["process.execute"],
      version: 1,
      input_schema: { type: "object" },
      source: "trusted local host configuration",
      source_sha256: sourceDigest,
      limitations: [
        "Executes trusted local code, not an operating-system sandbox. Hostile test code is outside this runner security boundary.",
      ],
    },
    execute: async (input, context = {}) => {
      const permission = authorize("process.execute", policy, {
        contract: context.contract,
        signal: context.signal,
      });
      assert(permission.allowed, permission.reason, "APPROVAL_REQUIRED");
      const before = {};
      for (const file of files)
        before[path.relative(project, file)] = await digest(
          await readFile(file, "utf8"),
        );
      assert(
        (await digest(before)) === sourceDigest,
        "Approved test file changed before execution",
        "SOURCE_CHANGED",
      );
      const r = await boundedProcess(process.execPath, ["--test", ...files], {
        cwd: project,
        signal: context.signal,
        timeoutMs,
        maxOutput: 131072,
      });
      const after = authorize("process.execute", policy, {
        contract: context.contract,
        signal: context.signal,
      });
      assert(after.allowed, after.reason, "APPROVAL_REQUIRED");
      const actualSources = {};
      for (const file of files)
        actualSources[path.relative(project, file)] = await digest(
          await readFile(file, "utf8"),
        );
      assert(
        (await digest(actualSources)) === sourceDigest,
        "Approved test file changed during execution",
        "SOURCE_CHANGED",
      );
      assert(
        !r.termination,
        `Process stopped: ${r.termination}`,
        r.termination,
      );
      return {
        resource: "project-test",
        version: 1,
        input_sha256: await digest(JSON.stringify(input)),
        result: {
          ...r,
          summary: { exit_code: r.exit_code },
          test_sources: before,
          rollback:
            "Tests can modify local files; review project git status and restore only explicitly approved changes.",
        },
      };
    },
  };
}

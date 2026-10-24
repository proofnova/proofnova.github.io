import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const releaseFolders = [
  "src",
  "vendor",
  "examples",
  "assets",
  "docs",
  "benchmarks",
  "tests",
  "scripts",
  "site-integrations",
  ".github",
];
export const releaseFiles = [
  "index.html",
  "app.mjs",
  "style.css",
  "browser.mjs",
  "run.mjs",
  "cli.mjs",
  "package.json",
  "SKILL.md",
  "README.md",
  "README.ko.md",
  "README.ja.md",
  "README.zh-CN.md",
  "DESIGN.md",
  "RESEARCH.md",
  "LICENSE",
  "LICENSE_AUDIT.md",
  "THIRD_PARTY_NOTICES.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "resource.json",
  ".gitignore",
  ".gitattributes",
];
export async function releaseEntries() {
  const files = [];
  async function walk(relative) {
    const name = path.join(root, relative),
      stat = await fs.lstat(name);
    if (stat.isSymbolicLink()) throw Error("Release rejects symlinks");
    if (stat.isDirectory()) {
      for (const entry of await fs.readdir(name))
        await walk(path.posix.join(relative, entry));
    } else {
      if (
        stat.size > 16_000_000 ||
        /(?:^|\/)(?:node_modules|\.git|\.pactweave|private|\.env)(?:\/|$)/.test(
          relative,
        ) ||
        (!/\.(?:mjs|md|json|html|css|png|jpg|svg|yml|yaml|txt)$/.test(
          relative,
        ) &&
          !/(?:^|\/)(?:LICENSE|\.gitignore|\.gitattributes)$/.test(relative))
      )
        throw Error(`Unexpected release path: ${relative}`);
      files.push({ name: relative, bytes: await fs.readFile(name) });
    }
  }
  for (const folder of releaseFolders) await walk(folder);
  for (const name of releaseFiles) await walk(name);
  return files.sort((a, b) => a.name.localeCompare(b.name));
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function buildReleaseZip(destination) {
  const entries = await releaseEntries(),
    parts = [],
    central = [];
  let offset = 0,
    total = 0;
  for (const entry of entries) {
    const name = Buffer.from("proofnova-pactweave/" + entry.name),
      size = entry.bytes.length,
      crc = crc32(entry.bytes);
    total += size;
    if (total > 64_000_000) throw Error("Release size limit");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, entry.bytes);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(size, 20);
    record.writeUInt32LE(size, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += local.length + name.length + size;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
  await fs.writeFile(destination, Buffer.concat([...parts, directory, end]));
  return { files: entries.length, uncompressed_bytes: total, destination };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  if (!process.argv[2]) throw Error("Pass an output ZIP path");
  console.log(JSON.stringify(await buildReleaseZip(process.argv[2]), null, 2));
}

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { flagship } from "../site-integrations/resource.mjs";
import { buildReleaseZip } from "./package-release.mjs";
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export async function integrateSite(siteRoot, { published = false } = {}) {
  const target = await fs.realpath(siteRoot);
  if (path.basename(target) !== "proofnova.github.io")
    throw Error("Expected the ProofNova site checkout");
  const gitMarker = await fs.stat(path.join(target, ".git"));
  if (!gitMarker) throw Error("Site git checkout required");
  const workspace = path.join(target, "workspaces", "pactweave");
  await fs.mkdir(workspace, { recursive: true });
  const folders = [
    "src",
    "vendor",
    "examples",
    "assets",
    "docs",
    "benchmarks",
    "tests",
    "scripts",
    "site-integrations",
  ];
  const files = [
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
  ];
  for (const folder of folders)
    await fs.cp(path.join(source, folder), path.join(workspace, folder), {
      recursive: true,
      force: true,
      filter: (file) =>
        !file.includes("node_modules") && !file.includes(".pactweave"),
    });
  for (const name of files)
    await fs.copyFile(path.join(source, name), path.join(workspace, name));
  const bundle = await buildReleaseZip(
    path.join(target, "downloads", "pactweave.zip"),
  );
  const downloadIndex = path.join(target, "downloads", "manifest.json"),
    downloadManifest = JSON.parse(await fs.readFile(downloadIndex, "utf8"));
  const zipBytes = await fs.readFile(
    path.join(target, "downloads", "pactweave.zip"),
  );
  downloadManifest.resources = [
    {
      id: "pactweave",
      file: "pactweave.zip",
      sha256: createHash("sha256").update(zipBytes).digest("hex"),
      bytes: zipBytes.length,
      files: bundle.files,
    },
    ...downloadManifest.resources.filter((r) => r.id !== "pactweave"),
  ];
  downloadManifest.scope =
    "Thirty independent task tools and one PactWeave flagship source pack. Repository publication is recorded separately.";
  await fs.writeFile(
    downloadIndex,
    JSON.stringify(downloadManifest, null, 2) + "\n",
  );
  const workspaceFiles = [];
  async function indexFiles(directory, prefix = "") {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw Error("Workspace contains symlink");
      if (entry.isDirectory())
        await indexFiles(path.join(directory, entry.name), relative + "/");
      else if (relative !== "distribution-files.json")
        workspaceFiles.push({
          path: relative,
          sha256: createHash("sha256")
            .update(await fs.readFile(path.join(directory, entry.name)))
            .digest("hex"),
        });
    }
  }
  await indexFiles(workspace);
  await fs.writeFile(
    path.join(workspace, "distribution-files.json"),
    JSON.stringify({ schema_version: 1, files: workspaceFiles }, null, 2) +
      "\n",
  );
  const { catalog } = await import(
    pathToFileURL(path.join(target, "catalog.mjs")).href +
      "?build=" +
      Date.now()
  );
  const rows = [
    { ...flagship, repository_published: published },
    ...catalog.filter((r) => r.id !== "pactweave"),
  ];
  await fs.writeFile(
    path.join(target, "catalog.mjs"),
    "export const catalog=" + JSON.stringify(rows) + ";\n",
  );
  let app = await fs.readFile(path.join(target, "app.mjs"), "utf8");
  app = app.replace(
    /card\.className\s*=\s*['"]resource-card['"]/,
    "card.className=r.flagship?'resource-card flagship-card':'resource-card'",
  );
  const hash = (bytes) =>
    createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  app = app.replace(
    /(from\s*['"]\.\/catalog\.mjs)(?:\?v=[^'"]*)?(['"])/,
    "$1?v=" + hash(await fs.readFile(path.join(target, "catalog.mjs"))) + "$2",
  );
  await fs.writeFile(path.join(target, "app.mjs"), app);
  let css = await fs.readFile(path.join(target, "style.css"), "utf8");
  if (!css.includes("/* PactWeave flagship */"))
    css +=
      "\n/* PactWeave flagship */\n.flagship-card{border:2px solid #3567ee;background:linear-gradient(145deg,#f5f8ff,#fff);box-shadow:0 8px 30px #3567ee12}.flagship-card .card-category{color:#2457d6;font-weight:800}.flagship-card h3{color:#174aba}\n";
  await fs.writeFile(path.join(target, "style.css"), css);
  let html = await fs.readFile(path.join(target, "index.html"), "utf8");
  html = html
    .replace(
      /src="app\.mjs(?:\?v=[^"]*)?"/,
      'src="app.mjs?v=' + hash(app) + '"',
    )
    .replace(
      /href="style\.css(?:\?v=[^"]*)?"/,
      'href="style.css?v=' + hash(css) + '"',
    );
  await fs.writeFile(path.join(target, "index.html"), html);
  const publicationPath = path.join(target, "publication.json");
  const publication = JSON.parse(await fs.readFile(publicationPath, "utf8"));
  publication.resources = [
    {
      id: "pactweave",
      site: flagship.site,
      repository: flagship.repository,
      repository_published: published,
    },
    ...publication.resources.filter((r) => r.id !== "pactweave"),
  ];
  publication.checked_at = new Date().toISOString();
  publication.note =
    "Thirty independent task-tool repositories plus the separately published PactWeave flagship. Root-hosted workspaces provide additional access.";
  await fs.writeFile(
    publicationPath,
    JSON.stringify(publication, null, 2) + "\n",
  );
  return {
    resources: rows.length,
    first: rows[0].id,
    published,
    workspace,
    bundle,
  };
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  if (!process.argv[2])
    throw Error(
      "Usage: node scripts/integrate-site.mjs /path/to/proofnova.github.io [--published]",
    );
  console.log(
    JSON.stringify(
      await integrateSite(process.argv[2], {
        published: process.argv.includes("--published"),
      }),
      null,
      2,
    ),
  );
}

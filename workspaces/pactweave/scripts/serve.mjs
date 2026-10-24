import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = await realpath(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const port = Number(process.env.PACTWEAVE_PORT || 4178);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const rel =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    if (
      rel.split(/[\\/]/).some((x) => x.startsWith(".")) ||
      !["GET", "HEAD"].includes(req.method)
    )
      throw Error();
    const f = await realpath(path.resolve(root, rel));
    if (!f.startsWith(root + path.sep)) throw Error();
    const data = await readFile(f);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(f)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`PactWeave demo: http://127.0.0.1:${port}`),
);

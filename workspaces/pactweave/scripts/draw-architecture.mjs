import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "assets", "architecture");
const languages = ["en", "ko", "ja", "zh-CN"];
const colors = {
  blue: ["#eef5fc", "#cbdced"],
  green: ["#eaf7f1", "#cce3d8"],
  purple: ["#f4effa", "#dfd5eb"],
  amber: ["#fff6e1", "#ecdfbd"],
  rose: ["#fceef3", "#ecd4de"],
  white: ["#ffffff", "#dce5ef"],
};
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
function width(text, size) {
  return [...text].reduce(
    (sum, char) =>
      sum +
      size *
        (/[^\x00-\xff]/u.test(char)
          ? 1
          : /[MW@]/.test(char)
            ? 0.85
            : /[ilI.,:;!'| ]/.test(char)
              ? 0.3
              : 0.57),
    0,
  );
}
function wrap(text, maximum, size) {
  const result = [];
  for (const paragraph of String(text).split("\n")) {
    let remaining = [...paragraph];
    while (remaining.length) {
      let length = 0;
      while (
        length < remaining.length &&
        width(remaining.slice(0, length + 1).join(""), size) <= maximum
      )
        length++;
      if (!length) throw Error("Text column too narrow");
      if (length < remaining.length) {
        const space = remaining.slice(0, length).lastIndexOf(" ");
        if (space > length / 2) length = space;
      }
      result.push(remaining.slice(0, length).join("").trim());
      remaining = remaining.slice(length);
      while (remaining[0] === " ") remaining.shift();
    }
  }
  return result;
}
export function drawArchitecture(copy) {
  const out = [];
  const add = (text) => out.push(text);
  function text(
    value,
    x,
    y,
    maximum,
    size = 14,
    weight = 400,
    fill = "#17324d",
    leading = size * 1.42,
  ) {
    const lines = wrap(value, maximum, size);
    for (const [index, line] of lines.entries())
      add(
        `<text x="${x}" y="${y + index * leading}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escape(line)}</text>`,
      );
    return y + (lines.length - 1) * leading;
  }
  function node(
    id,
    x,
    y,
    w,
    h,
    data,
    color = "white",
    size = 14,
    titleSize = 18,
  ) {
    const [fill, stroke] = colors[color];
    add(
      `<g data-node="${id}" data-x="${x}" data-y="${y}" data-width="${w}" data-height="${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
    );
    let baseline =
      text(data.title, x + 18, y + 29, w - 36, titleSize, 700) + 23;
    for (const item of data.body ?? []) {
      text("•", x + 18, baseline, 14, size);
      baseline = text(item, x + 33, baseline, w - 51, size) + size * 1.42 + 2;
    }
    if ((data.body?.length ?? 0) && baseline - (size * 1.42 + 2) > y + h - 12)
      throw Error(`Copy exceeds node ${copy.lang}/${id}`);
    add("</g>");
  }
  function line(
    points,
    { optional = false, repair = false, both = false } = {},
  ) {
    add(
      `<polyline points="${points}" fill="none" stroke="${repair ? "#b45355" : "#2e5e87"}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"${optional ? ' stroke-dasharray="6 5"' : ""} marker-end="url(#${repair ? "repair-arrow" : "arrow"})"${both ? ' marker-start="url(#arrow)"' : ""}/>`,
    );
  }
  add(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1280" viewBox="0 0 1600 1280" role="img" aria-labelledby="title description" xml:lang="${escape(copy.lang)}">`,
  );
  add(
    `<title id="title">${escape(copy.title)} — ${escape(copy.tagline)}</title><desc id="description">${escape(copy.loop.subtitle)}. ${escape(copy.footer.local)} ${escape(copy.footer.browser)}</desc>`,
  );
  add(
    '<style>text{font-family:"Segoe UI","Noto Sans","Noto Sans CJK KR","Noto Sans CJK JP","Noto Sans CJK SC","Malgun Gothic","Yu Gothic","Microsoft YaHei",sans-serif}text{font-kerning:normal}</style>',
  );
  add(
    '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#2e5e87" stroke-width="1.8"/></marker><marker id="repair-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#b45355" stroke-width="1.8"/></marker></defs>',
  );
  add(
    '<rect width="1600" height="1280" fill="#ffffff"/><rect x="40" y="28" width="1520" height="78" rx="14" fill="#0c4a7c"/>',
  );
  text(copy.title, 65, 62, 1450, 28, 750, "#ffffff");
  text(copy.tagline, 65, 87, 1450, 16, 400, "#dcebf8");
  node("request", 40, 135, 230, 205, copy.request, "blue");
  node("intent", 300, 135, 370, 205, copy.intent, "green");
  node("contract", 700, 135, 390, 205, copy.contract, "purple");
  node("preprocess", 1120, 135, 440, 205, copy.preprocess, "purple");
  line("270,235 300,235");
  line("670,235 700,235");
  line("1090,235 1120,235");
  line("1340,340 1340,362 800,362 800,385");
  add(
    '<rect x="500" y="385" width="600" height="585" rx="16" fill="#ffffff" stroke="#cbdced" stroke-width="1.5"/><path d="M516 385 H1084 Q1100 385 1100 401 V435 H500 V401 Q500 385 516 385" fill="#0c4a7c"/>',
  );
  text(copy.loop.title, 520, 410, 550, 20, 700, "#ffffff");
  text(copy.loop.subtitle, 520, 428, 550, 12, 400, "#dcebf8");
  node("plan", 520, 452, 560, 108, copy.plan, "blue", 13.5);
  node("execute", 520, 585, 560, 130, copy.execute, "amber", 13.5);
  node("review", 520, 740, 560, 110, copy.review, "rose", 13.5);
  node("repair", 520, 875, 265, 85, copy.repair, "rose", 12.5, 16);
  node("passed", 815, 875, 265, 85, copy.passed, "green", 12.5, 16);
  line("800,560 800,585");
  line("800,715 800,740");
  line("800,850 800,863 652,863 652,875", { repair: true });
  line("800,850 800,863 947,863 947,875");
  line("520,912 508,912 508,506 520,506", { repair: true });
  node("gateway", 40, 385, 400, 585, { title: copy.gateway.title }, "green");
  text(copy.gateway.subtitle, 60, 442, 360, 13.5);
  add(
    '<polygon points="240,478 333,513 240,548 147,513" fill="#ffffff" stroke="#cbdced" stroke-width="1.5"/>',
  );
  add(
    `<text x="240" y="518" text-anchor="middle" font-size="14.5" font-weight="650" fill="#17324d">${escape(copy.decision.title)}</text>`,
  );
  node("cache", 60, 575, 360, 150, copy.cache, "purple", 13.5, 16);
  node("hit", 60, 765, 170, 140, copy.hit, "green", 12.5, 15);
  node("miss", 250, 765, 170, 140, copy.miss, "rose", 12.5, 15);
  line("240,548 240,575");
  text(copy.decision.yes, 250, 565, 65, 11.5);
  line("147,513 50,513 50,473 460,473 460,535 500,535", { optional: true });
  text(copy.decision.no, 65, 502, 80, 11.5);
  line("240,725 240,745 145,745 145,765");
  line("240,725 240,745 335,745 335,765");
  line("420,835 430,835 430,650 420,650", { optional: true });
  node(
    "knowledge",
    1160,
    385,
    400,
    585,
    { title: copy.knowledge.title },
    "green",
  );
  text(copy.knowledge.subtitle, 1180, 442, 360, 13.5);
  node("wiki", 1180, 485, 360, 180, copy.wiki, "blue", 13.5, 17);
  node("rag", 1180, 695, 360, 235, copy.rag, "purple", 13.5, 17);
  line("440,655 500,655", { optional: true, both: true });
  text(copy.optionalModel, 447, 615, 50, 10, 600);
  line("1100,655 1160,655", { optional: true, both: true });
  text(copy.optionalKnowledge, 1107, 615, 48, 10, 600);
  add(
    '<rect x="40" y="1010" width="1520" height="170" rx="14" fill="#f8faff" stroke="#cbdced" stroke-width="1.5"/>',
  );
  text(copy.vault.title, 60, 1040, 720, 19, 700);
  text(copy.vault.subtitle, 830, 1039, 700, 12.5);
  node("resources", 60, 1055, 350, 112, copy.resources, "blue", 12.5, 16);
  node("memory", 440, 1055, 350, 112, copy.memory, "green", 12.5, 16);
  node("skills", 820, 1055, 350, 112, copy.skills, "amber", 12.5, 16);
  node("sessions", 1200, 1055, 340, 112, copy.sessions, "rose", 12.5, 16);
  for (const x of [240, 800, 1360]) {
    line(`${x},970 ${x},1010`, { optional: true, both: true });
    text(copy.store, x + 12, 995, 150, 11);
  }
  add(
    '<rect x="40" y="1200" width="1520" height="58" rx="12" fill="#eef5fc"/>',
  );
  text(copy.footer.local, 60, 1225, 720, 13.5, 600);
  text(copy.footer.browser, 820, 1225, 720, 13.5, 600);
  add("</svg>");
  return out.join("\n") + "\n";
}
export async function generateArchitecture() {
  const files = [];
  for (const lang of languages) {
    const copy = JSON.parse(
      await fs.readFile(path.join(directory, "copy", `${lang}.json`), "utf8"),
    );
    if (copy.lang !== lang) throw Error("Unexpected diagram language");
    const destination = path.join(
      directory,
      `pactweave-architecture-${lang}.svg`,
    );
    await fs.writeFile(destination, drawArchitecture(copy), "utf8");
    files.push(path.basename(destination));
  }
  return files;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(JSON.stringify(await generateArchitecture()));

// Parse AoN per-class spell list pages into { name -> level } maps.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CLASSES = ["Cleric", "Druid", "Paladin", "Ranger", "Warpriest", "Shaman"];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|’/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const strip = (s) => decode(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " "));

export function parseList(html) {
  const out = new Map();
  // Sections look like: <h2 class="title">3rd-Level</h2> then repeated
  // <b><a href="SpellDisplay.aspx?ItemName=X">X</a></b>: short description<br />
  const sectionRe = /<h2 class="title">([^<]*?)-Level<\/h2>/g;
  const marks = [];
  let m;
  while ((m = sectionRe.exec(html))) marks.push({ label: m[1], at: m.index });

  marks.forEach((mark, i) => {
    const lvlWord = mark.label.trim().toLowerCase();
    const level = /^\d/.test(lvlWord) ? parseInt(lvlWord, 10) : NaN;
    if (Number.isNaN(level)) return;
    const body = html.slice(mark.at, i + 1 < marks.length ? marks[i + 1].at : html.length);
    const entryRe =
      /<a href="SpellDisplay\.aspx\?ItemName=([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/b>\s*:?\s*([\s\S]*?)<br\s*\/?>/g;
    let e;
    while ((e = entryRe.exec(body))) {
      const name = decode(decodeURIComponent(e[1].replace(/\+/g, " ")));
      const short = strip(e[3]);
      if (!out.has(name)) out.set(name, { name, level, short });
    }
  });
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("lists.mjs")) {
  const union = new Map();
  const perClass = {};
  for (const cls of CLASSES) {
    const file = `${DIR}/${cls.toLowerCase()}.html`;
    if (!existsSync(file)) {
      console.log(`missing ${file}`);
      continue;
    }
    const parsed = parseList(readFileSync(file, "utf8"));
    perClass[cls] = parsed.size;
    for (const [name, rec] of parsed) if (!union.has(name)) union.set(name, rec);
  }
  console.log("per class:", perClass);
  console.log("union:", union.size);
  writeFileSync(`${DIR}/union.json`, JSON.stringify([...union.values()], null, 1));
}

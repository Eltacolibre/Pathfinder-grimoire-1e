// Turn scraped AoN detail pages into src/data/spellsData.ts.
// Curated entries already in the repo keep their hand-written descriptions.
import { readFileSync, writeFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const REPO = "C:/Users/yanni/Pathfinder-grimoire-1e";

const details = JSON.parse(readFileSync(`${DIR}/details.json`, "utf8"));

// Classes the app models. AoN names on the left, our ids on the right.
const CLASS_IDS = {
  wizard: "wizard", "sorcerer/wizard": "wizard", cleric: "cleric",
  "cleric/oracle": "cleric", druid: "druid", sorcerer: "sorcerer", bard: "bard",
  witch: "witch", magus: "magus", alchemist: "alchemist", oracle: "oracle",
  inquisitor: "inquisitor", paladin: "paladin", ranger: "ranger",
  warpriest: "warpriest", psychic: "psychic", shaman: "shaman",
  summoner: "summoner", "summoner unchained": "summoner", bloodrager: "bloodrager",
  medium: "medium", mesmerist: "mesmerist", occultist: "occultist",
  spiritualist: "spiritualist",
};

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment",
  "Evocation", "Illusion", "Necromancy", "Transmutation", "Universal"];

const slug = (name) =>
  name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function parseSchool(raw) {
  const lower = (raw || "").toLowerCase();
  const hit = SCHOOLS.find((s) => lower.startsWith(s.toLowerCase()));
  if (hit) return hit;
  const any = SCHOOLS.find((s) => lower.includes(s.toLowerCase()));
  return any || "Universal";
}

function parseSubschool(raw) {
  const m = (raw || "").match(/\(([^)]+)\)/);
  return m ? m[1].replace(/\s+/g, " ").trim() : undefined;
}

function parseDescriptors(raw) {
  const m = (raw || "").match(/\[([^\]]+)\]/);
  if (!m) return undefined;
  const list = m[1].split(",").map((d) => d.replace(/\s+/g, " ").trim()).filter(Boolean);
  return list.length ? list : undefined;
}

// "adept 1, cleric 1, inquisitor 1" -> { cleric: 1, inquisitor: 1 }
function parseClasses(levelLine) {
  const out = {};
  for (const chunk of (levelLine || "").split(",")) {
    const m = chunk.trim().match(/^(.*?)\s+(\d+)$/);
    if (!m) continue;
    const name = m[1].toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").trim();
    const level = parseInt(m[2], 10);
    const id = CLASS_IDS[name];
    if (id && (out[id] === undefined || level < out[id])) out[id] = level;
  }
  return out;
}

const VALID_COMPONENTS = ["V", "S", "M", "F", "DF"];
function parseComponents(raw) {
  const found = new Set();
  for (const tok of (raw || "").split(/[,/]/)) {
    const t = tok.trim().toUpperCase();
    if (t.startsWith("DF")) found.add("DF");
    else if (t.startsWith("V")) found.add("V");
    else if (t.startsWith("S")) found.add("S");
    else if (t.startsWith("M")) found.add("M");
    else if (t.startsWith("F")) found.add("F");
  }
  return VALID_COMPONENTS.filter((c) => found.has(c));
}

function shorten(text, fallback) {
  const clean = stripBoilerplate(text).replace(/\s+/g, " ").trim();
  if (!clean) return fallback || "See the Archives of Nethys entry for details.";
  if (clean.length <= 160) return clean;
  const cut = clean.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 157)}…`;
}

// The scraped page text runs on past the spell into site chrome — the footer
// credit, ad-loader and theme-toggle scripts. Cut at the first sign of it.
const BOILERPLATE =
  /\s*(?:Site Owner\b|Email Spam Checker\b|MX Guarddog\b|\(adsbygoogle\b|adsbygoogle\b|initiateToggle\b|initializeMenuToggle\b|window\.\w|document\.getElementById\b|All Rights Reserved\b|Latest Pathfinder products\b)/i;

function stripBoilerplate(text) {
  const cut = (text || "").search(BOILERPLATE);
  return cut >= 0 ? text.slice(0, cut) : text || "";
}

// Keep the page from ballooning: store a trimmed description and point at AoN.
function trimDescription(text) {
  const clean = stripBoilerplate(text).replace(/\s+/g, " ").trim();
  const LIMIT = 500;
  if (clean.length <= LIMIT) return clean;
  const cut = clean.slice(0, LIMIT);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return `${cut.slice(0, lastStop > 400 ? lastStop + 1 : LIMIT)} […]`;
}

// --- existing curated spells keep their richer text -------------------------
const existingSrc = readFileSync(`${REPO}/src/data/spellsData.ts`, "utf8");
const curated = new Map();
for (const m of existingSrc.matchAll(/\{\s*\n\s*id: "([^"]+)",\s*\n\s*name: "([^"]+)",[\s\S]*?\n  \}/g)) {
  const block = m[0];
  const desc = block.match(/\n\s*description:\s*"((?:[^"\\]|\\.)*)"/);
  const short = block.match(/\n\s*shortDescription:\s*"((?:[^"\\]|\\.)*)"/);
  curated.set(m[1], {
    description: desc ? desc[1] : null,
    shortDescription: short ? short[1] : null,
  });
}

const spells = [];
const skipped = [];

for (const rec of Object.values(details)) {
  if (rec.failed) { skipped.push(`${rec.name}: fetch failed`); continue; }
  const classes = parseClasses(rec.levelLine);
  if (Object.keys(classes).length === 0) { skipped.push(`${rec.name}: no known class`); continue; }

  const id = slug(rec.name);
  const keep = curated.get(id);
  const components = parseComponents(rec.components);

  spells.push({
    id,
    name: rec.name,
    school: parseSchool(rec.school),
    subschool: parseSubschool(rec.school),
    descriptors: parseDescriptors(rec.school),
    classes,
    castingTime: rec.castingTime || "1 standard action",
    components: components.length ? components : ["V", "S"],
    range: rec.range || "—",
    areaTarget: rec.area || undefined,
    duration: rec.duration || "—",
    savingThrow: rec.saving || "None",
    spellResistance: rec.sr || "No",
    description: keep?.description
      ? keep.description.replace(/\\n/g, "\n")
      : trimDescription(rec.description),
    shortDescription: keep?.shortDescription || shorten(rec.short || rec.description),
    source: (rec.source || "Paizo").replace(/\s+pg\.\s*\d+.*$/, "").trim() || "Paizo",
  });
}

spells.sort((a, b) => a.name.localeCompare(b.name));

// Emitted as JSON, not TypeScript: a 1,700-entry array literal is both too
// large to ship in the JS bundle and too complex for tsc to type-check.
// Undefined fields are dropped so the file stays as small as possible.
const compact = spells.map((s) =>
  Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)),
);
writeFileSync(`${REPO}/public/spells.json`, JSON.stringify(compact));

console.log(`wrote ${spells.length} spells to public/spells.json`);
if (skipped.length) console.log(`skipped ${skipped.length}, e.g.`, skipped.slice(0, 5));
const byClass = {};
for (const s of spells) for (const c of Object.keys(s.classes)) byClass[c] = (byClass[c] || 0) + 1;
console.log("per class:", byClass);

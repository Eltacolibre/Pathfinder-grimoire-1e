// Fetch and parse AoN SpellDisplay pages for every spell in union.json.
// Polite: small concurrency, retries, resumable via details.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const UA = "Mozilla/5.0 (compatible; grimoire-import/1.0)";
const CONCURRENCY = 5;

const union = JSON.parse(readFileSync(`${DIR}/union.json`, "utf8"));
const done = existsSync(`${DIR}/details.json`)
  ? JSON.parse(readFileSync(`${DIR}/details.json`, "utf8"))
  : {};

const decode = (s) =>
  s
    // Drop script/style bodies first: stripping only the tags would leave the
    // JavaScript behind as visible text in the middle of a spell description.
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// Pull "Label value" out of the flattened stat block.
function field(text, label, stops) {
  const re = new RegExp(`${label}\\s+([\\s\\S]*?)(?=\\s+(?:${stops.join("|")})\\b|$)`, "i");
  const m = text.match(re);
  return m ? m[1].trim().replace(/[;,]$/, "") : "";
}

const STOPS = [
  "School", "Level", "Casting", "Casting Time", "Components", "Effect", "Range",
  "Area", "Target", "Targets", "Effect", "Duration", "Saving Throw",
  "Spell Resistance", "Description", "Mythic", "Source",
];

function parseSpell(html, fallbackName) {
  // The stat block lives between the title and the mythic/section end.
  const start = html.indexOf("<h1");
  const body = html.slice(start > 0 ? start : 0);
  const text = decode(body);

  const school = field(text, "School", STOPS);
  const levelLine = field(text, "Level", STOPS);
  const castingTime = field(text, "Casting Time", STOPS);
  const components = field(text, "Components", STOPS);
  const range = field(text, "Range", STOPS);
  const area = field(text, "Area", STOPS) || field(text, "Target", STOPS) || field(text, "Targets", STOPS) || field(text, "Effect", STOPS);
  const duration = field(text, "Duration", STOPS);
  const saving = field(text, "Saving Throw", STOPS);
  const sr = field(text, "Spell Resistance", STOPS);
  const source = field(text, "Source", STOPS);

  let description = "";
  const dIdx = text.indexOf(" Description ");
  if (dIdx >= 0) {
    description = text.slice(dIdx + " Description ".length);
    // Stop before mythic/alternate sections appended to the same page, and
    // before the site footer that follows the article.
    description = description.split(/\s+Mythic\s+/)[0];
    const junk = description.search(
      /\s*(?:Site Owner\b|Email Spam Checker\b|MX Guarddog\b|adsbygoogle\b|initiateToggle\b|initializeMenuToggle\b|All Rights Reserved\b)/i,
    );
    if (junk >= 0) description = description.slice(0, junk);
    description = description.trim();
  }

  return {
    name: fallbackName,
    school,
    levelLine,
    castingTime,
    components,
    range,
    area,
    duration,
    saving,
    sr,
    source,
    description,
  };
}

async function fetchOne(rec, attempt = 0) {
  const url = `https://www.aonprd.com/SpellDisplay.aspx?ItemName=${encodeURIComponent(rec.name)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const parsed = parseSpell(html, rec.name);
    if (!parsed.school && attempt < 2) throw new Error("no school parsed");
    done[rec.name] = { ...parsed, short: rec.short };
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return fetchOne(rec, attempt + 1);
    }
    done[rec.name] = { name: rec.name, failed: String(err.message), short: rec.short };
  }
}

const todo = union.filter((r) => !done[r.name]);
console.log(`total ${union.length}, already have ${union.length - todo.length}, fetching ${todo.length}`);

let i = 0;
let completed = 0;
async function worker() {
  while (i < todo.length) {
    const rec = todo[i++];
    await fetchOne(rec);
    completed++;
    if (completed % 100 === 0) {
      console.log(`  ${completed}/${todo.length}`);
      writeFileSync(`${DIR}/details.json`, JSON.stringify(done));
    }
    await new Promise((r) => setTimeout(r, 60));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
writeFileSync(`${DIR}/details.json`, JSON.stringify(done));

const failed = Object.values(done).filter((d) => d.failed);
console.log(`done. parsed ${Object.keys(done).length}, failed ${failed.length}`);
if (failed.length) console.log("examples:", failed.slice(0, 5).map((f) => `${f.name}: ${f.failed}`));

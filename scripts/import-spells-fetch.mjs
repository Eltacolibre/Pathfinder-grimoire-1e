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

// Everything from here on is site chrome, not spell text. Cutting before any
// field is extracted keeps it out of Area/Saving Throw/Level as well as the
// description — `field()` runs to the end of the text when the label it
// expects next is absent, so an unbounded tail poisons whatever came last.
const FOOTER =
  /\s*(?:Site Owner\b|Email Spam Checker\b|MX Guarddog\b|adsbygoogle\b|initiateToggle\b|initializeMenuToggle\b|All Rights Reserved\b|Latest Pathfinder products\b)/i;

function parseSpell(html, fallbackName) {
  // The stat block lives between the title and the mythic/section end.
  const start = html.indexOf("<h1");
  const body = html.slice(start > 0 ? start : 0);
  let text = decode(body);
  const footerAt = text.search(FOOTER);
  if (footerAt >= 0) text = text.slice(0, footerAt);

  // Confine stat lookups to the block above "Description". Phrases like "no
  // spell resistance applies" occur in ordinary rules text, so a spell whose
  // block omits that line would otherwise take its value from the prose.
  const dIdx = text.indexOf(" Description ");
  const stats = dIdx >= 0 ? text.slice(0, dIdx) : text;

  const school = field(stats, "School", STOPS);
  const levelLine = field(stats, "Level", STOPS);
  const castingTime = field(stats, "Casting Time", STOPS);
  const components = field(stats, "Components", STOPS);
  const range = field(stats, "Range", STOPS);
  const area = field(stats, "Area", STOPS) || field(stats, "Target", STOPS) || field(stats, "Targets", STOPS) || field(stats, "Effect", STOPS);
  const duration = field(stats, "Duration", STOPS);
  const saving = field(stats, "Saving Throw", STOPS);
  const sr = field(stats, "Spell Resistance", STOPS);
  const source = field(stats, "Source", STOPS);

  let description = "";
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

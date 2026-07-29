import { Spell } from "../types";
import { INITIAL_PAIZO_SPELLS } from "../data/spellsData";

// The full library (~1,750 spells) is too large to sit in the JS bundle, so it
// ships as a separate JSON file fetched after first paint. Until it arrives —
// or if it never does, e.g. offline on a phone at the table — the app runs on
// the curated set compiled into the bundle.

export const SEED_SPELLS: Spell[] = INITIAL_PAIZO_SPELLS;

let cache: Spell[] | null = null;
let inFlight: Promise<Spell[]> | null = null;

function isSpell(value: unknown): value is Spell {
  const s = value as Spell;
  return (
    !!s &&
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.classes === "object" &&
    s.classes !== null
  );
}

/**
 * Fetch the full spell library, merged over the bundled seed. Entries from the
 * library win, since they carry the same curated text plus everything else.
 * Resolves to the seed alone if the file cannot be loaded.
 */
export async function loadSpellLibrary(): Promise<Spell[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}spells.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error("spells.json is not an array");

      const byId = new Map<string, Spell>();
      for (const spell of SEED_SPELLS) byId.set(spell.id, spell);
      for (const entry of data) if (isSpell(entry)) byId.set(entry.id, entry);

      cache = [...byId.values()];
      return cache;
    } catch {
      cache = SEED_SPELLS;
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

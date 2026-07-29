import { CharacterClassEntry, Spell } from "../types";
import { CLERIC_DOMAINS, DomainDefinition } from "../data/domainsData";

// In Pathfinder 1e a domain grants its spells *in addition* to the class list,
// and most of them are not cleric spells at all — six of the nine Sun Domain
// spells (Heat Metal, Fire Shield, Sunbeam…) are absent from it. Filtering the
// preparation picker to the class list alone therefore hides every one of them.

export interface DomainGrant {
  spell: Spell;
  /** The spell level the domain grants it at, which is the slot it fills. */
  level: number;
  domainName: string;
}

function findDomain(spec?: string): DomainDefinition | undefined {
  if (!spec) return undefined;
  const needle = spec.trim().toLowerCase();
  if (!needle) return undefined;
  return CLERIC_DOMAINS.find(
    (d) => d.name.toLowerCase() === needle || d.id === needle || `${d.id} domain` === needle,
  );
}

export function getCharacterDomains(classEntry: CharacterClassEntry): DomainDefinition[] {
  return [
    findDomain(classEntry.specialization),
    findDomain(classEntry.secondarySpecialization),
  ].filter((d): d is DomainDefinition => d !== undefined);
}

const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9",
};

/**
 * The domain tables and the imported library do not always spell a name the
 * same way, so try the documented variants before giving up:
 * "Heal (Mass)" -> "Heal, Mass", "Summon Monster IX" -> "Summon Monster 9",
 * "Align Weapon (Chaos)" -> "Align Weapon".
 */
function candidateNames(name: string): string[] {
  const out = new Set<string>();
  const add = (s: string) => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t) out.add(t.toLowerCase());
  };

  add(name);

  const paren = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const [, base, qualifier] = paren;
    add(base);
    add(`${base}, ${qualifier}`);
    add(`${qualifier} ${base}`);
  }

  for (const variant of [...out]) {
    const roman = variant.replace(
      /\b(i{1,3}|iv|v|vi{1,3}|ix)\b\s*$/i,
      (m) => ROMAN[m.toLowerCase()] ?? m,
    );
    if (roman !== variant) add(roman);
  }

  return [...out];
}

/** Every spell the character's domains grant, keyed by spell id. */
export function getDomainGrants(
  classEntry: CharacterClassEntry,
  allSpells: Spell[],
): Map<string, DomainGrant> {
  const byName = new Map<string, Spell>();
  for (const s of allSpells) byName.set(s.name.toLowerCase(), s);

  const grants = new Map<string, DomainGrant>();
  for (const domain of getCharacterDomains(classEntry)) {
    for (const [levelKey, spellName] of Object.entries(domain.grantedSpells)) {
      const level = Number(levelKey);
      let spell: Spell | undefined;
      for (const candidate of candidateNames(spellName)) {
        spell = byName.get(candidate);
        if (spell) break;
      }
      if (!spell) continue;
      // A lower-level grant wins if two domains grant the same spell.
      const existing = grants.get(spell.id);
      if (!existing || level < existing.level) {
        grants.set(spell.id, { spell, level, domainName: domain.name });
      }
    }
  }
  return grants;
}

/**
 * The level this spell occupies for this character: its class level normally,
 * or the domain's granted level for a spell that is not on the class list.
 */
export function effectiveSpellLevel(
  spell: Spell,
  classEntry: CharacterClassEntry,
  grants: Map<string, DomainGrant>,
): number | undefined {
  const classLevel = spell.classes[classEntry.casterClass];
  const grantLevel = grants.get(spell.id)?.level;
  if (classLevel === undefined) return grantLevel;
  if (grantLevel === undefined) return classLevel;
  return Math.min(classLevel, grantLevel);
}

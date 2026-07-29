import { Character, CasterClass, Spell, CharacterClassEntry } from "../types";
import {
  CASTER_CLASSES,
  PREPARED_9_BASE_SLOTS,
  SPONTANEOUS_9_BASE_SLOTS,
  SLOTS_6_BASE,
  SLOTS_4_BASE,
  FULL_LIST_CLASSES,
} from "../data/classesData";

export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Normalizes a character into a list of all class entries
 */
export function getAllCharacterClasses(character: Character): CharacterClassEntry[] {
  const primaryEntry: CharacterClassEntry = {
    id: "primary",
    casterClass: character.casterClass,
    level: character.level,
    primaryAbility: character.primaryAbility,
    abilityScore: character.abilityScore,
    specialization: character.specialization,
    secondarySpecialization: character.secondarySpecialization,
    oppositionSchools: character.oppositionSchools,
    preparedSpells: character.preparedSpells || [],
    spontaneousSlotsUsed: character.spontaneousSlotsUsed || {},
  };

  const multiclass = character.multiclassEntries || [];
  return [primaryEntry, ...multiclass];
}

/**
 * Gets the active class entry for a character based on activeClassIndex
 */
export function getActiveClassEntry(character: Character): CharacterClassEntry {
  const classes = getAllCharacterClasses(character);
  const idx = character.activeClassIndex ?? 0;
  return classes[idx] || classes[0];
}

/**
 * Standard PF1e Bonus Spells per Day formula based on Ability Modifier M and Spell Level L.
 * If M < L, returns 0.
 * Otherwise returns Math.floor((M - L) / 4) + 1
 */
export function getBonusSlotsForLevel(abilityModifier: number, spellLevel: number): number {
  if (spellLevel <= 0) return 0; // Cantrips/Orisons do not gain bonus slots
  if (abilityModifier < spellLevel) return 0;
  return Math.floor((abilityModifier - spellLevel) / 4) + 1;
}

export interface SlotBreakdown {
  level: number;
  base: number;
  bonus: number;
  specialty: number; // domain or school specialty
  total: number;
}

export function getCharacterSlotsBreakdownForClass(classEntry: CharacterClassEntry): SlotBreakdown[] {
  const classDef = CASTER_CLASSES[classEntry.casterClass] || CASTER_CLASSES.wizard;
  const mod = calculateAbilityModifier(classEntry.abilityScore);
  const maxLvl = classDef.maxSpellLevel;
  const level = Math.min(Math.max(classEntry.level, 1), 20);

  let baseTable: Record<number, number[]>;
  if (maxLvl === 9) {
    baseTable = classDef.castingType.includes("spontaneous")
      ? SPONTANEOUS_9_BASE_SLOTS
      : PREPARED_9_BASE_SLOTS;
  } else if (maxLvl === 6) {
    baseTable = SLOTS_6_BASE;
  } else {
    baseTable = SLOTS_4_BASE;
  }

  const levelRow = baseTable[level] || [];
  const result: SlotBreakdown[] = [];

  for (let l = 0; l <= maxLvl; l++) {
    const rawBase = levelRow[l] ?? 0;

    // Special rule for 4-level casters or classes with 0 base slots prior to high ability bonus
    const bonus = getBonusSlotsForLevel(mod, l);

    // Specialty slot (1 per day per spell level L >= 1 if base > 0 or bonus > 0)
    let specialty = 0;
    if (l >= 1 && classDef.hasSpecialtySlot && (rawBase > 0 || bonus > 0)) {
      specialty = 1;
    }

    const total = l === 0 ? rawBase : rawBase + bonus + specialty;

    result.push({
      level: l,
      base: rawBase,
      bonus,
      specialty,
      total,
    });
  }

  return result;
}

export function getCharacterSlotsBreakdown(character: Character): SlotBreakdown[] {
  const activeClass = getActiveClassEntry(character);
  return getCharacterSlotsBreakdownForClass(activeClass);
}

export function calculateSaveDC(character: Character, spellLevel: number): number {
  const activeClass = getActiveClassEntry(character);
  const mod = calculateAbilityModifier(activeClass.abilityScore);
  return 10 + spellLevel + mod;
}

/**
 * Automatically inscribe all spells on a class list into character's known spells
 */
export function autoInscribeClassSpells(character: Character, targetClass: CasterClass, allSpells: Spell[]): Character {
  const classSpells = allSpells.filter((s) => s.classes[targetClass] !== undefined);
  const newIds = classSpells.map((s) => s.id);
  const mergedKnown = Array.from(new Set([...character.knownSpellIds, ...newIds]));

  return {
    ...character,
    knownSpellIds: mergedKnown,
  };
}

// LocalStorage Keys
const STORAGE_CHARACTERS_KEY = "pf1e_grimoire_characters";
const STORAGE_ACTIVE_CHAR_KEY = "pf1e_grimoire_active_char_id";
const STORAGE_CUSTOM_SPELLS_KEY = "pf1e_grimoire_custom_spells";

export function loadStoredCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHARACTERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load characters from localStorage", err);
    return [];
  }
}

export function saveStoredCharacters(characters: Character[]) {
  try {
    localStorage.setItem(STORAGE_CHARACTERS_KEY, JSON.stringify(characters));
  } catch (err) {
    console.error("Failed to save characters to localStorage", err);
  }
}

export function loadActiveCharacterId(): string | null {
  return localStorage.getItem(STORAGE_ACTIVE_CHAR_KEY);
}

export function saveActiveCharacterId(id: string) {
  localStorage.setItem(STORAGE_ACTIVE_CHAR_KEY, id);
}

export function loadStoredCustomSpells(): Spell[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_SPELLS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load custom spells", err);
    return [];
  }
}

export function saveStoredCustomSpells(spells: Spell[]) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_SPELLS_KEY, JSON.stringify(spells));
  } catch (err) {
    console.error("Failed to save custom spells", err);
  }
}

// Helper to filter spells by search criteria
export function filterSpellsList(spells: Spell[], filter: {
  search: string;
  classFilter: CasterClass | "all";
  levelFilter: number | "all";
  schoolFilter: string | "all";
  componentFilter: string[];
  descriptorFilter: string;
  sourceFilter: string;
  onlyCharacterKnown?: boolean;
  knownSpellIds?: string[];
}): Spell[] {
  return spells.filter((spell) => {
    // Search
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      const matchName = spell.name.toLowerCase().includes(q);
      const matchDesc = spell.description.toLowerCase().includes(q);
      const matchSchool = spell.school.toLowerCase().includes(q);
      const matchSubschool = spell.subschool?.toLowerCase().includes(q) ?? false;
      const matchDescriptors = spell.descriptors?.some((d) => d.toLowerCase().includes(q)) ?? false;
      if (!matchName && !matchDesc && !matchSchool && !matchSubschool && !matchDescriptors) {
        return false;
      }
    }

    // Class & Level
    if (filter.classFilter !== "all") {
      const clsLvl = spell.classes[filter.classFilter];
      if (clsLvl === undefined) return false;

      if (filter.levelFilter !== "all" && clsLvl !== filter.levelFilter) {
        return false;
      }
    } else {
      if (filter.levelFilter !== "all") {
        // If class filter is 'all', check if any class has this level
        const hasLevel = Object.values(spell.classes).includes(filter.levelFilter as number);
        if (!hasLevel) return false;
      }
    }

    // School
    if (filter.schoolFilter !== "all" && spell.school !== filter.schoolFilter) {
      return false;
    }

    // Components
    if (filter.componentFilter.length > 0) {
      const hasAllComponents = filter.componentFilter.every((comp) =>
        spell.components.includes(comp as any)
      );
      if (!hasAllComponents) return false;
    }

    // Descriptors
    if (filter.descriptorFilter && filter.descriptorFilter !== "all") {
      const descQ = filter.descriptorFilter.toLowerCase();
      const matchDesc = spell.descriptors?.some((d) => d.toLowerCase() === descQ);
      if (!matchDesc) return false;
    }

    // Source
    if (filter.sourceFilter && filter.sourceFilter !== "all") {
      if (spell.source !== filter.sourceFilter) return false;
    }

    // Only Known
    if (filter.onlyCharacterKnown && filter.knownSpellIds) {
      if (!filter.knownSpellIds.includes(spell.id)) return false;
    }

    return true;
  });
}

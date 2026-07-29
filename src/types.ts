export type SpellSchool =
  | "Abjuration"
  | "Conjuration"
  | "Divination"
  | "Enchantment"
  | "Evocation"
  | "Illusion"
  | "Necromancy"
  | "Transmutation"
  | "Universal";

export type SpellComponent = "V" | "S" | "M" | "F" | "DF";

export type CasterClass =
  | "wizard"
  | "cleric"
  | "druid"
  | "sorcerer"
  | "bard"
  | "witch"
  | "magus"
  | "alchemist"
  | "oracle"
  | "inquisitor"
  | "paladin"
  | "ranger"
  | "psychic"
  | "shaman"
  | "summoner"
  | "bloodrager"
  | "medium"
  | "mesmerist"
  | "occultist"
  | "spiritualist";

export type CastingType =
  | "arcane-prepared"
  | "arcane-spontaneous"
  | "divine-prepared"
  | "divine-spontaneous"
  | "occult-spontaneous"
  | "formulae";

export interface Spell {
  id: string;
  name: string;
  school: SpellSchool;
  subschool?: string;
  descriptors?: string[];
  classes: Partial<Record<CasterClass, number>>;
  castingTime: string;
  components: SpellComponent[];
  materials?: string;
  range: string;
  areaTarget?: string;
  duration: string;
  savingThrow: string;
  spellResistance: string;
  description: string;
  shortDescription: string;
  source: string;
  isCustom?: boolean;
}

export type MetamagicFeat =
  | "Empower"
  | "Extend"
  | "Heighten"
  | "Maximize"
  | "Quicken"
  | "Silent"
  | "Still"
  | "Reach"
  | "Selective"
  | "Persistent"
  | "Ectoplasmic"
  | "Enlarge";

export interface PreparedSpellInstance {
  id: string; // unique instance ID
  spellId: string;
  slotLevel: number; // The spell slot level it occupies (0 to 9)
  isDomainOrSpecialty?: boolean;
  domainName?: string; // e.g. "Sun Domain" or "Fire Domain"
  isCast: boolean;
  metamagic?: MetamagicFeat[];
  customNote?: string;
}

export interface Character {
  id: string;
  name: string;
  casterClass: CasterClass;
  level: number; // 1-20
  primaryAbility: "int" | "wis" | "cha";
  abilityScore: number; // e.g. 18 (+4)
  specialization?: string; // Primary domain (Cleric) / Arcane School (Wizard) / Bloodline / Patron
  secondarySpecialization?: string; // Secondary domain (Cleric)
  oppositionSchools?: SpellSchool[]; // e.g. ["Necromancy", "Enchantment"]
  knownSpellIds: string[]; // Spells in Spellbook / Formulas / Known Spells
  preparedSpells: PreparedSpellInstance[]; // For prepared casters or Arcanist prepared list
  spontaneousSlotsUsed: Record<number, number>; // level -> count used today
  notes?: string;
  createdAt: number;
}

export interface FilterOptions {
  search: string;
  classFilter: CasterClass | "all";
  levelFilter: number | "all";
  schoolFilter: SpellSchool | "all";
  componentFilter: SpellComponent[];
  descriptorFilter: string;
  sourceFilter: string;
  onlyCharacterKnown: boolean;
}

export interface ClassDefinition {
  id: CasterClass;
  name: string;
  castingType: CastingType;
  primaryAbility: "int" | "wis" | "cha";
  maxSpellLevel: number; // 9, 6, or 4
  hasSpecialtySlot: boolean; // e.g. Wizard school slot / Cleric domain slot
  specialtySlotLabel?: string; // "Specialty School" / "Domain"
  allowsOppositionSchools: boolean;
  spellbookType: "Spellbook" | "Formula Book" | "Known Spells" | "Divine Prayer List";
  description: string;
}

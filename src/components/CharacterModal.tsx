import React, { useState } from "react";
import { X, Shield, Wand2, Sparkles, Check, BookOpen, Plus, Trash2, Layers } from "lucide-react";
import { Character, CasterClass, SpellSchool, CharacterClassEntry } from "../types";
import { CASTER_CLASSES, FULL_LIST_CLASSES } from "../data/classesData";
import { CLERIC_DOMAINS } from "../data/domainsData";
import { calculateAbilityModifier } from "../utils/pf1eUtils";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character, autoInscribe?: boolean) => void;
  existingCharacter?: Character | null;
}

const ALL_SCHOOLS: SpellSchool[] = [
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
  "Universal",
];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCharacter,
}) => {
  const [name, setName] = useState(existingCharacter?.name || "Ezren the Pious");
  const [casterClass, setCasterClass] = useState<CasterClass>(
    existingCharacter?.casterClass || "cleric"
  );
  const [level, setLevel] = useState<number>(existingCharacter?.level || 5);
  const [abilityScore, setAbilityScore] = useState<number>(
    existingCharacter?.abilityScore || 18
  );
  const [specialization, setSpecialization] = useState<string>(
    existingCharacter?.specialization || (existingCharacter?.casterClass === "cleric" ? "Sun Domain" : "Evocation")
  );
  const [secondarySpecialization, setSecondarySpecialization] = useState<string>(
    existingCharacter?.secondarySpecialization || (existingCharacter?.casterClass === "cleric" ? "Fire Domain" : "")
  );
  const [oppositionSchools, setOppositionSchools] = useState<SpellSchool[]>(
    existingCharacter?.oppositionSchools || ["Necromancy", "Enchantment"]
  );

  // Multiclassing state
  const [multiclassEntries, setMulticlassEntries] = useState<CharacterClassEntry[]>(
    existingCharacter?.multiclassEntries || []
  );

  // Auto-inscribe full class list option
  const [autoInscribe, setAutoInscribe] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentClassDef = CASTER_CLASSES[casterClass];
  const mod = calculateAbilityModifier(abilityScore);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  const isFullListClass = FULL_LIST_CLASSES.includes(casterClass);

  const toggleOppositionSchool = (school: SpellSchool) => {
    if (oppositionSchools.includes(school)) {
      setOppositionSchools(oppositionSchools.filter((s) => s !== school));
    } else {
      if (oppositionSchools.length < 2) {
        setOppositionSchools([...oppositionSchools, school]);
      }
    }
  };

  const handleAddMulticlass = () => {
    const newClass: CasterClass = casterClass === "wizard" ? "cleric" : "wizard";
    const newEntry: CharacterClassEntry = {
      id: `mc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      casterClass: newClass,
      level: 3,
      primaryAbility: CASTER_CLASSES[newClass].primaryAbility,
      abilityScore: 16,
      specialization: "",
      preparedSpells: [],
      spontaneousSlotsUsed: {},
    };
    setMulticlassEntries([...multiclassEntries, newEntry]);
  };

  const handleUpdateMulticlass = (index: number, updated: Partial<CharacterClassEntry>) => {
    const copy = [...multiclassEntries];
    const item = { ...copy[index], ...updated };
    if (updated.casterClass) {
      item.primaryAbility = CASTER_CLASSES[updated.casterClass].primaryAbility;
    }
    copy[index] = item;
    setMulticlassEntries(copy);
  };

  const handleRemoveMulticlass = (index: number) => {
    setMulticlassEntries(multiclassEntries.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const char: Character = {
      id: existingCharacter?.id || `char_${Date.now()}`,
      name: name.trim() || "Unnamed Hero",
      casterClass,
      level: Math.min(Math.max(level, 1), 20),
      primaryAbility: currentClassDef.primaryAbility,
      abilityScore: Math.min(Math.max(abilityScore, 1), 50),
      specialization: specialization.trim(),
      secondarySpecialization: casterClass === "cleric" ? secondarySpecialization.trim() : undefined,
      oppositionSchools: currentClassDef.allowsOppositionSchools ? oppositionSchools : [],
      knownSpellIds: existingCharacter?.knownSpellIds || [],
      preparedSpells: existingCharacter?.preparedSpells || [],
      spontaneousSlotsUsed: existingCharacter?.spontaneousSlotsUsed || {},
      multiclassEntries: multiclassEntries.length > 0 ? multiclassEntries : undefined,
      activeClassIndex: existingCharacter?.activeClassIndex || 0,
      createdAt: existingCharacter?.createdAt || Date.now(),
    };

    onSave(char, autoInscribe);
    onClose();
  };

  const primaryDomainObj = CLERIC_DOMAINS.find((d) =>
    d.name.toLowerCase().includes(specialization.toLowerCase()) || d.id === specialization.toLowerCase()
  );
  const secondaryDomainObj = CLERIC_DOMAINS.find((d) =>
    d.name.toLowerCase().includes(secondarySpecialization.toLowerCase()) || d.id === secondarySpecialization.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37]">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#e2d5c3] tracking-wide uppercase">
                {existingCharacter ? "Configure Hero Parameters" : "Create New Pathfinder Hero"}
              </h2>
              <p className="text-xs text-[#8c7a65] font-serif italic">
                Set up casting parameters according to Pathfinder 1e rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8c7a65] hover:text-[#e2d5c3] p-1 rounded hover:bg-[#2d241c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-[#d4c5b3]">
          {/* Character Name & Primary Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Character Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Ezren, Kyra, Seoni"
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] text-sm font-serif"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Primary Caster Class
              </label>
              <select
                value={casterClass}
                onChange={(e) => setCasterClass(e.target.value as CasterClass)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] text-sm font-serif"
              >
                {Object.values(CASTER_CLASSES).map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.castingType.replace("-", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Description Card */}
          <div className="bg-[#14100e] border border-[#3d2e24] p-3 rounded-sm text-xs text-[#8c7a65] flex gap-3 items-start font-serif italic">
            <Shield className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#d4c5b3] not-italic">{currentClassDef.name}: </span>
              {currentClassDef.description}
            </div>
          </div>

          {/* Level & Ability Score (Mobile & Desktop Touch Friendly Inputs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Class Level (1 - 20)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLevel(Math.max(1, level - 1))}
                  className="bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4af37] px-2.5 py-2 rounded-sm border border-[#3d2e24] font-mono text-sm font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] text-sm font-mono text-center"
                />
                <button
                  type="button"
                  onClick={() => setLevel(Math.min(20, level + 1))}
                  className="bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4af37] px-2.5 py-2 rounded-sm border border-[#3d2e24] font-mono text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                {currentClassDef.primaryAbility.toUpperCase()} Score (Any Value)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAbilityScore(Math.max(1, abilityScore - 1))}
                  className="bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4af37] px-2.5 py-2 rounded-sm border border-[#3d2e24] font-mono text-sm font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={abilityScore}
                  onChange={(e) => setAbilityScore(parseInt(e.target.value) || 10)}
                  className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] text-sm font-mono text-center"
                />
                <button
                  type="button"
                  onClick={() => setAbilityScore(abilityScore + 1)}
                  className="bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4af37] px-2.5 py-2 rounded-sm border border-[#3d2e24] font-mono text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Ability Modifier
              </label>
              <div className="bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4af37] font-bold text-sm text-center font-mono">
                {modStr} ({currentClassDef.primaryAbility.toUpperCase()})
              </div>
            </div>
          </div>

          {/* Full List Divine Caster Option */}
          {isFullListClass && (
            <div className="bg-[#14100e] border border-[#d4af37]/40 p-3 rounded-sm">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#e2d5c3]">
                <input
                  type="checkbox"
                  checked={autoInscribe}
                  onChange={(e) => setAutoInscribe(e.target.checked)}
                  className="accent-[#d4af37]"
                />
                <span className="font-serif">
                  <strong className="text-[#d4af37]">Auto-Inscribe Class Spell List: </strong>
                  In Pathfinder 1e, <span className="capitalize">{casterClass}s</span> automatically know all spells on their class list.
                </span>
              </label>
            </div>
          )}

          {/* Specialization / Domain / Bloodline */}
          {casterClass === "cleric" ? (
            <div className="space-y-4 bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm">
              <div className="flex items-center justify-between border-b border-[#3d2e24] pb-2">
                <span className="font-serif font-bold text-xs text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Cleric Dual Domains (PF1e Rules)</span>
                </span>
                <span className="text-[10px] text-[#8c7a65] font-serif italic">
                  Clerics select 2 divine domains from their deity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Domain */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                    Primary Domain / Subdomain
                  </label>
                  <select
                    value={CLERIC_DOMAINS.some((d) => d.name === specialization) ? specialization : "CUSTOM"}
                    onChange={(e) => {
                      if (e.target.value !== "CUSTOM") {
                        setSpecialization(e.target.value);
                      }
                    }}
                    className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1.5 text-[#d4c5b3] text-xs font-serif mb-1.5"
                  >
                    <option value="CUSTOM">-- Custom / Other Domain --</option>
                    {CLERIC_DOMAINS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Sun Domain, Healing, Light Subdomain"
                    className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-1.5 text-[#d4c5b3] text-xs font-serif placeholder-[#8c7a65]"
                  />
                </div>

                {/* Secondary Domain */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                    Secondary Domain / Subdomain
                  </label>
                  <select
                    value={CLERIC_DOMAINS.some((d) => d.name === secondarySpecialization) ? secondarySpecialization : "CUSTOM"}
                    onChange={(e) => {
                      if (e.target.value !== "CUSTOM") {
                        setSecondarySpecialization(e.target.value);
                      }
                    }}
                    className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1.5 text-[#d4c5b3] text-xs font-serif mb-1.5"
                  >
                    <option value="CUSTOM">-- Custom / Other Domain --</option>
                    {CLERIC_DOMAINS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={secondarySpecialization}
                    onChange={(e) => setSecondarySpecialization(e.target.value)}
                    placeholder="e.g. Fire Domain, Good, Restoration Subdomain"
                    className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-1.5 text-[#d4c5b3] text-xs font-serif placeholder-[#8c7a65]"
                  />
                </div>
              </div>

              {/* Granted Domain Spells Preview */}
              {(primaryDomainObj || secondaryDomainObj) && (
                <div className="pt-2 border-t border-[#3d2e24] text-[11px] text-[#8c7a65]">
                  <span className="font-bold text-[#d4af37] uppercase tracking-wider block mb-1">
                    Deity Domain Spells Granted:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-serif italic">
                    {primaryDomainObj && (
                      <div className="bg-[#1c1714] p-2 rounded-sm border border-[#3d2e24]">
                        <strong className="text-[#e2d5c3] not-italic block font-sans font-semibold text-xs mb-0.5">
                          {primaryDomainObj.name}:
                        </strong>
                        {Object.entries(primaryDomainObj.grantedSpells)
                          .map(([lvl, sName]) => `Lvl ${lvl}: ${sName}`)
                          .join(" • ")}
                      </div>
                    )}
                    {secondaryDomainObj && (
                      <div className="bg-[#1c1714] p-2 rounded-sm border border-[#3d2e24]">
                        <strong className="text-[#e2d5c3] not-italic block font-sans font-semibold text-xs mb-0.5">
                          {secondaryDomainObj.name}:
                        </strong>
                        {Object.entries(secondaryDomainObj.grantedSpells)
                          .map(([lvl, sName]) => `Lvl ${lvl}: ${sName}`)
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Specialization / School / Bloodline / Patron
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Evocation, Sun Domain, Draconic Bloodline, Time Patron"
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-3 py-2 text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] text-sm font-serif"
              />
            </div>
          )}

          {/* Opposition Schools for Wizards */}
          {currentClassDef.allowsOppositionSchools && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
                Wizard Opposition Schools (Select up to 2)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SCHOOLS.map((school) => {
                  const isOpposed = oppositionSchools.includes(school);
                  return (
                    <button
                      key={school}
                      type="button"
                      onClick={() => toggleOppositionSchool(school)}
                      className={`px-2.5 py-1.5 rounded-sm text-xs font-serif flex items-center justify-between transition ${
                        isOpposed
                          ? "bg-[#2d241c] border-[#d4af37] text-[#d4af37]"
                          : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65] hover:border-[#d4af37]"
                      }`}
                    >
                      <span>{school}</span>
                      {isOpposed && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multiclassing Section */}
          <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#3d2e24] pb-2">
              <span className="font-serif font-bold text-xs text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Multiclass Spellcasting Entries</span>
              </span>
              <button
                type="button"
                onClick={handleAddMulticlass}
                className="flex items-center gap-1 text-[11px] bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] border border-[#d4af37] px-2.5 py-1 rounded-sm font-serif font-bold uppercase tracking-wider transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Multiclass</span>
              </button>
            </div>

            {multiclassEntries.length === 0 ? (
              <p className="text-xs text-[#8c7a65] italic font-serif">
                Single class character. Click "+ Add Multiclass" if this hero has levels in additional spellcasting classes (e.g. Cleric / Wizard).
              </p>
            ) : (
              <div className="space-y-3">
                {multiclassEntries.map((mc, idx) => {
                  const mcDef = CASTER_CLASSES[mc.casterClass];
                  const mcMod = calculateAbilityModifier(mc.abilityScore);

                  return (
                    <div key={mc.id} className="bg-[#1c1714] border border-[#3d2e24] p-3 rounded-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e2d5c3] font-serif uppercase tracking-wider">
                          Secondary Class #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMulticlass(idx)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[9px] uppercase text-[#8c7a65] mb-1">Class</label>
                          <select
                            value={mc.casterClass}
                            onChange={(e) => handleUpdateMulticlass(idx, { casterClass: e.target.value as CasterClass })}
                            className="w-full bg-[#14100e] border border-[#3d2e24] rounded-sm p-1.5 text-[#d4c5b3]"
                          >
                            {Object.values(CASTER_CLASSES).map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase text-[#8c7a65] mb-1">Level (1-20)</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={mc.level}
                            onChange={(e) => handleUpdateMulticlass(idx, { level: parseInt(e.target.value) || 1 })}
                            className="w-full bg-[#14100e] border border-[#3d2e24] rounded-sm p-1.5 text-[#d4c5b3] text-center font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase text-[#8c7a65] mb-1">
                            {mcDef.primaryAbility.toUpperCase()} Score
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={mc.abilityScore}
                              onChange={(e) => handleUpdateMulticlass(idx, { abilityScore: parseInt(e.target.value) || 10 })}
                              className="w-full bg-[#14100e] border border-[#3d2e24] rounded-sm p-1.5 text-[#d4c5b3] text-center font-mono"
                            />
                            <span className="text-[#d4af37] font-mono text-xs font-bold whitespace-nowrap">
                              ({mcMod >= 0 ? `+${mcMod}` : mcMod})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-[#8c7a65] mb-1">
                          Specialization / Focus
                        </label>
                        <input
                          type="text"
                          value={mc.specialization || ""}
                          onChange={(e) => handleUpdateMulticlass(idx, { specialization: e.target.value })}
                          placeholder="e.g. Transmutation, Life Mystery"
                          className="w-full bg-[#14100e] border border-[#3d2e24] rounded-sm p-1.5 text-[#d4c5b3]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3d2e24]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs uppercase font-serif tracking-wider text-[#8c7a65] hover:text-[#e2d5c3] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest px-6 py-2 rounded-sm border border-[#d4af37] shadow-lg transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save Hero Parameters</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


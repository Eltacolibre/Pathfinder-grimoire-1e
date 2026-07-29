import React, { useState } from "react";
import {
  CheckCircle2,
  Moon,
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  Wand2,
  Check,
  X,
  AlertCircle,
  Zap,
  Layers,
  Eye,
} from "lucide-react";
import {
  Character,
  Spell,
  PreparedSpellInstance,
  MetamagicFeat,
} from "../types";
import { CASTER_CLASSES } from "../data/classesData";
import { CLERIC_DOMAINS } from "../data/domainsData";
import { getDomainGrants, effectiveSpellLevel } from "../utils/domainSpells";
import {
  calculateSaveDC,
  getCharacterSlotsBreakdownForClass,
  calculateAbilityModifier,
  getAllCharacterClasses,
  getActiveClassEntry,
} from "../utils/pf1eUtils";

interface DailyPreparationViewProps {
  character: Character;
  allSpells: Spell[];
  onUpdateCharacter: (updated: Character) => void;
  onOpenSpellDetails: (spell: Spell) => void;
}

const METAMAGIC_OPTIONS: { feat: MetamagicFeat; levelAdjustment: number; desc: string }[] = [
  { feat: "Extend", levelAdjustment: 1, desc: "Doubles spell duration." },
  { feat: "Empower", levelAdjustment: 2, desc: "Increases variable numeric effects by 50%." },
  { feat: "Maximize", levelAdjustment: 3, desc: "All variable numeric effects deal maximum amount." },
  { feat: "Quicken", levelAdjustment: 4, desc: "Casting time reduced to swift action." },
  { feat: "Silent", levelAdjustment: 1, desc: "Cast without verbal components." },
  { feat: "Still", levelAdjustment: 1, desc: "Cast without somatic components." },
  { feat: "Reach", levelAdjustment: 1, desc: "Increases range category (Touch -> Close -> Med -> Long)." },
  { feat: "Selective", levelAdjustment: 1, desc: "Exclude targets equal to key ability mod from AOE." },
  { feat: "Persistent", levelAdjustment: 2, desc: "Target must roll saving throw twice and take worse." },
  { feat: "Heighten", levelAdjustment: 1, desc: "Increases effective spell level and DC." },
];

export const DailyPreparationView: React.FC<DailyPreparationViewProps> = ({
  character,
  allSpells,
  onUpdateCharacter,
  onOpenSpellDetails,
}) => {
  const allClassEntries = getAllCharacterClasses(character);
  const activeClass = getActiveClassEntry(character);
  const activeClassIdx = character.activeClassIndex ?? 0;
  const classDef = CASTER_CLASSES[activeClass.casterClass] || CASTER_CLASSES.wizard;
  const slotsBreakdown = getCharacterSlotsBreakdownForClass(activeClass);
  const spellMap = new Map<string, Spell>(allSpells.map((s) => [s.id, s]));

  // Modal for selecting spell to prepare into a slot
  const [preparingSlotLevel, setPreparingSlotLevel] = useState<number | null>(null);
  const [isSpecialtySlot, setIsSpecialtySlot] = useState<boolean>(false);
  const [selectedDomainName, setSelectedDomainName] = useState<string>("");
  const [selectedMetamagic, setSelectedMetamagic] = useState<MetamagicFeat[]>([]);
  const [domainFilter, setDomainFilter] = useState<"all" | "primary" | "secondary">("all");
  const [pickerSearch, setPickerSearch] = useState("");

  const isSpontaneous = classDef.castingType.includes("spontaneous");
  const isCleric = activeClass.casterClass === "cleric";

  const primaryDomainName = activeClass.specialization || "Primary Domain";
  const secondaryDomainName = activeClass.secondarySpecialization || "Secondary Domain";

  // Domain Objects lookup
  const primaryDomainObj = CLERIC_DOMAINS.find(
    (d) => d.name.toLowerCase() === primaryDomainName.toLowerCase() || d.id === primaryDomainName.toLowerCase()
  );
  const secondaryDomainObj = CLERIC_DOMAINS.find(
    (d) => d.name.toLowerCase() === secondaryDomainName.toLowerCase() || d.id === secondaryDomainName.toLowerCase()
  );

  // Metamagic raises the slot a spell needs, so it narrows what fits.
  const metamagicLevelAdjustment = selectedMetamagic.reduce(
    (sum, feat) =>
      sum + (METAMAGIC_OPTIONS.find((o) => o.feat === feat)?.levelAdjustment ?? 0),
    0,
  );

  // Highest spell level that still fits the slot once metamagic is added.
  const spellCeiling = (preparingSlotLevel ?? 0) - metamagicLevelAdjustment;

  // Domains grant their spells on top of the class list, and most of them are
  // not class spells at all, so they have to be merged into what can be
  // prepared — otherwise they never appear anywhere.
  const domainGrants = getDomainGrants(activeClass, allSpells);

  const knownSpells = (() => {
    const pool = new Map<string, Spell>();
    for (const id of character.knownSpellIds) {
      const s = spellMap.get(id);
      if (s) pool.set(s.id, s);
    }
    for (const grant of domainGrants.values()) pool.set(grant.spell.id, grant.spell);
    return [...pool.values()];
  })();

  const levelForCharacter = (spell: Spell): number | undefined =>
    effectiveSpellLevel(spell, activeClass, domainGrants);

  // What the preparation picker can currently offer for the open slot.
  const visiblePickerSpells = knownSpells.filter((spell) => {
    // A spell only fits a slot of its own level or higher, and metamagic
    // pushes it further up. Without this a 1st-level slot would offer
    // 9th-level spells.
    const baseLvl = levelForCharacter(spell);
    if (baseLvl === undefined) return false;
    if (baseLvl + metamagicLevelAdjustment > (preparingSlotLevel ?? 0)) return false;

    const q = pickerSearch.trim().toLowerCase();
    if (
      q &&
      !`${spell.name} ${spell.school} ${spell.shortDescription}`.toLowerCase().includes(q)
    ) {
      return false;
    }

    if (domainFilter === "primary" && primaryDomainObj) {
      return (
        primaryDomainObj.grantedSpells[preparingSlotLevel ?? 0]?.toLowerCase() ===
        spell.name.toLowerCase()
      );
    }
    if (domainFilter === "secondary" && secondaryDomainObj) {
      return (
        secondaryDomainObj.grantedSpells[preparingSlotLevel ?? 0]?.toLowerCase() ===
        spell.name.toLowerCase()
      );
    }
    return true;
  });

  // Helper to check if a spell belongs to primary or secondary domain
  const getSpellDomainTag = (spellName: string, level: number): string | null => {
    const grant = [...domainGrants.values()].find(
      (g) => g.spell.name.toLowerCase() === spellName.toLowerCase(),
    );
    if (grant && grant.level === level) return grant.domainName;
    return null;
  };

  // Cast or Expend a prepared spell slot
  const toggleCastPreparedSlot = (instanceId: string) => {
    const updatedPrepared = character.preparedSpells.map((p) => {
      if (p.id === instanceId) {
        return { ...p, isCast: !p.isCast };
      }
      return p;
    });
    onUpdateCharacter({ ...character, preparedSpells: updatedPrepared });
  };

  // Remove a prepared spell instance
  const removePreparedSlot = (instanceId: string) => {
    const updatedPrepared = character.preparedSpells.filter((p) => p.id !== instanceId);
    onUpdateCharacter({ ...character, preparedSpells: updatedPrepared });
  };

  // Add spell to prepared list
  const handleConfirmPrepare = (spell: Spell) => {
    if (preparingSlotLevel === null) return;

    const detectedDomain = getSpellDomainTag(spell.name, preparingSlotLevel) || selectedDomainName;

    const newInstance: PreparedSpellInstance = {
      id: `prep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spellId: spell.id,
      slotLevel: preparingSlotLevel,
      isDomainOrSpecialty: isSpecialtySlot || !!detectedDomain,
      domainName: detectedDomain || undefined,
      isCast: false,
      metamagic: selectedMetamagic.length > 0 ? [...selectedMetamagic] : undefined,
    };

    const updatedPrepared = [...character.preparedSpells, newInstance];
    onUpdateCharacter({ ...character, preparedSpells: updatedPrepared });

    // Reset picker state
    setPreparingSlotLevel(null);
    setIsSpecialtySlot(false);
    setSelectedDomainName("");
    setSelectedMetamagic([]);
    setDomainFilter("all");
    setPickerSearch("");
  };

  // Long Rest / Reset All Spells for new day
  // A new day refreshes expended slots but keeps the prepared list — most
  // casters re-prepare the same spells, so wiping it every morning is busywork.
  const handleNewDay = () => {
    const resetPrepared = character.preparedSpells.map((p) => ({ ...p, isCast: false }));
    onUpdateCharacter({
      ...character,
      preparedSpells: resetPrepared,
      spontaneousSlotsUsed: {},
    });
  };

  // Separate, deliberate action for actually starting the list over.
  const handleClearPrepared = () => {
    if (character.preparedSpells.length === 0) return;
    if (!confirm(`Clear all ${character.preparedSpells.length} prepared spells for ${character.name}? Slots stay available so you can prepare a fresh list.`)) return;
    onUpdateCharacter({
      ...character,
      preparedSpells: [],
      spontaneousSlotsUsed: {},
    });
  };

  // Spontaneous Cast Spell action
  const handleSpontaneousCast = (spellLevel: number) => {
    const currentUsed = character.spontaneousSlotsUsed[spellLevel] || 0;
    const maxForLevel = slotsBreakdown.find((s) => s.level === spellLevel)?.total || 0;

    if (currentUsed >= maxForLevel && spellLevel > 0) {
      alert(`No available Level ${spellLevel} spell slots remaining today! Take a Long Rest.`);
      return;
    }

    if (spellLevel === 0) return; // Cantrips are at-will

    onUpdateCharacter({
      ...character,
      spontaneousSlotsUsed: {
        ...character.spontaneousSlotsUsed,
        [spellLevel]: currentUsed + 1,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Multiclass Active Selector Bar (If Multiclassed) */}
      {allClassEntries.length > 1 && (
        <div className="bg-[#14100e] border border-[#d4af37]/60 rounded-lg p-3.5 shadow-xl flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#d4af37] uppercase tracking-wider whitespace-nowrap">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>Active Class:</span>
          </div>
          <div className="flex items-center gap-2">
            {allClassEntries.map((cls, idx) => {
              const clsDef = CASTER_CLASSES[cls.casterClass];
              const isActive = idx === activeClassIdx;
              const mod = calculateAbilityModifier(cls.abilityScore);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

              return (
                <button
                  key={cls.id + "_" + idx}
                  onClick={() => onUpdateCharacter({ ...character, activeClassIndex: idx })}
                  className={`px-3 py-1.5 rounded-sm font-serif text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
                    isActive
                      ? "bg-[#2d241c] border-[#d4af37] text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65] hover:text-[#e2d5c3] hover:border-[#8c7a65]"
                  }`}
                >
                  <span>{clsDef.name} (Lvl {cls.level})</span>
                  <span className="font-mono text-[10px] bg-[#14100e] px-1.5 py-0.5 rounded border border-[#3d2e24] text-[#e2d5c3]">
                    {clsDef.primaryAbility.toUpperCase()} {cls.abilityScore} ({modStr})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest & Header Actions Bar */}
      <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#e2d5c3] flex items-center gap-2 tracking-wide uppercase">
            <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />
            <span>Daily Preparation & Arcane Slots</span>
          </h2>
          <p className="text-xs text-[#8c7a65] mt-1 font-serif italic">
            {isSpontaneous
              ? `${classDef.name} casts spontaneously from known spells using daily slot pools.`
              : `${classDef.name} prepares specific spells into daily slots each morning.`}
          </p>
        </div>

        <div className="flex flex-wrap items-stretch gap-2 w-full sm:w-auto">
          <button
            onClick={handleNewDay}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest px-4 sm:px-5 py-2.5 rounded-sm border border-[#d4af37] shadow-lg transition"
            title="Rest for the night: expended slots refresh and your prepared list stays as it is"
          >
            <Moon className="w-4 h-4 shrink-0" />
            <span>New Day — Refresh Slots</span>
          </button>

          {!isSpontaneous && character.preparedSpells.length > 0 && (
            <button
              onClick={handleClearPrepared}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-[#1c1714] hover:bg-[#2d241c] text-[#8c7a65] hover:text-[#d4c5b3] font-serif font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-sm border border-[#3d2e24] transition"
              title="Empty the prepared list so you can build a different one"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Clear Prepared</span>
            </button>
          )}
        </div>
      </div>

      <p className="-mt-3 text-[11px] text-[#8c7a65] font-serif italic">
        A new day refreshes your slots and keeps the same prepared spells — use
        <strong className="text-[#d4c5b3]"> Clear Prepared</strong> only when you want to build a different list.
      </p>

      {/* Daily Spell Slots Summary Bar across levels */}
      <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl">
        <h3 className="font-serif font-bold text-xs text-[#d4af37] uppercase tracking-widest mb-3">
          Daily Spell Slots Capacity (Base + Bonus + Domain/Specialty)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center text-xs">
          {slotsBreakdown.map((s) => {
            const isAtWill = s.level === 0;
            const used = isSpontaneous
              ? character.spontaneousSlotsUsed[s.level] || 0
              : character.preparedSpells.filter((p) => p.slotLevel === s.level && p.isCast).length;

            const preparedCount = character.preparedSpells.filter(
              (p) => p.slotLevel === s.level
            ).length;

            return (
              <div
                key={s.level}
                className="bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 flex flex-col justify-between"
              >
                <div className="text-[#8c7a65] font-bold text-[10px] uppercase tracking-wider">
                  {s.level === 0 ? "Cantrips" : `Lvl ${s.level}`}
                </div>
                <div className="my-1 text-base font-bold text-[#d4af37] font-mono">
                  {/* Spontaneous casters really do have unlimited cantrips.
                      Prepared casters slot a fixed number of orisons and only
                      then cast them at will, so "∞" contradicted the count
                      shown underneath. */}
                  {isAtWill && isSpontaneous ? "∞" : `${s.total}`}
                </div>
                <div className="text-[10px] text-[#8c7a65] font-mono">
                  {isSpontaneous
                    ? isAtWill
                      ? "At-Will"
                      : `${used} / ${s.total} used`
                    : `${preparedCount} / ${s.total} prep`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main View Body */}
      {isSpontaneous ? (
        /* ==================== SPONTANEOUS CASTER VIEW ==================== */
        <div className="space-y-6">
          {slotsBreakdown.map((slotInfo) => {
            const level = slotInfo.level;
            const maxSlots = slotInfo.total;
            const usedSlots = character.spontaneousSlotsUsed[level] || 0;
            const remaining = Math.max(0, maxSlots - usedSlots);

            // Spells known of this level
            const levelKnownSpells = knownSpells.filter(
              (s) => levelForCharacter(s) === level
            );

            if (level > classDef.maxSpellLevel || (maxSlots === 0 && level > 0)) return null;

            return (
              <div
                key={level}
                className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl space-y-4"
              >
                {/* Level Title & Slot Pool Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#3d2e24] pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-lg text-[#e2d5c3] tracking-wide">
                      {level === 0 ? "Cantrips / Orisons (At-will)" : `Level ${level} Spells`}
                    </span>
                    <span className="text-xs text-[#d4af37] bg-[#2d241c] border border-[#3d2e24] px-2.5 py-0.5 font-bold font-mono">
                      Save DC: {calculateSaveDC(character, level)}
                    </span>
                  </div>

                  {level > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#8c7a65]">
                        Slots: <strong className="text-[#d4af37] font-mono">{remaining}</strong> / {maxSlots} Available
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: maxSlots }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full border ${
                              idx < usedSlots
                                ? "bg-[#2d241c] border-[#3d2e24]"
                                : "bg-[#d4af37] border-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                            }`}
                            title={idx < usedSlots ? "Slot Expended" : "Slot Available"}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Spells List */}
                {levelKnownSpells.length === 0 ? (
                  <p className="text-xs text-[#8c7a65] italic font-serif">
                    No level {level} spells known. Add spells from the Paizo library to your known list!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {levelKnownSpells.map((spell) => (
                      <div
                        key={spell.id}
                        className="bg-[#1c1714] border border-[#3d2e24] hover:border-[#d4af37] rounded-sm p-3 flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => onOpenSpellDetails(spell)}
                            className="font-serif font-bold text-sm text-[#e2d5c3] hover:text-[#d4af37] cursor-pointer truncate"
                          >
                            {spell.name}
                          </h4>
                          <p className="text-xs text-[#8c7a65] line-clamp-1 mt-0.5 font-serif italic">
                            {spell.school} • {spell.castingTime} • {spell.range}
                          </p>
                        </div>

                        {level > 0 && (
                          <button
                            onClick={() => handleSpontaneousCast(level)}
                            disabled={remaining <= 0}
                            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider border transition shrink-0 flex items-center gap-1.5 ${
                              remaining > 0
                                ? "bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] border-[#d4af37] shadow"
                                : "bg-[#14100e] text-[#5e4b36] border-[#2d241c] cursor-not-allowed"
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Cast</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== PREPARED CASTER VIEW ==================== */
        <div className="space-y-6">
          {slotsBreakdown.map((slotInfo) => {
            const level = slotInfo.level;
            const maxCapacity = slotInfo.total;

            // Get prepared spell instances for this level
            const levelPrepared = character.preparedSpells.filter(
              (p) => p.slotLevel === level
            );

            // Hide levels with no slots, but keep showing any that still hold
            // prepared spells — after a level change they would otherwise be
            // stranded somewhere the player cannot reach to remove them.
            if (
              level > classDef.maxSpellLevel ||
              (maxCapacity === 0 && level > 0 && levelPrepared.length === 0)
            ) {
              return null;
            }

            const saveDc = calculateSaveDC(character, level);

            return (
              <div
                key={level}
                className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl space-y-4"
              >
                {/* Level Title & Prepare Action */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#3d2e24] pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-lg text-[#e2d5c3] tracking-wide">
                      {level === 0 ? "Cantrips / Orisons" : `Level ${level} Prepared Slots`}
                    </span>
                    <span className="text-xs text-[#d4af37] bg-[#2d241c] border border-[#3d2e24] px-2.5 py-0.5 font-bold font-mono">
                      Save DC: {saveDc}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#8c7a65]">
                      Prepared: <strong className="text-[#d4af37] font-mono">{levelPrepared.length}</strong> / {maxCapacity} Slots
                    </span>

                    <button
                      onClick={() => {
                        setPreparingSlotLevel(level);
                        setIsSpecialtySlot(false);
                        setSelectedMetamagic([]);
                      }}
                      className="flex items-center gap-1.5 bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-sm border border-[#d4af37] transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Prepare Spell</span>
                    </button>
                  </div>
                </div>

                {/* Prepared Slots List */}
                {levelPrepared.length === 0 ? (
                  <div className="bg-[#1c1714] border border-dashed border-[#3d2e24] p-4 rounded-sm text-center text-xs text-[#8c7a65] font-serif italic">
                    No spells prepared in Level {level} slots for today. Click <strong className="text-[#d4af37] font-sans">+ Prepare Spell</strong> to assign a spell from your grimoire!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {levelPrepared.map((instance) => {
                      const spell: Spell | undefined = spellMap.get(instance.spellId);
                      if (!spell) return null;

                      return (
                        <div
                          key={instance.id}
                          className={`border rounded-sm p-3.5 flex items-start justify-between gap-3 transition ${
                            instance.isCast
                              ? "bg-[#14100e] border-[#2d241c] opacity-50 grayscale-[40%]"
                              : "bg-[#1c1714] border-[#3d2e24] hover:border-[#d4af37]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <h4
                                onClick={() => onOpenSpellDetails(spell)}
                                className={`font-serif font-bold text-sm cursor-pointer hover:underline ${
                                  instance.isCast
                                    ? "text-[#8c7a65] line-through"
                                    : "text-[#e2d5c3] hover:text-[#d4af37]"
                                }`}
                              >
                                {spell.name}
                              </h4>

                              {instance.domainName ? (
                                <span className="text-[10px] bg-[#2d241c] text-[#d4af37] px-1.5 py-0.2 border border-[#d4af37]/50 font-bold uppercase tracking-wider">
                                  [{instance.domainName}]
                                </span>
                              ) : instance.isDomainOrSpecialty ? (
                                <span className="text-[10px] bg-[#2d241c] text-[#d4af37] px-1.5 py-0.2 border border-[#3d2e24] font-bold uppercase">
                                  Domain / Specialty Slot
                                </span>
                              ) : null}

                              {instance.metamagic?.map((m) => (
                                <span
                                  key={m}
                                  className="text-[10px] bg-[#2d241c] text-[#d4c5b3] px-1.5 py-0.2 border border-[#3d2e24] font-mono"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>

                            <p className="text-xs text-[#8c7a65] line-clamp-1 font-serif italic">
                              {spell.school} • {spell.castingTime} • {spell.range} • DC {saveDc}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Cast Toggle Button */}
                            <button
                              onClick={() => toggleCastPreparedSlot(instance.id)}
                              className={`px-3 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border transition flex items-center gap-1 ${
                                instance.isCast
                                  ? "bg-[#14100e] border-[#3d2e24] text-[#5e4b36]"
                                  : "bg-[#2d241c] hover:bg-[#d4af37] border-[#d4af37] text-[#d4af37] hover:text-[#1a1614] shadow"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{instance.isCast ? "EXPENDED" : "CAST"}</span>
                            </button>

                            {/* Remove Slot */}
                            <button
                              onClick={() => removePreparedSlot(instance.id)}
                              className="p-1 text-[#8c7a65] hover:text-red-400 rounded hover:bg-[#2d241c] transition"
                              title="Unprepare spell"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Preparing a Spell into a specific level slot */}
      {preparingSlotLevel !== null && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#e2d5c3] uppercase tracking-wide">
                  Prepare Spell into Level {preparingSlotLevel} Slot
                </h3>
                <p className="text-xs text-[#8c7a65] font-serif italic">
                  Choose a spell from your grimoire to assign to this daily slot.
                </p>
              </div>

              <button
                onClick={() => setPreparingSlotLevel(null)}
                className="text-[#8c7a65] hover:text-[#e2d5c3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-[#d4c5b3]">
              {/* Metamagic Feat Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-2">
                  Apply Metamagic Feats (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {METAMAGIC_OPTIONS.map((opt) => {
                    const isSelected = selectedMetamagic.includes(opt.feat);
                    return (
                      <button
                        key={opt.feat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMetamagic(selectedMetamagic.filter((m) => m !== opt.feat));
                          } else {
                            setSelectedMetamagic([...selectedMetamagic, opt.feat]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-sm text-xs font-serif border transition ${
                          isSelected
                            ? "bg-[#d4af37] text-[#1a1614] border-[#d4af37] font-bold"
                            : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65] hover:text-[#d4c5b3]"
                        }`}
                        title={`${opt.desc} (+${opt.levelAdjustment} spell level)`}
                      >
                        {opt.feat} (+{opt.levelAdjustment})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specialty / Domain Slot Controls */}
              {classDef.hasSpecialtySlot && (
                <div className="bg-[#14100e] p-3 rounded-sm border border-[#3d2e24] space-y-2">
                  <label className="flex items-center gap-2 text-xs text-[#d4c5b3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpecialtySlot}
                      onChange={(e) => setIsSpecialtySlot(e.target.checked)}
                      className="accent-[#d4af37]"
                    />
                    <span>
                      Assign as <strong className="text-[#d4af37]">{classDef.specialtySlotLabel || "Domain Slot"}</strong>
                    </span>
                  </label>

                  {isCleric && isSpecialtySlot && (
                    <div className="pt-2 border-t border-[#3d2e24]">
                      <label className="block text-[10px] font-bold uppercase text-[#8c7a65] tracking-wider mb-1">
                        Select Specific Cleric Domain for this Slot:
                      </label>
                      <select
                        value={selectedDomainName}
                        onChange={(e) => setSelectedDomainName(e.target.value)}
                        className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1 text-[#d4c5b3] text-xs font-serif"
                      >
                        <option value="">-- General Domain Slot --</option>
                        {primaryDomainName && <option value={primaryDomainName}>{primaryDomainName} (Primary)</option>}
                        {secondaryDomainName && <option value={secondaryDomainName}>{secondaryDomainName} (Secondary)</option>}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Available Spells to Prepare */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider">
                    Select Spell from Grimoire
                  </label>

                  {isCleric && (primaryDomainObj || secondaryDomainObj) && (
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDomainFilter("all")}
                        className={`px-2 py-0.5 rounded-sm font-serif border ${
                          domainFilter === "all"
                            ? "bg-[#d4af37] text-[#1a1614] border-[#d4af37] font-bold"
                            : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65]"
                        }`}
                      >
                        All Spells
                      </button>
                      {primaryDomainObj && (
                        <button
                          type="button"
                          onClick={() => setDomainFilter("primary")}
                          className={`px-2 py-0.5 rounded-sm font-serif border ${
                            domainFilter === "primary"
                              ? "bg-[#d4af37] text-[#1a1614] border-[#d4af37] font-bold"
                              : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65]"
                          }`}
                        >
                          {primaryDomainObj.name}
                        </button>
                      )}
                      {secondaryDomainObj && (
                        <button
                          type="button"
                          onClick={() => setDomainFilter("secondary")}
                          className={`px-2 py-0.5 rounded-sm font-serif border ${
                            domainFilter === "secondary"
                              ? "bg-[#d4af37] text-[#1a1614] border-[#d4af37] font-bold"
                              : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65]"
                          }`}
                        >
                          {secondaryDomainObj.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* With a full class list running to four figures, searching is
                    the only practical way to find a spell on a phone. */}
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search by name, school or effect..."
                    className="w-full bg-[#14100e] border border-[#3d2e24] rounded-sm px-3 py-2 text-sm text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-serif"
                  />
                  <p className="text-[10px] text-[#8c7a65] font-serif italic">
                    {metamagicLevelAdjustment === 0
                      ? `Showing spells of level ${preparingSlotLevel ?? 0} or lower.`
                      : spellCeiling < 0
                        ? `Metamagic +${metamagicLevelAdjustment} needs a level ${metamagicLevelAdjustment + 1} slot or higher — nothing fits a level ${preparingSlotLevel ?? 0} slot.`
                        : `Metamagic +${metamagicLevelAdjustment}: showing spells of level ${spellCeiling} or lower, which still fit this level ${preparingSlotLevel ?? 0} slot.`}
                  </p>
                </div>

                {knownSpells.length === 0 ? (
                  <p className="text-xs text-[#8c7a65] italic p-4 bg-[#14100e] rounded-sm font-serif">
                    Your grimoire is currently empty! Add spells from the Paizo Spell Database first.
                  </p>
                ) : (
                  <div className="max-h-[45vh] sm:max-h-72 overflow-y-auto space-y-2 pr-1">
                    {visiblePickerSpells.length === 0 && (
                      <p className="text-xs text-[#8c7a65] italic p-4 bg-[#14100e] rounded-sm font-serif">
                        {spellCeiling < 0
                          ? `No spell can absorb +${metamagicLevelAdjustment} levels of metamagic in a level ${preparingSlotLevel ?? 0} slot. Drop a feat or use a higher slot.`
                          : pickerSearch.trim()
                            ? `Nothing matches "${pickerSearch.trim()}" at level ${spellCeiling} or lower.`
                            : "No spells available for this slot yet."}
                      </p>
                    )}
                    {visiblePickerSpells
                      .map((spell) => {
                        const baseLvl = levelForCharacter(spell) ?? 0;
                        const domainTag = getSpellDomainTag(spell.name, preparingSlotLevel ?? 0);

                        return (
                          <div
                            key={spell.id}
                            className="bg-[#14100e] border border-[#3d2e24] hover:border-[#d4af37] rounded-sm p-3 flex items-start justify-between gap-2 transition group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <h4 className="font-serif font-bold text-sm text-[#e2d5c3]">
                                  {spell.name}
                                </h4>
                                {domainTag && (
                                  <span className="text-[9px] bg-[#2d241c] text-[#d4af37] border border-[#d4af37]/40 px-1.5 py-0.2 font-mono uppercase">
                                    {domainTag}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#8c7a65] font-serif italic mt-0.5">
                                Base Level: {baseLvl} • {spell.school} • {spell.range}
                              </p>
                              {/* The summary makes the choice readable without
                                  leaving the picker; the eye opens full rules. */}
                              <p className="text-[11px] text-[#8c7a65] font-serif mt-1 leading-snug">
                                {spell.shortDescription}
                              </p>
                              <p className="text-[10px] text-[#6b5c4c] font-mono mt-1">
                                {spell.castingTime} • {spell.components.join(", ")} • {spell.duration}
                                {spell.savingThrow && spell.savingThrow !== "None"
                                  ? ` • Save: ${spell.savingThrow}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-col items-stretch gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenSpellDetails(spell)}
                                title={`Read the full rules text for ${spell.name}`}
                                className="flex items-center justify-center gap-1 bg-[#1c1714] hover:bg-[#2d241c] text-[#8c7a65] hover:text-[#d4af37] border border-[#3d2e24] hover:border-[#d4af37]/60 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmPrepare(spell)}
                                className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] border border-[#d4af37] px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider transition"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

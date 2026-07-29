import React, { useState } from "react";
import { BookOpen, Plus, Sparkles, Search, CheckCircle2 } from "lucide-react";
import { Character, Spell, FilterOptions } from "../types";
import { SpellFilterBar } from "./SpellFilterBar";
import { SpellCard } from "./SpellCard";
import { CLERIC_DOMAINS } from "../data/domainsData";
import { filterSpellsList } from "../utils/pf1eUtils";

interface SpellbookViewProps {
  character: Character;
  allSpells: Spell[];
  onToggleSpellbook: (spellId: string) => void;
  onOpenSpellDetails: (spell: Spell) => void;
  onPrepareSpell: (spell: Spell) => void;
  onNavigateToDatabase: () => void;
  onUpdateCharacter?: (updated: Character) => void;
}

export const SpellbookView: React.FC<SpellbookViewProps> = ({
  character,
  allSpells,
  onToggleSpellbook,
  onOpenSpellDetails,
  onPrepareSpell,
  onNavigateToDatabase,
  onUpdateCharacter,
}) => {
  const [filter, setFilter] = useState<FilterOptions>({
    search: "",
    classFilter: character.casterClass,
    levelFilter: "all",
    schoolFilter: "all",
    componentFilter: [],
    descriptorFilter: "all",
    sourceFilter: "all",
    onlyCharacterKnown: true,
  });

  const [inscribedBannerMsg, setInscribedBannerMsg] = useState<string | null>(null);

  const knownSpells = allSpells.filter((s) => character.knownSpellIds.includes(s.id));

  const filteredSpells = filterSpellsList(knownSpells, {
    ...filter,
    onlyCharacterKnown: false, // already filtered to knownSpells
  });

  const isCleric = character.casterClass === "cleric";

  // Auto-inscribe all granted domain spells into character grimoire
  const handleAutoInscribeDomainSpells = () => {
    if (!onUpdateCharacter) return;

    const primarySpec = character.specialization || "";
    const secondarySpec = character.secondarySpecialization || "";

    const primaryObj = CLERIC_DOMAINS.find(
      (d) => d.name.toLowerCase() === primarySpec.toLowerCase() || d.id === primarySpec.toLowerCase()
    );
    const secondaryObj = CLERIC_DOMAINS.find(
      (d) => d.name.toLowerCase() === secondarySpec.toLowerCase() || d.id === secondarySpec.toLowerCase()
    );

    const targetSpellNames = new Set<string>();
    if (primaryObj) {
      Object.values(primaryObj.grantedSpells).forEach((sName) => targetSpellNames.add(sName.toLowerCase()));
    }
    if (secondaryObj) {
      Object.values(secondaryObj.grantedSpells).forEach((sName) => targetSpellNames.add(sName.toLowerCase()));
    }

    if (targetSpellNames.size === 0) {
      setInscribedBannerMsg("No domain spell matches found for current character specialization.");
      return;
    }

    // Match with allSpells database
    const newSpellIdsToAdd: string[] = [];
    allSpells.forEach((s) => {
      if (targetSpellNames.has(s.name.toLowerCase()) && !character.knownSpellIds.includes(s.id)) {
        newSpellIdsToAdd.push(s.id);
      }
    });

    if (newSpellIdsToAdd.length === 0) {
      setInscribedBannerMsg("All granted domain spells are already inscribed in your grimoire!");
    } else {
      const updatedChar: Character = {
        ...character,
        knownSpellIds: [...character.knownSpellIds, ...newSpellIdsToAdd],
      };
      onUpdateCharacter(updatedChar);
      setInscribedBannerMsg(`Successfully inscribed ${newSpellIdsToAdd.length} granted domain spells into Grimoire!`);
    }

    setTimeout(() => setInscribedBannerMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#e2d5c3] tracking-wide uppercase">
              {character.name}&apos;s Personal Grimoire
            </h2>
            <p className="text-xs text-[#8c7a65] mt-0.5 font-serif italic">
              Contains <strong className="text-[#d4af37] font-mono">{character.knownSpellIds.length}</strong> inscribed spells in spellbook / known list.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCleric && onUpdateCharacter && (
            <button
              onClick={handleAutoInscribeDomainSpells}
              className="flex items-center gap-2 bg-[#1c1714] hover:bg-[#2d241c] text-[#d4af37] font-serif font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-sm border border-[#d4af37]/60 transition shadow"
              title="Automatically add all spells granted by your 2 Cleric Domains into your grimoire"
            >
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Auto-Inscribe Domain Spells</span>
            </button>
          )}

          <button
            onClick={onNavigateToDatabase}
            className="flex items-center gap-2 bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-sm border border-[#d4af37] shadow transition"
          >
            <Search className="w-4 h-4" />
            <span>+ Find Spells in Paizo Library</span>
          </button>
        </div>
      </div>

      {inscribedBannerMsg && (
        <div className="bg-[#1a251b] border border-green-700/60 p-3 rounded-sm flex items-center gap-2 text-green-300 text-xs font-serif shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{inscribedBannerMsg}</span>
        </div>
      )}

      {/* Filter Controls */}
      <SpellFilterBar filter={filter} onChangeFilter={setFilter} />

      {/* Spells Grid */}
      {filteredSpells.length === 0 ? (
        <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-[#8c7a65]/40 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#e2d5c3] uppercase tracking-wide">
            No Spells Found in Grimoire
          </h3>
          <p className="text-xs text-[#8c7a65] max-w-md mx-auto font-serif italic">
            {character.knownSpellIds.length === 0
              ? "Your character doesn't have any spells saved in their spellbook yet."
              : "No spells matched your current filter criteria."}
          </p>
          <button
            onClick={onNavigateToDatabase}
            className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm inline-flex items-center gap-2 border border-[#d4af37] transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Browse All Paizo Spells</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpells.map((spell) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              character={character}
              isInSpellbook={true}
              onToggleSpellbook={onToggleSpellbook}
              onOpenDetails={onOpenSpellDetails}
              onPrepareSpell={onPrepareSpell}
            />
          ))}
        </div>
      )}
    </div>
  );
};

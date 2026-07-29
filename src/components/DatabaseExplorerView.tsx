import React, { useState } from "react";
import { Search, Sparkles, BookOpen, Layers } from "lucide-react";
import { Character, Spell, FilterOptions } from "../types";
import { SpellFilterBar } from "./SpellFilterBar";
import { SpellCard } from "./SpellCard";
import { filterSpellsList, knowsEntireSpellList } from "../utils/pf1eUtils";

interface DatabaseExplorerViewProps {
  character: Character | null;
  allSpells: Spell[];
  onToggleSpellbook: (spellId: string) => void;
  onOpenSpellDetails: (spell: Spell) => void;
  onPrepareSpell?: (spell: Spell) => void;
}

export const DatabaseExplorerView: React.FC<DatabaseExplorerViewProps> = ({
  character,
  allSpells,
  onToggleSpellbook,
  onOpenSpellDetails,
  onPrepareSpell,
}) => {
  const [filter, setFilter] = useState<FilterOptions>({
    search: "",
    classFilter: character?.casterClass || "all",
    levelFilter: "all",
    schoolFilter: "all",
    componentFilter: [],
    descriptorFilter: "all",
    sourceFilter: "all",
    onlyCharacterKnown: false,
  });

  const filteredSpells = filterSpellsList(allSpells, {
    ...filter,
    knownSpellIds: character?.knownSpellIds,
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
            <Search className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#e2d5c3] tracking-wide uppercase">
              Paizo Pathfinder 1st Edition Archives
            </h2>
            <p className="text-xs text-[#8c7a65] mt-0.5 font-serif italic">
              First-party Core, APG, Ultimate Magic, Ultimate Combat & Occult Adventures spells.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#d4c5b3] bg-[#1c1714] px-3.5 py-1.5 rounded-sm border border-[#3d2e24] font-mono">
          Showing <strong className="text-[#d4af37]">{filteredSpells.length}</strong> / {allSpells.length} Spells
        </div>
      </div>

      {/* Filter Bar */}
      <SpellFilterBar
        filter={filter}
        onChangeFilter={setFilter}
        showKnownToggle={!!character}
      />

      {/* Grid of Spells */}
      {filteredSpells.length === 0 ? (
        <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-12 text-center space-y-3">
          <Search className="w-12 h-12 text-[#8c7a65]/40 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#e2d5c3] uppercase tracking-wide">No Spells Found</h3>
          <p className="text-xs text-[#8c7a65] font-serif italic max-w-md mx-auto">
            No Paizo spells match your active search terms or class/level filters. Try clearing your filters!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpells.map((spell) => {
            // Full-list casters have every spell on their list available, so
            // treat those as already "in book" and hide the add/remove toggle.
            const fullListCaster = character ? knowsEntireSpellList(character) : false;
            const isInBook = !character
              ? false
              : fullListCaster
                ? spell.classes[character.casterClass] !== undefined
                : character.knownSpellIds.includes(spell.id);
            return (
              <SpellCard
                key={spell.id}
                spell={spell}
                character={character}
                isInSpellbook={isInBook}
                canToggleSpellbook={!fullListCaster}
                onToggleSpellbook={onToggleSpellbook}
                onOpenDetails={onOpenSpellDetails}
                onPrepareSpell={onPrepareSpell}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from "react";
import {
  BookOpen,
  Sparkles,
  PlusCircle,
  Download,
  Bot,
  Layers,
  Search,
  CheckCircle2,
  Trash2,
  Settings,
  Dices,
} from "lucide-react";
import { Character } from "../types";
import { CASTER_CLASSES } from "../data/classesData";
import { calculateAbilityModifier } from "../utils/pf1eUtils";

interface HeaderProps {
  characters: Character[];
  activeCharacter: Character | null;
  onSelectCharacter: (id: string) => void;
  onOpenNewCharacter: () => void;
  onOpenEditCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
  onExportPDF: () => void;
  onOpenAiAssistant: () => void;
  onOpenCustomSpell: () => void;
  onOpenCalculator: () => void;
  activeTab: "daily" | "spellbook" | "database";
  onChangeTab: (tab: "daily" | "spellbook" | "database") => void;
}

export const Header: React.FC<HeaderProps> = ({
  characters,
  activeCharacter,
  onSelectCharacter,
  onOpenNewCharacter,
  onOpenEditCharacter,
  onDeleteCharacter,
  onExportPDF,
  onOpenAiAssistant,
  onOpenCustomSpell,
  onOpenCalculator,
  activeTab,
  onChangeTab,
}) => {
  const activeClassDef = activeCharacter
    ? CASTER_CLASSES[activeCharacter.casterClass]
    : null;
  const mod = activeCharacter
    ? calculateAbilityModifier(activeCharacter.abilityScore)
    : 0;
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <header className="bg-[#1a1614] border-b border-[#3d2e24] text-[#d4c5b3] sticky top-0 z-30 shadow-xl backdrop-blur-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#e2d5c3] uppercase flex items-center gap-2">
              Pathfinder 1e <span className="text-[#d4af37] text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm bg-[#2d241c] border border-[#3d2e24]">Grimoire</span>
            </h1>
            <p className="text-xs text-[#8c7a65] italic hidden sm:block mt-0.5">
              Arcane & Divine Spellbook • Daily Preparation System
            </p>
          </div>
        </div>

        {/* Character Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Character Dropdown */}
          <div className="flex items-center gap-1 bg-[#14100e] border border-[#3d2e24] rounded-sm p-1">
            <select
              value={activeCharacter?.id || ""}
              onChange={(e) => {
                if (e.target.value === "__NEW__") {
                  onOpenNewCharacter();
                } else {
                  onSelectCharacter(e.target.value);
                }
              }}
              className="bg-transparent text-[#e2d5c3] font-serif text-xs font-semibold px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1614] text-[#d4c5b3]">
                  {c.name} ({CASTER_CLASSES[c.casterClass]?.name || c.casterClass} Lvl {c.level})
                </option>
              ))}
              <option value="__NEW__" className="bg-[#1a1614] text-[#d4af37] font-bold">
                + Create New Character...
              </option>
            </select>

            {activeCharacter && (
              <>
                <button
                  onClick={onOpenEditCharacter}
                  title="Edit Character Settings"
                  className="p-1 text-[#8c7a65] hover:text-[#d4af37] rounded hover:bg-[#2d241c] transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteCharacter(activeCharacter.id)}
                  title="Delete Character"
                  className="p-1 text-[#8c7a65] hover:text-red-400 rounded hover:bg-[#2d241c] transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={onOpenNewCharacter}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37] hover:border-[#d4af37]/50 text-xs font-bold uppercase tracking-wider transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden md:inline">New Hero</span>
          </button>

          {activeCharacter && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#d4af37] bg-[#2d241c] text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:bg-[#d4af37] hover:text-[#1a1614] transition-colors shadow-sm"
              title="Export Printable PDF Spell Sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}

          <button
            onClick={onOpenCustomSpell}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37] text-xs font-bold uppercase tracking-wider transition"
            title="Create Custom / Homebrew Spell"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden lg:inline">+ Homebrew</span>
          </button>

          {activeCharacter && (
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37] hover:border-[#d4af37]/60 text-xs font-bold uppercase tracking-wider transition"
              title="Open Pathfinder 1e Tactical Concentration & Save DC Calculator"
            >
              <Dices className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden xl:inline">Tactical Calc</span>
            </button>
          )}

          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#d4af37]/60 bg-[#2d241c] text-[#d4af37] text-xs font-bold uppercase tracking-wider hover:bg-[#d4af37]/20 transition shadow-[0_0_10px_rgba(212,175,55,0.15)]"
            title="Ask AI Rules Consultant & Spell Recommender"
          >
            <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>AI Lore Advisor</span>
          </button>

          <a
            href="https://ko-fi.com/bagquest"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ff5e5b]/70 bg-[#2d1b1b] text-[#ff8080] hover:text-white hover:bg-[#ff5e5b] text-xs font-bold uppercase tracking-wider transition shadow"
            title="Support this project on Ko-Fi"
          >
            <span className="text-sm">☕</span>
            <span>Tip on Ko-Fi</span>
          </a>
        </div>
      </div>

      {/* Active Character Subbar */}
      {activeCharacter && activeClassDef && (
        <div className="bg-[#14100e] border-t border-[#3d2e24] py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs text-[#8c7a65] gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-serif font-bold text-[#e2d5c3] text-sm tracking-wide">
                {activeCharacter.name}
              </span>
              <span className="text-[#8c7a65] italic">
                {activeClassDef.name} Level {activeCharacter.level}
              </span>
              <span className="text-[#d4af37] bg-[#2d241c] px-2 py-0.5 border border-[#3d2e24] font-mono text-[11px]">
                {activeCharacter.primaryAbility.toUpperCase()}: {activeCharacter.abilityScore} ({modStr})
              </span>
              {activeCharacter.specialization && (
                <span className="text-[#8c7a65]">
                  {activeCharacter.casterClass === "cleric" ? "Domains: " : "Focus: "}
                  <span className="text-[#d4c5b3] font-serif">
                    {activeCharacter.specialization}
                    {activeCharacter.secondarySpecialization ? ` & ${activeCharacter.secondarySpecialization}` : ""}
                  </span>
                </span>
              )}
            </div>

            <div className="text-[#8c7a65] flex items-center gap-4 text-[11px] uppercase tracking-wider">
              <span>Casting: <strong className="text-[#d4c5b3] font-serif capitalize">{activeClassDef.castingType.replace("-", " ")}</strong></span>
              <span>Known: <strong className="text-[#d4af37] font-mono">{activeCharacter.knownSpellIds.length}</strong></span>
              <span>Prepared: <strong className="text-[#d4af37] font-mono">{activeCharacter.preparedSpells.length}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-2 sm:space-x-6 border-t border-[#3d2e24] pt-2 pb-0.5">
          <button
            onClick={() => onChangeTab("daily")}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-serif font-bold uppercase tracking-widest border-b-2 transition ${
              activeTab === "daily"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
            <span>Daily Preparation & Slots</span>
          </button>

          <button
            onClick={() => onChangeTab("spellbook")}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-serif font-bold uppercase tracking-widest border-b-2 transition ${
              activeTab === "spellbook"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span>Grimoire ({activeCharacter?.knownSpellIds.length || 0})</span>
          </button>

          <button
            onClick={() => onChangeTab("database")}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-serif font-bold uppercase tracking-widest border-b-2 transition ${
              activeTab === "database"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <Search className="w-4 h-4 text-[#d4af37]" />
            <span>Paizo Archives</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

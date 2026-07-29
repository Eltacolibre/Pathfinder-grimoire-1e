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

// Shared shape for the quick-action buttons. On phones they share the row
// evenly (`flex-1`) so icons line up; from `lg` they size to their labels.
const ACTION_BTN =
  "flex flex-1 lg:flex-none items-center justify-center gap-1.5 px-2 sm:px-3 py-2 lg:py-1.5 border text-xs font-bold uppercase tracking-wider transition";

interface HeaderProps {
  characters: Character[];
  activeCharacter: Character | null;
  onSelectCharacter: (id: string) => void;
  onOpenNewCharacter: () => void;
  onOpenEditCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
  onExportPDF: () => void;
  onOpenExportModal: () => void;
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
  onOpenExportModal,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col lg:flex-row lg:flex-wrap lg:items-center justify-between gap-2.5 sm:gap-4">
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
        <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-2 lg:gap-3">
          {/* Character Dropdown */}
          <div className="flex items-center gap-1 bg-[#14100e] border border-[#3d2e24] rounded-sm p-1 w-full lg:w-auto">
            <select
              value={activeCharacter?.id || ""}
              onChange={(e) => {
                if (e.target.value === "__NEW__") {
                  onOpenNewCharacter();
                } else {
                  onSelectCharacter(e.target.value);
                }
              }}
              className="flex-1 min-w-0 bg-transparent text-[#e2d5c3] font-serif text-xs font-semibold px-2 py-1 rounded focus:outline-none cursor-pointer"
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

          {/* Action Buttons. `lg:contents` dissolves this wrapper on desktop so
              the buttons rejoin the parent row exactly as before. */}
          <div className="flex items-stretch gap-1.5 lg:contents">
          <button
            onClick={onOpenNewCharacter}
            className={`${ACTION_BTN} border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37] hover:border-[#d4af37]/50`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden md:inline">New Hero</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className={`${ACTION_BTN} border-[#d4af37] bg-[#2d241c] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1a1614] shadow-sm`}
            title="Export PDF, Data Backup, or Share"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export &amp; Backup</span>
          </button>

          <button
            onClick={onOpenCustomSpell}
            className={`${ACTION_BTN} border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37]`}
            title="Create Custom / Homebrew Spell"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden lg:inline">+ Homebrew</span>
          </button>

          {activeCharacter && (
            <button
              onClick={onOpenCalculator}
              className={`${ACTION_BTN} border-[#3d2e24] bg-[#2d241c] text-[#d4c5b3] hover:text-[#d4af37] hover:border-[#d4af37]/60`}
              title="Open Pathfinder 1e Tactical Concentration & Save DC Calculator"
            >
              <Dices className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden xl:inline">Tactical Calc</span>
            </button>
          )}

          <button
            onClick={onOpenAiAssistant}
            className={`${ACTION_BTN} border-[#d4af37]/60 bg-[#2d241c] text-[#d4af37] hover:bg-[#d4af37]/20 shadow-[0_0_10px_rgba(212,175,55,0.15)]`}
            title="Ask AI Rules Consultant & Spell Recommender"
          >
            <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">AI Lore Advisor</span>
          </button>

          <a
            href="https://ko-fi.com/bagquest"
            target="_blank"
            rel="noopener noreferrer"
            className={`${ACTION_BTN} border-[#ff5e5b]/70 bg-[#2d1b1b] text-[#ff8080] hover:text-white hover:bg-[#ff5e5b] shadow`}
            title="Support this project on Ko-Fi"
          >
            <span className="text-sm">☕</span>
            <span className="hidden sm:inline">Tip on Ko-Fi</span>
          </a>
          </div>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <nav className="flex gap-0.5 sm:gap-6 border-t border-[#3d2e24] pt-2 pb-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => onChangeTab("daily")}
            className={`flex shrink-0 items-center gap-1 sm:gap-2 whitespace-nowrap px-1.5 sm:px-4 py-2 text-[11px] sm:text-sm font-serif font-bold uppercase tracking-wider sm:tracking-widest border-b-2 transition ${
              activeTab === "daily"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
            <span className="sm:hidden">Prepare</span>
            <span className="hidden sm:inline">Daily Preparation &amp; Slots</span>
          </button>

          <button
            onClick={() => onChangeTab("spellbook")}
            className={`flex shrink-0 items-center gap-1 sm:gap-2 whitespace-nowrap px-1.5 sm:px-4 py-2 text-[11px] sm:text-sm font-serif font-bold uppercase tracking-wider sm:tracking-widest border-b-2 transition ${
              activeTab === "spellbook"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span className="sm:hidden">Spells</span>
            <span className="hidden sm:inline">Grimoire ({activeCharacter?.knownSpellIds.length || 0})</span>
          </button>

          <button
            onClick={() => onChangeTab("database")}
            className={`flex shrink-0 items-center gap-1 sm:gap-2 whitespace-nowrap px-1.5 sm:px-4 py-2 text-[11px] sm:text-sm font-serif font-bold uppercase tracking-wider sm:tracking-widest border-b-2 transition ${
              activeTab === "database"
                ? "border-[#d4af37] text-[#d4af37] bg-[#2d241c]/40"
                : "border-transparent text-[#8c7a65] hover:text-[#d4c5b3] hover:border-[#3d2e24]"
            }`}
          >
            <Search className="w-4 h-4 text-[#d4af37]" />
            <span className="sm:hidden">Archives</span>
            <span className="hidden sm:inline">Paizo Archives</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-serif font-bold uppercase tracking-widest border-b-2 border-transparent text-[#d4af37] hover:text-[#e2d5c3] hover:border-[#d4af37] transition ml-auto"
            title="Export PDF, Data Backup, or Share"
          >
            <Download className="w-4 h-4 text-[#d4af37]" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export &amp; Share</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

import React from "react";
import { BookOpen, Plus, Check, Eye, Sparkles } from "lucide-react";
import { Spell, Character } from "../types";
import { CASTER_CLASSES } from "../data/classesData";
import { calculateSaveDC } from "../utils/pf1eUtils";

interface SpellCardProps {
  spell: Spell;
  character: Character | null;
  isInSpellbook: boolean;
  onToggleSpellbook: (spellId: string) => void;
  onOpenDetails: (spell: Spell) => void;
  onPrepareSpell?: (spell: Spell) => void;
}

export const SpellCard: React.FC<SpellCardProps> = ({
  spell,
  character,
  isInSpellbook,
  onToggleSpellbook,
  onOpenDetails,
  onPrepareSpell,
}) => {
  const activeClass = character?.casterClass || "wizard";
  const spellLevel = spell.classes[activeClass];
  const saveDc = character && spellLevel !== undefined ? calculateSaveDC(character, spellLevel) : null;

  return (
    <div className={`bg-[#1a1614] border hover:border-[#d4af37] rounded-sm p-4.5 shadow-xl flex flex-col justify-between transition-all duration-200 group relative overflow-hidden ${
      isInSpellbook ? "border-[#3d2e24]" : "border-[#2d241c] opacity-90"
    }`}>
      {/* Left indicator stripe if in spellbook */}
      {isInSpellbook && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d4af37]"></div>
      )}

      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3
              onClick={() => onOpenDetails(spell)}
              className="font-serif font-bold text-base text-[#e2d5c3] group-hover:text-[#d4af37] transition cursor-pointer leading-snug"
            >
              {spell.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
              <span className="bg-[#2d241c] text-[#d4af37] border border-[#3d2e24] px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                {spell.school}
              </span>
              {spellLevel !== undefined && (
                <span className="bg-[#14100e] text-[#8c7a65] border border-[#2d241c] px-2 py-0.5 text-[10px] font-mono">
                  {spellLevel === 0 ? "Cantrip" : `Level ${spellLevel}`}
                </span>
              )}
              <span className="text-[#5e4b36] text-[10px] font-mono">
                {spell.components.join(", ")}
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenDetails(spell)}
            className="p-1.5 text-[#8c7a65] hover:text-[#d4af37] hover:bg-[#2d241c] rounded transition shrink-0"
            title="Read Full Spell Details & Arcane Rules"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Stat Badges Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-[#8c7a65] bg-[#14100e] p-2.5 rounded-sm border border-[#2d241c] my-3">
          <div>
            <span className="text-[#5e4b36] font-bold uppercase text-[10px]">Casting: </span>
            <span className="text-[#d4c5b3] text-[11px] font-serif">{spell.castingTime}</span>
          </div>
          <div>
            <span className="text-[#5e4b36] font-bold uppercase text-[10px]">Range: </span>
            <span className="text-[#d4c5b3] text-[11px] font-serif">{spell.range}</span>
          </div>
          <div>
            <span className="text-[#5e4b36] font-bold uppercase text-[10px]">Save: </span>
            <span className="text-[#d4c5b3] text-[11px] font-serif">{spell.savingThrow}</span>
          </div>
          <div>
            <span className="text-[#5e4b36] font-bold uppercase text-[10px]">DC / SR: </span>
            <span className="text-[#d4af37] font-bold font-mono text-[11px]">
              {saveDc ? `DC ${saveDc}` : "-"} / {spell.spellResistance}
            </span>
          </div>
        </div>

        {/* Short Summary */}
        <p className="text-xs text-[#8c7a65] line-clamp-2 leading-relaxed mb-4 italic font-serif">
          {spell.shortDescription}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-[#3d2e24] flex items-center justify-between gap-2">
        {/* Toggle Known / Spellbook */}
        <button
          onClick={() => onToggleSpellbook(spell.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider border transition ${
            isInSpellbook
              ? "bg-[#2d241c] border-[#d4af37]/60 text-[#d4af37]"
              : "bg-[#14100e] border-[#3d2e24] text-[#8c7a65] hover:border-[#d4af37] hover:text-[#d4c5b3]"
          }`}
        >
          {isInSpellbook ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>In Grimoire</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>+ Add to Book</span>
            </>
          )}
        </button>

        {/* Prepare Button if character present & spell in book */}
        {character && isInSpellbook && onPrepareSpell && (
          <button
            onClick={() => onPrepareSpell(spell)}
            className="flex items-center gap-1.5 bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] px-3.5 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-widest border border-[#d4af37] transition shadow-sm"
            title="Prepare into today's spell slots"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prepare</span>
          </button>
        )}
      </div>
    </div>
  );
};

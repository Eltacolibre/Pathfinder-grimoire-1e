import React from "react";
import { X, BookOpen, Scroll, Check, Plus, Shield, ExternalLink } from "lucide-react";
import { Spell, Character } from "../types";
import { CASTER_CLASSES } from "../data/classesData";
import { calculateSaveDC } from "../utils/pf1eUtils";

interface SpellDetailModalProps {
  spell: Spell | null;
  character: Character | null;
  isInSpellbook: boolean;
  onClose: () => void;
  onToggleSpellbook: (spellId: string) => void;
  onPrepareSpell?: (spell: Spell) => void;
}

export const SpellDetailModal: React.FC<SpellDetailModalProps> = ({
  spell,
  character,
  isInSpellbook,
  onClose,
  onToggleSpellbook,
  onPrepareSpell,
}) => {
  if (!spell) return null;

  const activeClass = character?.casterClass || "wizard";
  const spellLevel = spell.classes[activeClass];
  const dc = character && spellLevel !== undefined ? calculateSaveDC(character, spellLevel) : null;

  // Format Class Levels List
  const classLevelsList = Object.entries(spell.classes)
    .map(([clsKey, lvl]) => {
      const clsName = CASTER_CLASSES[clsKey as keyof typeof CASTER_CLASSES]?.name || clsKey;
      return `${clsName} ${lvl}`;
    })
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header Banner */}
        <div className="bg-[#14100e] px-6 py-5 border-b border-[#3d2e24] flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs uppercase font-serif font-bold text-[#d4af37] bg-[#2d241c] px-2.5 py-0.5 border border-[#3d2e24] tracking-wider">
                {spell.school} {spell.subschool ? `(${spell.subschool})` : ""}
              </span>
              {spell.descriptors && spell.descriptors.length > 0 && (
                <span className="text-xs text-[#8c7a65] font-mono">
                  [{spell.descriptors.join(", ")}]
                </span>
              )}
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#e2d5c3] tracking-wide">{spell.name}</h2>
            <p className="text-xs text-[#8c7a65] mt-1 font-serif italic">Source: {spell.source}</p>
          </div>

          <button
            onClick={onClose}
            className="text-[#8c7a65] hover:text-[#e2d5c3] p-1.5 rounded hover:bg-[#2d241c] transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-[#d4c5b3]">
          {/* Stat Block */}
          <div className="bg-[#14100e] border border-[#3d2e24] rounded-sm p-4 space-y-2 text-sm">
            <div className="border-b border-[#3d2e24] pb-2">
              <span className="font-bold uppercase text-[10px] text-[#d4af37] tracking-wider block sm:inline">Spell Level / Classes: </span>
              <span className="text-[#d4c5b3] font-serif">{classLevelsList}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1 font-serif text-xs">
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Casting Time: </span>
                <span className="text-[#d4c5b3]">{spell.castingTime}</span>
              </div>
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Components: </span>
                <span className="text-[#d4c5b3]">
                  {spell.components.join(", ")}
                  {spell.materials ? ` (${spell.materials})` : ""}
                </span>
              </div>
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Range: </span>
                <span className="text-[#d4c5b3]">{spell.range}</span>
              </div>
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Target / Area: </span>
                <span className="text-[#d4c5b3]">{spell.areaTarget || "Personal / See Text"}</span>
              </div>
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Duration: </span>
                <span className="text-[#d4c5b3]">{spell.duration}</span>
              </div>
              <div>
                <span className="font-bold text-[#d4af37] uppercase text-[10px] tracking-wider">Saving Throw / SR: </span>
                <span className="text-[#d4c5b3]">
                  {spell.savingThrow} {dc ? `(DC ${dc})` : ""} / SR: {spell.spellResistance}
                </span>
              </div>
            </div>
          </div>

          {/* Spell Description */}
          <div>
            <h3 className="font-serif font-bold text-[#d4af37] text-base mb-2 flex items-center gap-2 border-b border-[#3d2e24] pb-1 uppercase tracking-wider">
              <Scroll className="w-5 h-5 text-[#d4af37]" />
              <span>Spell Rules Text</span>
            </h3>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[#d4c5b3] whitespace-pre-line space-y-3 font-serif italic">
              {spell.description}
            </div>
            {!spell.isCustom && (
              <p className="mt-3 text-[11px] text-[#8c7a65] font-serif italic">
                {spell.description.trimEnd().endsWith("[…]") ? "This entry is abridged. " : ""}
                <a
                  href={`https://www.aonprd.com/SpellDisplay.aspx?ItemName=${encodeURIComponent(spell.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] hover:underline inline-flex items-center gap-1"
                >
                  Read the full text on Archives of Nethys
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#3d2e24]">
            <button
              onClick={() => onToggleSpellbook(spell.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition ${
                isInSpellbook
                  ? "bg-[#2d241c] border-[#d4af37] text-[#d4af37]"
                  : "bg-[#14100e] border-[#3d2e24] text-[#8c7a65] hover:border-[#d4af37] hover:text-[#d4c5b3]"
              }`}
            >
              {isInSpellbook ? (
                <>
                  <Check className="w-4 h-4 text-[#d4af37]" />
                  <span>In Personal Grimoire</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-[#d4af37]" />
                  <span>Add to Personal Grimoire</span>
                </>
              )}
            </button>

            {character && isInSpellbook && onPrepareSpell && (
              <button
                onClick={() => {
                  onPrepareSpell(spell);
                  onClose();
                }}
                className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] px-5 py-2 rounded-sm text-xs font-serif font-bold uppercase tracking-widest border border-[#d4af37] shadow transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Prepare for Today</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

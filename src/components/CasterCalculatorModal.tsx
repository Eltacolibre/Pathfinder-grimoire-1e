import React, { useState } from "react";
import { X, Dices, Shield, Zap, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Character } from "../types";
import { calculateAbilityModifier, calculateSaveDC } from "../utils/pf1eUtils";
import { NumberField } from "./NumberField";

interface CasterCalculatorModalProps {
  character: Character;
  onClose: () => void;
}

export const CasterCalculatorModal: React.FC<CasterCalculatorModalProps> = ({
  character,
  onClose,
}) => {
  const mod = calculateAbilityModifier(character.abilityScore);
  const cl = character.level;

  const [hasCombatCasting, setHasCombatCasting] = useState(false);
  const [hasSpellPenetration, setHasSpellPenetration] = useState(false);
  const [customBonus, setCustomBonus] = useState(0);

  // Roll states
  const [targetSpellLevel, setTargetSpellLevel] = useState(1);
  const [damageTaken, setDamageTaken] = useState(10);
  const [targetSR, setTargetSR] = useState(18);

  // Dice roll results
  const [concRollResult, setConcRollResult] = useState<{ d20: number; total: number } | null>(null);
  const [srRollResult, setSrRollResult] = useState<{ d20: number; total: number } | null>(null);

  const totalConcBonus = cl + mod + (hasCombatCasting ? 4 : 0) + customBonus;
  const totalSRBonus = cl + (hasSpellPenetration ? 2 : 0) + customBonus;

  const defensiveDC = 15 + 2 * targetSpellLevel;
  const injuredDC = 10 + damageTaken + targetSpellLevel;

  const handleRollConc = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setConcRollResult({ d20, total: d20 + totalConcBonus });
  };

  const handleRollSR = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setSrRollResult({ d20, total: d20 + totalSRBonus });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37]">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#e2d5c3] uppercase tracking-wide flex items-center gap-2">
                <span>PF1e Tactical Combat & Concentration Calculator</span>
              </h3>
              <p className="text-xs text-[#8c7a65] font-serif italic">
                {character.name} (CL {cl}, {character.primaryAbility.toUpperCase()} Mod {mod >= 0 ? `+${mod}` : mod})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8c7a65] hover:text-[#e2d5c3] p-1.5 rounded hover:bg-[#2d241c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-[#d4c5b3] text-xs font-serif">
          {/* Global Modifiers */}
          <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
            <h4 className="font-bold uppercase text-[#d4af37] tracking-wider text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Active Caster Feats & Tactical Modifiers</span>
            </h4>
            <div className="flex flex-wrap items-center gap-4 text-xs font-serif">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCombatCasting}
                  onChange={(e) => setHasCombatCasting(e.target.checked)}
                  className="accent-[#d4af37]"
                />
                <span>Combat Casting (+4 Concentration)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSpellPenetration}
                  onChange={(e) => setHasSpellPenetration(e.target.checked)}
                  className="accent-[#d4af37]"
                />
                <span>Spell Penetration (+2 CL vs SR)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[#8c7a65]">Misc Bonus:</span>
                <NumberField
                  value={customBonus}
                  onChange={setCustomBonus}
                  allowNegative
                  className="w-16 bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2 py-0.5 text-[#d4c5b3] font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Concentration Roller & Defensive Casting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Defensive Casting & Injury DCs */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
              <h4 className="font-bold uppercase text-[#d4af37] tracking-wider text-[11px] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Concentration DC Thresholds</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-[#8c7a65] uppercase tracking-wider mb-1">Target Spell Level:</label>
                  <select
                    value={targetSpellLevel}
                    onChange={(e) => setTargetSpellLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-1.5 text-[#d4c5b3] font-mono"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl} Spell
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-[#1c1714] p-2.5 rounded-sm border border-[#3d2e24] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#d4c5b3]">Defensive Casting DC:</span>
                    <strong className="text-[#d4af37] text-sm font-mono">DC {defensiveDC}</strong>
                  </div>
                  <p className="text-[10px] text-[#8c7a65] italic">15 + (2 × Spell Level)</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#8c7a65]">
                    <span>Damage Taken this round:</span>
                    <NumberField
                      min={0}
                      value={damageTaken}
                      onChange={setDamageTaken}
                      className="w-16 bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2 py-0.5 text-[#d4c5b3] font-mono text-center"
                    />
                  </div>
                  <div className="bg-[#1c1714] p-2.5 rounded-sm border border-[#3d2e24] flex justify-between items-center">
                    <span className="text-[#d4c5b3]">Casting Injured DC:</span>
                    <strong className="text-[#d4af37] text-sm font-mono">DC {injuredDC}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Roll Concentration Check */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold uppercase text-[#d4af37] tracking-wider text-[11px] flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Roll Concentration Check</span>
                </h4>
                <p className="text-[11px] text-[#8c7a65] mt-1">
                  Formula: 1d20 + Caster Level ({cl}) + Mod ({mod >= 0 ? `+${mod}` : mod}) + Feats = <strong className="text-[#d4af37] font-mono">{totalConcBonus >= 0 ? `+${totalConcBonus}` : totalConcBonus}</strong>
                </p>
              </div>

              <div className="bg-[#1c1714] border border-[#3d2e24] p-4 rounded-sm text-center space-y-2">
                {concRollResult ? (
                  <div>
                    <div className="text-2xl font-bold font-mono text-[#d4af37]">
                      {concRollResult.total}
                    </div>
                    <p className="text-[10px] text-[#8c7a65] font-mono">
                      [1d20: {concRollResult.d20}] + {totalConcBonus}
                    </p>

                    {concRollResult.total >= defensiveDC ? (
                      <span className="inline-block mt-2 text-[10px] bg-green-950 text-green-300 border border-green-800 px-2 py-0.5 uppercase tracking-wider font-bold rounded-sm">
                        Passes Defensive DC {defensiveDC}!
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 uppercase tracking-wider font-bold rounded-sm">
                        Fails Defensive DC {defensiveDC}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#8c7a65] italic">Click roll to test concentration</p>
                )}
              </div>

              <button
                onClick={handleRollConc}
                className="w-full bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest py-2 rounded-sm border border-[#d4af37] shadow transition flex items-center justify-center gap-2"
              >
                <Dices className="w-4 h-4" />
                <span>Roll 1d20 Concentration</span>
              </button>
            </div>
          </div>

          {/* Spell Resistance & Save DCs Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spell Resistance Check */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
              <h4 className="font-bold uppercase text-[#d4af37] tracking-wider text-[11px] flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Caster Level Check vs Spell Resistance (SR)</span>
              </h4>
              <p className="text-[11px] text-[#8c7a65]">
                Formula: 1d20 + Caster Level ({cl}) + Spell Pen = <strong className="text-[#d4af37] font-mono">{totalSRBonus >= 0 ? `+${totalSRBonus}` : totalSRBonus}</strong>
              </p>

              <div className="bg-[#1c1714] border border-[#3d2e24] p-3 rounded-sm flex items-center justify-between">
                {srRollResult ? (
                  <div>
                    <span className="text-lg font-bold font-mono text-[#d4af37]">Result: {srRollResult.total}</span>
                    <p className="text-[10px] text-[#8c7a65] font-mono">[1d20: {srRollResult.d20}] + {totalSRBonus}</p>
                  </div>
                ) : (
                  <span className="text-xs text-[#8c7a65] italic">Ready to roll vs SR</span>
                )}
                <button
                  onClick={handleRollSR}
                  className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-sm border border-[#d4af37] transition"
                >
                  Roll vs SR
                </button>
              </div>
            </div>

            {/* Spell Save DC Matrix */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-2">
              <h4 className="font-bold uppercase text-[#d4af37] tracking-wider text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Character Spell Save DCs Matrix</span>
              </h4>
              <p className="text-[10px] text-[#8c7a65]">
                Formula: 10 + Spell Level + {character.primaryAbility.toUpperCase()} Mod ({mod >= 0 ? `+${mod}` : mod})
              </p>

              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-xs pt-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                  <div key={lvl} className="bg-[#1c1714] border border-[#3d2e24] p-1.5 rounded-sm">
                    <span className="text-[9px] text-[#8c7a65] block uppercase font-sans">Lvl {lvl}</span>
                    <strong className="text-[#d4af37] text-xs">DC {calculateSaveDC(character, lvl)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

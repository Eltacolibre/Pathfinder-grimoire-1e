import React, { useState } from "react";
import { X, Sparkles, PlusCircle } from "lucide-react";
import { Spell, SpellSchool, SpellComponent, CasterClass } from "../types";
import { CASTER_CLASSES } from "../data/classesData";

interface CustomSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomSpell: (spell: Spell) => void;
}

const SCHOOLS: SpellSchool[] = [
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

const COMPONENTS: SpellComponent[] = ["V", "S", "M", "F", "DF"];

export const CustomSpellModal: React.FC<CustomSpellModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomSpell,
}) => {
  const [name, setName] = useState("");
  const [school, setSchool] = useState<SpellSchool>("Evocation");
  const [level, setLevel] = useState<number>(3);
  const [selectedClasses, setSelectedClasses] = useState<CasterClass[]>(["wizard", "sorcerer"]);
  const [castingTime, setCastingTime] = useState("1 standard action");
  const [components, setComponents] = useState<SpellComponent[]>(["V", "S"]);
  const [materials, setMaterials] = useState("");
  const [range, setRange] = useState("Medium (100 ft. + 10 ft./level)");
  const [areaTarget, setAreaTarget] = useState("20-ft.-radius burst");
  const [duration, setDuration] = useState("Instantaneous");
  const [savingThrow, setSavingThrow] = useState("Reflex half");
  const [spellResistance, setSpellResistance] = useState("Yes");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  if (!isOpen) return null;

  const toggleClass = (cKey: CasterClass) => {
    if (selectedClasses.includes(cKey)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== cKey));
    } else {
      setSelectedClasses([...selectedClasses, cKey]);
    }
  };

  const toggleComponent = (comp: SpellComponent) => {
    if (components.includes(comp)) {
      setComponents(components.filter((c) => c !== comp));
    } else {
      setComponents([...components, comp]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const classRecord: Partial<Record<CasterClass, number>> = {};
    selectedClasses.forEach((c) => {
      classRecord[c] = level;
    });

    const newSpell: Spell = {
      id: `custom_${Date.now()}`,
      name: name.trim() || "Custom Arcane Spell",
      school,
      classes: classRecord,
      castingTime,
      components,
      materials: materials.trim() || undefined,
      range,
      areaTarget: areaTarget.trim() || undefined,
      duration,
      savingThrow,
      spellResistance,
      description: description.trim() || "Custom homebrew Pathfinder 1e spell.",
      shortDescription: shortDescription.trim() || description.substring(0, 80) + "...",
      source: "Custom / Homebrew",
      isCustom: true,
    };

    onSaveCustomSpell(newSpell);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#e2d5c3] uppercase tracking-wide">
                Create Homebrew / Custom Spell
              </h3>
              <p className="text-xs text-[#8c7a65] font-serif italic">
                Define custom Pathfinder 1e spell stat block parameters
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8c7a65] hover:text-[#e2d5c3] p-1.5 rounded hover:bg-[#2d241c] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#d4c5b3] text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Spell Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arcane Nova"
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-serif"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">School</label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value as SpellSchool)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              >
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Spell Level (0 - 9)</label>
              <input
                type="number"
                min={0}
                max={9}
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 0)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Casting Time</label>
              <input
                type="text"
                value={castingTime}
                onChange={(e) => setCastingTime(e.target.value)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              />
            </div>
          </div>

          {/* Applicable Classes */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">
              Eligible Classes
            </label>
            <div className="flex flex-wrap gap-1.5 font-serif">
              {Object.values(CASTER_CLASSES).map((cls) => {
                const active = selectedClasses.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    className={`px-2 py-1 rounded-sm border transition text-xs ${
                      active
                        ? "bg-[#2d241c] border-[#d4af37] text-[#d4af37] font-bold"
                        : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65] hover:border-[#d4af37]"
                    }`}
                  >
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Components */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Components</label>
            <div className="flex gap-2 font-mono">
              {COMPONENTS.map((comp) => {
                const active = components.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => toggleComponent(comp)}
                    className={`px-3 py-1 rounded-sm border font-bold text-xs ${
                      active
                        ? "bg-[#2d241c] border-[#d4af37] text-[#d4af37]"
                        : "bg-[#1c1714] border-[#3d2e24] text-[#8c7a65] hover:border-[#d4af37]"
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Range</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Saving Throw</label>
              <input
                type="text"
                value={savingThrow}
                onChange={(e) => setSavingThrow(e.target.value)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Spell Resistance</label>
              <select
                value={spellResistance}
                onChange={(e) => setSpellResistance(e.target.value)}
                className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Yes (harmless)">Yes (harmless)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Short Summary</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="1-sentence quick rule summary"
              className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-serif"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#d4af37] tracking-wider mb-1">Full Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter complete spell rules text..."
              className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm p-2 text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-serif"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3d2e24]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-serif uppercase tracking-wider text-[#8c7a65] hover:text-[#e2d5c3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest px-5 py-2 rounded-sm border border-[#d4af37] transition shadow"
            >
              Save Custom Spell
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

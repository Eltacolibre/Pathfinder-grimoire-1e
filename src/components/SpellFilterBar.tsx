import React from "react";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import {
  CasterClass,
  SpellSchool,
  SpellComponent,
  FilterOptions,
} from "../types";
import { CASTER_CLASSES } from "../data/classesData";

interface SpellFilterBarProps {
  filter: FilterOptions;
  onChangeFilter: (newFilter: FilterOptions) => void;
  showKnownToggle?: boolean;
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

export const SpellFilterBar: React.FC<SpellFilterBarProps> = ({
  filter,
  onChangeFilter,
  showKnownToggle = false,
}) => {
  const handleReset = () => {
    onChangeFilter({
      search: "",
      classFilter: "all",
      levelFilter: "all",
      schoolFilter: "all",
      componentFilter: [],
      descriptorFilter: "all",
      sourceFilter: "all",
      onlyCharacterKnown: false,
    });
  };

  const toggleComponent = (comp: SpellComponent) => {
    const active = filter.componentFilter.includes(comp);
    const updated = active
      ? filter.componentFilter.filter((c) => c !== comp)
      : [...filter.componentFilter, comp];
    onChangeFilter({ ...filter, componentFilter: updated });
  };

  return (
    <div className="bg-[#14100e] border border-[#3d2e24] rounded-lg p-5 shadow-xl mb-6 space-y-4">
      {/* Top Row: Search Input & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onChangeFilter({ ...filter, search: e.target.value })}
            placeholder="Search spells by name, school, descriptors, or arcane properties..."
            className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm pl-10 pr-8 py-2 text-sm text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] transition font-serif"
          />
          {filter.search && (
            <button
              onClick={() => onChangeFilter({ ...filter, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7a65] hover:text-[#e2d5c3]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Known Spells Toggle if applicable */}
        {showKnownToggle && (
          <label className="flex items-center gap-2 cursor-pointer bg-[#1c1714] px-3.5 py-2 rounded-sm border border-[#3d2e24] text-xs font-serif text-[#d4c5b3] hover:border-[#d4af37] transition">
            <input
              type="checkbox"
              checked={filter.onlyCharacterKnown}
              onChange={(e) =>
                onChangeFilter({ ...filter, onlyCharacterKnown: e.target.checked })
              }
              className="accent-[#d4af37] rounded-sm"
            />
            <span>Known Spells Only</span>
          </label>
        )}

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-[#8c7a65] hover:text-[#d4af37] px-3 py-2 rounded-sm border border-[#3d2e24] hover:border-[#d4af37]/60 transition uppercase font-serif tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
        {/* Class Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-[#8c7a65] font-bold">Source Class</label>
          <select
            value={filter.classFilter}
            onChange={(e) =>
              onChangeFilter({ ...filter, classFilter: e.target.value as CasterClass | "all" })
            }
            className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1.5 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
          >
            <option value="all">All Classes</option>
            {Object.values(CASTER_CLASSES).map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-[#8c7a65] font-bold">Spell Circle / Level</label>
          <select
            value={filter.levelFilter}
            onChange={(e) => {
              const val = e.target.value;
              onChangeFilter({ ...filter, levelFilter: val === "all" ? "all" : parseInt(val) });
            }}
            className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1.5 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
          >
            <option value="all">All Levels (0 - 9)</option>
            <option value="0">Cantrips / Orisons (Level 0)</option>
            <option value="1">1st Level</option>
            <option value="2">2nd Level</option>
            <option value="3">3rd Level</option>
            <option value="4">4th Level</option>
            <option value="5">5th Level</option>
            <option value="6">6th Level</option>
            <option value="7">7th Level</option>
            <option value="8">8th Level</option>
            <option value="9">9th Level</option>
          </select>
        </div>

        {/* School Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-[#8c7a65] font-bold">School of Magic</label>
          <select
            value={filter.schoolFilter}
            onChange={(e) =>
              onChangeFilter({ ...filter, schoolFilter: e.target.value as SpellSchool | "all" })
            }
            className="w-full bg-[#1c1714] border border-[#3d2e24] rounded-sm px-2.5 py-1.5 text-[#d4c5b3] focus:outline-none focus:border-[#d4af37] font-serif"
          >
            <option value="all">All Schools</option>
            {SCHOOLS.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        {/* Components Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] uppercase tracking-wider text-[#8c7a65] font-bold">Components</label>
          <div className="flex items-center gap-1 mt-1">
            {COMPONENTS.map((comp) => {
              const active = filter.componentFilter.includes(comp);
              return (
                <button
                  key={comp}
                  onClick={() => toggleComponent(comp)}
                  className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold transition rounded-sm ${
                    active
                      ? "bg-[#d4af37] text-[#0c0908] shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                      : "bg-[#2d241c] text-[#8c7a65] border border-[#3d2e24] hover:text-[#d4c5b3]"
                  }`}
                  title={`Toggle component: ${comp}`}
                >
                  {comp}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

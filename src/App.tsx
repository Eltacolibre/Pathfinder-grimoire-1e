import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DailyPreparationView } from "./components/DailyPreparationView";
import { SpellbookView } from "./components/SpellbookView";
import { DatabaseExplorerView } from "./components/DatabaseExplorerView";
import { CharacterModal } from "./components/CharacterModal";
import { SpellDetailModal } from "./components/SpellDetailModal";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { CustomSpellModal } from "./components/CustomSpellModal";
import { CasterCalculatorModal } from "./components/CasterCalculatorModal";
import { Character, Spell } from "./types";
import { INITIAL_PAIZO_SPELLS } from "./data/spellsData";
import {
  loadStoredCharacters,
  saveStoredCharacters,
  loadActiveCharacterId,
  saveActiveCharacterId,
  loadStoredCustomSpells,
  saveStoredCustomSpells,
  autoInscribeClassSpells,
} from "./utils/pf1eUtils";
import { FULL_LIST_CLASSES } from "./data/classesData";
import { exportCharacterSpellSheetPDF } from "./utils/pdfExport";

// Default Preset Heroes for fast onboarding
const PRESET_CHARACTERS: Character[] = [
  {
    id: "ezren_wiz",
    name: "Ezren the Scholar",
    casterClass: "wizard",
    level: 7,
    primaryAbility: "int",
    abilityScore: 18,
    specialization: "Evocation School",
    oppositionSchools: ["Necromancy", "Enchantment"],
    knownSpellIds: [
      "detect-magic",
      "read-magic",
      "light",
      "mage-hand",
      "prestidigitation",
      "magic-missile",
      "shield",
      "mage-armor",
      "grease",
      "burning-hands",
      "feather-fall",
      "scorching-ray",
      "mirror-image",
      "invisibility",
      "glitterdust",
      "web",
      "bulls-strength",
      "fireball",
      "haste",
      "fly",
      "lightning-bolt",
      "dispel-magic",
      "dimension-door",
      "black-tentacles",
      "stoneskin",
    ],
    preparedSpells: [
      { id: "prep_1", spellId: "magic-missile", slotLevel: 1, isCast: false },
      { id: "prep_2", spellId: "shield", slotLevel: 1, isCast: false },
      { id: "prep_3", spellId: "grease", slotLevel: 1, isCast: false },
      { id: "prep_4", spellId: "burning-hands", slotLevel: 1, isDomainOrSpecialty: true, isCast: false },
      { id: "prep_5", spellId: "scorching-ray", slotLevel: 2, isDomainOrSpecialty: true, isCast: false },
      { id: "prep_6", spellId: "mirror-image", slotLevel: 2, isCast: false },
      { id: "prep_7", spellId: "web", slotLevel: 2, isCast: false },
      { id: "prep_8", spellId: "fireball", slotLevel: 3, isDomainOrSpecialty: true, isCast: false },
      { id: "prep_9", spellId: "haste", slotLevel: 3, isCast: false },
      { id: "prep_10", spellId: "fly", slotLevel: 3, isCast: false },
      { id: "prep_11", spellId: "dimension-door", slotLevel: 4, isCast: false },
    ],
    spontaneousSlotsUsed: {},
    createdAt: Date.now() - 3000,
  },
  {
    id: "kyra_cleric",
    name: "Kyra the Faithful",
    casterClass: "cleric",
    level: 5,
    primaryAbility: "wis",
    abilityScore: 16,
    specialization: "Sun Domain",
    oppositionSchools: [],
    knownSpellIds: [
      "detect-magic",
      "read-magic",
      "light",
      "guidance",
      "stabilize",
      "cure-light-wounds",
      "bless",
      "command",
      "spiritual-weapon",
      "lesser-restoration",
      "bulls-strength",
      "cure-serious-wounds",
      "dispel-magic",
    ],
    preparedSpells: [
      { id: "prep_c1", spellId: "bless", slotLevel: 1, isCast: false },
      { id: "prep_c2", spellId: "cure-light-wounds", slotLevel: 1, isCast: false },
      { id: "prep_c3", spellId: "spiritual-weapon", slotLevel: 2, isCast: false },
      { id: "prep_c4", spellId: "lesser-restoration", slotLevel: 2, isCast: false },
      { id: "prep_c5", spellId: "cure-serious-wounds", slotLevel: 3, isCast: false },
      { id: "prep_c6", spellId: "dispel-magic", slotLevel: 3, isCast: false },
    ],
    spontaneousSlotsUsed: {},
    createdAt: Date.now() - 2000,
  },
  {
    id: "seoni_sorc",
    name: "Seoni the Inheritor",
    casterClass: "sorcerer",
    level: 8,
    primaryAbility: "cha",
    abilityScore: 20,
    specialization: "Draconic Bloodline (Red)",
    oppositionSchools: [],
    knownSpellIds: [
      "detect-magic",
      "read-magic",
      "light",
      "mage-hand",
      "ray-of-frost",
      "magic-missile",
      "shield",
      "mage-armor",
      "burning-hands",
      "scorching-ray",
      "mirror-image",
      "invisibility",
      "fireball",
      "haste",
      "fly",
      "dimension-door",
      "black-tentacles",
    ],
    preparedSpells: [],
    spontaneousSlotsUsed: { 1: 1, 3: 2 },
    createdAt: Date.now() - 1000,
  },
];

export default function App() {
  // Spells database (Paizo + Custom)
  const [allSpells, setAllSpells] = useState<Spell[]>(() => {
    const customSpells = loadStoredCustomSpells();
    return [...INITIAL_PAIZO_SPELLS, ...customSpells];
  });

  // Characters List
  const [characters, setCharacters] = useState<Character[]>(() => {
    const stored = loadStoredCharacters();
    return stored.length > 0 ? stored : PRESET_CHARACTERS;
  });

  // Active Character Selection
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const storedId = loadActiveCharacterId();
    if (storedId && characters.some((c) => c.id === storedId)) {
      return storedId;
    }
    return characters[0]?.id || "ezren_wiz";
  });

  // Active View Tab: 'daily' | 'spellbook' | 'database'
  const [activeTab, setActiveTab] = useState<"daily" | "spellbook" | "database">("daily");

  // Modals state
  const [isNewCharModalOpen, setIsNewCharModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [selectedDetailSpell, setSelectedDetailSpell] = useState<Spell | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCustomSpellModalOpen, setIsCustomSpellModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    saveStoredCharacters(characters);
  }, [characters]);

  useEffect(() => {
    saveActiveCharacterId(activeCharacterId);
  }, [activeCharacterId]);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || characters[0] || null;

  // Character Management Handlers
  const handleSaveCharacter = (char: Character, autoInscribe?: boolean) => {
    let finalChar = char;
    if (autoInscribe && FULL_LIST_CLASSES.includes(char.casterClass)) {
      finalChar = autoInscribeClassSpells(char, char.casterClass, allSpells);
    }

    const exists = characters.some((c) => c.id === char.id);
    if (exists) {
      setCharacters(characters.map((c) => (c.id === finalChar.id ? finalChar : c)));
    } else {
      setCharacters([finalChar, ...characters]);
      setActiveCharacterId(finalChar.id);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    if (characters.length <= 1) {
      alert("You must keep at least one character in your grimoire manager!");
      return;
    }
    if (confirm("Are you sure you want to delete this character?")) {
      const remaining = characters.filter((c) => c.id !== id);
      setCharacters(remaining);
      setActiveCharacterId(remaining[0].id);
    }
  };

  const handleUpdateCharacter = (updated: Character) => {
    setCharacters(characters.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Toggle Spell in Character's Known Spellbook List
  const handleToggleSpellbook = (spellId: string) => {
    if (!activeCharacter) return;

    const isKnown = activeCharacter.knownSpellIds.includes(spellId);
    let updatedKnown: string[];

    if (isKnown) {
      updatedKnown = activeCharacter.knownSpellIds.filter((id) => id !== spellId);
    } else {
      updatedKnown = [...activeCharacter.knownSpellIds, spellId];
    }

    const updatedChar: Character = {
      ...activeCharacter,
      knownSpellIds: updatedKnown,
      // If removed, unprepare any prepared instances of this spell
      preparedSpells: isKnown
        ? activeCharacter.preparedSpells.filter((p) => p.spellId !== spellId)
        : activeCharacter.preparedSpells,
    };

    handleUpdateCharacter(updatedChar);
  };

  // Prepare a spell quickly from card or modal
  const handleQuickPrepare = (spell: Spell) => {
    if (!activeCharacter) return;
    const spellLvl = spell.classes[activeCharacter.casterClass] ?? 0;

    const newPrep = {
      id: `prep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      spellId: spell.id,
      slotLevel: spellLvl,
      isCast: false,
    };

    const updatedChar: Character = {
      ...activeCharacter,
      preparedSpells: [...activeCharacter.preparedSpells, newPrep],
    };

    handleUpdateCharacter(updatedChar);
  };

  // Save Custom / Homebrew Spell
  const handleSaveCustomSpell = (customSpell: Spell) => {
    const updatedSpells = [...allSpells, customSpell];
    setAllSpells(updatedSpells);

    // Persist custom spells
    const storedCustoms = loadStoredCustomSpells();
    saveStoredCustomSpells([...storedCustoms, customSpell]);

    // Automatically add to active character's spellbook
    if (activeCharacter) {
      handleToggleSpellbook(customSpell.id);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!activeCharacter) return;
    exportCharacterSpellSheetPDF(activeCharacter, allSpells);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans flex flex-col selection:bg-amber-800 selection:text-amber-100">
      {/* Header Bar */}
      <Header
        characters={characters}
        activeCharacter={activeCharacter}
        onSelectCharacter={setActiveCharacterId}
        onOpenNewCharacter={() => {
          setEditingCharacter(null);
          setIsNewCharModalOpen(true);
        }}
        onOpenEditCharacter={() => {
          setEditingCharacter(activeCharacter);
          setIsNewCharModalOpen(true);
        }}
        onDeleteCharacter={handleDeleteCharacter}
        onExportPDF={handleExportPDF}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenCustomSpell={() => setIsCustomSpellModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "daily" && activeCharacter && (
          <DailyPreparationView
            character={activeCharacter}
            allSpells={allSpells}
            onUpdateCharacter={handleUpdateCharacter}
            onOpenSpellDetails={setSelectedDetailSpell}
          />
        )}

        {activeTab === "spellbook" && activeCharacter && (
          <SpellbookView
            character={activeCharacter}
            allSpells={allSpells}
            onToggleSpellbook={handleToggleSpellbook}
            onOpenSpellDetails={setSelectedDetailSpell}
            onPrepareSpell={handleQuickPrepare}
            onNavigateToDatabase={() => setActiveTab("database")}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === "database" && (
          <DatabaseExplorerView
            character={activeCharacter}
            allSpells={allSpells}
            onToggleSpellbook={handleToggleSpellbook}
            onOpenSpellDetails={setSelectedDetailSpell}
            onPrepareSpell={handleQuickPrepare}
          />
        )}
      </main>

      {/* Modals */}
      <CharacterModal
        isOpen={isNewCharModalOpen}
        onClose={() => setIsNewCharModalOpen(false)}
        onSave={handleSaveCharacter}
        existingCharacter={editingCharacter}
      />

      <SpellDetailModal
        spell={selectedDetailSpell}
        character={activeCharacter}
        isInSpellbook={
          activeCharacter && selectedDetailSpell
            ? activeCharacter.knownSpellIds.includes(selectedDetailSpell.id)
            : false
        }
        onClose={() => setSelectedDetailSpell(null)}
        onToggleSpellbook={handleToggleSpellbook}
        onPrepareSpell={handleQuickPrepare}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeCharacter={activeCharacter}
      />

      <CustomSpellModal
        isOpen={isCustomSpellModalOpen}
        onClose={() => setIsCustomSpellModalOpen(false)}
        onSaveCustomSpell={handleSaveCustomSpell}
      />

      {isCalculatorOpen && activeCharacter && (
        <CasterCalculatorModal
          character={activeCharacter}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}
    </div>
  );
}

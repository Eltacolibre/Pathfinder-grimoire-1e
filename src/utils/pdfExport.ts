import jsPDF from "jspdf";
import { Character, Spell } from "../types";
import { CASTER_CLASSES } from "../data/classesData";
import {
  calculateAbilityModifier,
  calculateSaveDC,
  getCharacterSlotsBreakdown,
  knowsEntireSpellList,
} from "./pf1eUtils";

export function exportCharacterSpellSheetPDF(character: Character, allSpells: Spell[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const classDef = CASTER_CLASSES[character.casterClass] || CASTER_CLASSES.wizard;
  const mod = calculateAbilityModifier(character.abilityScore);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  const slotsBreakdown = getCharacterSlotsBreakdown(character);

  // Colors
  const primaryColor = [44, 24, 16]; // Dark burgundy brown
  const goldAccent = [184, 134, 11]; // Gold
  const textColor = [30, 30, 30];
  const tableHeaderBg = [240, 234, 222]; // Parchment tint

  let y = 15;

  // Title Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 22, "F");

  doc.setTextColor(255, 248, 230);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PATHFINDER 1e SPELLBOOK & GRIMOIRE SHEET", 15, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 200, 160);
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, 15, y + 17);

  y += 28;

  // Character Information Box
  doc.setLineWidth(0.3);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(252, 250, 245);
  doc.rect(10, y, 190, 24, "FD");

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(character.name.toUpperCase(), 15, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Class: ${classDef.name} (Lvl ${character.level})`, 15, y + 14);
  doc.text(`Casting Type: ${classDef.castingType.toUpperCase()}`, 15, y + 20);

  doc.text(`Casting Stat: ${character.primaryAbility.toUpperCase()} ${character.abilityScore} (${modStr})`, 105, y + 7);

  if (character.specialization) {
    const specLabel = character.casterClass === "cleric"
      ? `Domains: ${character.specialization}${character.secondarySpecialization ? ` & ${character.secondarySpecialization}` : ""}`
      : `Specialty / School / Bloodline: ${character.specialization}`;
    doc.text(specLabel, 105, y + 14);
  }
  if (character.oppositionSchools && character.oppositionSchools.length > 0) {
    doc.text(`Opposition Schools: ${character.oppositionSchools.join(", ")}`, 105, y + 20);
  }

  y += 30;

  // Spell Save DCs & Daily Slots Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DAILY SPELL SLOTS & SAVE DCS", 10, y);

  y += 3;

  const colWidth = 18;
  const startX = 10;

  // Table Headers
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.rect(startX, y, 190, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.text("Spell Level", startX + 2, y + 5);
  for (let l = 0; l <= classDef.maxSpellLevel; l++) {
    doc.text(`Lvl ${l}`, startX + 28 + l * colWidth, y + 5);
  }

  y += 8;

  // Save DC Row
  doc.setFont("helvetica", "normal");
  doc.text("Save DC", startX + 2, y + 5);
  for (let l = 0; l <= classDef.maxSpellLevel; l++) {
    const dc = calculateSaveDC(character, l);
    doc.text(`${dc}`, startX + 28 + l * colWidth, y + 5);
  }

  y += 7;

  // Total Slots Row
  doc.setFont("helvetica", "bold");
  doc.text("Daily Slots", startX + 2, y + 5);
  for (let l = 0; l <= classDef.maxSpellLevel; l++) {
    const slotInfo = slotsBreakdown.find((s) => s.level === l);
    const total = slotInfo ? slotInfo.total : 0;
    doc.text(l === 0 ? "At-will" : `${total}`, startX + 28 + l * colWidth, y + 5);
  }

  y += 12;

  // Prepared Spells / Known Spells List
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  const listHeader = classDef.castingType.includes("spontaneous")
    ? "KNOWN SPELLS & DAILY PREPARATION"
    : "DAILY PREPARED SPELLS";
  doc.text(listHeader, 10, y);

  y += 5;

  // Get list of prepared spells or known spells
  const spellMap = new Map<string, Spell>(allSpells.map((s) => [s.id, s]));

  let displayItems: Array<{
    level: number;
    spellName: string;
    school: string;
    castingTime: string;
    range: string;
    dc: number;
    sr: string;
    components: string;
    summary: string;
    isCast?: boolean;
    note?: string;
  }> = [];

  if (character.preparedSpells.length > 0) {
    displayItems = character.preparedSpells.map((prep) => {
      const spell = spellMap.get(prep.spellId);
      const level = prep.slotLevel;
      const dc = calculateSaveDC(character, level);
      const metamagicStr = prep.metamagic?.length ? ` [${prep.metamagic.join(", ")}]` : "";

      return {
        level,
        spellName: (spell ? spell.name : "Unknown Spell") + metamagicStr,
        school: spell ? spell.school : "-",
        castingTime: spell ? spell.castingTime : "-",
        range: spell ? spell.range : "-",
        dc,
        sr: spell ? spell.spellResistance : "-",
        components: spell ? spell.components.join(",") : "-",
        summary: spell ? spell.shortDescription : "-",
        isCast: prep.isCast,
        note: prep.isDomainOrSpecialty ? "Specialty Slot" : prep.customNote,
      };
    });
  } else {
    // If no daily prepared spells yet, list Known Spells. Casters who know
    // their entire class list are skipped here — dumping every cleric spell
    // would run to dozens of pages and tell the player nothing.
    const knownSpells = knowsEntireSpellList(character)
      ? []
      : character.knownSpellIds
          .map((id) => spellMap.get(id))
          .filter((s): s is Spell => s !== undefined);

    displayItems = knownSpells.map((spell) => {
      const level = spell.classes[character.casterClass] ?? 0;
      const dc = calculateSaveDC(character, level);
      return {
        level,
        spellName: spell.name,
        school: spell.school,
        castingTime: spell.castingTime,
        range: spell.range,
        dc,
        sr: spell.spellResistance,
        components: spell.components.join(","),
        summary: spell.shortDescription,
      };
    });
  }

  // Sort by Level then Name
  displayItems.sort((a, b) => a.level - b.level || a.spellName.localeCompare(b.spellName));

  if (displayItems.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("No spells in spellbook or prepared list yet. Add spells from the database!", 10, y + 5);
  } else {
    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, y, 190, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    doc.text("Lvl", 12, y + 5);
    doc.text("Spell Name", 22, y + 5);
    doc.text("School", 68, y + 5);
    doc.text("Casting", 98, y + 5);
    doc.text("Range", 122, y + 5);
    doc.text("DC/SR", 148, y + 5);
    doc.text("Comp", 168, y + 5);

    y += 7;

    for (const item of displayItems) {
      if (y > 270) {
        doc.addPage();
        y = 15;
        // Repeat Header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, y, 190, 7, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);

        doc.text("Lvl", 12, y + 5);
        doc.text("Spell Name", 22, y + 5);
        doc.text("School", 68, y + 5);
        doc.text("Casting", 98, y + 5);
        doc.text("Range", 122, y + 5);
        doc.text("DC/SR", 148, y + 5);
        doc.text("Comp", 168, y + 5);

        y += 7;
      }

      // Alternate row bg
      doc.setFillColor(250, 248, 244);
      doc.rect(10, y, 190, 10, "F");
      doc.setDrawColor(220, 215, 205);
      doc.line(10, y + 10, 200, y + 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      doc.text(`${item.level}`, 13, y + 4);

      const castPrefix = item.isCast ? "[CAST] " : "";
      doc.text(castPrefix + item.spellName, 22, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(item.school.substring(0, 18), 68, y + 4);
      doc.text(item.castingTime.substring(0, 14), 98, y + 4);
      doc.text(item.range.substring(0, 14), 122, y + 4);
      doc.text(`${item.dc} / ${item.sr}`, 148, y + 4);
      doc.text(item.components, 168, y + 4);

      // Short summary / note row
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      const summaryText = item.note ? `[${item.note}] ${item.summary}` : item.summary;
      doc.text(summaryText.substring(0, 110), 22, y + 8);

      y += 10;
    }
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${p} of ${totalPages}`, 180, 287);
    doc.text("Pathfinder 1e Grimoire & Spellbook Manager — Created for Official Paizo Spells", 10, 287);
  }

  doc.save(`${character.name.replace(/\s+/g, "_")}_Spellbook.pdf`);
}

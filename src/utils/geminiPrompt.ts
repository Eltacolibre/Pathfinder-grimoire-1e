// Shared between the browser client (src/utils/geminiClient.ts) and the local
// Express server (server.ts) so both paths ask Gemini the same way.

export const PF1E_SYSTEM_INSTRUCTION = `You are a Pathfinder 1st Edition (PF1e) Rules Expert, Archmage, and Spellbook Consultant.
You possess deep knowledge of Paizo Pathfinder 1e spell mechanics, class spell lists (Wizard, Cleric, Druid, Sorcerer, Bard, Witch, Magus, Paladin, Ranger, Alchemist, Inquisitor, Oracle, Psychic, etc.), spell preparation rules, metamagic feats, saving throw DCs, and rules interactions.

Always respond accurately to Pathfinder 1st Edition rules. If asked to evaluate or summarize a spell, output clear Paizo-formatted stat blocks or strategic recommendations. If asked to generate a custom spell or analyze a rule, maintain strict PF1e balance and official wording style.`;

export interface AdvisorContext {
  name: string;
  class: string;
  level: number;
  specialization?: string;
  knownSpellsCount: number;
}

export function buildAdvisorPrompt(prompt: string, context?: AdvisorContext | null): string {
  const contextBlock = context
    ? `Character / Context:\n${JSON.stringify(context)}\n\n`
    : "";
  return `${PF1E_SYSTEM_INSTRUCTION}\n\n${contextBlock}User Query: ${prompt}`;
}

export const GEMINI_MODEL = "gemini-2.5-flash";

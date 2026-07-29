import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper for Gemini AI calls
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// AI Spell Assistant & Pathfinder 1e Lore/Rule Query Endpoint
app.post("/api/gemini/spell-assistant", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured in environment variables.",
      });
    }

    const systemInstruction = `You are a Pathfinder 1st Edition (PF1e) Rules Expert, Archmage, and Spellbook Consultant.
You possess deep knowledge of Paizo Pathfinder 1e spell mechanics, class spell lists (Wizard, Cleric, Druid, Sorcerer, Bard, Witch, Magus, Paladin, Ranger, Alchemist, Inquisitor, Oracle, Psychic, etc.), spell preparation rules, metamagic feats, saving throw DCs, and rules interactions.

Always respond accurately to Pathfinder 1st Edition rules. If asked to evaluate or summarize a spell, output clear Paizo-formatted stat blocks or strategic recommendations. If asked to generate a custom spell or analyze a rule, maintain strict PF1e balance and official wording style.`;

    const fullPrompt = `${systemInstruction}\n\n${context ? `Character / Context:\n${JSON.stringify(context)}\n\n` : ""}User Query: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    res.json({ text: response.text || "No response generated." });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Failed to process AI request." });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", game: "Pathfinder 1st Edition Grimoire Manager" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pathfinder 1e Grimoire Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

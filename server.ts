import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { GEMINI_MODEL, buildAdvisorPrompt } from "./src/utils/geminiPrompt";

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

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildAdvisorPrompt(prompt, context),
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

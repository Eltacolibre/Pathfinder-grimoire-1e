import {
  AdvisorContext,
  GEMINI_MODEL,
  buildAdvisorPrompt,
} from "./geminiPrompt";

// The AI advisor has two routes:
//
//  1. Local dev (`bun dev`) — POST to the Express server, which holds the key
//     in GEMINI_API_KEY and never exposes it to the browser.
//  2. GitHub Pages — there is no server, so the visitor supplies their own
//     free Gemini API key. It lives only in their browser's localStorage and
//     goes straight to Google; it is never sent anywhere else.
//
// A saved personal key always wins, so anyone can override the server route.

const API_KEY_STORAGE = "pf1e_grimoire_gemini_key";

export function loadApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch {
    /* private browsing / storage disabled — the key just will not persist */
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("No Gemini API key configured.");
    this.name = "MissingApiKeyError";
  }
}

async function askViaUserKey(
  apiKey: string,
  prompt: string,
  context?: AdvisorContext | null,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildAdvisorPrompt(prompt, context) }] }],
      }),
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message || `Gemini request failed (HTTP ${res.status}).`;
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("")
    .trim();

  return text || "No response generated.";
}

async function askViaServer(
  prompt: string,
  context?: AdvisorContext | null,
): Promise<string> {
  const res = await fetch("/api/gemini/spell-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context }),
  });

  // On a static host this path returns the SPA's index.html rather than JSON,
  // which means there is no backend and the visitor needs their own key.
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new MissingApiKeyError();
  }

  const data = await res.json();

  if (!res.ok || !data.text) {
    // A 400 here means the server is running but has no key configured.
    if (res.status === 400) throw new MissingApiKeyError();
    throw new Error(data.error || "Unable to consult the arcane forces at this time.");
  }

  return data.text;
}

export async function askArcaneAdvisor(
  prompt: string,
  context?: AdvisorContext | null,
): Promise<string> {
  const userKey = loadApiKey();
  if (userKey) return askViaUserKey(userKey, prompt, context);
  return askViaServer(prompt, context);
}

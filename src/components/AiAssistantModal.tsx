import React, { useState } from "react";
import { X, Bot, Send, Loader2, KeyRound, ExternalLink } from "lucide-react";
import { Character } from "../types";
import {
  MissingApiKeyError,
  askArcaneAdvisor,
  loadApiKey,
  saveApiKey,
} from "../utils/geminiClient";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: Character | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState(() => loadApiKey());
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Greetings, Archmage! I am your Pathfinder 1st Edition Arcane Lore & Rule Advisor. Ask me about spell rules interactions (e.g., 'How does Grease interact with Fireball?'), metamagic optimizations, or ideal spell recommendations for your character!",
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userQuery = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: userQuery }]);
    setLoading(true);

    try {
      const text = await askArcaneAdvisor(
        userQuery,
        activeCharacter
          ? {
              name: activeCharacter.name,
              class: activeCharacter.casterClass,
              level: activeCharacter.level,
              specialization: activeCharacter.specialization,
              knownSpellsCount: activeCharacter.knownSpellIds.length,
            }
          : null,
      );
      setMessages((prev) => [...prev, { role: "assistant", text }]);
    } catch (err: any) {
      if (err instanceof MissingApiKeyError) {
        setShowKeyPanel(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "This advisor needs a Gemini API key to consult the archives. Google gives them away free — paste one below and it stays in this browser only.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Arcane interference: ${err.message}` },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "What are the best level 3 defensive wizard spells in Pathfinder 1e?",
    "How do metamagic feats like Empower and Maximize interact together?",
    "Explain the rules for concentration checks when taking damage while casting.",
    "Recommend top 1st level spells for a Cleric of the Sun Domain.",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-3xl w-full h-[600px] shadow-2xl flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2d241c] border border-[#d4af37] rounded-full flex items-center justify-center text-[#d4af37]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#e2d5c3] flex items-center gap-2 uppercase tracking-wide">
                <span>AI Pathfinder 1e Arcane Advisor</span>
                <span className="text-[10px] bg-[#2d241c] text-[#d4af37] px-2 py-0.5 rounded-sm border border-[#3d2e24] font-mono">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-[#8c7a65] font-serif italic">
                {activeCharacter ? `Consulting for ${activeCharacter.name}` : "General PF1e Rules Consultant"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowKeyPanel((v) => !v)}
              title="Configure your Gemini API key"
              className={`p-1.5 rounded hover:bg-[#2d241c] transition ${
                showKeyPanel ? "text-[#d4af37]" : "text-[#8c7a65] hover:text-[#e2d5c3]"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-[#8c7a65] hover:text-[#e2d5c3] p-1.5 rounded hover:bg-[#2d241c] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Panel */}
        {showKeyPanel && (
          <div className="px-6 py-4 bg-[#1c1714] border-b border-[#3d2e24] shrink-0">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#d4af37] mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Your Gemini API Key</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder="AIza..."
                className="flex-1 bg-[#14100e] border border-[#3d2e24] rounded-sm px-3 py-2 text-sm text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-mono"
              />
              <button
                onClick={() => {
                  saveApiKey(apiKeyDraft);
                  setShowKeyPanel(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      text: apiKeyDraft.trim()
                        ? "Key stored. The archives are open — ask away."
                        : "Key cleared from this browser.",
                    },
                  ]);
                }}
                className="px-4 py-2 rounded-sm font-serif font-bold text-xs uppercase tracking-wider bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] border border-[#d4af37] transition shrink-0"
              >
                Save Key
              </button>
            </div>
            <p className="text-[11px] text-[#8c7a65] font-serif italic mt-2 leading-relaxed">
              Stored in this browser only (localStorage) and sent straight to Google — never to
              this site's host.{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4af37] hover:underline inline-flex items-center gap-1"
              >
                Get a free key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#14100e]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-sm p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-serif ${
                  m.role === "user"
                    ? "bg-[#2d241c] text-[#d4af37] border border-[#d4af37]"
                    : "bg-[#1c1714] text-[#d4c5b3] border border-[#3d2e24] shadow-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1c1714] text-[#d4af37] border border-[#3d2e24] rounded-sm p-4 text-xs font-serif italic flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                <span>Consulting official Paizo rules archives...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sample Prompts */}
        <div className="px-6 py-2 bg-[#1c1714] border-t border-[#3d2e24] flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold uppercase text-[#8c7a65] tracking-wider shrink-0">
            Quick Queries:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(p);
              }}
              className="text-[11px] text-[#d4af37] hover:text-[#e2d5c3] bg-[#2d241c] border border-[#3d2e24] hover:border-[#d4af37] px-2.5 py-1 rounded-sm whitespace-nowrap font-serif transition shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-[#14100e] border-t border-[#3d2e24] flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a Pathfinder 1e spell or rule question..."
            className="flex-1 bg-[#1c1714] border border-[#3d2e24] rounded-sm px-4 py-2 text-sm text-[#d4c5b3] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] font-serif"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className={`px-4 py-2 rounded-sm font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 ${
              prompt.trim() && !loading
                ? "bg-[#2d241c] hover:bg-[#d4af37] text-[#d4af37] hover:text-[#1a1614] border border-[#d4af37] shadow"
                : "bg-[#1c1714] text-[#8c7a65] border border-[#3d2e24] cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};

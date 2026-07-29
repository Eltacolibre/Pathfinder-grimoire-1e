import React, { useState } from "react";
import { X, Download, Upload, FileText, Share2, ExternalLink, Check, Copy } from "lucide-react";
import { Character } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: Character | null;
  characters: Character[];
  onExportPDF: () => void;
  onImportCharacter: (importedChar: Character) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  characters,
  onExportPDF,
  onImportCharacter,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Export Character JSON
  const handleExportJSON = (charToExport?: Character) => {
    const target = charToExport || activeCharacter;
    if (!target) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(target, null, 2));
    const downloadAnchor = document.createElement("a");
    const sanitizedName = target.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pf1e_grimoire_${sanitizedName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export All Characters JSON
  const handleExportAllJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characters, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pf1e_grimoire_all_characters.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Character JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate basic fields
        if (Array.isArray(parsed)) {
          // Array of characters
          let count = 0;
          parsed.forEach((char) => {
            if (char.id && char.name && char.casterClass) {
              onImportCharacter(char);
              count++;
            }
          });
          if (count > 0) {
            setImportSuccessMsg(`Successfully imported ${count} character(s)!`);
          } else {
            setImportError("No valid character profiles found in JSON array.");
          }
        } else if (parsed.id && parsed.name && parsed.casterClass) {
          // Single character
          onImportCharacter(parsed);
          setImportSuccessMsg(`Successfully imported hero '${parsed.name}'!`);
        } else {
          setImportError("Invalid JSON structure. Missing character name or class.");
        }
      } catch (err) {
        setImportError("Failed to parse JSON file. Please check file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1614] border border-[#d4af37]/60 rounded-sm max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#14100e] px-6 py-4 border-b border-[#3d2e24] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2d241c] border border-[#d4af37] rounded-sm text-[#d4af37]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#e2d5c3] tracking-wide uppercase">
                Export & Backup Center
              </h2>
              <p className="text-xs text-[#8c7a65] italic">
                Print PDF spell sheets, backup JSON data, and support development
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c7a65] hover:text-[#d4af37] p-1 rounded hover:bg-[#2d241c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-[#d4c5b3]">
          {/* 1. Printable PDF Export */}
          {activeCharacter && (
            <div className="bg-[#14100e] border border-[#d4af37]/50 p-4 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-bold text-[#e2d5c3] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <span>Printable Character PDF Spellbook</span>
                </h3>
                <p className="text-xs text-[#8c7a65] font-serif">
                  Generate a high-contrast printable PDF sheet for <strong className="text-[#d4c5b3]">{activeCharacter.name}</strong> containing spell slots, DC tables, and prepared daily spells.
                </p>
              </div>
              <button
                onClick={() => {
                  onExportPDF();
                }}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#b59228] text-[#1a1614] font-serif font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-sm shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          )}

          {/* 2. JSON Backup & Restore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
              <h3 className="font-serif text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Export Data Backup (JSON)</span>
              </h3>
              <p className="text-xs text-[#8c7a65] font-serif">
                Download your character profiles and spellbook data as JSON files for safe offline backup.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {activeCharacter && (
                  <button
                    onClick={() => handleExportJSON(activeCharacter)}
                    className="w-full bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4c5b3] hover:text-[#e2d5c3] border border-[#3d2e24] text-xs font-serif font-bold px-3 py-2 rounded-sm transition flex items-center justify-between"
                  >
                    <span>Export {activeCharacter.name}</span>
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                  </button>
                )}
                <button
                  onClick={handleExportAllJSON}
                  className="w-full bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4c5b3] hover:text-[#e2d5c3] border border-[#3d2e24] text-xs font-serif font-bold px-3 py-2 rounded-sm transition flex items-center justify-between"
                >
                  <span>Export All Heroes ({characters.length})</span>
                  <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                </button>
              </div>
            </div>

            {/* Import JSON */}
            <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
              <h3 className="font-serif text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import Character JSON</span>
              </h3>
              <p className="text-xs text-[#8c7a65] font-serif">
                Upload a previously saved character JSON backup file to restore into your grimoire manager.
              </p>

              <label className="block w-full bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4c5b3] hover:text-[#e2d5c3] border border-[#3d2e24] hover:border-[#d4af37]/60 text-xs font-serif font-bold px-3 py-2 rounded-sm transition text-center cursor-pointer">
                <span>Choose .JSON Backup File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importError && (
                <p className="text-[11px] text-red-400 font-serif">{importError}</p>
              )}
              {importSuccessMsg && (
                <p className="text-[11px] text-emerald-400 font-serif flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{importSuccessMsg}</span>
                </p>
              )}
            </div>
          </div>

          {/* 3. Link Sharing & Ko-Fi Support */}
          <div className="bg-[#14100e] border border-[#3d2e24] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Share & Support Development</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1c1714] p-3 rounded-sm border border-[#3d2e24]">
              <div className="text-xs font-serif">
                <p className="text-[#e2d5c3] font-bold">Enjoying this Pathfinder 1e Spellbook?</p>
                <p className="text-[#8c7a65]">Consider supporting development or buying a coffee for bagquest!</p>
              </div>
              <a
                href="https://ko-fi.com/bagquest"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 bg-[#ff5e5b] hover:bg-[#e04b48] text-white font-serif font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-sm shadow transition"
              >
                <span>☕ Tip on Ko-Fi</span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleCopyAppUrl}
                className="text-xs text-[#8c7a65] hover:text-[#d4af37] font-serif flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "App URL copied to clipboard!" : "Copy App URL"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#14100e] px-6 py-3 border-t border-[#3d2e24] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#2d241c] hover:bg-[#3d2e24] text-[#d4c5b3] text-xs font-serif font-bold uppercase tracking-wider px-4 py-2 rounded-sm border border-[#3d2e24] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

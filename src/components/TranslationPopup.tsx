import { useState, useEffect } from "react";
import { BookOpen, Volume2 } from "lucide-react";

interface CedictEntry {
  traditional: String;
  simplified: String;
  pinyin: String;
  pinyin_accent: String;
  definitions: String[];
}

interface WordTranslation {
  word: string;
  entries: CedictEntry[];
}

interface TranslationPopupProps {
  translations: WordTranslation[];
  x: number;
  y: number;
  showBelow?: boolean;
  onSpeak: (text: string) => void;
}

export default function TranslationPopup({ translations, x, y, showBelow, onSpeak }: TranslationPopupProps) {
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);

  // Reset selected word index when translations change
  useEffect(() => {
    setSelectedWordIndex(0);
  }, [translations]);

  if (translations.length === 0) return null;

  const activeTranslation = translations[selectedWordIndex];
  const hasEntries = activeTranslation && activeTranslation.entries.length > 0;

  return (
    <div
      className="absolute glass shadow-2xl rounded-xl border border-zinc-800/80 p-3.5 z-50 text-zinc-300 w-80 md:w-96 select-none animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: showBelow ? "translate(-50%, 8px)" : "translate(-50%, -108%)",
      }}
      onClick={(e) => e.stopPropagation()} // Prevent closing editor selection on click
    >
      {/* Words pills header */}
      <div className="flex flex-wrap gap-1.5 pb-2.5 mb-2.5 border-b border-zinc-800/60 max-h-24 overflow-y-auto">
        {translations.map((t, idx) => {
          const isActive = idx === selectedWordIndex;
          const hasLookup = t.entries.length > 0;
          return (
            <button
              key={idx}
              onClick={() => setSelectedWordIndex(idx)}
              className={`px-2 py-0.5 text-sm rounded-md transition-all font-medium ${
                isActive
                  ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-500/20"
                  : hasLookup
                  ? "bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200"
                  : "bg-zinc-900/30 hover:bg-zinc-800/30 text-zinc-500 line-through decoration-zinc-700"
              }`}
            >
              {t.word}
            </button>
          );
        })}
      </div>

      {/* Selected Word Details */}
      {activeTranslation && (
        <div className="flex flex-col gap-2">
          {/* Header containing word, pinyin, and speak button */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white font-sans">
                  {activeTranslation.word}
                </span>
                
                {hasEntries && activeTranslation.entries[0].traditional !== activeTranslation.word && (
                  <span className="text-xs text-zinc-500">
                    tr. {activeTranslation.entries[0].traditional}
                  </span>
                )}
              </div>
              
              {hasEntries ? (
                <div className="text-xs font-semibold text-emerald-400 tracking-wide mt-0.5">
                  {activeTranslation.entries.map(e => e.pinyin_accent).join(" / ")}
                </div>
              ) : (
                <div className="text-xs text-zinc-600 italic mt-0.5">
                  No dictionary entry found
                </div>
              )}
            </div>

            {/* Pronounce Button */}
            <button
              onClick={() => onSpeak(activeTranslation.word)}
              className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-emerald-950/40 hover:text-emerald-400 text-zinc-400 transition-all border border-zinc-700/30 shrink-0"
              title="Pronounce word"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Definitions List */}
          {hasEntries ? (
            <div className="mt-1 max-h-40 overflow-y-auto pr-1 flex flex-col gap-2">
              {activeTranslation.entries.map((entry, entryIdx) => (
                <div key={entryIdx} className="text-xs bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/50">
                  {activeTranslation.entries.length > 1 && (
                    <div className="font-semibold text-zinc-400 mb-1">
                      Pronunciation {entryIdx + 1}: {entry.pinyin_accent}
                    </div>
                  )}
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                    {entry.definitions.map((def, defIdx) => (
                      <li key={defIdx} className="leading-relaxed">
                        {def}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 leading-relaxed mt-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span>This token is likely a punctuation mark, number, or name.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

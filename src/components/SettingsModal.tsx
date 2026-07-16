import { Settings, X, Volume2, Sliders, Info, HelpCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceName: string;
  setVoiceName: (voiceName: string) => void;
  speechRate: number;
  setSpeechRate: (speechRate: number) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export default function SettingsModal({
  isOpen,
  onClose,
  voiceName,
  setVoiceName,
  speechRate,
  setSpeechRate,
  availableVoices,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden glass animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <Settings className="w-5 h-5 text-[var(--accent-color)] animate-spin-slow" />
            <h2 className="text-sm font-bold tracking-wide uppercase">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-6 text-[var(--text-primary)]">

          {/* Voice Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[var(--accent-color)]" />
              <span>Mandarin TTS Voice</span>
            </label>
            {availableVoices.length > 0 ? (
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-[var(--bg-editor)] border border-[var(--border-color)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors cursor-pointer"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  No Chinese voices detected on this system. Please check your OS language settings to install Chinese speech synthesis packs.
                </span>
              </div>
            )}
          </div>

          {/* Speech Rate Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--text-secondary)] tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[var(--accent-color)]" />
                <span>Speech Reading Speed</span>
              </span>
              <span className="text-[var(--accent-color)] font-mono">{speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[var(--bg-editor)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)] focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-medium">
              <span>Slower (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.5x)</span>
            </div>
          </div>


          {/* Information / Help Banner */}
          <div className="p-3 bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded-xl flex gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            <HelpCircle className="w-4 h-4 text-[var(--accent-color)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--text-primary)]">How "Hanzi First" Works:</span>
              <p className="mt-1">
                This editor promotes character memorization. Audio pronunciations act as auditive feedback only when you input words or highlight specific phrases.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--bg-app)]/40 p-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-color)] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

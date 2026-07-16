import { Settings, X, Volume2, Sliders, Info, HelpCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  voiceName: string;
  setVoiceName: (voiceName: string) => void;
  speechRate: number;
  setSpeechRate: (speechRate: number) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export default function SettingsModal({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  voiceName,
  setVoiceName,
  speechRate,
  setSpeechRate,
  availableVoices,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden glass animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-emerald-500 animate-spin-slow" />
            <h2 className="text-sm font-bold tracking-wide uppercase">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-6 text-zinc-300">
          {/* Voice Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <span>Mandarin TTS Voice</span>
            </label>
            {availableVoices.length > 0 ? (
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-600 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-zinc-400 tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Speech Reading Speed</span>
              </span>
              <span className="text-emerald-400 font-mono">{speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
              <span>Slower (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.5x)</span>
            </div>
          </div>

          {/* Stepper Font Size Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Editor Font Size</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="12"
                max="36"
                value={fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 12 && val <= 36) {
                    setFontSize(val);
                  }
                }}
                className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-sm font-semibold text-emerald-400 focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-zinc-500 font-medium">Min 12px, Max 36px</span>
            </div>
          </div>

          {/* Information / Help Banner */}
          <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-xl flex gap-2.5 text-xs text-zinc-400 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-300">How "Hanzi First" Works:</span>
              <p className="mt-1">
                This editor promotes character memorization. Audio pronunciations act as auditive feedback only when you input words or highlight specific phrases.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-900/40 p-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

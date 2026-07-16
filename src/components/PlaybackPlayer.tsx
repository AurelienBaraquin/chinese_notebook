import { useState, useEffect } from "react";
import { Play, Pause, Square, X, Volume2 } from "lucide-react";

interface PlaybackPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  tabTitle: string;
  tabContent: string;
  voiceName: string;
  speechRate: number;
}

export default function PlaybackPlayer({
  isOpen,
  onClose,
  tabTitle,
  tabContent,
  voiceName,
  speechRate,
}: PlaybackPlayerProps) {
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused">("idle");

  useEffect(() => {
    // Stop reading when tab or content changes
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayState("idle");
  }, [tabContent]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const cleanTextForSpeech = (markdown: string) => {
    if (!markdown) return "";
    // Strip HTML tags
    let text = markdown.replace(/<[^>]*>/g, "");
    // Strip Markdown links
    text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    // Strip bullet points, header hashes, backticks
    text = text.replace(/^[#\-*+\s]+/gm, "");
    text = text.replace(/[*_`~]+/g, "");
    // Strip other mixed styling symbols
    text = text.replace(/[()\[\]{}]/g, " ");
    return text.trim();
  };

  const handlePlayPause = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (playState === "playing") {
      window.speechSynthesis.pause();
      setPlayState("paused");
    } else if (playState === "paused") {
      window.speechSynthesis.resume();
      setPlayState("playing");
    } else {
      // Idle -> start playing
      window.speechSynthesis.cancel();

      const speakText = cleanTextForSpeech(tabContent);
      if (!speakText) {
        alert("No speakable text content in this note.");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speakText);
      const voices = window.speechSynthesis.getVoices();
      
      let voice = null;
      if (voiceName) {
        voice = voices.find((v) => v.name === voiceName);
      }
      if (!voice) {
        voice = voices.find((v) => v.lang.startsWith("zh-") || v.lang.startsWith("zh"));
      }
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = speechRate;
      
      utterance.onend = () => {
        setPlayState("idle");
      };

      utterance.onerror = () => {
        setPlayState("idle");
      };

      window.speechSynthesis.speak(utterance);
      setPlayState("playing");
    }
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setPlayState("idle");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] px-4 py-3 rounded-full flex items-center gap-4 shadow-2xl glass min-w-[280px]">
        {/* Playback status indicator */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] shrink-0">
          <Volume2 className={`w-4 h-4 ${playState === "playing" ? "animate-pulse" : ""}`} />
        </div>

        {/* Note Info */}
        <div className="flex flex-col select-none overflow-hidden pr-2">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            {playState === "playing" ? "Reading Document" : playState === "paused" ? "Reading Paused" : "Read Aloud Ready"}
          </span>
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[120px]">
            {tabTitle}
          </span>
        </div>

        <div className="h-6 w-px bg-[var(--border-color)] shrink-0" />

        {/* Media Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-full bg-[var(--accent-color)] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow shadow-emerald-500/10"
            title={playState === "playing" ? "Pause" : "Play"}
          >
            {playState === "playing" ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={playState === "idle"}
            className="w-8 h-8 rounded-full bg-[var(--bg-editor)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--bg-panel)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Stop"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          <div className="w-1" />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center hover:bg-[var(--bg-editor)]/50 transition-all cursor-pointer"
            title="Close Player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export function useSpeech() {
  const [voiceName, setVoiceName] = useState<string>(() => {
    return localStorage.getItem("cn_tts_voice") || "";
  });
  
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem("cn_tts_rate");
    return saved ? parseFloat(saved) : 0.85;
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem("cn_tts_voice", voiceName);
  }, [voiceName]);

  useEffect(() => {
    localStorage.setItem("cn_tts_rate", speechRate.toString());
  }, [speechRate]);

  // Load available Chinese voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      const voices = window.speechSynthesis.getVoices();
      const zhVoices = voices.filter(
        (v) =>
          v.lang.startsWith("zh-") ||
          v.lang.startsWith("zh") ||
          v.lang.toLowerCase().includes("chinese")
      );
      setAvailableVoices(zhVoices);
      
      if (!voiceName && zhVoices.length > 0) {
        setVoiceName(zhVoices[0].name);
        localStorage.setItem("cn_tts_voice", zhVoices[0].name);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      }
    };
  }, [voiceName]);

  return {
    voiceName,
    setVoiceName,
    speechRate,
    setSpeechRate,
    availableVoices,
  };
}

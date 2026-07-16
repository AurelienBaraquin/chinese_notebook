import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TranslationPopup from "./TranslationPopup";
import { segmentAndTranslateWeb } from "../utils/webSql";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  voiceName: string;
  isActivePane: boolean;
  onFocus: () => void;
}

export default function Editor({ content, onChange, voiceName, isActivePane, onFocus }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupData, setPopupData] = useState<{
    translations: any[];
    x: number;
    y: number;
    showBelow: boolean;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to read text using Web Speech API
  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    if (!text || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let voice = null;
    if (voiceName) {
      voice = voices.find((v) => v.name === voiceName);
    }
    
    if (!voice) {
      // Find standard Chinese voices (zh-CN preferred, then zh)
      voice =
        voices.find((v) => v.lang === "zh-CN") ||
        voices.find((v) => v.lang.startsWith("zh-")) ||
        voices.find((v) => v.lang.startsWith("zh")) ||
        voices.find((v) => v.lang.includes("Chinese"));
    }

    if (voice) {
      utterance.voice = voice;
    }
    
    // Slow down speech slightly for learners
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Customize starter kit if needed
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => {
      onFocus();
    },
    editorProps: {
      handleDOMEvents: {
        // TTS on IME Validation (compositionend)
        compositionend: (_view, event) => {
          const committedText = event.data;
          if (committedText && committedText.trim()) {
            // Instantly speak the typed character/word
            speak(committedText);
          }
          return false;
        },
      },
    },
    // Listen to selection changes for debounced dictionary lookup and TTS reading
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      
      // Clear previous debounce timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (from === to) {
        // Selection is cleared
        window.speechSynthesis.cancel();
        setPopupData(null);
        return;
      }

      const selectedText = editor.state.doc.textBetween(from, to, " ");
      if (!selectedText || !selectedText.trim()) {
        setPopupData(null);
        return;
      }

      // Debounce: Trigger synthesis and translation after 400ms of stabilized selection
      debounceTimerRef.current = setTimeout(async () => {
        // Speak selection
        speak(selectedText);

        try {
          let res: any[];
          // Check if running inside Tauri context
          const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
          
          if (isTauri) {
            // Dynamically import Tauri core to query SQLite backend
            const { invoke } = await import("@tauri-apps/api/core");
            res = await invoke("translate_selection", { text: selectedText });
          } else {
            // Web environment: query WebAssembly SQLite database
            res = await segmentAndTranslateWeb(selectedText);
          }

          // Find coordinates of the selection
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0 && containerRef.current) {
            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();
            
            if (rects.length > 0) {
              const rect = rects[0];
              const containerRect = containerRef.current.getBoundingClientRect();

              // Compute relative position inside the container
              const x = rect.left - containerRect.left + rect.width / 2;
              const yTop = rect.top - containerRect.top;
              const yBottom = rect.bottom - containerRect.top;

              // If character is too close to the top, position below it to prevent overlap with header
              const showBelow = yTop < 240;
              const y = showBelow ? yBottom : yTop;

              setPopupData({
                translations: res,
                x,
                y,
                showBelow,
              });
            }
          }
        } catch (err) {
          console.error("Translation SQLite lookup failed:", err);
          
          // Fallback to Web WASM SQLite if native invoke fails
          try {
            const res = await segmentAndTranslateWeb(selectedText);
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && containerRef.current) {
              const range = selection.getRangeAt(0);
              const rects = range.getClientRects();
              if (rects.length > 0) {
                const rect = rects[0];
                const containerRect = containerRef.current.getBoundingClientRect();
                const x = rect.left - containerRect.left + rect.width / 2;
                const yTop = rect.top - containerRect.top;
                const yBottom = rect.bottom - containerRect.top;

                const showBelow = yTop < 240;
                const y = showBelow ? yBottom : yTop;

                setPopupData({
                  translations: res,
                  x,
                  y,
                  showBelow,
                });
                return;
              }
            }
          } catch {}
          setPopupData(null);
        }
      }, 400);
    },
  });

  // Sync content when it changes outside (e.g. switching tabs)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Web Speech API voice loading listener
  useEffect(() => {
    const handleVoices = () => {
      // Warm up voice cache
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
    handleVoices(); // Initial call
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
    };
  }, []);

  // Focus editor when clicking empty space in the container
  const handleContainerClick = () => {
    onFocus();
    if (editor && !editor.isFocused) {
      editor.commands.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 w-full h-full overflow-y-auto cursor-text transition-all duration-300 bg-zinc-950 ${
        isActivePane 
          ? "border-t-2 border-blue-600/90 shadow-[inset_0_4px_20px_rgba(59,130,246,0.05)]" 
          : "border-t-2 border-zinc-900 opacity-70"
      }`}
      onClick={handleContainerClick}
    >
      {/* TipTap editor element */}
      <div className="max-w-4xl mx-auto min-h-full pb-32">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Translation popup tooltip overlay */}
      {popupData && (
        <TranslationPopup
          translations={popupData.translations}
          x={popupData.x}
          y={popupData.y}
          showBelow={popupData.showBelow}
          onSpeak={speak}
        />
      )}
    </div>
  );
}

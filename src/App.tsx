import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Editor from "./components/Editor";
import { X, Settings, Volume2, Sliders, Info, HelpCircle } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  content: string;
}

interface Pane {
  id: string;
  activeTabId: string;
}

export default function App() {
  // Tabs State
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      title: "Note 1.txt",
      content: `<h1>你好, 欢迎使用 Chinese Notebook! 🎯</h1><p>这是一个极简、100% 离线的中文学习编辑器。</p><p><b>💡 使用提示:</b></p><ul><li><b>反馈输入:</b> 用你的系统输入法 (IME) 输入中文并空格/回车确认，应用会立即朗读出你输入的词语，帮助你立刻校对同音字。</li><li><b>智能阅读:</b> 用鼠标<b>双击</b>或<b>拖拽选择</b>一段文本，应用将在 400 毫秒后自动朗读选择的内容。</li><li><b>即时查询:</b> 在朗读的同时，段落上方会出现浮动的词条词典弹窗。点击弹窗里的汉字词块，能立即在下方显示拼音和英文释义。</li><li><b>安静模式:</b> 在编辑器任意空白处单击一下，就会清除选择并立刻切断声音。</li></ul>`,
    },
    {
      id: "2",
      title: "Reference.txt",
      content: `<h1>学习中文 (Study Chinese) 📚</h1><p>这是你的第二侧分栏视窗，你可以用它来对照翻译，或者记录词汇笔记！</p><p><b>词汇积累:</b></p><ul><li>中文 (zhōng wén) - Chinese language</li><li>学习 (xué xí) - to learn / study</li><li>离线 (lí xiàn) - offline</li><li>编辑器 (biān jí qì) - editor</li></ul>`,
    }
  ]);

  // Split-Screen Panes State (horizontal tmux split)
  const [panes, setPanes] = useState<Pane[]>([
    { id: "left", activeTabId: "1" }
  ]);
  const [focusedPaneId, setFocusedPaneId] = useState<string>("left");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings State (Persisted in localStorage)
  const [voiceName, setVoiceName] = useState<string>(() => {
    return localStorage.getItem("cn_tts_voice") || "";
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem("cn_tts_rate");
    return saved ? parseFloat(saved) : 0.85;
  });

  // Browser voices list state
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load browser voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Filter for Chinese voices
      const zhVoices = voices.filter(
        (v) =>
          v.lang.startsWith("zh-") ||
          v.lang.startsWith("zh") ||
          v.lang.toLowerCase().includes("chinese")
      );
      setAvailableVoices(zhVoices);
      
      // Auto-select first available Chinese voice if none is configured
      if (!voiceName && zhVoices.length > 0) {
        setVoiceName(zhVoices[0].name);
        localStorage.setItem("cn_tts_voice", zhVoices[0].name);
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [voiceName]);

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem("cn_tts_voice", voiceName);
  }, [voiceName]);

  useEffect(() => {
    localStorage.setItem("cn_tts_rate", speechRate.toString());
  }, [speechRate]);

  // Tab Operations
  const handleNewTab = () => {
    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      title: `Untitled-${tabs.length + 1}.txt`,
      content: "",
    };
    setTabs([...tabs, newTab]);
    
    // Assign new tab to focused pane
    setPanes(
      panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
    );
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent setting active tab on close button click
    
    // Don't close if it's the last remaining tab, just clear it
    if (tabs.length === 1) {
      setTabs([
        {
          id: "1",
          title: "Note 1.txt",
          content: "",
        },
      ]);
      setPanes(panes.map((p) => ({ ...p, activeTabId: "1" })));
      return;
    }

    const closedIndex = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    const fallbackTabId = newTabs[closedIndex > 0 ? closedIndex - 1 : 0].id;

    // Update any pane that was displaying the closed tab
    setPanes(
      panes.map((p) => (p.activeTabId === id ? { ...p, activeTabId: fallbackTabId } : p))
    );
  };

  const handleContentChange = (tabId: string, newContent: string) => {
    setTabs(
      tabs.map((t) => (t.id === tabId ? { ...t, content: newContent } : t))
    );
  };

  const handleSetActiveTabId = (id: string) => {
    setPanes(
      panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: id } : p))
    );
  };

  // Split view operations (columns tmux style)
  const handleToggleSplit = () => {
    if (panes.length === 1) {
      // Find a different tab to show in right pane, otherwise show same one
      const currentActiveId = panes[0].activeTabId;
      const otherTab = tabs.find((t) => t.id !== currentActiveId) || tabs[0];
      
      setPanes([
        { id: "left", activeTabId: currentActiveId },
        { id: "right", activeTabId: otherTab.id },
      ]);
      setFocusedPaneId("right");
    } else {
      // Close split: return to single left pane view
      setPanes([{ id: "left", activeTabId: panes[0].activeTabId }]);
      setFocusedPaneId("left");
    }
  };

  const handleClosePane = (paneId: string) => {
    if (panes.length > 1) {
      const remainingPane = panes.find((p) => p.id !== paneId);
      if (remainingPane) {
        setPanes([{ id: "left", activeTabId: remainingPane.activeTabId }]);
        setFocusedPaneId("left");
      }
    }
  };

  // Active tab ID of the currently focused pane
  const focusedActiveTabId = panes.find((p) => p.id === focusedPaneId)?.activeTabId || panes[0].activeTabId;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-zinc-950 font-sans">
      {/* Titlebar Header */}
      <Header
        tabs={tabs}
        activeTabId={focusedActiveTabId}
        setActiveTabId={handleSetActiveTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onOpenSettings={() => setSettingsOpen(true)}
        isSplit={panes.length > 1}
        onToggleSplit={handleToggleSplit}
      />

      {/* Split Pane Editor Content Area */}
      <div className="flex-1 flex overflow-hidden relative bg-zinc-950">
        {panes.map((pane, idx) => {
          const tab = tabs.find((t) => t.id === pane.activeTabId) || tabs[0];
          const isActive = pane.id === focusedPaneId;

          return (
            <React.Fragment key={pane.id}>
              {/* Column Separator */}
              {idx > 0 && (
                <div className="w-[1px] bg-zinc-800 shrink-0 h-full select-none pointer-events-none" />
              )}
              
              <div
                className={`flex-1 flex flex-col h-full overflow-hidden relative ${
                  isActive ? "bg-zinc-900/10" : "bg-zinc-950/20"
                }`}
                onClick={() => setFocusedPaneId(pane.id)}
              >
                {/* Micro Pane Toolbar Header */}
                <div
                  className={`h-7 px-3 flex items-center justify-between border-b text-[10px] uppercase font-bold tracking-wider shrink-0 select-none ${
                    isActive
                      ? "bg-zinc-900/60 border-zinc-850 text-blue-400"
                      : "bg-zinc-950 border-zinc-900/80 text-zinc-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : "bg-zinc-700"}`} />
                    <span>{isActive ? "Active View" : "Inactive View"}</span>
                    <span className="text-zinc-800">|</span>
                    <span className="text-zinc-400 normal-case">{tab.title}</span>
                  </div>

                  {panes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosePane(pane.id);
                      }}
                      className="p-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200 text-zinc-500 transition-colors cursor-pointer"
                      title="Close view pane"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Pane Editor Instance */}
                <Editor
                  key={pane.id + "-" + tab.id} // Reset selection overlays on switch/resize
                  content={tab.content}
                  onChange={(content) => handleContentChange(pane.activeTabId, content)}
                  voiceName={voiceName}
                  isActivePane={isActive}
                  onFocus={() => setFocusedPaneId(pane.id)}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Settings Modal Dialog Overlay */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden glass animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" />
                <h2 className="text-sm font-bold tracking-wide uppercase">App Settings</h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-6 text-zinc-300">
              {/* Voice Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-500" />
                  <span>Mandarin TTS Voice</span>
                </label>
                {availableVoices.length > 0 ? (
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
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
                    <Sliders className="w-4 h-4 text-blue-500" />
                    <span>Speech Reading Speed</span>
                  </span>
                  <span className="text-blue-400 font-mono">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                  <span>Slower (0.5x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Faster (1.5x)</span>
                </div>
              </div>

              {/* Information / Help Banner */}
              <div className="p-3 bg-blue-950/10 border border-blue-900/20 rounded-xl flex gap-2.5 text-xs text-zinc-400 leading-relaxed">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
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
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

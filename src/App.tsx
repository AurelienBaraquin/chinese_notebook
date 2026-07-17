import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Editor from "./components/Editor";
import SettingsModal from "./components/SettingsModal";
import ShortcutsModal from "./components/ShortcutsModal";
import PlaybackPlayer from "./components/PlaybackPlayer";
import { useSpeech } from "./hooks/useSpeech";
import { getFileHandle, saveFileHandle, deleteFileHandle } from "./utils/db";
import { generateFlashcards } from "./utils/flashcards";

interface Tab {
  id: string;
  title: string;
  content: string;
  fileHandle?: any;
  isDirty?: boolean;
  lastSavedContent?: string;
}

interface Pane {
  id: string;
  activeTabId: string;
}

export default function App() {
  // 1. Initial State Loading from Local Storage
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem("cn_tabs");
    if (saved) {
      try {
        const parsed: Tab[] = JSON.parse(saved);
        return parsed.map((t) => ({
          ...t,
          fileHandle: undefined,
          isDirty: t.isDirty ?? false,
          lastSavedContent: t.lastSavedContent ?? (t.isDirty ? "" : t.content),
        }));
      } catch (e) {
        console.error("Failed to parse saved tabs:", e);
      }
    }
    return [
      {
        id: "1",
        title: "Welcome.md",
        content: `# 欢迎使用 Hanzi First! 🎯\n\nHanzi First 是一款极简、安全且完全离线的中文学习与写作编辑器。\n\n## 🚀 核心功能\n\n- **🎙️ 输入即时朗读 (Speak-on-Type):** 用你的系统输入法 (IME) 输入中文并空格或回车确认，应用会立即朗读出你输入的词语，帮助你实时校对同音字。\n- **📖 智能划词朗读 (TTS):** 鼠标双击或拖拽选择任何中文文本，应用将在 400 毫秒后自动为您朗读所选内容。\n- **🔍 即时词典查询:** 点击朗读栏中的汉字词块，段落上方会立即浮现词条词典弹窗，为您展示拼音、声调、繁体对照以及详细释义。\n- **📂 本地文件管理:** 使用浏览器原生的文件系统访问 API，直接打开、编辑并保存本地电脑中的文件或目录。\n\n## 💡 快捷使用提示\n- 想要创建新文档？点击标签栏右侧的 **"+"** 按钮，或者使用快捷键 **Ctrl + N**。\n- 想要双栏对照？点击顶部菜单的 **"Split (分栏)"** 按钮，即可同时处理两份文档（例如左侧记笔记，右侧对照翻译）。\n- 在编辑器任意空白处单击一下，即可清除选择并切断声音。`,
        isDirty: false,
        lastSavedContent: `# 欢迎使用 Hanzi First! 🎯\n\nHanzi First 是一款极简、安全且完全离线的中文学习与写作编辑器。\n\n## 🚀 核心功能\n\n- **🎙️ 输入即时朗读 (Speak-on-Type):** 用你的系统输入法 (IME) 输入中文并空格或回车确认，应用会立即朗读出你输入的词语，帮助你实时校对同音字。\n- **📖 智能划词朗读 (TTS):** 鼠标双击或拖拽选择任何中文文本，应用将在 400 毫秒后自动为您朗读所选内容。\n- **🔍 即时词典查询:** 点击朗读栏中的汉字词块，段落上方会立即浮现词条词典弹窗，为您展示拼音、声调、繁体对照以及详细释义。\n- **📂 本地文件管理:** 使用浏览器原生的文件系统访问 API，直接打开、编辑并保存本地电脑中的文件或目录。\n\n## 💡 快捷使用提示\n- 想要创建新文档？点击标签栏右侧的 **"+"** 按钮，或者使用快捷键 **Ctrl + N**。\n- 想要双栏对照？点击顶部菜单的 **"Split (分栏)"** 按钮，即可同时处理两份文档（例如左侧记笔记，右侧对照翻译）。\n- 在编辑器任意空白处单击一下，即可清除选择并切断声音。`,
      }
    ];
  });

  const [panes, setPanes] = useState<Pane[]>(() => {
    const saved = localStorage.getItem("cn_panes");
    return saved ? JSON.parse(saved) : [{ id: "left", activeTabId: "1" }];
  });

  const [focusedPaneId, setFocusedPaneId] = useState<string>(() => {
    return localStorage.getItem("cn_focused_pane_id") || "left";
  });

  const [recentFiles, setRecentFiles] = useState<Array<{ id: string; title: string; content: string; fileHandle?: any }>>(() => {
    const saved = localStorage.getItem("cn_recent_files");
    return saved ? JSON.parse(saved) : [];
  });

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem("cn_auto_save") === "true";
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [playbackBarOpen, setPlaybackBarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Settings State (Persisted in localStorage managed by custom hook)
  const {
    voiceName,
    setVoiceName,
    speechRate,
    setSpeechRate,
    availableVoices
  } = useSpeech();

  // Reference for file & folder pickers (Web Fallback)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const activeEditorCommandsRef = useRef<{ undo: () => void; redo: () => void } | null>(null);

  const handleUndo = () => {
    activeEditorCommandsRef.current?.undo();
  };
  const handleRedo = () => {
    activeEditorCommandsRef.current?.redo();
  };

  // 2. Local Storage Sync Effect Loops
  useEffect(() => {
    const cleanTabs = tabs.map(({ fileHandle, ...rest }) => rest);
    localStorage.setItem("cn_tabs", JSON.stringify(cleanTabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem("cn_panes", JSON.stringify(panes));
  }, [panes]);

  useEffect(() => {
    localStorage.setItem("cn_focused_pane_id", focusedPaneId);
  }, [focusedPaneId]);


  useEffect(() => {
    const cleanRecents = recentFiles.map(({ fileHandle, ...rest }) => rest);
    localStorage.setItem("cn_recent_files", JSON.stringify(cleanRecents));
  }, [recentFiles]);

  useEffect(() => {
    localStorage.setItem("cn_auto_save", autoSaveEnabled.toString());
  }, [autoSaveEnabled]);


  // Load browser file handles from IndexedDB on startup
  useEffect(() => {
    const loadHandles = async () => {
      try {
        const handlesMap: Record<string, any> = {};
        for (const tab of tabs) {
          if (!tab.fileHandle) {
            const handle = await getFileHandle(tab.id);
            if (handle) {
              handlesMap[tab.id] = handle;
            }
          }
        }

        if (Object.keys(handlesMap).length > 0) {
          setTabs((prevTabs) =>
            prevTabs.map((tab) => {
              if (handlesMap[tab.id]) {
                return { ...tab, fileHandle: handlesMap[tab.id] };
              }
              return tab;
            })
          );
        }
      } catch (err) {
        console.warn("Failed to load file handles from IndexedDB on startup:", err);
      }
    };

    loadHandles();
  }, []);


  // Active tab ID of the currently focused pane
  const focusedActiveTabId = panes.find((p) => p.id === focusedPaneId)?.activeTabId || panes[0].activeTabId;

  // Debounced Auto-Save Effect (triggers after 1.5 seconds of user input inactivity)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const activeTab = tabs.find((t) => t.id === focusedActiveTabId);
    if (!activeTab || !activeTab.isDirty || !activeTab.fileHandle) return;

    const timer = setTimeout(async () => {
      const fileContent = activeTab.content;

      if (activeTab.fileHandle) {
        try {
          const writable = await activeTab.fileHandle.createWritable();
          await writable.write(fileContent);
          await writable.close();
          
          // Reset dirty state silently
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTab.id
                ? { ...t, isDirty: false, lastSavedContent: activeTab.content }
                : t
            )
          );
          console.log(`Auto-saved file to disk (Web): ${activeTab.title}`);
        } catch (err) {
          console.error("Web Auto-save failed:", err);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [tabs, focusedActiveTabId, autoSaveEnabled]);

  // Tab Operations
  const handleNewTab = () => {
    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      title: `Untitled-${tabs.length + 1}.txt`,
      content: "",
      isDirty: false,
      lastSavedContent: "",
    };
    setTabs([...tabs, newTab]);
    
    // Assign new tab to focused pane
    setPanes(
      panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
    );
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose?.isDirty) {
      const confirmClose = confirm(
        `You have unsaved changes in "${tabToClose.title}". Are you sure you want to close it without saving?`
      );
      if (!confirmClose) return;
    }

    // Delete file handle from IndexedDB on close
    deleteFileHandle(id).catch(console.error);

    if (tabs.length === 1) {
      setTabs([
        {
          id: "1",
          title: "Note 1.txt",
          content: "",
          isDirty: false,
          lastSavedContent: "",
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
      tabs.map((t) => {
        if (t.id === tabId) {
          const isDirty = newContent !== (t.lastSavedContent ?? "");

          // Request write permission if not granted on typing user gesture
          if (t.fileHandle && isDirty) {
            t.fileHandle.queryPermission({ mode: "readwrite" }).then(async (status: string) => {
              if (status !== "granted") {
                try {
                  await t.fileHandle.requestPermission({ mode: "readwrite" });
                } catch (e) {
                  console.warn("User rejected write permission prompt:", e);
                }
              }
            }).catch(console.error);
          }

          return { ...t, content: newContent, isDirty };
        }
        return t;
      })
    );
  };

  const handleSetActiveTabId = async (id: string) => {
    setPanes(
      panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: id } : p))
    );

    // Request write permission on tab switch user gesture
    const tab = tabs.find(t => t.id === id);
    if (tab && tab.fileHandle) {
      try {
        const status = await tab.fileHandle.queryPermission({ mode: "readwrite" });
        if (status !== "granted") {
          await tab.fileHandle.requestPermission({ mode: "readwrite" });
        }
      } catch (err) {
        console.warn("Permission request rejected on active tab switch:", err);
      }
    }
  };

  const handleEditorFocus = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && tab.fileHandle) {
      try {
        const status = await tab.fileHandle.queryPermission({ mode: "readwrite" });
        if (status !== "granted") {
          console.log("Requesting browser write permission for handle via editor focus gesture...");
          await tab.fileHandle.requestPermission({ mode: "readwrite" });
        }
      } catch (err) {
        console.warn("Write permission request was not granted by editor focus gesture:", err);
      }
    }
  };

  // Split view operations (columns tmux style)
  const handleToggleSplit = () => {
    if (panes.length === 1) {
      const currentActiveId = panes[0].activeTabId;
      const otherTab = tabs.find((t) => t.id !== currentActiveId) || tabs[0];
      
      setPanes([
        { id: "left", activeTabId: currentActiveId },
        { id: "right", activeTabId: otherTab.id },
      ]);
      setFocusedPaneId("right");
    } else {
      setPanes([{ id: "left", activeTabId: panes[0].activeTabId }]);
      setFocusedPaneId("left");
    }
  };

  // File dropdown operations (Files)
  const triggerOpenFile = async () => {
    // Web Fallback: Try File System Access API first
    if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Text/Markdown/HTML Files',
            accept: {
              'text/plain': ['.txt', '.md'],
              'text/html': ['.html']
            }
          }]
        });
        const file = await handle.getFile();
        const text = await file.text();
        const htmlContent = text;

        const newId = Date.now().toString();
        const newTab = {
          id: newId,
          title: file.name,
          content: htmlContent,
          fileHandle: handle,
          isDirty: false,
          lastSavedContent: htmlContent,
        };

        await saveFileHandle(newId, handle);

        setTabs([...tabs, newTab]);
        setPanes(
          panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
        );

        // Add to recent files
        const filtered = recentFiles.filter((f) => f.title !== file.name);
        const updatedRecents = [
          { id: newId, title: file.name, content: text, fileHandle: handle },
          ...filtered
        ].slice(0, 5);
        setRecentFiles(updatedRecents);
        return;
      } catch (err) {
        console.warn("Web File System Access API failed or cancelled, using simple input fallback:", err);
      }
    }

    // Traditional Web Fallback
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const htmlContent = text;

      const newId = Date.now().toString();
      const newTab = {
        id: newId,
        title: file.name,
        content: htmlContent,
        isDirty: false,
        lastSavedContent: htmlContent,
      };
      setTabs([...tabs, newTab]);
      
      setPanes(
        panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
      );

      // Save to recent files
      const filtered = recentFiles.filter((f) => f.title !== file.name);
      const updatedRecents = [{ id: newId, title: file.name, content: text }, ...filtered].slice(0, 5);
      setRecentFiles(updatedRecents);
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
  };

  // File dropdown operations (Folders)
  const triggerOpenFolder = async () => {
    // Web Fallback: Try File System Access API showDirectoryPicker
    if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const loadedTabs: Tab[] = [];
        let idx = 0;
        
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            if (entry.name.endsWith(".txt") || entry.name.endsWith(".md") || entry.name.endsWith(".html")) {
              const file = await entry.getFile();
              const text = await file.text();
              const htmlContent = text;
              
              const entryId = (Date.now() + idx).toString();
              loadedTabs.push({
                id: entryId,
                title: entry.name,
                content: htmlContent,
                fileHandle: entry,
                isDirty: false,
                lastSavedContent: htmlContent,
              });
              
              await saveFileHandle(entryId, entry);
              idx++;
            }
          }
        }
        
        if (loadedTabs.length === 0) {
          alert("No compatible text files found in the selected folder.");
          return;
        }

        setTabs([...tabs, ...loadedTabs]);
        setPanes(
          panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: loadedTabs[0].id } : p))
        );
        alert(`Loaded ${loadedTabs.length} files from folder!`);
        return;
      } catch (err) {
        console.warn("Web Directory Picker failed or cancelled, using simple input fallback:", err);
      }
    }

    // Traditional Web Fallback: trigger HTML5 folder picker
    folderInputRef.current?.click();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Filter compatible text files
    const textFiles = Array.from(files).filter(
      (f) => f.name.endsWith(".txt") || f.name.endsWith(".md") || f.name.endsWith(".html")
    );

    if (textFiles.length === 0) {
      alert("No compatible text files found in the selected folder.");
      return;
    }

    let loadedCount = 0;
    const loadedTabs: Tab[] = [];

    textFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const htmlContent = text;

        loadedTabs.push({
          id: (Date.now() + idx).toString(),
          title: file.name,
          content: htmlContent,
          isDirty: false,
          lastSavedContent: htmlContent,
        });

        loadedCount++;
        if (loadedCount === textFiles.length) {
          setTabs([...tabs, ...loadedTabs]);
          setPanes(
            panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: loadedTabs[0].id } : p))
          );
          alert(`Loaded ${loadedTabs.length} files from folder!`);
        }
      };
      reader.readAsText(file);
    });

    e.target.value = ""; // Reset
  };

  const handleOpenRecent = (recentId: string) => {
    const file = recentFiles.find((f) => f.id === recentId);
    if (!file) return;

    const alreadyOpen = tabs.find((t) => t.title === file.title);
    if (alreadyOpen) {
      setPanes(
        panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: alreadyOpen.id } : p))
      );
    } else {
      const newId = Date.now().toString();
      const htmlContent = file.content;
      const newTab = {
        id: newId,
        title: file.title,
        content: htmlContent,
        fileHandle: file.fileHandle,
        isDirty: false,
        lastSavedContent: htmlContent,
      };
      setTabs([...tabs, newTab]);
      setPanes(
        panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
      );
    }
  };

  const handleSaveFile = async (isSaveAs: boolean = false) => {
    const tab = tabs.find((t) => t.id === focusedActiveTabId);
    if (!tab) return;

    const fileContent = tab.content;

    // Web Fallback: Try File System Access API showSaveFilePicker first
    if (typeof window !== "undefined" && ("showSaveFilePicker" in window || tab.fileHandle)) {
      try {
        let handle = tab.fileHandle;
        if (isSaveAs || !handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: tab.title,
            types: [{
              description: 'Text Files',
              accept: {
                'text/plain': ['.txt', '.md'],
                'text/html': ['.html']
              }
            }]
          });
        }
        
        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(fileContent);
          await writable.close();

          await saveFileHandle(tab.id, handle);

          const file = await handle.getFile();

          const filtered = recentFiles.filter((f) => f.title !== file.name);
          const updatedRecents = [
            { id: tab.id, title: file.name, content: fileContent, fileHandle: handle },
            ...filtered
          ].slice(0, 5);
          setRecentFiles(updatedRecents);

          setTabs(
            tabs.map((t) =>
              t.id === tab.id
                ? {
                    ...t,
                    title: file.name,
                    fileHandle: handle,
                    isDirty: false,
                    lastSavedContent: tab.content,
                  }
                : t
            )
          );
          return;
        }
      } catch (err) {
        console.warn("Web File System Access API write failed or cancelled, using download blob fallback:", err);
      }
    }

    // Traditional Web Fallback: download file Blob
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    if (isSaveAs) {
      const customName = prompt("Save file as:", tab.title);
      if (!customName) return;
      a.download = customName.endsWith(".txt") ? customName : `${customName}.txt`;
      setTabs(
        tabs.map((t) =>
          t.id === tab.id
            ? {
                ...t,
                title: a.download,
                isDirty: false,
                lastSavedContent: tab.content,
              }
            : t
        )
      );
    } else {
      a.download = tab.title;
      setTabs(
        tabs.map((t) =>
          t.id === tab.id
            ? { ...t, isDirty: false, lastSavedContent: tab.content }
            : t
        )
      );
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Edit dropdown operations
  const handleCopyAll = () => {
    const tab = tabs.find((t) => t.id === focusedActiveTabId);
    if (!tab) return;
    const fileContent = tab.content;

    navigator.clipboard.writeText(fileContent).then(() => {
      alert("Document copied to clipboard!");
    });
  };

  const handlePasteAll = () => {
    navigator.clipboard.readText().then((clipText) => {
      const tab = tabs.find((t) => t.id === focusedActiveTabId);
      if (!tab) return;
      const pastedHtml = clipText;
      handleContentChange(focusedActiveTabId, tab.content + pastedHtml);
    }).catch((err) => {
      console.error("Failed to read clipboard:", err);
    });
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear this document's content?")) {
      handleContentChange(focusedActiveTabId, "");
    }
  };

  const handleGenerateFlashcards = async () => {
    const tab = tabs.find((t) => t.id === focusedActiveTabId);
    if (!tab) return;

    try {
      const flashcardText = await generateFlashcards(tab.content);
      const newId = Date.now().toString();
      const newTab: Tab = {
        id: newId,
        title: `Fiche — ${tab.title.replace(/\.\w+$/, "")}.md`,
        content: flashcardText,
        isDirty: false,
        lastSavedContent: flashcardText,
      };

      setTabs((prev) => [...prev, newTab]);

      // Switch to split view with original on left, flashcard on right
      setPanes([
        { id: "left", activeTabId: focusedActiveTabId },
        { id: "right", activeTabId: newId },
      ]);
      setFocusedPaneId("right");
    } catch (err) {
      console.error("Flashcard generation failed:", err);
      alert("Failed to generate flashcards. Make sure the dictionary is loaded.");
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing inside text input elements (to avoid breaking typing)
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow ONLY specific system shortcuts like Save (Ctrl+S) even inside text areas
        if (!(e.ctrlKey && e.key.toLowerCase() === "s")) {
          return;
        }
      }

      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "/":
            e.preventDefault();
            setShortcutsOpen((prev) => !prev);
            break;
          case "n":
            e.preventDefault();
            handleNewTab();
            break;
          case "w":
            e.preventDefault();
            const activeTab = tabs.find((t) => t.id === focusedActiveTabId);
            if (activeTab) {
              handleCloseTab(activeTab.id, { stopPropagation: () => {} } as any);
            }
            break;
          case "s":
            e.preventDefault();
            if (e.altKey) {
              handleSaveFile(true); // Save As
            } else {
              handleSaveFile(false); // Save
            }
            break;
          case "p":
            e.preventDefault();
            setPlaybackBarOpen((prev) => !prev);
            break;
          case "z":
            e.preventDefault();
            handleUndo();
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, focusedActiveTabId, handleNewTab, handleCloseTab, handleSaveFile]);

  const activeTab = tabs.find((t) => t.id === focusedActiveTabId) || tabs[0];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
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
        onOpenFile={triggerOpenFile}
        onOpenFolder={triggerOpenFolder}
        onSaveFile={() => handleSaveFile(false)}
        onSaveAs={() => handleSaveFile(true)}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        recentFiles={recentFiles}
        onOpenRecent={handleOpenRecent}
        onCopyAll={handleCopyAll}
        onPasteAll={handlePasteAll}
        onClearAll={handleClearAll}
        onGenerateFlashcards={handleGenerateFlashcards}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchActive={searchOpen}
        playbackBarOpen={playbackBarOpen}
        onTogglePlaybackBar={() => setPlaybackBarOpen(!playbackBarOpen)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Hidden file input picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md,.html"
        className="hidden"
      />

      {/* Hidden folder input picker for web fallback */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        {...({ webkitdirectory: "", directory: "" } as any)}
        multiple
        className="hidden"
      />

      {/* Split Pane Editor Content Area */}
      <div className="flex-1 flex overflow-hidden relative bg-[var(--bg-app)]">
        {panes.map((pane, idx) => {
          const tab = tabs.find((t) => t.id === pane.activeTabId) || tabs[0];
          const isActive = pane.id === focusedPaneId;

          return (
            <React.Fragment key={pane.id}>
              {/* Column Separator */}
              {idx > 0 && (
                <div className="w-[1px] bg-[var(--border-color)] shrink-0 h-full select-none pointer-events-none" />
              )}
              
              <div
                className={`flex-1 flex flex-col h-full overflow-hidden relative ${
                  isActive ? "bg-[var(--bg-editor)]" : "bg-[var(--bg-panel)]/50"
                }`}
                onClick={() => setFocusedPaneId(pane.id)}
              >
                {/* Pane Editor Instance */}
                <Editor
                  key={pane.id + "-" + tab.id} 
                  content={tab.content}
                  onChange={(content) => handleContentChange(pane.activeTabId, content)}
                  voiceName={voiceName}
                  isActivePane={isActive}
                  onFocus={() => {
                    setFocusedPaneId(pane.id);
                    handleEditorFocus(pane.activeTabId);
                  }}
                  searchOpen={searchOpen}
                  onCloseSearch={() => setSearchOpen(false)}
                  onRegisterCommands={(cmds) => {
                    if (isActive) {
                      activeEditorCommandsRef.current = cmds;
                    }
                  }}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Settings Modal Dialog Overlay */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        voiceName={voiceName}
        setVoiceName={setVoiceName}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        availableVoices={availableVoices}
      />

      {/* Floating Read Aloud Playback Player */}
      <PlaybackPlayer
        isOpen={playbackBarOpen}
        onClose={() => setPlaybackBarOpen(false)}
        tabTitle={activeTab?.title || "Document"}
        tabContent={activeTab?.content || ""}
        voiceName={voiceName}
        speechRate={speechRate}
      />

      {/* Keyboard Shortcuts Cheatsheet */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Editor from "./components/Editor";
import { X, Settings, Volume2, Sliders, Info, HelpCircle } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  content: string;
  filePath?: string;
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
        title: "Note 1.txt",
        content: `# 你好, 欢迎使用 Chinese Notebook! 🎯\n\n这是一个极简、100% 离线的中文学习编辑器。\n\n**💡 使用提示:**\n\n- **反馈输入:** 用你的系统输入法 (IME) 输入中文并空格/回车确认，应用会立即朗读出你输入的词语，帮助你立刻校对同音字。\n- **智能阅读:** 用鼠标**双击**或**拖拽选择**一段文本，应用将在 400 毫秒后自动朗读选择的内容。\n- **即时查询:** 在朗读的同时，段落上方会出现浮动的词条词典弹窗。点击弹窗里的汉字词块，能立即在下方显示拼音和英文释义。\n- **安静模式:** 在编辑器任意空白处单击一下，就会清除选择并立刻切断声音。`,
        isDirty: false,
        lastSavedContent: `# 你好, 欢迎使用 Chinese Notebook! 🎯\n\n这是一个极简、100% 离线的中文学习编辑器。\n\n**💡 使用提示:**\n\n- **反馈输入:** 用你的系统输入法 (IME) 输入中文并空格/回车确认，应用会立即朗读出你输入的词语，帮助你立刻校对同音字。\n- **智能阅读:** 用鼠标**双击**或**拖拽选择**一段文本，应用将在 400 毫秒后自动朗读选择的内容。\n- **即时查询:** 在朗读的同时，段落上方会出现浮动的词条词典弹窗。点击弹窗里的汉字词块，能立即在下方显示拼音和英文释义。\n- **安静模式:** 在编辑器任意空白处单击一下，就会清除选择并立刻切断声音。`,
      },
      {
        id: "2",
        title: "Reference.txt",
        content: `# 学习中文 (Study Chinese) 📚\n\n这是你的第二侧分栏视窗，你可以用它来对照翻译，或者记录词汇笔记！\n\n**词汇积累:**\n\n- 中文 (zhōng wén) - Chinese language\n- 学习 (xué xí) - to learn / study\n- 离线 (lí xiàn) - offline\n- 编辑器 (biān jí qì) - editor`,
        isDirty: false,
        lastSavedContent: `# 学习中文 (Study Chinese) 📚\n\n这是你的第二侧分栏视窗，你可以用它来对照翻译，或者记录词汇笔记！\n\n**词汇积累:**\n\n- 中文 (zhōng wén) - Chinese language\n- 学习 (xué xí) - to learn / study\n- 离线 (lí xiàn) - offline\n- 编辑器 (biān jí qì) - editor`,
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

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("cn_font_size");
    return saved ? parseInt(saved, 10) : 20; // Default 20px
  });

  const [recentFiles, setRecentFiles] = useState<Array<{ id: string; title: string; content: string; filePath?: string; fileHandle?: any }>>(() => {
    const saved = localStorage.getItem("cn_recent_files");
    return saved ? JSON.parse(saved) : [];
  });

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem("cn_auto_save") === "true";
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Reference for file & folder pickers (Web Fallback)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
    localStorage.setItem("cn_font_size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    const cleanRecents = recentFiles.map(({ fileHandle, ...rest }) => rest);
    localStorage.setItem("cn_recent_files", JSON.stringify(cleanRecents));
  }, [recentFiles]);

  useEffect(() => {
    localStorage.setItem("cn_auto_save", autoSaveEnabled.toString());
  }, [autoSaveEnabled]);

  useEffect(() => {
    localStorage.setItem("cn_tts_voice", voiceName);
  }, [voiceName]);

  useEffect(() => {
    localStorage.setItem("cn_tts_rate", speechRate.toString());
  }, [speechRate]);

  // Load browser file handles from IndexedDB on startup
  useEffect(() => {
    const loadHandles = async () => {
      const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
      if (isTauri) return;

      try {
        const { getFileHandle } = await import("./utils/db");
        const handlesMap: Record<string, any> = {};
        for (const tab of tabs) {
          if (!tab.filePath && !tab.fileHandle) {
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

  // Load browser voices
  useEffect(() => {
    const updateVoices = () => {
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
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, [voiceName]);

  // Active tab ID of the currently focused pane
  const focusedActiveTabId = panes.find((p) => p.id === focusedPaneId)?.activeTabId || panes[0].activeTabId;

  // Debounced Auto-Save Effect (triggers after 1.5 seconds of user input inactivity)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const activeTab = tabs.find((t) => t.id === focusedActiveTabId);
    if (!activeTab || !activeTab.isDirty || (!activeTab.filePath && !activeTab.fileHandle)) return;

    const timer = setTimeout(async () => {
      const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
      const fileContent = activeTab.content;

      if (isTauri && activeTab.filePath) {
        try {
          const { writeTextFile } = await import("@tauri-apps/plugin-fs");
          await writeTextFile(activeTab.filePath, fileContent);
          
          // Reset dirty state silently
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTab.id
                ? { ...t, isDirty: false, lastSavedContent: activeTab.content }
                : t
            )
          );
          console.log(`Auto-saved file to disk (Tauri): ${activeTab.title}`);
        } catch (err) {
          console.error("Auto-save write operation failed:", err);
        }
      } else if (activeTab.fileHandle) {
        // Web Auto-Save fallback using File System Access API
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
    import("./utils/db").then(({ deleteFileHandle }) => {
      deleteFileHandle(id).catch(console.error);
    }).catch(console.error);

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
          if (t.fileHandle && isDirty && !t.filePath) {
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
    if (tab && tab.fileHandle && !tab.filePath) {
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
    if (tab && tab.fileHandle && !tab.filePath) {
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
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
    if (isTauri) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile } = await import("@tauri-apps/plugin-fs");

        const selected = await open({
          multiple: false,
          directory: false,
          filters: [{ name: 'Text/Markdown/HTML', extensions: ['txt', 'md', 'html'] }]
        });

        if (selected) {
          const content = await readTextFile(selected as string);
          const htmlContent = content;

          const newId = Date.now().toString();
          const filename = (selected as string).split(/[/\\]/).pop() || "Untitled.txt";
          const newTab = {
            id: newId,
            title: filename,
            content: htmlContent,
            filePath: selected as string,
            isDirty: false,
            lastSavedContent: htmlContent,
          };
          setTabs([...tabs, newTab]);
          
          setPanes(
            panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: newId } : p))
          );

          // Add to recent files
          const filtered = recentFiles.filter((f) => f.title !== filename);
          const updatedRecents = [
            { id: selected as string, title: filename, content: content, filePath: selected as string },
            ...filtered
          ].slice(0, 5);
          setRecentFiles(updatedRecents);
        }
        return;
      } catch (err) {
        console.error("Tauri dialog open failed:", err);
      }
    }

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

        const { saveFileHandle } = await import("./utils/db");
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
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
    if (isTauri) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile, readDir } = await import("@tauri-apps/plugin-fs");
        const { join } = await import("@tauri-apps/api/path");

        const selectedDir = await open({
          multiple: false,
          directory: true,
        });

        if (selectedDir) {
          const entries = await readDir(selectedDir as string);
          const textEntries = entries.filter(
            (e) => e.isFile && (e.name.endsWith(".txt") || e.name.endsWith(".md") || e.name.endsWith(".html"))
          );

          if (textEntries.length === 0) {
            alert("No compatible text files found in the selected directory.");
            return;
          }

          const loadedTabs: Tab[] = [];
          for (let i = 0; i < textEntries.length; i++) {
            const entry = textEntries[i];
            const filePath = await join(selectedDir as string, entry.name);
            const content = await readTextFile(filePath);
            const htmlContent = content;

            loadedTabs.push({
              id: (Date.now() + i).toString(),
              title: entry.name,
              content: htmlContent,
              filePath: filePath,
              isDirty: false,
              lastSavedContent: htmlContent,
            });
          }

          setTabs([...tabs, ...loadedTabs]);
          setPanes(
            panes.map((p) => (p.id === focusedPaneId ? { ...p, activeTabId: loadedTabs[0].id } : p))
          );

          // Add first loaded file to recent files list
          const updatedRecents = [
            {
              id: loadedTabs[0].filePath!,
              title: loadedTabs[0].title,
              content: loadedTabs[0].content,
              filePath: loadedTabs[0].filePath
            },
            ...recentFiles
          ].slice(0, 5);
          setRecentFiles(updatedRecents);
          alert(`Loaded ${loadedTabs.length} files from folder!`);
        }
        return;
      } catch (err) {
        console.error("Tauri native folder dialog failed, using web picker fallback:", err);
      }
    }

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
              
              const { saveFileHandle } = await import("./utils/db");
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
        filePath: file.filePath,
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

    const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;

    if (isTauri) {
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");

        if (isSaveAs || !tab.filePath) {
          // Native Save As Picker dialog
          const savedPath = await save({
            defaultPath: tab.title,
            filters: [{ name: 'Text/Markdown/HTML', extensions: ['txt', 'md', 'html'] }]
          });

          if (!savedPath) return; // Save cancelled by user

          await writeTextFile(savedPath, fileContent);
          const filename = savedPath.split(/[/\\]/).pop() || tab.title;

          const filtered = recentFiles.filter((f) => f.title !== filename);
          const updatedRecents = [
            { id: savedPath, title: filename, content: fileContent, filePath: savedPath },
            ...filtered
          ].slice(0, 5);
          setRecentFiles(updatedRecents);

          setTabs(
            tabs.map((t) =>
              t.id === tab.id
                ? {
                    ...t,
                    title: filename,
                    filePath: savedPath,
                    isDirty: false,
                    lastSavedContent: tab.content,
                  }
                : t
            )
          );
        } else {
          // Silent direct save to loaded path
          await writeTextFile(tab.filePath, fileContent);
          setTabs(
            tabs.map((t) =>
              t.id === tab.id
                ? { ...t, isDirty: false, lastSavedContent: tab.content }
                : t
            )
          );
        }
        return;
      } catch (err) {
        console.error("Tauri native write failed:", err);
      }
    }

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

          const { saveFileHandle } = await import("./utils/db");
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
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchActive={searchOpen}
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
                  fontSize={fontSize}
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
                <Settings className="w-5 h-5 text-emerald-500 animate-spin-slow" />
                <h2 className="text-sm font-bold tracking-wide uppercase">App Settings</h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
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
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
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

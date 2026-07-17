import React, { useState, useEffect } from "react";
import { Plus, Settings, Columns2, X, Play, Keyboard, Undo2, Redo2 } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  isDirty?: boolean;
}

interface HeaderProps {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isSplit: boolean;
  onToggleSplit: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onSaveFile: () => void;
  onSaveAs: () => void;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  recentFiles: { id: string; title: string }[];
  onOpenRecent: (tabId: string) => void;
  onCopyAll: () => void;
  onPasteAll: () => void;
  onClearAll: () => void;
  onGenerateFlashcards: () => void;
  onToggleSearch: () => void;
  searchActive: boolean;
  playbackBarOpen: boolean;
  onTogglePlaybackBar: () => void;
  onOpenShortcuts: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function Header({
  tabs,
  activeTabId,
  setActiveTabId,
  onNewTab,
  onCloseTab,
  onOpenSettings,
  isSplit,
  onToggleSplit,
  onOpenFile,
  onOpenFolder,
  onSaveFile,
  onSaveAs,
  autoSaveEnabled,
  onToggleAutoSave,
  recentFiles,
  onOpenRecent,
  onCopyAll,
  onPasteAll,
  onClearAll,
  onGenerateFlashcards,
  onToggleSearch,
  searchActive,
  playbackBarOpen,
  onTogglePlaybackBar,
  onOpenShortcuts,
  onUndo,
  onRedo,
}: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<"file" | "edit" | null>(null);

  // Close dropdown menus when clicking anywhere else
  useEffect(() => {
    const handleClose = () => setActiveMenu(null);
    if (activeMenu) {
      window.addEventListener("click", handleClose);
    }
    return () => window.removeEventListener("click", handleClose);
  }, [activeMenu]);

  return (
    <header className="h-11 w-full bg-[var(--bg-panel)] border-b border-[var(--border-color)] flex items-center justify-between select-none glass shrink-0 z-40">
      {/* Left: App Logo & Menu Dropdowns */}
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mr-2">
          <img src="/logo.png" className="w-4 h-4 object-contain rounded-sm" alt="Hanzi First Logo" />
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--text-primary)]">Hanzi First</span>
        </div>
        
        {/* File Menu Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === "file" ? null : "file");
            }}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              activeMenu === "file"
                ? "bg-[var(--bg-editor)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/60"
            }`}
          >
            <span>File</span>
          </button>
          
          {activeMenu === "file" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={onNewTab}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>New Tab</span>
              </button>
              <button
                onClick={onOpenFile}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Open File...</span>
              </button>
              <button
                onClick={onOpenFolder}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Open Folder...</span>
              </button>
              <button
                onClick={onSaveFile}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Save File</span>
              </button>
              <button
                onClick={onSaveAs}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Save As...</span>
              </button>
              
              <div className="border-t border-[var(--border-color)]/80 my-1"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoSave();
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Auto-Save</span>
                <span className={`text-[10px] font-bold ${autoSaveEnabled ? "text-[var(--accent-color)]" : "text-[var(--text-secondary)]/60"}`}>
                  {autoSaveEnabled ? "✓ ON" : "OFF"}
                </span>
              </button>
              
              {recentFiles.length > 0 && (
                <>
                  <div className="border-t border-[var(--border-color)]/80 my-1"></div>
                  <div className="px-3 py-1 text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Recent Files
                  </div>
                  {recentFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onOpenRecent(file.id)}
                      className="w-full px-3 py-1 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] truncate cursor-pointer"
                      title={file.title}
                    >
                      {file.title}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit Menu Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === "edit" ? null : "edit");
            }}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              activeMenu === "edit"
                ? "bg-[var(--bg-editor)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/60"
            }`}
          >
            <span>Edit</span>
          </button>
          
          {activeMenu === "edit" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={onCopyAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Copy Document</span>
              </button>
              <button
                onClick={onPasteAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Paste Clipboard</span>
              </button>
              <button
                onClick={onClearAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Clear Document</span>
              </button>
              <div className="border-t border-[var(--border-color)]/80 my-1"></div>
              <button
                onClick={() => { onGenerateFlashcards(); setActiveMenu(null); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 text-[var(--accent-color)] hover:text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
              >
                <span>Generate Flashcards</span>
                <span className="text-[9px] text-[var(--text-secondary)]/60">Fiche</span>
              </button>
              <div className="border-t border-[var(--border-color)]/80 my-1"></div>
              <button
                onClick={onToggleSearch}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-editor)]/50 flex items-center justify-between cursor-pointer ${
                  searchActive ? "text-[var(--accent-color)] font-bold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>Find & Replace</span>
              </button>
            </div>
          )}
        </div>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/60 rounded-md transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/60 rounded-md transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Split View Toggle Button */}
        <button
          onClick={onToggleSplit}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
            isSplit
              ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/30"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/60"
          }`}
          title={isSplit ? "Single View" : "Split View (Tmux)"}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>{isSplit ? "Unsplit" : "Split"}</span>
        </button>
      </div>

      {/* Middle: File Tabs */}
      <div className="flex-1 h-full flex items-end px-4 overflow-x-auto scrollbar-none gap-1 mask-linear-r">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group h-8 px-3 flex items-center gap-2 border-t-2 rounded-t-md text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                isActive
                  ? "bg-[var(--bg-editor)] border-[var(--accent-color)] text-[var(--text-primary)] shadow-lg"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/40"
              }`}
            >
              <span>{tab.title}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] shrink-0" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => onCloseTab(tab.id, e)}
                className="p-0.5 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors opacity-60 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        
        {/* Plus Button */}
        <button
          onClick={onNewTab}
          className="h-7 w-7 mb-0.5 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-editor)]/50 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions and Settings */}
      <div className="flex items-center h-full pr-3 gap-1 shrink-0">
        {/* Playback player bar toggle */}
        <button
          onClick={onTogglePlaybackBar}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
            playbackBarOpen
              ? "bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/30 font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/60"
          }`}
          title="Toggle Read Aloud Player"
        >
          <Play className="w-3.5 h-3.5 animate-pulse" />
          <span>Read Aloud</span>
        </button>

        {/* Shortcuts button */}
        <button
          onClick={onOpenShortcuts}
          className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Keyboard Shortcuts Cheatsheet"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Shortcuts</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Open Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}

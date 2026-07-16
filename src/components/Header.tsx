import React, { useState, useEffect } from "react";
import { Plus, Settings, Columns2, X } from "lucide-react";

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
  onToggleSearch: () => void;
  searchActive: boolean;
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
  onToggleSearch,
  searchActive,
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
    <header className="h-11 w-full bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between select-none glass shrink-0 z-40">
      {/* Left: App Logo & Menu Dropdowns */}
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-400 mr-2">
          <img src="/logo.png" className="w-4 h-4 object-contain rounded-sm" alt="Hanzi First Logo" />
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">Hanzi First</span>
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
                ? "bg-zinc-850 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
            }`}
          >
            <span>File</span>
          </button>
          
          {activeMenu === "file" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={onNewTab}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>New Tab</span>
              </button>
              <button
                onClick={onOpenFile}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Open File...</span>
              </button>
              <button
                onClick={onOpenFolder}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Open Folder...</span>
              </button>
              <button
                onClick={onSaveFile}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Save File</span>
              </button>
              <button
                onClick={onSaveAs}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Save As...</span>
              </button>
              
              <div className="border-t border-zinc-800/80 my-1"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoSave();
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-855 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Auto-Save</span>
                <span className={`text-[10px] font-bold ${autoSaveEnabled ? "text-emerald-400" : "text-zinc-650"}`}>
                  {autoSaveEnabled ? "✓ ON" : "OFF"}
                </span>
              </button>
              
              {recentFiles.length > 0 && (
                <>
                  <div className="border-t border-zinc-800/80 my-1"></div>
                  <div className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    Recent Files
                  </div>
                  {recentFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onOpenRecent(file.id)}
                      className="w-full px-3 py-1 text-left text-xs hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 truncate cursor-pointer"
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
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <span>Edit</span>
          </button>
          
          {activeMenu === "edit" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={onCopyAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-850 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Copy Document</span>
              </button>
              <button
                onClick={onPasteAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-850 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Paste Clipboard</span>
              </button>
              <button
                onClick={onClearAll}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-850 text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Clear Document</span>
              </button>
              <div className="border-t border-zinc-800/80 my-1"></div>
              <button
                onClick={onToggleSearch}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-zinc-850 flex items-center justify-between cursor-pointer ${
                  searchActive ? "text-emerald-400 font-bold" : "text-zinc-300 hover:text-white"
                }`}
              >
                <span>Find & Replace</span>
              </button>
            </div>
          )}
        </div>

        {/* Split View Toggle Button */}
        <button
          onClick={onToggleSplit}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
            isSplit
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
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
                  ? "bg-zinc-900 border-emerald-500 text-zinc-200 shadow-lg"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
              }`}
            >
              <span>{tab.title}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => onCloseTab(tab.id, e)}
                className="p-0.5 rounded-full hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors opacity-60 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        
        {/* Plus Button */}
        <button
          onClick={onNewTab}
          className="h-7 w-7 mb-0.5 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Settings button */}
      <div className="flex items-center h-full pr-3 shrink-0">
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Open Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}

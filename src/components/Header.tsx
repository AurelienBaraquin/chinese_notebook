import React from "react";
import { Plus, Settings, FileText, Columns2, X } from "lucide-react";

interface Tab {
  id: string;
  title: string;
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
}: HeaderProps) {
  return (
    <header className="h-11 w-full bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between select-none glass shrink-0">
      {/* Left: App Logo & Actions */}
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-400 mr-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">Hanzi First</span>
        </div>
        
        <button
          onClick={onNewTab}
          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
        <button
          onClick={onToggleSplit}
          className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
            isSplit
              ? "bg-blue-600/35 text-blue-400 border border-blue-500/25"
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
              className={`group h-8 px-3 flex items-center gap-2 border-t-2 rounded-t-md text-xs font-medium cursor-pointer transition-all shrink-0 ${
                isActive
                  ? "bg-zinc-900 border-blue-500 text-zinc-200 shadow-lg"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
              }`}
            >
              <span>{tab.title}</span>
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
          className="h-7 w-7 mb-0.5 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Settings button (Window actions are managed natively by standard OS titlebar chrome) */}
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

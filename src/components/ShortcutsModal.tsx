import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "File Operations",
      items: [
        { keys: ["Ctrl", "N"], desc: "Create new note tab" },
        { keys: ["Ctrl", "S"], desc: "Save active tab content" },
        { keys: ["Ctrl", "Alt", "S"], desc: "Save note As..." },
        { keys: ["Ctrl", "W"], desc: "Close active tab safely" },
      ],
    },
    {
      title: "Editor & Speech Controls",
      items: [
        { keys: ["Ctrl", "P"], desc: "Toggle Play / Pause read aloud" },
        { keys: ["Ctrl", "F"], desc: "Toggle Find & Replace panel" },
        { keys: ["Ctrl", "="], desc: "Zoom in editor text (+1px)" },
        { keys: ["Ctrl", "-"], desc: "Zoom out editor text (-1px)" },
        { keys: ["Ctrl", "/"], desc: "Toggle shortcuts cheatsheet" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden glass animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <Keyboard className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-sm font-bold tracking-wide uppercase">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 text-[var(--text-primary)] max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] border-b border-[var(--border-color)] pb-1.5">
                {group.title}
              </h3>
              <div className="flex flex-col gap-2.5">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-1 bg-[var(--bg-editor)] border border-[var(--border-color)] rounded text-xs font-bold font-mono text-[var(--text-primary)] shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--bg-app)]/40 p-4 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-color)] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search } from 'lucide-react';

export const GlobalSearchBar: React.FC = () => {
  const handleOpenPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <button
      type="button"
      onClick={handleOpenPalette}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0 group"
      title="Buka Command Palette & Pencarian Global (Ctrl / ⌘ + K)"
      aria-label="Pencarian Global (⌘K)"
    >
      <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors shrink-0" />
      <kbd className="text-[10px] font-mono text-slate-500 group-hover:text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded border border-slate-300/80 font-bold shrink-0">
        ⌘K
      </kbd>
    </button>
  );
};

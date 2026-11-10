import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredLabel?: string;
  /** Force the "required but empty" error to show (e.g. on a submit attempt) — this is a custom dropdown button, not a native <select>, so it was never actually enforcing `required` at all without this. */
  showError?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * Generic searchable dropdown — replaces plain <select> wherever the list is
 * long enough to need search (user, 2026-11-02: "Semua dropdown seharusnya
 * ... wajib bisa search"). Flips upward automatically when there isn't
 * enough room below the trigger so the menu never gets clipped by a modal's
 * bottom edge, the same fix applied to EmployeeSelect.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = '-- Pilih --',
  required = false,
  requiredLabel = 'Wajib dipilih',
  showError = false,
  disabled = false,
  className = '',
  emptyMessage = 'Tidak ditemukan.',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = () => {
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320 && rect.top > spaceBelow);
    }
    setIsOpen(true);
  };

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => {
    const q = search.toLowerCase();
    return o.label.toLowerCase().includes(q) || (o.sublabel || '').toLowerCase().includes(q);
  });
  const hasError = required && showError && !value;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="font-medium text-slate-700 block mb-1 text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className={`w-full text-left px-3 py-2 bg-white border rounded-md text-xs flex items-center justify-between gap-2 transition-colors ${
          hasError
            ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
            : isOpen
            ? 'border-indigo-500 ring-1 ring-indigo-500'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        {selected ? (
          <span className="truncate font-medium text-slate-900">{selected.label}</span>
        ) : (
          <span className="text-slate-400 font-normal truncate">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {hasError && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{requiredLabel}</span>
        </p>
      )}

      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-72 flex flex-col ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none font-medium text-slate-800"
            />
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{o.label}</div>
                      {o.sublabel && <div className="text-[11px] text-slate-500 truncate">{o.sublabel}</div>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

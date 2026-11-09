import React, { useState, useRef, useEffect } from 'react';
import { Employee } from '../../types/hrms';
import { ChevronDown, Search, Check, User, Edit3, AlertCircle } from 'lucide-react';

interface EmployeeSelectProps {
  employees: Employee[];
  value?: string;
  onChange?: (employeeId: string) => void;
  selectedEmployeeId?: string;
  onSelect?: (employeeId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  requiredLabel?: string;
  /** Force the "required but empty" error to show (e.g. on a submit attempt) — this is a custom dropdown button, not a native <select>, so it was never actually enforcing `required` at all without this. */
  showError?: boolean;
  disabled?: boolean;
  className?: string;
  allowManual?: boolean;
  manualLabel?: string;
}

export const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  employees,
  value,
  onChange,
  selectedEmployeeId,
  onSelect,
  label,
  placeholder = '-- Pilih Karyawan --',
  required = false,
  requiredLabel = 'Karyawan wajib dipilih',
  showError = false,
  disabled = false,
  className = '',
  allowManual = false,
  manualLabel = '+ Input Manual / Pihak Eksternal',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Searchable dropdowns must never get clipped by a modal's bottom edge
  // (user, 2026-11-02) — flip the menu to open upward when there isn't
  // enough room below the trigger inside the nearest scrollable ancestor.
  const openDropdown = () => {
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320 && rect.top > spaceBelow);
    }
    setIsOpen(true);
  };

  const activeId = value !== undefined ? value : (selectedEmployeeId || '');
  const handleSelectChange = (id: string) => {
    if (onChange) onChange(id);
    if (onSelect) onSelect(id);
  };

  const selectedEmployee = employees.find((e) => e.id === activeId);
  const hasError = required && showError && !activeId;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    // position/department aren't always resolved (e.g. employee has no
    // position/department assigned yet) despite the mock type claiming
    // they're required strings — real backend rows can omit them, which
    // crashed every EmployeeSelect search with "Cannot read properties of
    // undefined (reading 'toLowerCase')" (found live, 2026-11-04).
    return (
      (emp.fullName || '').toLowerCase().includes(q) ||
      (emp.nik || '').toLowerCase().includes(q) ||
      (emp.position || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    return (name || '?')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="font-medium text-slate-700 block mb-1 text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
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
        {selectedEmployee ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedEmployee.avatar ? (
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.fullName}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                {getInitials(selectedEmployee.fullName)}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate leading-tight">
                {selectedEmployee.fullName}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                <span className="font-mono text-indigo-600 font-medium">{selectedEmployee.nik}</span> ·{' '}
                <span>{selectedEmployee.position}</span>
              </div>
            </div>
          </div>
        ) : activeId === '__manual__' ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-amber-900 truncate leading-tight">
                Input Manual / Pihak Eksternal
              </div>
              <div className="text-[10px] text-amber-700 truncate">
                Pejabat di luar master karyawan
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">{placeholder}</span>
        )}

        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {hasError && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{requiredLabel}</span>
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-72 flex flex-col ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Cari nama, NIK, jabatan, atau divisi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none font-medium text-slate-800"
            />
          </div>

          {/* Employee List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((emp) => {
                const isSelected = emp.id === activeId;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      handleSelectChange(emp.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(emp.fullName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                          <span className="font-mono text-indigo-700 font-semibold">{emp.nik}</span>
                          <span>·</span>
                          <span>{emp.position}</span>
                          <span>·</span>
                          <span className="text-slate-400 text-[10px]">{emp.department}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Karyawan tidak ditemukan.
              </div>
            )}
          </div>

          {/* Optional Manual Entry Option */}
          {allowManual && (
            <button
              type="button"
              onClick={() => {
                handleSelectChange('__manual__');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 hover:bg-amber-50/70 transition-colors ${
                activeId === '__manual__' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {manualLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Input nama & jabatan manual di luar master karyawan
                  </div>
                </div>
              </div>
              {activeId === '__manual__' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

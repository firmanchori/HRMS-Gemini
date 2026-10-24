import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Search,
  X,
  User,
  Box,
  FileText,
  ChevronRight,
  Command,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Employee, GAAsset, OfficialDocument } from '../../types/hrms';

export type SearchCategory = 'all' | 'employee' | 'asset' | 'document';

interface SearchResultItem {
  id: string;
  type: 'employee' | 'asset' | 'document';
  title: string;
  subtitle: string;
  codeOrTag: string;
  badge: string;
  score: number;
  originalData: Employee | GAAsset | OfficialDocument;
}

// Subsequence & Token Fuzzy Matcher
function calculateFuzzyScore(query: string, ...targetStrings: (string | undefined)[]): number {
  if (!query) return 0;
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let maxScore = 0;
  const qTokens = q.split(/\s+/).filter(Boolean);

  for (const text of targetStrings) {
    if (!text) continue;
    const t = text.toLowerCase();

    // 1. Exact match bonus
    if (t === q) {
      maxScore = Math.max(maxScore, 100);
      continue;
    }

    // 2. Starts with query
    if (t.startsWith(q)) {
      maxScore = Math.max(maxScore, 85);
      continue;
    }

    // 3. Substring match
    const subIdx = t.indexOf(q);
    if (subIdx !== -1) {
      maxScore = Math.max(maxScore, 70 - Math.min(subIdx, 20));
      continue;
    }

    // 4. Token matches (all tokens present)
    const allTokensFound = qTokens.every((tok) => t.includes(tok));
    if (allTokensFound && qTokens.length > 1) {
      maxScore = Math.max(maxScore, 65);
      continue;
    }

    // 5. Fuzzy character subsequence match
    let qIdx = 0;
    let seqScore = 0;
    for (let i = 0; i < t.length && qIdx < q.length; i++) {
      if (t[i] === q[qIdx]) {
        qIdx++;
        seqScore += 2;
      }
    }
    if (qIdx === q.length) {
      maxScore = Math.max(maxScore, 40 + seqScore);
    }
  }

  return maxScore;
}

export const GlobalSearchBar: React.FC = () => {
  const { employees, assets, documents, setActiveModule, openFilePreview } = useHrms();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard shortcut: Ctrl+K or Cmd+K or "/" to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute fuzzy search results
  const searchResults = useMemo<SearchResultItem[]>(() => {
    if (!query.trim()) return [];

    const results: SearchResultItem[] = [];

    // 1. Search Employees
    for (const emp of employees) {
      const score = calculateFuzzyScore(
        query,
        emp.fullName,
        emp.nik,
        emp.position,
        emp.department,
        emp.nikKtp,
        emp.contractDocNumber
      );
      if (score > 0) {
        results.push({
          id: `emp-${emp.id}`,
          type: 'employee',
          title: emp.fullName,
          subtitle: `${emp.position} · ${emp.department} (Grade ${emp.grade || 'L3'})`,
          codeOrTag: emp.nik,
          badge: emp.employmentType,
          score: score + 5, // slight priority for personnel
          originalData: emp,
        });
      }
    }

    // 2. Search GA Assets
    for (const asset of assets) {
      const score = calculateFuzzyScore(
        query,
        asset.name,
        asset.assetCode,
        asset.category,
        asset.building,
        asset.room,
        asset.condition
      );
      if (score > 0) {
        results.push({
          id: `asset-${asset.id}`,
          type: 'asset',
          title: asset.name,
          subtitle: `${asset.category} · ${asset.building} (${asset.room})`,
          codeOrTag: asset.assetCode,
          badge: asset.condition,
          score,
          originalData: asset,
        });
      }
    }

    // 3. Search Official Documents
    for (const doc of documents) {
      const score = calculateFuzzyScore(
        query,
        doc.title,
        doc.documentNumber,
        doc.type,
        doc.signeeName,
        doc.signeeRole
      );
      if (score > 0) {
        results.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.title,
          subtitle: `Tertanda: ${doc.signeeName} (${doc.signeeRole}) · Terbit: ${doc.issueDate}`,
          codeOrTag: doc.documentNumber,
          badge: doc.type,
          score,
          originalData: doc,
        });
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);

    // Filter by category if selected
    if (activeFilter === 'all') {
      return results.slice(0, 15);
    }
    return results.filter((r) => r.type === activeFilter).slice(0, 15);
  }, [query, employees, assets, documents, activeFilter]);

  // Reset selectedIndex when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Execute Navigation
  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);

    if (item.type === 'employee') {
      setActiveModule('employees');
    } else if (item.type === 'asset') {
      setActiveModule('assets');
    } else if (item.type === 'document') {
      const doc = item.originalData as OfficialDocument;
      // Open preview modal directly for instant feedback and switch module
      setActiveModule('documents');
      openFilePreview({
        title: doc.title,
        documentNumber: doc.documentNumber,
        typeBadge: `Dokumen: ${doc.type}`,
        date: doc.issueDate,
        partyName: doc.signeeName,
        partyRole: doc.signeeRole,
        contentParagraphs: [doc.contentPreview],
        rawHtmlOrBody: doc.renderedHtml,
        qrPayload: doc.qrVerificationUrl,
      });
    }
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex]);
      }
    }
  };

  const employeeCount = searchResults.filter((r) => r.type === 'employee').length;
  const assetCount = searchResults.filter((r) => r.type === 'asset').length;
  const documentCount = searchResults.filter((r) => r.type === 'document').length;

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop / Tablet Search Input Container */}
      <div className="hidden sm:flex items-center">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="w-28 sm:w-36 md:w-44 lg:w-60 xl:w-72 pl-8 pr-10 sm:pr-14 py-1 sm:py-1.5 text-xs bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-400 rounded-md outline-none transition-all text-slate-500 hover:text-slate-700 shadow-2xs flex items-center justify-between text-left"
            title="Buka Command Palette & Pencarian Global (Ctrl+K)"
          >
            <span className="truncate">Cari atau Perintah...</span>
            <div className="absolute right-2 hidden sm:flex items-center gap-0.5 pointer-events-none">
              <kbd className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1 py-0.2 rounded border border-slate-300/80">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Search Trigger Button (< sm) */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-slate-200 transition-colors"
          title="Buka Command Palette & Pencarian Global"
          aria-label="Cari"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Fullscreen Search Overlay Drawer */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col p-3 sm:hidden animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Search Header */}
            <div className="p-3 border-b border-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari karyawan, aset, dokumen..."
                className="w-full text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded"
              >
                Tutup
              </button>
            </div>

            {/* Mobile Category Filters */}
            {query.trim() && (
              <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-xs overflow-x-auto shrink-0">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Semua ({searchResults.length})
                </button>
                <button
                  onClick={() => setActiveFilter('employee')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                    activeFilter === 'employee'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Karyawan ({employeeCount})
                </button>
                <button
                  onClick={() => setActiveFilter('asset')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                    activeFilter === 'asset'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Aset ({assetCount})
                </button>
                <button
                  onClick={() => setActiveFilter('document')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                    activeFilter === 'document'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Dokumen ({documentCount})
                </button>
              </div>
            )}

            {/* Mobile Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
              {query.trim() === '' ? (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <Sparkles className="w-6 h-6 mx-auto text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-700">Pencarian Cepat NusaHR</p>
                  <p className="text-[11px] text-slate-500">
                    Ketik nama karyawan, kode tag aset QR, atau nomor dokumen resmi.
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="font-semibold text-slate-800">Tidak ada hasil ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tidak ditemukan data yang cocok dengan "{query}".
                  </p>
                </div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full p-3 text-left hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'employee' && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'asset' && (
                        <div className="w-7 h-7 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                          <Box className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'document' && (
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-slate-900 truncate text-xs">
                          {item.title}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded shrink-0">
                          {item.codeOrTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Tablet Floating Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="hidden sm:block absolute top-full left-0 mt-1.5 w-[380px] md:w-[450px] lg:w-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header Result Filter Tabs */}
          <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semua ({searchResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('employee')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === 'employee'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Karyawan ({employeeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('asset')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === 'asset'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Aset GA ({assetCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('document')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeFilter === 'document'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Dokumen ({documentCount})
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              Navigasi: ↑↓ Enter
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 text-xs">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Search className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-800 text-xs">Tidak ada hasil ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tidak ditemukan karyawan, aset, atau dokumen yang cocok dengan kata kunci "{query}".
                </p>
              </div>
            ) : (
              searchResults.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full p-2.5 sm:p-3 text-left flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Leading Icon */}
                    <div className="mt-0.5 shrink-0">
                      {item.type === 'employee' && (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'asset' && (
                        <div className="w-7 h-7 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          <Box className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {item.type === 'document' && (
                        <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-900 truncate">
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              item.type === 'employee'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.type === 'asset'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.type === 'employee'
                              ? 'Karyawan'
                              : item.type === 'asset'
                              ? 'Aset GA'
                              : 'Dokumen Legal'}
                          </span>
                        </div>

                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 font-medium">
                          {item.codeOrTag}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Trailing arrow / Enter hint */}
                    <div className="self-center shrink-0 text-slate-400 pl-1">
                      {isSelected ? (
                        <span className="text-[10px] font-mono text-indigo-600 font-semibold flex items-center gap-0.5">
                          <span>Buka</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Quick Action Bar */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {searchResults.length} hasil ditemukan
            </span>
            <span className="text-[10px] text-slate-400">
              Klik hasil atau tekan Enter untuk navigasi langsung
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

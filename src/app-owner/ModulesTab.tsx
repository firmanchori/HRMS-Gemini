import React, { useEffect, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { CurrencyInput } from "../components/common/CurrencyInput";
import { api, ApiError, type ModuleRow, type ModuleCatalogEntry } from "./api";
import { ConfirmButton } from "./ConfirmButton";

function PriceRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="text-[11px] text-slate-500 block mb-1">{label}</span>
      <CurrencyInput value={value} onChange={onChange} showTerbilang={false} />
    </div>
  );
}

function ModuleCard({ row, features, onSaved }: { row: ModuleRow; features: string[]; onSaved: () => void }) {
  const [edited, setEdited] = useState<Partial<ModuleRow>>({});
  const [saving, setSaving] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const value = (field: "basePriceIdr" | "pricePerUserIdr" | "pricePerEntityIdr") => edited[field] ?? row[field];
  const dirty = Object.keys(edited).length > 0;

  async function save() {
    setSaving(true);
    try {
      await api.updateModule(row.id, edited);
      setEdited({});
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{row.name}</h3>
          <span className="text-[10px] text-slate-400 font-mono">{row.code}</span>
        </div>
        <ConfirmButton
          label={row.isActive ? "Aktif" : "Nonaktif"}
          confirmTitle={row.isActive ? "Nonaktifkan Modul Ini?" : "Aktifkan Modul Ini?"}
          confirmMessage={
            row.isActive
              ? `Modul "${row.name}" tidak akan lagi ditawarkan ke tenant/calon tenant baru.`
              : `Modul "${row.name}" akan kembali ditawarkan ke tenant/calon tenant.`
          }
          danger={row.isActive}
          onConfirm={async () => {
            await api.updateModule(row.id, { isActive: !row.isActive });
            onSaved();
          }}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
            row.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        />
      </div>
      <div className="mb-3">
        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Deskripsi</label>
        <textarea
          rows={2}
          value={edited.description ?? row.description ?? ""}
          onChange={(e) => setEdited((ed) => ({ ...ed, description: e.target.value }))}
          placeholder="Satu kalimat jelas tentang manfaat modul ini bagi calon tenant."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-indigo-600"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <PriceRow label="Harga Dasar /bulan" value={value("basePriceIdr")} onChange={(v) => setEdited((e) => ({ ...e, basePriceIdr: v }))} />
        <PriceRow label="Harga /User /bulan" value={value("pricePerUserIdr")} onChange={(v) => setEdited((e) => ({ ...e, pricePerUserIdr: v }))} />
        <PriceRow label="Harga /Entitas /bulan" value={value("pricePerEntityIdr")} onChange={(v) => setEdited((e) => ({ ...e, pricePerEntityIdr: v }))} />
      </div>
      {features.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <button type="button" onClick={() => setShowFeatures((v) => !v)} className="text-[11px] font-semibold text-indigo-700">
            {showFeatures ? "Sembunyikan detail modul" : `Lihat detail modul (${features.length} turunan)`}
          </button>
          {showFeatures && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {features.map((f) => (
                <span key={f} className="text-[10px] bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 text-slate-700">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {dirty && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button
            type="button"
            onClick={() => setEdited({})}
            disabled={saving}
            className="text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg px-3 py-1.5 disabled:opacity-60"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}

function NewModuleForm({ catalog, onCreated, onClose }: { catalog: ModuleCatalogEntry[]; onCreated: () => void; onClose: () => void }) {
  const available = catalog.filter((c) => !c.isAdded);
  const [selectedCode, setSelectedCode] = useState(available[0]?.code ?? "");
  const [prices, setPrices] = useState({ basePriceIdr: 0, pricePerUserIdr: 0, pricePerEntityIdr: 0 });
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = available.find((c) => c.code === selectedCode);

  function applyRecommendation() {
    if (selected) setPrices(selected.recommended);
  }

  useEffect(() => {
    if (selected) setPrices(selected.recommended);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSaving(true);
    try {
      await api.createModule({ code: selected.code, name: selected.label, description: description || null, ...prices });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah modul");
    } finally {
      setSaving(false);
    }
  }

  if (available.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 text-xs text-slate-500">
        Semua modul aplikasi sudah punya harga di katalog ini.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      {error && <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Pilih Modul Aplikasi <span className="text-rose-500">*</span>
        </label>
        <select
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-indigo-600"
        >
          {available.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.lineCount.toLocaleString("id-ID")} baris kode)
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 mt-1">
          Kode (<code className="bg-slate-100 px-1 rounded">{selected?.code}</code>) dan nama modul terisi otomatis dari daftar modul
          aplikasi yang sesungguhnya — tidak bisa diketik manual, supaya tidak pernah menyimpang dari modul yang benar-benar ada.
        </p>
        <div className="mt-2">
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Deskripsi (opsional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Satu kalimat jelas tentang manfaat modul ini bagi calon tenant — tampil di website publik & halaman daftar."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-indigo-600"
          />
        </div>
        {selected && selected.features.length > 0 && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <p className="text-[10px] font-semibold text-slate-600 mb-1">Turunan modul ini (otomatis dari kode):</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.features.map((f) => (
                <span key={f} className="text-[10px] bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Harga</span>
        <button
          type="button"
          onClick={applyRecommendation}
          className="text-[11px] font-semibold flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1"
        >
          <Sparkles className="w-3 h-3" /> Pakai Rekomendasi
        </button>
      </div>
      <p className="text-[10px] text-slate-400 -mt-2">
        Rekomendasi dihitung dari ukuran/kompleksitas modul ({selected?.lineCount.toLocaleString("id-ID")} baris kode) — hanya saran awal,
        semua nilai bisa diubah bebas sebelum disimpan.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <PriceRow label="Harga Dasar /bulan" value={prices.basePriceIdr} onChange={(v) => setPrices((p) => ({ ...p, basePriceIdr: v }))} />
        <PriceRow label="Harga /User /bulan" value={prices.pricePerUserIdr} onChange={(v) => setPrices((p) => ({ ...p, pricePerUserIdr: v }))} />
        <PriceRow
          label="Harga /Entitas /bulan"
          value={prices.pricePerEntityIdr}
          onChange={(v) => setPrices((p) => ({ ...p, pricePerEntityIdr: v }))}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3.5 py-2 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Tambahkan ke Katalog"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500 px-3 py-2">
          Batal
        </button>
      </div>
    </form>
  );
}

export function ModulesTab() {
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalogEntry[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setRows(await api.listModules());
    setCatalog(await api.getModuleCatalog());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="text-xs font-semibold flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 shrink-0"
        >
          {showNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showNew ? "Tutup" : "Modul Baru"}
        </button>
      </div>

      {showNew && <NewModuleForm catalog={catalog} onCreated={load} onClose={() => setShowNew(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((m) => (
          <ModuleCard key={m.id} row={m} features={catalog.find((c) => c.code === m.code)?.features ?? []} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

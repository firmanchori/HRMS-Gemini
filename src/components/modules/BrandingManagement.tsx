import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHrms } from '../../context/HrmsContext';
import { Building2, Globe, FileText, Image as ImageIcon, Check, RotateCcw } from 'lucide-react';

/**
 * Identitas visual PER ENTITAS (logo dokumen & favicon) — bukan satu
 * branding untuk seluruh tenant. Anak/cucu perusahaan boleh punya kop
 * surat & favicon sendiri, berbeda dari induknya (user correction).
 * Dipisah dari struktur organisasi karena ini soal tampilan, bukan
 * hierarki entitas. Sebelumnya tergabung dalam menu "Manajemen Tenant"
 * yang sudah dihapus.
 */
export const BrandingManagement: React.FC = () => {
  const { entities, currentEntityId, updateEntity } = useHrms();

  const [selectedEntityId, setSelectedEntityId] = useState(currentEntityId);
  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

  const [brandLogo, setBrandLogo] = useState(selectedEntity?.documentLogoUrl || '');
  const [brandFavicon, setBrandFavicon] = useState(selectedEntity?.appFaviconUrl || '');
  const [brandSavedToast, setBrandSavedToast] = useState(false);

  // Muat ulang form setiap kali pindah entitas yang sedang diatur brandingnya.
  useEffect(() => {
    setBrandLogo(selectedEntity?.documentLogoUrl || '');
    setBrandFavicon(selectedEntity?.appFaviconUrl || '');
  }, [selectedEntity?.id]);

  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Building2 className="w-10 h-10 text-slate-300" />
        <h2 className="text-base font-semibold text-slate-800">Belum Ada Entitas Perusahaan</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Buat entitas perusahaan dulu di menu Struktur Organisasi sebelum mengatur branding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Branding Perusahaan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Logo resmi dokumen (kop surat, SK, slip gaji) dan favicon browser — diatur per entitas, setiap anak/cucu perusahaan bisa berbeda.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs w-full sm:w-[320px] shrink-0 shadow-2xs">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer truncate text-xs min-w-0"
            title="Pilih Entitas"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.name} ({ent.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-lg shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950">
              Pengaturan Identitas Visual & Branding ({selectedEntity.name})
            </h3>
            <p className="text-xs text-indigo-800/80 mt-0.5">
              Sesuaikan Logo Resmi Dokumen Perusahaan (Kop Surat, SK, Slip Gaji, SP) dan Favicon Browser Web untuk meningkatkan kredibilitas brand korporat.
            </p>
          </div>
        </div>
        {typeof document !== 'undefined' && brandSavedToast && createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-[999999] flex items-center gap-2 px-4 py-3 bg-slate-900 text-white border border-slate-700 rounded-xl text-xs font-semibold shadow-2xl toast-floating-enter ring-1 ring-white/10 pointer-events-auto"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Pengaturan Branding Korporat Berhasil Disimpan!</span>
          </div>,
          document.body
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setting 1: Logo Dokumen Resmi */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Logo Resmi Dokumen (Kop Surat & SK)
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded">
              Format PNG / SVG / JPG
            </span>
          </div>

          <div className="p-5 space-y-4 text-xs flex-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                URL Logo Dokumen Legal
              </label>
              <input
                type="url"
                value={brandLogo}
                onChange={(e) => setBrandLogo(e.target.value)}
                placeholder="https://example.com/logo-perusahaan.png"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Logo ini otomatis disematkan pada seluruh Kop Surat Resmi, SK Mutasi/Promosi, Offering Letter, dan Dokumen Pesangon.
              </p>
            </div>

            {/* Preset Options */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                Gunakan Preset Contoh Logo:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBrandLogo(
                      'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop&crop=faces'
                    )
                  }
                  className="p-2 border border-slate-200 hover:border-indigo-400 rounded-lg text-left bg-slate-50 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop&crop=faces"
                    alt="Preset 1"
                    className="w-6 h-6 rounded object-cover border"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Logo Geometric Blue</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBrandLogo(
                      'https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=200&h=200&fit=crop&crop=faces'
                    )
                  }
                  className="p-2 border border-slate-200 hover:border-indigo-400 rounded-lg text-left bg-slate-50 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=200&h=200&fit=crop&crop=faces"
                    alt="Preset 2"
                    className="w-6 h-6 rounded object-cover border"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Logo Shield Enterprise</span>
                </button>
              </div>
            </div>

            {/* Live Preview Kop Surat */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                Simulasi Tampilan Kop Surat:
              </span>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt="Company Logo Preview"
                      className="w-12 h-12 object-contain rounded border border-slate-200 bg-white p-1 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop&crop=faces';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      {selectedEntity.name}
                    </h5>
                    <p className="text-[10px] text-slate-600">
                      Gedung Perkantoran Menara Palma Lt. 18, Jl. H.R. Rasuna Said, {selectedEntity.city}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      NPWP: {selectedEntity.npwp} | Telp: (021) 555-0928 | Email: hrd@{selectedEntity.code.toLowerCase()}.co.id
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setting 2: App Favicon */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Favicon Aplikasi Browser (App Favicon)
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">
              Tab Icon .ico / .png
            </span>
          </div>

          <div className="p-5 space-y-4 text-xs flex-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                URL Favicon Browser
              </label>
              <input
                type="url"
                value={brandFavicon}
                onChange={(e) => setBrandFavicon(e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ikon ini akan muncul di bilah tab browser dan bookmark pengguna NusaHR saat mengakses portal.
              </p>
            </div>

            {/* Preset Favicons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                Gunakan Preset Contoh Favicon:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBrandFavicon(
                      'https://api.iconify.design/lucide:shield-check.svg?color=%234f46e5'
                    )
                  }
                  className="p-2 border border-slate-200 hover:border-indigo-400 rounded-lg text-left bg-slate-50 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
                >
                  <img
                    src="https://api.iconify.design/lucide:shield-check.svg?color=%234f46e5"
                    alt="Shield"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Shield Check Indigo</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBrandFavicon(
                      'https://api.iconify.design/lucide:building-2.svg?color=%23059669'
                    )
                  }
                  className="p-2 border border-slate-200 hover:border-indigo-400 rounded-lg text-left bg-slate-50 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
                >
                  <img
                    src="https://api.iconify.design/lucide:building-2.svg?color=%23059669"
                    alt="Building"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Building Emerald</span>
                </button>
              </div>
            </div>

            {/* Live Preview Browser Tab */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                Simulasi Tab Browser Web:
              </span>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white rounded-t-md text-[11px] font-medium shadow-xs max-w-xs truncate">
                    {brandFavicon ? (
                      <img
                        src={brandFavicon}
                        alt="Favicon Preview"
                        className="w-3.5 h-3.5 object-contain shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://api.iconify.design/lucide:building-2.svg?color=%234f46e5';
                        }}
                      />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                    <span className="truncate">NusaHR Enterprise — {selectedEntity.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            setBrandLogo(selectedEntity.documentLogoUrl || '');
            setBrandFavicon(selectedEntity.appFaviconUrl || '');
          }}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Perubahan</span>
        </button>
        <button
          type="button"
          onClick={() => {
            updateEntity(selectedEntity.id, { documentLogoUrl: brandLogo, appFaviconUrl: brandFavicon });
            setBrandSavedToast(true);
            setTimeout(() => setBrandSavedToast(false), 3000);
          }}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Simpan Logo & Favicon</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Network,
  Users,
  Building,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  ChevronDown,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Briefcase,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { ValidatedDateInput } from '../common/ValidatedDateInput';

export const OrgChartManagement: React.FC = () => {
  const {
    employees,
    entities,
    currentEntity,
    currentEntityId,
    setCurrentEntityId,
    orgNodes,
    orgProposals,
    submitOrgProposal,
    reviewOrgProposal,
    currentUser,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'chart' | 'vacant' | 'proposals'>('chart');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Proposal Form State
  const [proposalForm, setProposalForm] = useState({
    proposalTitle: '',
    changeType: 'Buat Posisi Baru' as const,
    description: '',
    effectiveDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  // Filter nodes for active entity
  const entityNodes = orgNodes.filter((n) => n.entityId === currentEntityId);

  // Build tree hierarchy: root nodes have no reportsToId or reportsToId not in current list
  const rootNodes = entityNodes.filter((n) => !n.reportsToId || !entityNodes.some((p) => p.id === n.reportsToId));

  const vacantPositions = entityNodes.filter((n) => n.isVacant);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setProposalError(null);

    if (!proposalForm.proposalTitle.trim()) {
      setProposalError('Judul usulan perubahan bagan organisasi wajib diisi.');
      return;
    }
    if (!proposalForm.effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(proposalForm.effectiveDate)) {
      setProposalError('Tanggal efektif tidak valid (format YYYY-MM-DD).');
      return;
    }
    if (!proposalForm.description.trim()) {
      setProposalError('Uraian alasan bisnis dan dampak organisasi wajib diisi.');
      return;
    }

    submitOrgProposal({
      entityId: currentEntityId,
      proposalTitle: proposalForm.proposalTitle.trim(),
      changeType: proposalForm.changeType,
      description: proposalForm.description.trim(),
      effectiveDate: proposalForm.effectiveDate,
      proposedBy: currentUser.name,
    });

    setIsProposalModalOpen(false);
    setProposalForm({
      proposalTitle: '',
      changeType: 'Buat Posisi Baru',
      description: '',
      effectiveDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    });
  };

  const renderTreeNode = (node: typeof orgNodes[0], level: number = 0) => {
    const children = entityNodes.filter((n) => n.reportsToId === node.id);
    const occupant = employees.find((e) => e.id === node.currentEmployeeId);
    const isSelected = selectedNodeId === node.id;

    // Check if occupant has reportsTo pointing to another entity (administrative dotted line)
    const isDotted = currentEntity.relationType === 'administratif';

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          onClick={() => setSelectedNodeId(node.id)}
          className={`cursor-pointer transition-all duration-200 relative p-3.5 rounded-xl border-2 w-64 shadow-xs ${
            isDotted
              ? 'border-dashed border-amber-400 bg-amber-50/40'
              : node.isVacant
              ? 'border-dashed border-rose-300 bg-rose-50/50'
              : isSelected
              ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
              : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          {isDotted && (
            <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded border border-amber-300">
              Jalur Administratif
            </span>
          )}
          {node.isVacant && (
            <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-semibold rounded border border-rose-300">
              Posisi Kosong (Vacant)
            </span>
          )}

          <div className="flex items-center gap-2.5">
            {node.isVacant ? (
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                ?
              </div>
            ) : occupant?.avatar ? (
              <img
                src={occupant.avatar}
                alt={occupant.fullName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {occupant?.fullName?.charAt(0) || 'K'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-xs truncate">
                {node.isVacant ? 'Belum Terisi' : occupant?.fullName || 'Karyawan'}
              </div>
              <div className="text-[11px] font-medium text-indigo-700 truncate">
                {node.title}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {node.department}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Level: L{node.level}</span>
            <span className="font-medium text-slate-600">
              {children.length > 0 ? `${children.length} Bawahan Langsung` : 'Individual Contributor'}
            </span>
          </div>
        </div>

        {/* Tree Connectors & Children */}
        {children.length > 0 && (
          <div className="flex flex-col items-center mt-3">
            {/* Vertical stem down */}
            <div className={`w-0.5 h-6 ${isDotted ? 'border-l-2 border-dashed border-amber-400' : 'bg-indigo-300'}`} />

            {/* Horizontal bar across children */}
            {children.length > 1 && (
              <div className={`h-0.5 ${isDotted ? 'border-t-2 border-dashed border-amber-400' : 'bg-indigo-300'} w-full max-w-[calc(100%-2rem)]`} />
            )}

            {/* Child nodes container */}
            <div className="flex items-start gap-6 mt-1">
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className={`w-0.5 h-4 ${isDotted ? 'border-l-2 border-dashed border-amber-400' : 'bg-indigo-300'}`} />
                  {renderTreeNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Entity Picker */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200">
              Modul 02B
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Struktur Organisasi & Hierarki Jabatan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hierarki posisi per entitas perusahaan (garis tebal komando resmi, garis putus-putus jalur administratif)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Entity Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg text-xs">
            <Building className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={currentEntityId}
              onChange={(e) => setCurrentEntityId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {entities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.name} ({ent.relationType === 'resmi' ? 'Resmi' : 'Administratif'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsProposalModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Usul Ubah Struktur</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Export Chart</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'chart'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Diagram Organisasi</span>
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
            {entityNodes.length} Posisi
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vacant')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'vacant'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Jabatan Kosong (Vacant)</span>
          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px]">
            {vacantPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'proposals'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Usulan Perubahan Struktur</span>
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
            {orgProposals.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Interactive Org Chart */}
      {activeTab === 'chart' && (
        <div className="bg-slate-100/60 p-6 rounded-2xl border border-slate-200 overflow-x-auto min-h-[480px]">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-600 shadow-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-0.5 bg-indigo-600 inline-block" /> Garis Solid: Komando Resmi
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" /> Garis Putus: Jalur Administratif
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Posisi Kosong
              </span>
            </div>
          </div>

          {rootNodes.length > 0 ? (
            <div className="flex justify-center gap-12">
              {rootNodes.map((root) => renderTreeNode(root))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Network className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Belum ada struktur organisasi untuk entitas ini.</p>
              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs"
              >
                Buat Posisi Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Vacant Positions */}
      {activeTab === 'vacant' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Daftar Posisi yang Terdefinisi di Struktur Tapi Belum Memiliki Karyawan
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {vacantPositions.map((pos) => {
              const supervisor = entityNodes.find((n) => n.id === pos.reportsToId);
              const supEmployee = employees.find((e) => e.id === supervisor?.currentEmployeeId);

              return (
                <div key={pos.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                      VAC
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{pos.title}</div>
                      <div className="text-xs text-slate-500">
                        Departemen: {pos.department} • Level: L{pos.level}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Lapor ke: {supervisor ? `${supervisor.title} (${supEmployee?.fullName || 'Belum terisi'})` : 'Puncak'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium">
                      Butuh Rekrutmen
                    </span>
                  </div>
                </div>
              );
            })}

            {vacantPositions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada posisi kosong saat ini. Semua posisi dalam struktur terisi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Structure Change Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Usulan Perubahan Struktur Organisasi (Memerlukan Approval & Tanggal Efektif)
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {orgProposals.map((prop) => (
                <div key={prop.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded border border-indigo-200">
                        {prop.changeType}
                      </span>
                      <div className="font-bold text-slate-900 text-sm">{prop.proposalTitle}</div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">{prop.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>Diajukan oleh: <b>{prop.proposedBy}</b></span>
                      <span>•</span>
                      <span>Tanggal Efektif Berlaku: <b>{prop.effectiveDate}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {prop.status === 'Menunggu Approval' ? (
                      <>
                        <button
                          onClick={() => reviewOrgProposal(prop.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Setujui & Jadwalkan
                        </button>
                        <button
                          onClick={() => reviewOrgProposal(prop.id, false)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        prop.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {prop.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {orgProposals.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada usulan perubahan struktur organisasi yang diajukan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Usul Ubah Struktur */}
      {isProposalModalOpen && (
        <div
          onClick={() => setIsProposalModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden cursor-default"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">
                Usulkan Perubahan Struktur Organisasi
              </div>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-5 space-y-4">
              {/* Form Validation Error Notice */}
              {proposalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{proposalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Usulan Perubahan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembentukan Sub-Divisi AI & Cloud Architecture"
                  value={proposalForm.proposalTitle}
                  onChange={(e) => {
                    setProposalForm({ ...proposalForm, proposalTitle: e.target.value });
                    if (proposalError) setProposalError(null);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Aksi Perubahan
                  </label>
                  <select
                    value={proposalForm.changeType}
                    onChange={(e) => setProposalForm({ ...proposalForm, changeType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600 bg-white"
                  >
                    <option value="Buat Posisi Baru">Buat Posisi Baru</option>
                    <option value="Pindah Atasan">Pindah Atasan / Reporting Line</option>
                    <option value="Hapus Posisi">Hapus Posisi (Likuidasi)</option>
                    <option value="Restrukturisasi Departemen">Restrukturisasi Departemen</option>
                  </select>
                </div>

                <ValidatedDateInput
                  id="orgProposalEffectiveDate"
                  label="Tanggal Efektif Berlaku *"
                  value={proposalForm.effectiveDate}
                  onChange={(val) => {
                    setProposalForm({ ...proposalForm, effectiveDate: val });
                    if (proposalError) setProposalError(null);
                  }}
                  required
                  helperText="Format YYYY-MM-DD"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Alasan Bisnis & Dampak Organisasi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan rasionalisasi beban kerja, efisiensi operasional, dan atasan yang ditunjuk..."
                  value={proposalForm.description}
                  onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Sesuai prinsip kepatuhan korporat, usulan ini akan masuk ke Approval Center Direksi dan hanya aktif secara otomatis pada tanggal efektif yang ditetapkan.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Kirim ke Approval Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

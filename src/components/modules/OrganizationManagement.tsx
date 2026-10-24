import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Network,
  Building2,
  Layers,
  Briefcase,
  Users,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Building,
  Check,
  ShieldCheck,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  GitFork,
  X,
  UserCheck,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileImage,
  FileText,
  Lock,
  Unlock,
  UploadCloud,
  Eye,
  FileCheck2,
  Award,
  History,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import {
  CompanyDivision,
  CompanyDepartment,
  OrgStructureNode,
  CompanyEntity,
  OrgChangeProposal,
  OrgStructureSnapshot,
  MasterJobPosition,
} from '../../types/hrms';
import { exportElementToPng, exportElementToPdf } from '../../utils/exportTreeHelper';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const OrganizationManagement: React.FC = () => {
  const {
    currentTenant,
    entities,
    currentEntity,
    currentEntityId,
    setCurrentEntityId,
    divisions,
    departments,
    orgNodes,
    orgProposals,
    submitOrgProposal,
    reviewOrgProposal,
    orgSnapshots,
    replaceEntityStructure,
    addDivision,
    updateDivision,
    deleteDivision,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    masterJobPositions,
    addMasterJobPosition,
    updateMasterJobPosition,
    deleteMasterJobPosition,
    assignEmployeeToPosition,
    addOrgNode,
    updateOrgNode,
    deleteOrgNode,
    employees,
    currentUser,
    isOrgGovernanceLocked,
    isEntityGovernanceLocked,
    toggleEntityGovernanceLock,
    setOrgGovernanceLocked,
    toggleEntityDepartmentLevel,
    openFilePreview,
  } = useHrms();

  // Active Main Tab: 'chart' (Diagram Organisasi) | 'corporate' (Diagram Perusahaan) | 'structure' (Divisi & Dept) | 'positions' (Master Jabatan) | 'history' (Riwayat Restrukturisasi)
  const [activeTab, setActiveTab] = useState<'chart' | 'corporate' | 'structure' | 'positions' | 'history'>('chart');

  // Zoom scales
  const [orgZoomScale, setOrgZoomScale] = useState<number>(1);
  const [corpZoomScale, setCorpZoomScale] = useState<number>(1);

  // References for export and scroll containers
  const orgChartContainerRef = useRef<HTMLDivElement>(null);
  const corpChartContainerRef = useRef<HTMLDivElement>(null);
  const orgScrollContainerRef = useRef<HTMLDivElement>(null);
  const corpScrollContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Node for Preview Modal (tidak ada opsi edit di bagan)
  const [previewPosition, setPreviewPosition] = useState<OrgStructureNode | null>(null);
  const [previewDivision, setPreviewDivision] = useState<CompanyDivision | null>(null);
  const [previewDepartment, setPreviewDepartment] = useState<CompanyDepartment | null>(null);
  const [previewMasterJobPosition, setPreviewMasterJobPosition] = useState<MasterJobPosition | null>(null);
  const [previewEntity, setPreviewEntity] = useState<CompanyEntity | null>(null);
  const [previewProposal, setPreviewProposal] = useState<OrgChangeProposal | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<OrgStructureSnapshot | null>(null);

  // Dedicated selection states (memilih entitas & posisi tanpa langsung membuka modal popup)
  const [selectedCorpEntityId, setSelectedCorpEntityId] = useState<string>(currentEntityId || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Otomatis sinkronisasi selectedCorpEntityId dengan currentEntityId
  useEffect(() => {
    if (currentEntityId) {
      setSelectedCorpEntityId(currentEntityId);
    }
  }, [currentEntityId]);

  // Sub-tab di Riwayat SK: 'proposals' (Daftar Pengajuan SK) | 'snapshots' (Arsip Snapshot Struktur Terdahulu)
  const [historySubTab, setHistorySubTab] = useState<'proposals' | 'snapshots'>('proposals');

  // Modal Penolakan Proposal
  const [isRejectingInModal, setIsRejectingInModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Restructuring vs Administrative Typo Correction Modal
  const [isRestructureModalOpen, setIsRestructureModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [proposalCategory, setProposalCategory] = useState<'organisasi' | 'perusahaan'>('organisasi');

  // Mode Draft Restrukturisasi: 'full' (Rancang Draft Lengkap: Divisi, Dept & Jabatan) vs 'single' (Perubahan Parsial Tunggal)
  const [restructureDraftMode, setRestructureDraftMode] = useState<'full' | 'single'>('full');
  const [draftActiveTab, setDraftActiveTab] = useState<'info' | 'divisions' | 'departments' | 'positions'>('info');
  const [draftDivisions, setDraftDivisions] = useState<CompanyDivision[]>([]);
  const [draftDepartments, setDraftDepartments] = useState<CompanyDepartment[]>([]);
  const [draftNodes, setDraftNodes] = useState<OrgStructureNode[]>([]);

  // Direct CRUD Modals (HANYA AKTIF KETIKA BELUM DIKUNCI / MODE SETUP)
  const [isDivisionModalOpen, setIsDivisionModalOpen] = useState(false);
  const [divisionFormData, setDivisionFormData] = useState({
    id: '',
    name: '',
    code: '',
    headTitle: 'Head of Division',
    description: '',
  });

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    id: '',
    name: '',
    code: '',
    divisionId: '',
    headTitle: 'Department Head',
    description: '',
  });

  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [positionFormData, setPositionFormData] = useState({
    id: '',
    title: '',
    level: 3,
    division: '',
    department: '',
    reportsToId: '',
    relationType: 'struktural' as 'struktural' | 'administratif',
    currentEmployeeId: '',
    isVacant: true,
    description: '',
  });

  // Sub-tab di Tab 3: Master Organisasi ('divisions' | 'departments' | 'master_positions')
  const [structureSubTab, setStructureSubTab] = useState<'divisions' | 'departments' | 'master_positions'>('divisions');
  const [masterPositionSearch, setMasterPositionSearch] = useState('');
  const [masterPositionFamilyFilter, setMasterPositionFamilyFilter] = useState('ALL');
  const [masterPositionLevelFilter, setMasterPositionLevelFilter] = useState<number | 'ALL'>('ALL');

  // Modal Master Jabatan (Kamus Jabatan)
  const [isMasterPositionModalOpen, setIsMasterPositionModalOpen] = useState(false);
  const [masterPositionFormData, setMasterPositionFormData] = useState({
    id: '',
    code: '',
    title: '',
    defaultLevel: 3,
    division: '',
    department: '',
    jobFamily: 'Teknologi & Engineering',
    jobGrade: 'Grade 08',
    description: '',
    requirements: '',
  });

  // Filter & Quick Assign Karyawan untuk Tab 4: Assign Jabatan
  const [assignStatusFilter, setAssignStatusFilter] = useState<'ALL' | 'occupied' | 'vacant'>('ALL');
  const [assignRelationFilter, setAssignRelationFilter] = useState<'ALL' | 'struktural' | 'administratif'>('ALL');
  const [assignDivisionFilter, setAssignDivisionFilter] = useState('ALL');
  const [assigningPosition, setAssigningPosition] = useState<OrgStructureNode | null>(null);
  const [selectedAssignEmployeeId, setSelectedAssignEmployeeId] = useState('');

  // Form Restrukturisasi Resmi (Ber-SK)
  const [restructureForm, setRestructureForm] = useState({
    title: '',
    changeType: 'Buat Posisi Baru' as OrgChangeProposal['changeType'],
    effectiveDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    skDocNumber: `SK-DIR/RESTRUCT/${new Date().getFullYear()}/${String(Math.floor(100 + Math.random() * 900))}`,
    skDocFileName: 'SK_Restrukturisasi_Direksi_2026.pdf',
    skDocUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    description: '',
    targetType: 'position' as 'position' | 'division' | 'department' | 'entity',
    targetPositionTitle: '',
    targetDivision: '',
    targetDepartment: '',
    targetLevel: 3,
    targetReportsToId: '',
    targetRelationType: 'struktural' as 'struktural' | 'administratif',
    targetIsVacant: true,
    targetEmployeeId: '',
    // Entity fields
    targetEntityName: '',
    targetEntityCode: '',
    targetEntityParentId: '',
    targetEntityCity: 'Jakarta Selatan',
  });

  // Form Koreksi Typo / Perbaikan Administratif Ringan (Tanpa Restrukturisasi SK)
  const [correctionForm, setCorrectionForm] = useState({
    targetId: '',
    targetType: 'position' as 'position' | 'division' | 'department' | 'entity',
    fieldToCorrect: 'title',
    correctedValue: '',
    notes: 'Perbaikan ejaan penulisan gelar dan nama posisi administratif',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scoped active entity data
  const entityNodes = useMemo(() => {
    return orgNodes.filter((n) => n.entityId === currentEntityId);
  }, [orgNodes, currentEntityId]);

  const entityDivisions = useMemo(() => {
    return divisions.filter((d) => d.entityId === currentEntityId);
  }, [divisions, currentEntityId]);

  const entityDepartments = useMemo(() => {
    return departments.filter((d) => d.entityId === currentEntityId);
  }, [departments, currentEntityId]);

  const entityMasterPositions = useMemo(() => {
    return masterJobPositions.filter((mjp) => mjp.entityId === currentEntityId);
  }, [masterJobPositions, currentEntityId]);

  const occupiedPositions = useMemo(() => entityNodes.filter((n) => !n.isVacant), [entityNodes]);
  const structuralPositions = useMemo(() => entityNodes.filter((n) => n.relationType !== 'administratif'), [entityNodes]);
  const adminPositions = useMemo(() => entityNodes.filter((n) => n.relationType === 'administratif'), [entityNodes]);

  // Root node org tree
  const rootOrgNodes = useMemo(() => {
    return entityNodes.filter((n) => !n.reportsToId || !entityNodes.some((p) => p.id === n.reportsToId));
  }, [entityNodes]);

  // Root entity tree (parentEntityId kosong)
  const rootEntities = useMemo(() => {
    return entities.filter((e) => !e.parentEntityId || !entities.some((p) => p.id === e.parentEntityId));
  }, [entities]);

  // Tree-ordered entities for select dropdown (konsisten dengan top menu/header)
  const treeOrderedEntities = useMemo(() => {
    const result: { entity: CompanyEntity; prefix: string; depth: number }[] = [];

    const traverse = (parentId?: string, depth: number = 0) => {
      const children = entities.filter((e) =>
        (!parentId && (!e.parentEntityId || !entities.some((p) => p.id === e.parentEntityId))) ||
        (parentId && e.parentEntityId === parentId)
      );

      for (const child of children) {
        let prefix = '';
        if (depth === 0) {
          prefix = '🏢 ';
        } else if (depth === 1) {
          prefix = '  ↳ 🏭 ';
        } else {
          prefix = '    ↳ 🏪 ';
        }
        result.push({ entity: child, prefix, depth });
        traverse(child.id, depth + 1);
      }
    };

    traverse(undefined, 0);
    return result.length > 0 ? result : entities.map((e) => ({ entity: e, prefix: '🏢 ', depth: 0 }));
  }, [entities]);

  const vacantPositions = useMemo(() => {
    return entityNodes.filter((n) => n.isVacant);
  }, [entityNodes]);

  const useDeptLevel = currentEntity?.useDepartmentLevel ?? true;
  const currentEntityLocked = isEntityGovernanceLocked(currentEntityId);

  // Selected entity for previewing tree below corporate diagram
  const corpSelectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedCorpEntityId) || currentEntity;
  }, [entities, selectedCorpEntityId, currentEntity]);

  const corpSelectedEntityNodes = useMemo(() => {
    return orgNodes.filter((n) => n.entityId === corpSelectedEntity.id);
  }, [orgNodes, corpSelectedEntity.id]);

  const corpSelectedEntityRootNodes = useMemo(() => {
    return corpSelectedEntityNodes.filter(
      (n) => !n.reportsToId || !corpSelectedEntityNodes.some((p) => p.id === n.reportsToId)
    );
  }, [corpSelectedEntityNodes]);

  const corpSelectedEntityEmployees = useMemo(() => {
    return employees.filter((e) => e.company === corpSelectedEntity.name || e.entityId === corpSelectedEntity.id);
  }, [employees, corpSelectedEntity]);

  const selectedNode = useMemo(() => {
    return orgNodes.find((n) => n.id === selectedNodeId) || null;
  }, [orgNodes, selectedNodeId]);

  const selectedNodeOccupant = useMemo(() => {
    if (!selectedNode?.currentEmployeeId) return null;
    return employees.find((e) => e.id === selectedNode.currentEmployeeId) || null;
  }, [selectedNode, employees]);

  // Zoom Reset and Center Handlers
  const handleResetOrgZoom = () => {
    setOrgZoomScale(1);
    if (orgScrollContainerRef.current) {
      const el = orgScrollContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        el.scrollTo({ left: maxScroll / 2, behavior: 'smooth' });
      }
    }
  };

  const handleResetCorpZoom = () => {
    setCorpZoomScale(1);
    if (corpScrollContainerRef.current) {
      const el = corpScrollContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll > 0) {
        el.scrollTo({ left: maxScroll / 2, behavior: 'smooth' });
      }
    }
  };

  // Center horizontal scroll on initial tab render or entity switch
  useEffect(() => {
    if (activeTab === 'chart' && orgScrollContainerRef.current) {
      const timer = setTimeout(() => {
        const el = orgScrollContainerRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          el.scrollLeft = maxScroll / 2;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentEntityId]);

  useEffect(() => {
    if (activeTab === 'corporate' && corpScrollContainerRef.current) {
      const timer = setTimeout(() => {
        const el = corpScrollContainerRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          el.scrollLeft = maxScroll / 2;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Export handlers
  const handleExportOrgPng = async () => {
    if (!orgChartContainerRef.current) return;
    setIsExporting(true);
    showToast('Sedang membuat file gambar PNG diagram organisasi...');
    await exportElementToPng(orgChartContainerRef.current, `Diagram_Organisasi_${currentEntity.code}_${Date.now()}.png`);
    setIsExporting(false);
  };

  const handleExportOrgPdf = async () => {
    if (!orgChartContainerRef.current) return;
    setIsExporting(true);
    showToast('Sedang merender dokumen PDF diagram organisasi...');
    await exportElementToPdf(orgChartContainerRef.current, `Diagram_Organisasi_${currentEntity.code}_${Date.now()}.pdf`);
    setIsExporting(false);
  };

  const handleExportCorpPng = async () => {
    if (!corpChartContainerRef.current) return;
    setIsExporting(true);
    showToast('Sedang membuat file gambar PNG diagram korporasi...');
    await exportElementToPng(corpChartContainerRef.current, `Diagram_Perusahaan_${currentTenant.code}_${Date.now()}.png`);
    setIsExporting(false);
  };

  const handleExportCorpPdf = async () => {
    if (!corpChartContainerRef.current) return;
    setIsExporting(true);
    showToast('Sedang merender dokumen PDF diagram korporasi...');
    await exportElementToPdf(corpChartContainerRef.current, `Diagram_Perusahaan_${currentTenant.code}_${Date.now()}.pdf`);
    setIsExporting(false);
  };

  // Open Restructuring modal with initialized draft
  const handleOpenRestructureModal = () => {
    setDraftDivisions(entityDivisions.map((d) => ({ ...d })));
    setDraftDepartments(entityDepartments.map((d) => ({ ...d })));
    setDraftNodes(entityNodes.map((n) => ({ ...n })));
    setRestructureDraftMode('full');
    setDraftActiveTab('info');
    setRestructureForm((prev) => ({
      ...prev,
      title: `Restrukturisasi Organisasi ${currentEntity.name} ${new Date().getFullYear()}`,
      changeType: 'Restrukturisasi Menyeluruh (Draft Baru)' as any,
    }));
    setIsRestructureModalOpen(true);
  };

  // Direct CRUD Handlers (Only active when !currentEntityLocked)
  const handleSubmitDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!divisionFormData.name.trim() || !divisionFormData.code.trim()) return;
    if (divisionFormData.id) {
      updateDivision(divisionFormData.id, {
        name: divisionFormData.name.trim(),
        code: divisionFormData.code.trim().toUpperCase(),
        headTitle: divisionFormData.headTitle.trim(),
        description: divisionFormData.description.trim(),
      });
      showToast(`Divisi ${divisionFormData.name} berhasil diperbarui.`);
    } else {
      addDivision({
        entityId: currentEntityId,
        name: divisionFormData.name.trim(),
        code: divisionFormData.code.trim().toUpperCase(),
        headTitle: divisionFormData.headTitle.trim(),
        description: divisionFormData.description.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      });
      showToast(`Divisi baru ${divisionFormData.name} berhasil ditambahkan.`);
    }
    setIsDivisionModalOpen(false);
  };

  const handleSubmitDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentFormData.name.trim() || !departmentFormData.code.trim()) return;
    if (departmentFormData.id) {
      updateDepartment(departmentFormData.id, {
        name: departmentFormData.name.trim(),
        code: departmentFormData.code.trim().toUpperCase(),
        divisionId: departmentFormData.divisionId || entityDivisions[0]?.id || '',
        headTitle: departmentFormData.headTitle.trim(),
        description: departmentFormData.description.trim(),
      });
      showToast(`Departemen ${departmentFormData.name} berhasil diperbarui.`);
    } else {
      addDepartment({
        entityId: currentEntityId,
        divisionId: departmentFormData.divisionId || entityDivisions[0]?.id || '',
        name: departmentFormData.name.trim(),
        code: departmentFormData.code.trim().toUpperCase(),
        headTitle: departmentFormData.headTitle.trim(),
        description: departmentFormData.description.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      });
      showToast(`Departemen baru ${departmentFormData.name} berhasil ditambahkan.`);
    }
    setIsDepartmentModalOpen(false);
  };

  const handleSubmitPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionFormData.title.trim()) return;
    if (positionFormData.id) {
      updateOrgNode(positionFormData.id, {
        title: positionFormData.title.trim(),
        level: Number(positionFormData.level),
        division: positionFormData.division,
        department: useDeptLevel ? positionFormData.department : 'Direct to Division',
        reportsToId: positionFormData.reportsToId || undefined,
        relationType: positionFormData.relationType || 'struktural',
        currentEmployeeId: positionFormData.isVacant ? undefined : (positionFormData.currentEmployeeId || undefined),
        isVacant: positionFormData.isVacant,
        description: positionFormData.description.trim(),
      });
      showToast(`Posisi jabatan ${positionFormData.title} berhasil diperbarui.`);
    } else {
      addOrgNode({
        entityId: currentEntityId,
        title: positionFormData.title.trim(),
        level: Number(positionFormData.level),
        division: positionFormData.division || entityDivisions[0]?.name || currentEntity.name,
        department: useDeptLevel ? (positionFormData.department || entityDepartments[0]?.name || 'Umum') : 'Direct to Division',
        reportsToId: positionFormData.reportsToId || undefined,
        relationType: positionFormData.relationType || 'struktural',
        currentEmployeeId: positionFormData.isVacant ? undefined : (positionFormData.currentEmployeeId || undefined),
        isVacant: positionFormData.isVacant,
        description: positionFormData.description.trim(),
      });
      showToast(`Posisi jabatan baru ${positionFormData.title} berhasil ditambahkan.`);
    }
    setIsPositionModalOpen(false);
  };

  // Handlers untuk Master Jabatan (Kamus Jabatan)
  const handleSubmitMasterPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPositionFormData.title.trim()) return;

    if (masterPositionFormData.id) {
      updateMasterJobPosition(masterPositionFormData.id, {
        code: masterPositionFormData.code.trim() || `JAB-${Date.now().toString().slice(-4)}`,
        title: masterPositionFormData.title.trim(),
        defaultLevel: Number(masterPositionFormData.defaultLevel),
        division: masterPositionFormData.division || undefined,
        department: masterPositionFormData.department || undefined,
        jobFamily: masterPositionFormData.jobFamily,
        jobGrade: masterPositionFormData.jobGrade,
        description: masterPositionFormData.description.trim(),
        requirements: masterPositionFormData.requirements.trim(),
      });
      showToast(`Master Jabatan ${masterPositionFormData.title} berhasil diperbarui.`);
    } else {
      addMasterJobPosition({
        entityId: currentEntityId,
        code: masterPositionFormData.code.trim() || `JAB-${Date.now().toString().slice(-4)}`,
        title: masterPositionFormData.title.trim(),
        defaultLevel: Number(masterPositionFormData.defaultLevel),
        division: masterPositionFormData.division || undefined,
        department: masterPositionFormData.department || undefined,
        jobFamily: masterPositionFormData.jobFamily,
        jobGrade: masterPositionFormData.jobGrade,
        description: masterPositionFormData.description.trim(),
        requirements: masterPositionFormData.requirements.trim(),
      });
      showToast(`Master Jabatan baru ${masterPositionFormData.title} berhasil didaftarkan ke katalog.`);
    }
    setIsMasterPositionModalOpen(false);
  };

  // Handler Quick Assign Karyawan ke Formasi Kursi
  const handleSaveQuickAssignment = () => {
    if (!assigningPosition) return;
    assignEmployeeToPosition(assigningPosition.id, selectedAssignEmployeeId || null);
    const emp = employees.find((e) => e.id === selectedAssignEmployeeId);
    showToast(
      selectedAssignEmployeeId
        ? `Karyawan ${emp?.fullName || ''} berhasil ditetapkan menduduki posisi ${assigningPosition.title}.`
        : `Formasi posisi ${assigningPosition.title} telah dikosongkan (Vacant).`
    );
    setAssigningPosition(null);
    setSelectedAssignEmployeeId('');
  };

  // Handler Auto-fill formasi kursi dari Master Jabatan
  const handleSelectMasterJobForPosition = (mjpOrId: string | MasterJobPosition) => {
    const selectedMjp =
      typeof mjpOrId === 'string'
        ? entityMasterPositions.find((m) => m.id === mjpOrId)
        : mjpOrId;
    if (selectedMjp) {
      setPositionFormData((prev) => ({
        ...prev,
        title: selectedMjp.title,
        level: selectedMjp.defaultLevel,
        division: selectedMjp.division || prev.division || entityDivisions[0]?.name || currentEntity.name,
        department: useDeptLevel ? (selectedMjp.department || prev.department || entityDepartments[0]?.name || 'Umum') : 'Direct to Division',
        description: selectedMjp.description || prev.description,
      }));
    }
  };

  // Submit Restructuring Proposal
  const handleSubmitRestructuring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restructureForm.title.trim() || !restructureForm.skDocNumber.trim()) return;

    let payload: any = null;

    if (restructureDraftMode === 'full') {
      payload = {
        type: 'full_restructure',
        newDivisions: draftDivisions,
        newDepartments: draftDepartments,
        newNodes: draftNodes,
      };
    } else if (restructureForm.targetType === 'position') {
      if (restructureForm.changeType === 'Buat Posisi Baru') {
        payload = {
          type: 'create_position',
          data: {
            entityId: currentEntityId,
            title: restructureForm.targetPositionTitle.trim() || restructureForm.title.trim(),
            division: restructureForm.targetDivision || entityDivisions[0]?.name || 'Human Capital & Culture',
            department: useDeptLevel ? (restructureForm.targetDepartment || 'General Affairs') : 'Direct to Division',
            level: Number(restructureForm.targetLevel),
            reportsToId: restructureForm.targetReportsToId || undefined,
            relationType: restructureForm.targetRelationType || 'struktural',
            currentEmployeeId: restructureForm.targetIsVacant ? undefined : (restructureForm.targetEmployeeId || undefined),
            isVacant: restructureForm.targetIsVacant,
          },
        };
      } else if (restructureForm.changeType === 'Hapus Posisi') {
        payload = {
          type: 'delete_position',
          id: restructureForm.targetReportsToId,
        };
      }
    } else if (restructureForm.targetType === 'entity') {
      payload = {
        type: 'create_entity',
        data: {
          name: restructureForm.targetEntityName.trim() || restructureForm.title.trim(),
          code: restructureForm.targetEntityCode.toUpperCase().trim() || 'NEW-ENT',
          level: 'anak',
          parentEntityId: restructureForm.targetEntityParentId || entities[0]?.id,
          relationType: 'resmi',
          address: 'Gedung Menara Mandiri Lt. 12',
          city: restructureForm.targetEntityCity,
          npwp: '01.999.888.7-012.000',
          nikPattern: '{ENTITY}-{YYYY}-{SEQ:4}',
          docPrefix: 'CORP',
          status: 'Aktif',
          useDepartmentLevel: true,
        },
      };
    }

    submitOrgProposal({
      entityId: currentEntityId,
      category: proposalCategory,
      proposalTitle: restructureForm.title.trim(),
      changeType: restructureDraftMode === 'full' ? 'Restrukturisasi Menyeluruh (Draft Baru)' : restructureForm.changeType,
      description: restructureForm.description.trim(),
      effectiveDate: restructureForm.effectiveDate,
      skDocNumber: restructureForm.skDocNumber.trim(),
      skDocFileName: restructureForm.skDocFileName,
      skDocUrl: restructureForm.skDocUrl,
      proposedBy: currentUser.name,
      isCorrectionOnly: false,
      payload,
    });

    setIsRestructureModalOpen(false);
    showToast(
      currentEntityLocked
        ? `Usulan restrukturisasi [SK: ${restructureForm.skDocNumber}] berhasil diajukan untuk persetujuan Direksi.`
        : `Restrukturisasi berhasil diterapkan langsung efektif per ${restructureForm.effectiveDate}. Struktur lama diarsipkan ke Snapshot.`
    );
  };

  // Submit Typo / Administrative Correction
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.correctedValue.trim()) return;

    let payload: any = null;
    if (correctionForm.targetType === 'position' && previewPosition) {
      payload = {
        type: 'update_position',
        id: previewPosition.id,
        data: {
          title: correctionForm.correctedValue.trim(),
        },
      };
    }

    submitOrgProposal({
      entityId: currentEntityId,
      category: 'organisasi',
      proposalTitle: `Koreksi Typo / Administratif: ${correctionForm.correctedValue.trim()}`,
      changeType: 'Koreksi Typo / Administratif',
      description: correctionForm.notes,
      effectiveDate: new Date().toISOString().split('T')[0],
      proposedBy: currentUser.name,
      isCorrectionOnly: true,
      payload,
    });

    setIsCorrectionModalOpen(false);
    showToast('Perbaikan administratif berhasil diterapkan dan dicatat pada riwayat.');
  };

  // ----------------------------------------------------
  // PRECISE CSS TREE CONNECTOR RENDERER (NO OFFSET, NO GAP, TABLET FRIENDLY)
  // ----------------------------------------------------
  const renderOrgNode = (node: OrgStructureNode, level: number = 0, nodePool?: OrgStructureNode[]) => {
    const currentPool = nodePool || entityNodes;
    const children = currentPool.filter((n) => n.reportsToId === node.id);
    const occupant = employees.find((e) => e.id === node.currentEmployeeId);
    const isNodeDotted = node.relationType === 'administratif';
    const isSelected = node.id === selectedNodeId;

    return (
      <div key={node.id} className="flex flex-col items-center shrink-0">
        {/* Node Card - Klik untuk select & highlight, tombol Preview / double-click untuk membuka modal */}
        <div
          onClick={() => setSelectedNodeId((prev) => (prev === node.id ? null : node.id))}
          onDoubleClick={() => setPreviewPosition(node)}
          className={`cursor-pointer transition-all duration-200 relative p-3 rounded-xl border-2 w-64 shrink-0 shadow-xs text-left group select-none hover:scale-[1.02] ${
            isSelected
              ? 'border-indigo-600 ring-4 ring-indigo-200 shadow-md bg-indigo-50/40'
              : node.isVacant
              ? 'border-dashed border-rose-300 bg-rose-50/60 hover:bg-rose-100/60'
              : isNodeDotted
              ? 'border-dashed border-amber-400 bg-amber-50/70 hover:bg-amber-100/70'
              : 'border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md'
          }`}
        >
          {/* Badge Level & Okupansi & Tipe Relasi */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              L{node.level} • {node.level === 1 ? 'Direksi' : node.level === 2 ? 'VP / Head' : node.level === 3 ? 'Manager' : node.level === 4 ? 'Supervisor' : 'Staff'}
            </span>

            {node.isVacant ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded">
                Vacant (Kosong)
              </span>
            ) : isNodeDotted ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Dotted Line
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Terisi
              </span>
            )}
          </div>

          {/* Occupant Avatar & Info */}
          <div className="flex items-center gap-2.5">
            {node.isVacant ? (
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0 shadow-2xs">
                ?
              </div>
            ) : occupant?.avatar ? (
              <img
                src={occupant.avatar}
                alt={occupant.fullName}
                className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {occupant?.fullName?.charAt(0) || 'K'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 text-xs truncate">
                {node.isVacant ? 'Posisi Belum Terisi' : occupant?.fullName}
              </div>
              <div className={`text-[11px] font-semibold truncate ${isNodeDotted ? 'text-amber-800' : 'text-indigo-700'}`}>
                {node.title}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {node.division || currentEntity.name} {useDeptLevel && node.department && node.department !== 'Direct to Division' ? `• ${node.department}` : ''}
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className={isNodeDotted ? 'text-amber-700 font-medium' : node.isVacant ? 'text-rose-600 font-medium' : 'text-slate-400'}>
              {isNodeDotted ? 'Koordinasi Administratif' : node.isVacant ? 'Formatur Rekrutmen' : occupant?.nik ? `NIK: ${occupant.nik}` : 'Komando Struktural'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewPosition(node);
              }}
              className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-indigo-50 transition-colors"
              title="Buka Modal Pratinjau Detail Posisi"
            >
              <span>Preview</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Precise Mathematical Tree Connector System */}
        {children.length > 0 && (
          <div className="flex flex-col items-center w-full shrink-0">
            {/* Garis vertikal lurus turun dari parent */}
            <div className="w-0.5 h-6 bg-slate-400" />

            {/* Container baris horizontal anak-anak */}
            <div className="flex justify-center items-start shrink-0">
              {children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                const isOnly = children.length === 1;
                const isChildDotted = child.relationType === 'administratif';

                return (
                  <div key={child.id} className="relative flex flex-col items-center px-3 sm:px-4 shrink-0">
                    {/* Garis horizontal penghubung antar-anak */}
                    {!isOnly && (
                      <div
                        className={`absolute top-0 h-0.5 ${
                          isChildDotted ? 'border-t-2 border-dashed border-amber-500' : 'bg-slate-400'
                        } ${
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                        }`}
                      />
                    )}

                    {/* Garis vertikal lurus turun ke node anak */}
                    <div
                      className={`w-0.5 h-6 ${
                        isChildDotted ? 'border-l-2 border-dashed border-amber-500' : 'bg-slate-400'
                      }`}
                    />

                    {/* Render Node Anak secara rekursif */}
                    {renderOrgNode(child, level + 1, currentPool)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // PRECISE CORPORATE ENTITY TREE RENDERER
  // ----------------------------------------------------
  const renderCorpNode = (ent: CompanyEntity, level: number = 0) => {
    const childEntities = entities.filter((e) => e.parentEntityId === ent.id);
    const isSelected = ent.id === corpSelectedEntity.id;
    const entEmployees = employees.filter((e) => e.company === ent.name || e.entityId === ent.id);
    const entDivisions = divisions.filter((d) => d.entityId === ent.id);
    const entDepartments = departments.filter((d) => d.entityId === ent.id);
    const hasDept = ent.useDepartmentLevel ?? true;
    const isEntLocked = isEntityGovernanceLocked(ent.id);

    return (
      <div key={ent.id} className="flex flex-col items-center shrink-0">
        {/* Entity Card - Klik untuk memilih entitas & melihat Bagan Struktur di bawah */}
        <div
          onClick={() => {
            setSelectedCorpEntityId(ent.id);
            setCurrentEntityId(ent.id);
          }}
          className={`cursor-pointer transition-all duration-200 relative p-4 rounded-xl border-2 w-84 sm:w-96 shrink-0 shadow-xs text-left group select-none hover:scale-[1.01] bg-white ${
            isSelected
              ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-md bg-gradient-to-b from-indigo-50/40 to-white'
              : 'border-slate-200 hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          {/* Header Code, Shareholding & Entity Lock Status */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 shrink-0">
              {ent.code}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                ent.relationType === 'resmi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {ent.relationType === 'resmi' ? 'Saham >50%' : 'Afiliasi'}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border shrink-0 ${
                isEntLocked
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`} title={isEntLocked ? 'Entitas ini dalam Mode Tata Kelola Resmi (Wajib SK)' : 'Entitas ini dalam Mode Setup Awal (Bebas Edit)'}>
                {isEntLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                <span>{isEntLocked ? 'Locked' : 'Setup'}</span>
              </span>
            </div>
          </div>

          <div className="font-bold text-slate-900 text-sm leading-snug">{ent.name}</div>
          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{ent.address}, {ent.city}</div>

          {/* Data Utama Holding: NPWP Legal Perusahaan */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              NPWP:
            </span>
            <code className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {ent.npwp}
            </code>
          </div>

          {/* Data Penting Holding: Domisili Hukum & Prefix Persuratan Legal */}
          <div className="flex items-center justify-between pt-1.5 text-[11px]">
            <span className="text-slate-400">Domisili Hukum:</span>
            <span className="font-semibold text-slate-700">{ent.city}</span>
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[11px]">
            <span className="text-slate-400">Prefix Surat Legal:</span>
            <code className="font-mono font-bold text-indigo-700">{ent.docPrefix}</code>
          </div>

          {/* Grid Informasi Utama: Total Karyawan, Divisi, dan Departemen (jika ada) */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Karyawan</div>
              <div className="font-bold text-slate-900 font-mono text-xs">{entEmployees.length}</div>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <div className="text-[9px] text-slate-400 uppercase font-semibold">Divisi</div>
              <div className="font-bold text-slate-900 font-mono text-xs">{entDivisions.length}</div>
            </div>
            {hasDept ? (
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <div className="text-[9px] text-slate-400 uppercase font-semibold">Departemen</div>
                <div className="font-bold text-slate-900 font-mono text-xs">{entDepartments.length}</div>
              </div>
            ) : (
              <div className="bg-amber-50/70 p-1 rounded-lg border border-amber-200/60 flex flex-col justify-center">
                <div className="text-[9px] text-amber-800 font-bold leading-tight">Ramping</div>
                <div className="text-[8px] text-amber-600">Tanpa Dept</div>
              </div>
            )}
          </div>

          {/* Footer Card: Klik card memilih entitas, tombol Detail membuka modal */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold flex items-center gap-1 ${
                isSelected ? 'text-indigo-700 font-bold' : 'text-slate-600 group-hover:text-indigo-600'
              }`}>
                {isSelected ? '✓ Sedang Dipilih' : 'Klik untuk Pilih'}
              </span>
              <span className="text-[10px] text-slate-400">↓ Bagan di bawah</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewEntity(ent);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-bold transition-colors flex items-center gap-1 text-[11px]"
              title="Buka Modal Detail Profil Entitas"
            >
              <Eye className="w-3 h-3 text-indigo-600" />
              <span>Detail</span>
            </button>
          </div>
        </div>

        {/* Tree Connectors for Children Entities */}
        {childEntities.length > 0 && (
          <div className="flex flex-col items-center w-full shrink-0">
            <div className="w-0.5 h-6 bg-slate-400" />

            <div className="flex justify-center items-start shrink-0">
              {childEntities.map((childEnt, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === childEntities.length - 1;
                const isOnly = childEntities.length === 1;

                return (
                  <div key={childEnt.id} className="relative flex flex-col items-center px-3 sm:px-4 shrink-0">
                    {!isOnly && (
                      <div
                        className={`absolute top-0 h-0.5 bg-slate-400 ${
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                        }`}
                      />
                    )}

                    <div className="w-0.5 h-6 bg-slate-400" />
                    {renderCorpNode(childEnt, level + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Header Bar (Tanpa Button Cetak Bagan & Tanpa Button Tambah Posisi Sesuai Permintaan) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-200 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" />
              Tata Kelola Struktur Organisasi
            </span>
            <span className="text-xs text-slate-400">• ISO 9001 Governance</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
            Bagan Organisasi, Divisi & Hierarki Perusahaan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi hierarki organisasi dan diagram relasi perusahaan dengan sistem tata kelola perubahan berbasis SK Restrukturisasi resmi.
          </p>
        </div>

        {/* Entity Selector & Governance Status Indicator (Responsive Tree Select for Mobile & Tablet) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto min-w-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs w-full sm:w-[280px] md:w-[320px] lg:w-[360px] min-w-0 shadow-2xs">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={currentEntityId}
              onChange={(e) => setCurrentEntityId(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer truncate text-xs min-w-0"
              title="Pilih Entitas Aktif"
            >
              {treeOrderedEntities.map(({ entity: ent, prefix }) => (
                <option key={ent.id} value={ent.id}>
                  {prefix}{ent.name} ({ent.code})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Restrukturisasi Button */}
          <button
            type="button"
            onClick={() => {
              setProposalCategory(activeTab === 'corporate' ? 'perusahaan' : 'organisasi');
              setIsRestructureModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 w-full sm:w-auto"
          >
            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
            <span>Ajukan Restrukturisasi Resmi (SK)</span>
          </button>
        </div>
      </div>

      {/* State Switch: Mode Setup Awal vs Tata Kelola Resmi Ber-SK (Spesifik per Entitas Aktif) */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
        currentEntityLocked
          ? 'bg-slate-900 text-white border-slate-800'
          : 'bg-amber-50 text-amber-950 border-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            currentEntityLocked ? 'bg-indigo-600 text-white' : 'bg-amber-200 text-amber-800'
          }`}>
            {currentEntityLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                currentEntityLocked ? 'text-indigo-300' : 'text-amber-900'
              }`}>
                {currentEntityLocked
                  ? `Tata Kelola Resmi Aktif: ${currentEntity.name}`
                  : `Mode Setup Awal Aktif: ${currentEntity.name}`}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                currentEntityLocked ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' : 'bg-amber-200 text-amber-900 border border-amber-300'
              }`}>
                {currentEntity.code}
              </span>
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${currentEntityLocked ? 'text-slate-300' : 'text-amber-800'}`}>
              {currentEntityLocked
                ? `Struktur organisasi ${currentEntity.name} telah dikunci. Setiap penambahan/perubahan divisi, departemen, dan posisi wajib menyertakan SK Restrukturisasi resmi.`
                : `Entitas ${currentEntity.name} saat ini dalam mode setup baseline awal. Anda leluasa mengatur struktur tanpa persetujuan SK sebelum memberlakukan kebijakan resmi.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            toggleEntityGovernanceLock(currentEntityId);
            showToast(
              !currentEntityLocked
                ? `Struktur ${currentEntity.name} berhasil dikunci. Tata kelola ber-SK resmi sekarang berlaku.`
                : `Mode setup awal dibuka untuk entitas ${currentEntity.name}.`
            );
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
            currentEntityLocked
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
          }`}
        >
          {currentEntityLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{currentEntityLocked ? `Buka Kunci Setup (${currentEntity.code})` : `Kunci Baseline (${currentEntity.code})`}</span>
        </button>
      </div>

      {/* Tabs Sub-Menu Navigation Bar (Consistent with Other HRMS Modules) */}
      <ScrollableTabNav>
        <button
          type="button"
          onClick={() => setActiveTab('chart')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'chart'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Diagram Organisasi</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'chart'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {entityNodes.length} Posisi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('corporate')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'corporate'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Diagram Perusahaan</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'corporate'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {entities.length} Entitas
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structure')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'structure'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Master Divisi, Dept & Jabatan</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'structure'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {entityDivisions.length} Divisi • {entityMasterPositions.length} Jabatan
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'positions'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assign Jabatan / Posisi</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'positions'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {entityNodes.length} Formasi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Restrukturisasi & SK</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {orgProposals.length} Dokumen
          </span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: DIAGRAM ORGANISASI (PRESISI TANPA POTONG KIRI DENGAN EXPORT PDF/PNG) */}
      {activeTab === 'chart' && (
        <div className="bg-slate-100/70 rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[580px] shadow-xs">
          {/* Controls Bar: Legend, Zoom In, Zoom Out, Reset, Export PNG, Export PDF */}
          <div className="p-4 bg-white border-b border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                <span className="w-3.5 h-0.5 bg-slate-400 inline-block" /> Komando Struktural Resmi ({entityNodes.filter((n) => n.relationType !== 'administratif').length})
              </span>
              <span className="flex items-center gap-1.5 font-medium bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-300">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" /> Koordinasi Administratif ({entityNodes.filter((n) => n.relationType === 'administratif').length})
              </span>
              <span className="flex items-center gap-1.5 font-medium bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Posisi Kosong ({vacantPositions.length})
              </span>
            </div>

            {/* Zoom Controls + Export PDF / PNG */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setOrgZoomScale((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono px-1.5 font-bold text-slate-700 text-xs">
                {Math.round(orgZoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setOrgZoomScale((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetOrgZoom}
                className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-600 border-r pr-2 transition-colors"
                title="Reset Zoom & Pusatkan Tampilan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Pusatkan</span>
              </button>

              {/* Export PNG */}
              <button
                type="button"
                onClick={handleExportOrgPng}
                disabled={isExporting}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                title="Download Bagan Format PNG Beresolusi Tinggi"
              >
                <FileImage className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export PNG</span>
              </button>

              {/* Export PDF */}
              <button
                type="button"
                onClick={handleExportOrgPdf}
                disabled={isExporting}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                title="Download Bagan Format Dokumen PDF Landscape"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Org Tree Scrollable Viewport: min-w-full w-max mx-auto px-6 sm:px-12 md:px-16 prevents left-clipping */}
          <div
            ref={orgScrollContainerRef}
            className="flex-1 overflow-auto p-4 sm:p-6 relative touch-pan-x touch-pan-y"
          >
            <div className="min-w-full w-max mx-auto flex flex-col items-center px-6 sm:px-12 md:px-16 py-8">
              <div
                ref={orgChartContainerRef}
                style={{ transform: `scale(${orgZoomScale})`, transformOrigin: 'top center' }}
                className="transition-transform duration-200 flex flex-col items-center"
              >
                {rootOrgNodes.length > 0 ? (
                  <div className="flex items-start gap-12 pb-16">
                    {rootOrgNodes.map((root) => renderOrgNode(root))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <Network className="w-12 h-12 mx-auto mb-2 opacity-40 text-indigo-500" />
                    <p className="text-sm font-semibold text-slate-700">Belum ada posisi jabatan terdaftar untuk entitas ini.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Selection Bar for Selected Node in Tab 1 */}
            {selectedNode && (
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-between gap-3 border border-slate-800 m-4 animate-in fade-in shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold mr-2 text-white">{selectedNode.title}</span>
                    <span className="text-[11px] text-slate-300">
                      ({selectedNodeOccupant?.fullName || 'Posisi Kosong / Vacant'}) • Level {selectedNode.level} {selectedNode.relationType === 'administratif' ? '• Dotted Line' : '• Komando Struktural'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewPosition(selectedNode)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Posisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Batal Pilih"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIAGRAM PERUSAHAAN (POHON RELASI ENTITAS DENGAN EXPORT PDF/PNG) */}
      {activeTab === 'corporate' && (
        <div className="space-y-6">
          <div className="bg-slate-100/70 rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[580px] shadow-xs">
            {/* Controls Bar */}
            <div className="p-4 bg-white border-b border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Diagram Perusahaan & Pohon Struktur Relasi</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Klik kotak perusahaan untuk <b>memilih & menampilkan pratinjau Bagan Struktur Organisasinya</b> di bawah. Klik tombol <b>Detail</b> jika ingin membuka modal profil entitas lengkap.
                </p>
              </div>

              {/* Zoom Controls + Export PDF / PNG */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs shadow-xs">
                <button
                  type="button"
                  onClick={() => setCorpZoomScale((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono px-1.5 font-bold text-slate-700 text-xs">
                  {Math.round(corpZoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setCorpZoomScale((z) => Math.min(1.6, Number((z + 0.1).toFixed(1))))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetCorpZoom}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-600 border-r pr-2 transition-colors"
                  title="Reset Zoom & Pusatkan Tampilan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-medium">Pusatkan</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCorpPng}
                  disabled={isExporting}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  title="Download Bagan Entitas Format PNG"
                >
                  <FileImage className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCorpPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  title="Download Bagan Entitas Format PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Corporate Tree Scrollable Viewport */}
            <div
              ref={corpScrollContainerRef}
              className="flex-1 overflow-auto p-4 sm:p-6 relative touch-pan-x touch-pan-y"
            >
              <div className="min-w-full w-max mx-auto flex flex-col items-center px-6 sm:px-12 md:px-16 py-8">
                <div
                  ref={corpChartContainerRef}
                  style={{ transform: `scale(${corpZoomScale})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-200 flex flex-col items-center"
                >
                  {rootEntities.length > 0 ? (
                    <div className="flex items-start gap-12 pb-16">
                      {rootEntities.map((rootEnt) => renderCorpNode(rootEnt))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-400">
                      <Building className="w-12 h-12 mx-auto mb-2 opacity-40 text-indigo-500" />
                      <p className="text-sm font-semibold text-slate-700">Belum ada entitas perusahaan terdaftar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW TREE ORGANISASI DI BAWAH DIAGRAM PERUSAHAAN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-200 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5" />
                    Pratinjau Struktur Organisasi Entitas
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {corpSelectedEntity.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isEntityGovernanceLocked(corpSelectedEntity.id)
                      ? 'bg-slate-900 text-white border-slate-800'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isEntityGovernanceLocked(corpSelectedEntity.id) ? '🔒 Tata Kelola SK' : '🔓 Setup Awal'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Bagan Struktur: {corpSelectedEntity.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Pohon komando jabatan yang dinaungi oleh entitas yang dipilih pada diagram perusahaan di atas.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-3">
                  <span><b>{corpSelectedEntityEmployees.length}</b> Karyawan</span>
                  <span>•</span>
                  <span><b>{corpSelectedEntityNodes.length}</b> Posisi Jabatan</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewEntity(corpSelectedEntity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                  title="Buka Modal Detail Profil Entitas"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentEntityId(corpSelectedEntity.id);
                    setActiveTab('chart');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Buka Penuh di Diagram Organisasi</span>
                </button>
              </div>
            </div>

            {/* Canvas Preview Tree */}
            <div className="bg-slate-100/70 rounded-xl border border-slate-200 overflow-x-auto min-h-[340px] p-6 flex justify-center items-start touch-pan-x touch-pan-y">
              {corpSelectedEntityRootNodes.length > 0 ? (
                <div className="min-w-full w-max flex justify-center py-6">
                  <div className="flex items-start gap-12 pb-6">
                    {corpSelectedEntityRootNodes.map((root) => renderOrgNode(root, 0, corpSelectedEntityNodes))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 m-auto">
                  <Network className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
                  <p className="text-xs font-bold text-slate-700">Belum ada struktur posisi jabatan untuk {corpSelectedEntity.name}.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol <b>Buka Penuh di Diagram Organisasi</b> untuk mengatur posisi jabatan entitas ini.
                  </p>
                </div>
              )}
            </div>

            {/* Floating Selection Bar for Selected Node in Tab 2 Preview */}
            {selectedNode && (
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-between gap-3 border border-slate-800 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold mr-2 text-white">{selectedNode.title}</span>
                    <span className="text-[11px] text-slate-300">
                      ({selectedNodeOccupant?.fullName || 'Posisi Kosong / Vacant'}) • Level {selectedNode.level} {selectedNode.relationType === 'administratif' ? '• Dotted Line' : '• Komando Struktural'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewPosition(selectedNode)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Posisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Batal Pilih"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PENGATURAN MASTER DIVISI, DEPARTEMEN & MASTER JABATAN */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          {/* Sub-Tab Navigation for Master Data Organisasi */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStructureSubTab('divisions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  structureSubTab === 'divisions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Master Divisi</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  structureSubTab === 'divisions' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {entityDivisions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStructureSubTab('departments')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  structureSubTab === 'departments'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Master Departemen</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  structureSubTab === 'departments' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {useDeptLevel ? entityDepartments.length : 'Bypass'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStructureSubTab('master_positions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  structureSubTab === 'master_positions'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Master Jabatan</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  structureSubTab === 'master_positions' ? 'bg-violet-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {entityMasterPositions.length}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 hidden lg:block">
              Entitas Aktif: <b className="text-slate-800">{currentEntity.name}</b>
            </div>
          </div>

          {/* SUB-TAB 1: MASTER DIVISI */}
          {structureSubTab === 'divisions' && (
            <div className="space-y-6">
              {/* Interactive Flexibility Banner */}
              <div className={`p-5 rounded-2xl border-2 transition-all shadow-sm ${
                useDeptLevel
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300'
                  : 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        useDeptLevel
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {useDeptLevel ? 'Mode Struktur Lengkap (Hierarki Bertingkat)' : 'Mode Struktur Ramping (Lean / Flat)'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Entitas: <b>{currentEntity.name}</b></span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Fleksibilitas Penggunaan Level Departemen
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {useDeptLevel
                        ? 'Saat ini entitas ini menggunakan struktur organisasi 3-tingkat: Divisi membawahi Departemen, dan Departemen membawahi Posisi/Jabatan. Cocok untuk unit skala besar dengan spesialisasi tinggi.'
                        : 'Entitas ini beroperasi dalam mode Struktur Ramping: Seluruh posisi/jabatan langsung berada di bawah naungan Divisi tanpa perlu membuat Departemen. Lebih lincah, minim birokrasi, dan cocok untuk unit bisnis lean.'}
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-900">
                        {useDeptLevel ? 'Gunakan Departemen' : 'Bypass Departemen (Ramping)'}
                      </span>
                      <span className="text-[10px] text-slate-400">Klik untuk beralih</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleEntityDepartmentLevel(currentEntityId)}
                      className={`w-12 h-6 rounded-full transition-colors relative focus:outline-hidden p-0.5 ${
                        useDeptLevel ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          useDeptLevel ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Divisi Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Daftar Master Divisi ({entityDivisions.length} Divisi Aktif)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Unit kerja tingkat pertama di bawah Direksi. <b>Klik baris untuk preview detail divisi.</b>
                    </span>
                  </div>

                  {!currentEntityLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setDivisionFormData({
                          id: '',
                          name: '',
                          code: `DIV-${Date.now().toString().slice(-3)}`,
                          headTitle: 'Head of Division',
                          description: '',
                        });
                        setIsDivisionModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Divisi</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {entityDivisions.map((div) => {
                    const childDepts = departments.filter((d) => d.divisionId === div.id);
                    const childPositions = entityNodes.filter((n) => n.division === div.name);

                    return (
                      <div
                        key={div.id}
                        onClick={() => setPreviewDivision(div)}
                        className="p-4 hover:bg-indigo-50/70 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {div.code.slice(-3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{div.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border">
                                {div.code}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Pimpinan: <b>{div.headTitle || 'Head of Division'}</b>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {div.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right text-xs">
                            {useDeptLevel && (
                              <span className="block font-semibold text-slate-700">
                                {childDepts.length} Departemen
                              </span>
                            )}
                            <span className="text-[11px] text-indigo-600 font-medium">
                              {childPositions.length} Posisi Jabatan
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: MASTER DEPARTEMEN */}
          {structureSubTab === 'departments' && (
            <div className="space-y-6">
              {useDeptLevel ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        Daftar Master Departemen ({entityDepartments.length} Departemen Aktif)
                      </h3>
                      <span className="text-[11px] text-slate-500">Unit operasional teknis di bawah naungan Divisi. <b>Klik baris untuk preview detail departemen.</b></span>
                    </div>

                    {!currentEntityLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setDepartmentFormData({
                            id: '',
                            name: '',
                            code: `DEPT-${Date.now().toString().slice(-3)}`,
                            divisionId: entityDivisions[0]?.id || '',
                            headTitle: 'Department Head',
                            description: '',
                          });
                          setIsDepartmentModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Departemen</span>
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {entityDepartments.map((dept) => {
                      const parentDiv = divisions.find((d) => d.id === dept.divisionId);
                      const deptPositions = entityNodes.filter((n) => n.department === dept.name);

                      return (
                        <div
                          key={dept.id}
                          onClick={() => setPreviewDepartment(dept)}
                          className="p-4 hover:bg-emerald-50/70 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                <span>{dept.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border">
                                {dept.code}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Divisi Induk: <b className="text-indigo-700">{parentDiv?.name || 'Divisi Umum'}</b> • Lead: {dept.headTitle || 'Dept Head'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {dept.description}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right text-xs">
                              <span className="font-semibold text-slate-700">
                                {deptPositions.length} Posisi Jabatan
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/80 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Info className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Level Departemen Dinonaktifkan (Mode Struktur Ramping Aktif)
                  </h4>
                  <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed">
                    Entitas ini beroperasi dalam mode tanpa level departemen. Seluruh posisi/jabatan langsung terhubung ke Divisi induk tanpa memerlukan hierarki perantara.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      toggleEntityDepartmentLevel(currentEntityId);
                      showToast('Mode level departemen diaktifkan.');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Aktifkan Level Departemen Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: MASTER JABATAN (KAMUS & KATALOG JABATAN) */}
          {structureSubTab === 'master_positions' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-800/80 text-violet-200 border border-violet-600">
                        Kamus Jabatan Resmi Perusahaan
                      </span>
                      <span className="text-xs text-violet-300 font-medium">Entitas: {currentEntity.name}</span>
                    </div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-violet-400" />
                      Katalog Master Jabatan & Spesifikasi Posisi
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Kamus referensi standar seluruh judul jabatan, jenjang karir (level tier), rumpun profesi (job family), job grade, dan spesifikasi kompetensi minimum. Master ini dijadikan acuan formasi kursi saat melakukan penetapan / penugasan (assign jabatan).
                    </p>
                  </div>

                  {!currentEntityLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setMasterPositionFormData({
                          id: '',
                          code: `MJP-${String(entityMasterPositions.length + 1).padStart(3, '0')}`,
                          title: '',
                          defaultLevel: 3,
                          division: entityDivisions[0]?.name || '',
                          department: entityDepartments[0]?.name || 'Umum',
                          jobFamily: 'Teknologi & Engineering',
                          jobGrade: 'Grade 08',
                          description: '',
                          requirements: '',
                        });
                        setIsMasterPositionModalOpen(true);
                      }}
                      className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 shrink-0 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Master Jabatan</span>
                    </button>
                  )}
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <div className="text-[11px] text-violet-200">Total Master Jabatan</div>
                    <div className="text-xl font-black text-white mt-0.5">{entityMasterPositions.length}</div>
                    <div className="text-[10px] text-violet-300">Master judul terdaftar</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <div className="text-[11px] text-violet-200">Tier Eksekutif & Head</div>
                    <div className="text-xl font-black text-violet-300 mt-0.5">
                      {entityMasterPositions.filter((p) => p.defaultLevel <= 2).length}
                    </div>
                    <div className="text-[10px] text-violet-300">Level 1 (BOD) & Level 2 (VP)</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <div className="text-[11px] text-violet-200">Tier Manajerial & SPV</div>
                    <div className="text-xl font-black text-emerald-300 mt-0.5">
                      {entityMasterPositions.filter((p) => p.defaultLevel === 3 || p.defaultLevel === 4).length}
                    </div>
                    <div className="text-[10px] text-emerald-300">Level 3 (Mgr) & Level 4 (Lead)</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <div className="text-[11px] text-violet-200">Formasi Kursi Aktif</div>
                    <div className="text-xl font-black text-amber-300 mt-0.5">{entityNodes.length}</div>
                    <div className="text-[10px] text-amber-300">Kursi penetapan jabatan</div>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari kode jabatan, judul, deskripsi..."
                    value={masterPositionSearch}
                    onChange={(e) => setMasterPositionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-violet-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rumpun:</span>
                    <select
                      value={masterPositionFamilyFilter}
                      onChange={(e) => setMasterPositionFamilyFilter(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-violet-600"
                    >
                      <option value="ALL">Semua Rumpun Profesi</option>
                      <option value="Executive & Leadership">Executive & Leadership</option>
                      <option value="Human Resources & People">Human Resources & People</option>
                      <option value="Finance & Accounting">Finance & Accounting</option>
                      <option value="Teknologi & Engineering">Teknologi & Engineering</option>
                      <option value="Commercial & Sales">Commercial & Sales</option>
                      <option value="General Affairs & Legal">General Affairs & Legal</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Level:</span>
                    <select
                      value={masterPositionLevelFilter}
                      onChange={(e) => setMasterPositionLevelFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-violet-600"
                    >
                      <option value="ALL">Semua Level</option>
                      <option value={1}>L1 - Direksi</option>
                      <option value={2}>L2 - VP / Head</option>
                      <option value={3}>L3 - Manager</option>
                      <option value={4}>L4 - Supervisor / Lead</option>
                      <option value={5}>L5 - Officer / Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Master Job Position Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Kode & Judul Jabatan</th>
                        <th className="py-3 px-4">Rumpun Profesi (Family)</th>
                        <th className="py-3 px-4">Jenjang & Grade</th>
                        <th className="py-3 px-4">Divisi & Dept Default</th>
                        <th className="py-3 px-4">Kualifikasi Minimum</th>
                        <th className="py-3 px-4">Formasi Terpakai</th>
                        <th className="py-3 px-4 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entityMasterPositions
                        .filter((p) => {
                          const matchesSearch =
                            p.title.toLowerCase().includes(masterPositionSearch.toLowerCase()) ||
                            p.code.toLowerCase().includes(masterPositionSearch.toLowerCase()) ||
                            (p.description || '').toLowerCase().includes(masterPositionSearch.toLowerCase());
                          const matchesFamily =
                            masterPositionFamilyFilter === 'ALL' || p.jobFamily === masterPositionFamilyFilter;
                          const matchesLevel =
                            masterPositionLevelFilter === 'ALL' || p.defaultLevel === masterPositionLevelFilter;
                          return matchesSearch && matchesFamily && matchesLevel;
                        })
                        .map((pos) => {
                          const matchingFormations = entityNodes.filter(
                            (node) =>
                              node.masterJobPositionId === pos.id ||
                              node.title.toLowerCase() === pos.title.toLowerCase()
                          );

                          // Color-coded badge for job family
                          const familyColor =
                            pos.jobFamily === 'Executive & Leadership'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : pos.jobFamily === 'Teknologi & Engineering'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : pos.jobFamily === 'Human Resources & People'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : pos.jobFamily === 'Finance & Accounting'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : pos.jobFamily === 'Commercial & Sales'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200';

                          return (
                            <tr
                              key={pos.id}
                              onClick={() => setPreviewMasterJobPosition(pos)}
                              className="hover:bg-violet-50/70 cursor-pointer transition-colors group"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-start gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                                    pos.defaultLevel === 1
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : pos.defaultLevel === 2
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : pos.defaultLevel === 3
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : pos.defaultLevel === 4
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    L{pos.defaultLevel}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm group-hover:text-violet-700 transition-colors flex items-center gap-1.5">
                                      <span>{pos.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                        {pos.code}
                                      </span>
                                      {pos.description && (
                                        <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                                          {pos.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border ${familyColor}`}>
                                  {pos.jobFamily || 'General'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div>
                                  <span className="font-semibold text-slate-800">
                                    {pos.defaultLevel === 1 && 'L1 - Direksi'}
                                    {pos.defaultLevel === 2 && 'L2 - VP / Head'}
                                    {pos.defaultLevel === 3 && 'L3 - Manager'}
                                    {pos.defaultLevel === 4 && 'L4 - Supervisor'}
                                    {pos.defaultLevel === 5 && 'L5 - Staff'}
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {pos.jobGrade || 'Grade Standard'}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-medium text-slate-800">{pos.division || '-'}</div>
                                <div className="text-[11px] text-slate-500">{pos.department || '-'}</div>
                              </td>

                              <td className="py-3.5 px-4 max-w-xs">
                                <span className="text-[11px] text-slate-600 line-clamp-2">
                                  {pos.requirements || '-'}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  matchingFormations.length > 0
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {matchingFormations.length} Formasi
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 transition-colors ml-auto" />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASSIGN JABATAN & FORMASI POSISI (PENETAPAN KARYAWAN) */}
      {activeTab === 'positions' && (
        <div className="space-y-6">
          {/* Header Banner Assign Jabatan */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-800/80 text-indigo-200 border border-indigo-600">
                    Penetapan & Penugasan Karyawan (Assignment)
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">Entitas: {currentEntity.name}</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  Assign Jabatan & Manajemen Formasi Kursi
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Ruang kerja penetapan karyawan aktif ke dalam kursi formasi struktur organisasi. Pantau status keterisian kursi (okupansi), lakukan penugasan karyawan baru, pergantian pemegang jabatan, atau pelepasan formasi kosong (vacant).
                </p>
              </div>

              {!currentEntityLocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setPositionFormData({
                      id: '',
                      title: '',
                      level: 3,
                      division: entityDivisions[0]?.name || currentEntity.name,
                      department: useDeptLevel ? (entityDepartments[0]?.name || 'Umum') : 'Direct to Division',
                      reportsToId: '',
                      relationType: 'struktural',
                      currentEmployeeId: '',
                      isVacant: true,
                      description: '',
                    });
                    setIsPositionModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 shrink-0 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Formasi Posisi</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Struktur Terkunci (SK Resmi)</span>
                </span>
              )}
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="text-[11px] text-indigo-200">Total Formasi Kursi</div>
                <div className="text-xl font-black text-white mt-0.5">{entityNodes.length}</div>
                <div className="text-[10px] text-indigo-300">Posisi struktural</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="text-[11px] text-indigo-200">Kursi Terisi (Occupied)</div>
                <div className="text-xl font-black text-emerald-300 mt-0.5">{occupiedPositions}</div>
                <div className="text-[10px] text-emerald-300">
                  {Math.round((occupiedPositions / (entityNodes.length || 1)) * 100)}% Okupansi
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="text-[11px] text-indigo-200">Kursi Kosong (Vacant)</div>
                <div className="text-xl font-black text-rose-300 mt-0.5">{entityNodes.length - occupiedPositions}</div>
                <div className="text-[10px] text-rose-300">Butuh penetapan karyawan</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="text-[11px] text-indigo-200">Komando Struktural</div>
                <div className="text-xl font-black text-slate-200 mt-0.5">{structuralPositions}</div>
                <div className="text-[10px] text-slate-300">Garis lurus resmi</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <div className="text-[11px] text-indigo-200">Koordinasi Administratif</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">{adminPositions}</div>
                <div className="text-[10px] text-amber-300">Garis koordinasi putus-putus</div>
              </div>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari posisi, nama karyawan, NIK, divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-indigo-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Okupansi:</span>
                <select
                  value={assignStatusFilter}
                  onChange={(e) => setAssignStatusFilter(e.target.value as 'ALL' | 'occupied' | 'vacant')}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-indigo-600 font-medium"
                >
                  <option value="ALL">Semua Formasi ({entityNodes.length})</option>
                  <option value="occupied">Terisi Karyawan ({occupiedPositions})</option>
                  <option value="vacant">Posisi Kosong / Vacant ({entityNodes.length - occupiedPositions})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Jalur Komando:</span>
                <select
                  value={assignRelationFilter}
                  onChange={(e) => setAssignRelationFilter(e.target.value as 'ALL' | 'struktural' | 'administratif')}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-indigo-600 font-medium"
                >
                  <option value="ALL">Semua Jalur</option>
                  <option value="struktural">Komando Struktural ({structuralPositions})</option>
                  <option value="administratif">Koordinasi Administratif ({adminPositions})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Divisi:</span>
                <select
                  value={assignDivisionFilter}
                  onChange={(e) => setAssignDivisionFilter(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-indigo-600 font-medium"
                >
                  <option value="ALL">Semua Divisi</option>
                  {entityDivisions.map((div) => (
                    <option key={div.id} value={div.name}>{div.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table: Assign Jabatan & Formasi Posisi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Formasi Kursi & ID</th>
                    <th className="py-3 px-4">Tipe Jalur Komando</th>
                    <th className="py-3 px-4">Level Tier</th>
                    <th className="py-3 px-4">Divisi & Departemen</th>
                    <th className="py-3 px-4">Lapor Ke (Atasan)</th>
                    <th className="py-3 px-4">Penetapan Karyawan (Assign Jabatan)</th>
                    <th className="py-3 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entityNodes
                    .filter((pos) => {
                      const occupant = employees.find((e) => e.id === pos.currentEmployeeId);
                      const matchesSearch =
                        pos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pos.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (pos.division || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (occupant?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (occupant?.nik || '').toLowerCase().includes(searchQuery.toLowerCase());

                      const matchesOccupancy =
                        assignStatusFilter === 'ALL' ||
                        (assignStatusFilter === 'occupied' && !pos.isVacant && pos.currentEmployeeId) ||
                        (assignStatusFilter === 'vacant' && (pos.isVacant || !pos.currentEmployeeId));

                      const matchesRelation =
                        assignRelationFilter === 'ALL' || pos.relationType === assignRelationFilter;

                      const matchesDivision =
                        assignDivisionFilter === 'ALL' || pos.division === assignDivisionFilter;

                      return matchesSearch && matchesOccupancy && matchesRelation && matchesDivision;
                    })
                    .map((pos) => {
                      const occupant = employees.find((e) => e.id === pos.currentEmployeeId);
                      const supervisor = entityNodes.find((n) => n.id === pos.reportsToId);

                      return (
                        <tr
                          key={pos.id}
                          onClick={() => setPreviewPosition(pos)}
                          className="hover:bg-indigo-50/70 cursor-pointer transition-colors group"
                        >
                          {/* Nama Posisi & Preview */}
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{pos.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {pos.id}</span>
                            </div>
                          </td>

                          {/* Jalur Komando */}
                          <td className="py-3.5 px-4">
                            {pos.relationType === 'administratif' ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[11px]">
                                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-amber-600 inline-block" />
                                Koordinasi Administratif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[11px]">
                                <span className="w-2.5 h-0.5 bg-slate-500 inline-block" />
                                Komando Struktural
                              </span>
                            )}
                          </td>

                          {/* Level Tier */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border text-[11px]">
                              L{pos.level}
                            </span>
                          </td>

                          {/* Divisi & Dept */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{pos.division || currentEntity.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {useDeptLevel ? pos.department : <span className="text-amber-700 font-semibold">Direct to Division</span>}
                            </div>
                          </td>

                          {/* Lapor Ke (Atasan) */}
                          <td className="py-3.5 px-4">
                            {supervisor ? (
                              <div>
                                <div className="font-medium text-slate-800">{supervisor.title}</div>
                                <span className="text-[10px] text-slate-400 font-mono">Tier L{supervisor.level}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Puncak Hierarki</span>
                            )}
                          </td>

                          {/* Penetapan Karyawan (Assign Jabatan / Pemegang) */}
                          <td className="py-3.5 px-4">
                            {pos.isVacant || !pos.currentEmployeeId ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md border border-rose-200 text-[11px] font-semibold shrink-0">
                                  Posisi Kosong (Vacant)
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {occupant?.fullName.charAt(0) || 'K'}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{occupant?.fullName || 'Karyawan Aktif'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{occupant?.nik || 'NIK-HRMS'}</div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Aksi Formasi: Chevron only */}
                          <td className="py-3.5 px-4 text-center">
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RIWAYAT RESTRUKTURISASI, SK & ARSIP HISTORI SNAPSHOT */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                Arsip Riwayat SK Restrukturisasi & Koreksi Administratif
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap usulan restrukturisasi dapat dirancang draftnya, diajukan, serta di-approve atau ditolak di dalam modal pratinjau.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setHistorySubTab('proposals')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    historySubTab === 'proposals' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Usulan & SK ({orgProposals.filter((p) => p.entityId === currentEntityId).length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySubTab('snapshots')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    historySubTab === 'snapshots' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arsip Snapshot ({orgSnapshots.filter((s) => s.entityId === currentEntityId).length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenRestructureModal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Ajukan Restrukturisasi Baru</span>
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Usulan & Dokumen SK */}
          {historySubTab === 'proposals' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {orgProposals
                  .filter((p) => p.entityId === currentEntityId || !p.entityId)
                  .map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => {
                        setPreviewProposal(prop);
                        setIsRejectingInModal(false);
                        setRejectionReasonInput('');
                      }}
                      className="p-4 hover:bg-indigo-50/60 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            prop.isCorrectionOnly
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {prop.isCorrectionOnly ? 'Koreksi Administratif Typo' : `SK Restrukturisasi: ${prop.changeType}`}
                          </span>

                          {prop.skDocNumber && (
                            <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded border">
                              No. SK: {prop.skDocNumber}
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prop.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prop.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {prop.status}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{prop.proposalTitle}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl line-clamp-2">{prop.description}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>Diajukan: <b>{prop.proposedBy}</b></span>
                          <span>•</span>
                          <span>Tanggal Efektif Berlaku: <b className="text-indigo-900">{prop.effectiveDate}</b></span>
                          {prop.approvedBy && (
                            <>
                              <span>•</span>
                              <span>Disetujui Direksi: <b>{prop.approvedBy}</b></span>
                            </>
                          )}
                          {prop.rejectionReason && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-semibold">Alasan Penolakan: {prop.rejectionReason}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}

                {orgProposals.filter((p) => p.entityId === currentEntityId || !p.entityId).length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Belum ada pengajuan restrukturisasi untuk entitas ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Arsip Snapshot Struktur Terdahulu */}
          {historySubTab === 'snapshots' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {orgSnapshots
                  .filter((s) => s.entityId === currentEntityId)
                  .map((snap) => (
                    <div
                      key={snap.id}
                      onClick={() => setPreviewSnapshot(snap)}
                      className="p-4 hover:bg-indigo-50/60 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">
                            Snapshot Arsip Versi
                          </span>
                          {snap.skDocNumber && (
                            <span className="font-mono font-bold text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                              Dasar SK: {snap.skDocNumber}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{snap.versionTitle}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl">{snap.reason}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span>Diarsipkan Tanggal: <b>{snap.archivedAt}</b></span>
                          <span>•</span>
                          <span>Oleh: <b>{snap.archivedBy}</b></span>
                          <span>•</span>
                          <span>Tanggal Efektif Berlaku Kala Itu: <b>{snap.effectiveDate}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right text-xs">
                          <span className="block font-semibold text-slate-700">{snap.divisions.length} Divisi • {snap.departments.length} Dept</span>
                          <span className="text-[11px] text-indigo-600 font-medium">{snap.orgNodes.length} Posisi Jabatan</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}

                {orgSnapshots.filter((s) => s.entityId === currentEntityId).length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Belum ada snapshot arsip struktur terdahulu untuk entitas ini. Snapshot otomatis dibuat setiap kali usulan restrukturisasi disetujui.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PREVIEW POSISI // JABATAN (PENGGANTI OPSI EDIT) */}
      {/* ======================================================== */}
      {previewPosition && (
        <div
          onClick={() => setPreviewPosition(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Preview Detail Jabatan & Struktur</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPosition(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Header Box Title & Status */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                    LEVEL L{previewPosition.level} • {previewPosition.level === 1 ? 'Direksi' : previewPosition.level === 2 ? 'VP / Head' : previewPosition.level === 3 ? 'Manager' : 'Staff'}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{previewPosition.title}</h4>
                  <div className="text-slate-600 text-xs mt-0.5">
                    Divisi: <b>{previewPosition.division || currentEntity.name}</b> {useDeptLevel ? `• Departemen: ${previewPosition.department}` : '• Struktur Ramping (Direct to Div)'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {previewPosition.isVacant ? (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
                      Posisi Kosong
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                      Posisi Terisi
                    </span>
                  )}
                </div>
              </div>

              {/* Tipe Jalur Relasi & Status Okupansi Formasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    previewPosition.relationType === 'administratif'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Jalur Hubungan Pelaporan:
                  </span>
                  {previewPosition.relationType === 'administratif' ? (
                    <div>
                      <div className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                        <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-600 inline-block" />
                        <span>Koordinasi Administratif (Dotted Line)</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-1 leading-snug">
                        Garis hierarki putus-putus amber. Melapor secara fungsional / koordinatif (cth: Internal Audit, Tata Kelola).
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="w-3.5 h-0.5 bg-slate-500 inline-block" />
                        <span>Komando Struktural Resmi (Solid Line)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Garis komando hierarkis resmi lurus tegas vertikal atasan langsung (direct line management).
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    previewPosition.isVacant
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Status Formasi Okupansi:
                  </span>
                  {previewPosition.isVacant ? (
                    <div>
                      <div className="font-bold text-xs text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Posisi Kosong (Vacant)</span>
                      </div>
                      <p className="text-[10px] text-rose-600 mt-1 leading-snug">
                        Posisi formatur belum terisi pemangku definitif. Ditampilkan dengan card putus-putus dan avatar &quot;?&quot;.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Posisi Terisi (Definitif)</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1 leading-snug">
                        Telah terisi oleh pemangku jabatan aktif sesuai SK penugasan resmi perusahaan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pemangku Jabatan Saat Ini */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Pejabat / Pemangku Jabatan Saat Ini:
                </label>
                {(() => {
                  const emp = employees.find((e) => e.id === previewPosition.currentEmployeeId);
                  if (!emp) {
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 italic text-xs">
                        Saat ini posisi ini belum memiliki pejabat definitif (membutuhkan rekrutmen atau suksesi internal).
                      </div>
                    );
                  }
                  return (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                          alt={emp.fullName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{emp.fullName}</div>
                          <div className="text-slate-500 text-xs font-mono">NIK: {emp.nik} • Status: {emp.employmentType}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">Bergabung: {emp.joinDate}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Atasan Langsung & Reporting Line */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Bertanggung Jawab Ke:</span>
                  {(() => {
                    const sup = entityNodes.find((n) => n.id === previewPosition.reportsToId);
                    const supEmp = employees.find((e) => e.id === sup?.currentEmployeeId);
                    return (
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{sup ? sup.title : 'Direksi Puncak'}</div>
                        <div className="text-slate-500 text-[11px]">{supEmp?.fullName || 'Belum Terisi'}</div>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Bawahan Langsung:</span>
                  {(() => {
                    const subs = entityNodes.filter((n) => n.reportsToId === previewPosition.id);
                    return (
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{subs.length} Posisi Jabatan</div>
                        <div className="text-slate-500 text-[11px]">Subordinate Direct Reports</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Uraian Tugas & Tanggung Jawab */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Ruang Lingkup & Job Role:</span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {previewPosition.description ||
                    'Bertanggung jawab penuh atas efisiensi operasional dan pencapaian target kerja pada unit terkait. Melaporkan progress langsung kepada atasan struktural sesuai garis komando ISO 9001.'}
                </p>
              </div>

              {/* Governance Notice & Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                {!currentEntityLocked ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Mode Setup / Belum Dikunci
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus posisi jabatan "${previewPosition.title}"?`)) {
                            deleteOrgNode(previewPosition.id);
                            setPreviewPosition(null);
                            showToast(`Posisi "${previewPosition.title}" telah dihapus.`);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Jabatan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPositionFormData({
                            id: previewPosition.id,
                            title: previewPosition.title,
                            level: previewPosition.level,
                            division: previewPosition.division || entityDivisions[0]?.name || currentEntity.name,
                            department: previewPosition.department || 'Direct to Division',
                            reportsToId: previewPosition.reportsToId || '',
                            relationType: previewPosition.relationType || 'struktural',
                            currentEmployeeId: previewPosition.currentEmployeeId || '',
                            isVacant: previewPosition.isVacant,
                            description: previewPosition.description || '',
                          });
                          setPreviewPosition(null);
                          setIsPositionModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Jabatan</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectionForm({
                          targetId: previewPosition.id,
                          targetType: 'position',
                          fieldToCorrect: 'title',
                          correctedValue: previewPosition.title,
                          notes: 'Perbaikan ejaan penulisan gelar / jabatan administratif',
                        });
                        setIsCorrectionModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Koreksi Typo Ringan</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPosition(null);
                          setProposalCategory('organisasi');
                          setRestructureForm((prev) => ({
                            ...prev,
                            title: `Restrukturisasi Posisi: ${previewPosition.title}`,
                            targetType: 'position',
                            targetReportsToId: previewPosition.id,
                          }));
                          setIsRestructureModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Ajukan Perubahan Ber-SK</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DETAIL ENTITAS PERUSAHAAN                       */}
      {/* ======================================================== */}
      {previewEntity && (
        <div
          onClick={() => setPreviewEntity(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Detail Entitas Perusahaan</span>
              </h3>
              <button onClick={() => setPreviewEntity(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Badan Hukum Resmi</span>
                <div className="text-sm font-bold text-slate-900">{previewEntity.name}</div>
                <div className="text-xs text-indigo-700 font-mono font-semibold">Kode Entitas: {previewEntity.code}</div>
              </div>

              {/* Data Utama Penting Holding: NPWP Perusahaan */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  NPWP Perusahaan (Nomor Pokok Wajib Pajak)
                </span>
                <div className="font-mono font-bold text-indigo-950 text-sm tracking-wide">
                  {previewEntity.npwp}
                </div>
                <div className="text-[10px] text-slate-500">
                  Wajib untuk konsolidasi perpajakan holding, pemotongan PPh 21/23, dan pelaporan faktur pajak.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Hubungan Kepemilikan</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {previewEntity.relationType === 'resmi' ? 'Saham Mayoritas (>50%)' : 'Afiliasi / Unit Usaha'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Status Operasional</span>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {previewEntity.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Kota Domisili Hukum</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{previewEntity.city}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Prefix Surat Legal</span>
                  <div className="font-mono font-bold text-indigo-700 text-xs mt-0.5">{previewEntity.docPrefix}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Alamat Kantor Terdaftar</span>
                <div className="text-slate-700 text-xs mt-0.5 leading-relaxed">{previewEntity.address}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Posisi Struktural</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {orgNodes.filter((n) => n.entityId === previewEntity.id).length} Posisi Jabatan
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Divisi Terdaftar</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {divisions.filter((d) => d.entityId === previewEntity.id).length} Divisi Aktif
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewEntity(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW DETAIL DIVISI (KLIK ROW DIVISI)            */}
      {/* ======================================================== */}
      {previewDivision && (
        <div
          onClick={() => setPreviewDivision(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Preview Master Divisi: {previewDivision.name}</h3>
                  <span className="text-[11px] text-slate-400">Kode: {previewDivision.code}</span>
                </div>
              </div>
              <button onClick={() => setPreviewDivision(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300 text-[11px]">
                    {previewDivision.code}
                  </span>
                  <span className="text-slate-500 text-[11px]">Entitas: <b>{currentEntity.name}</b></span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">{previewDivision.name}</h4>
                <div className="text-slate-600 text-xs mt-0.5">
                  Pimpinan / Head: <b>{previewDivision.headTitle || 'Head of Division'}</b>
                </div>
                <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
                  {previewDivision.description || 'Divisi operasional utama di bawah koordinasi Direksi korporasi.'}
                </p>
              </div>

              {/* Departemen di bawah divisi */}
              {useDeptLevel && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                    Departemen di Bawah Naungan Divisi Ini ({departments.filter((d) => d.divisionId === previewDivision.id).length}):
                  </label>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    {departments.filter((d) => d.divisionId === previewDivision.id).map((dept) => (
                      <div key={dept.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{dept.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">[{dept.code}]</span>
                          <div className="text-[11px] text-slate-500">Lead: {dept.headTitle || 'Dept Head'}</div>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {orgNodes.filter((n) => n.department === dept.name).length} Posisi
                        </span>
                      </div>
                    ))}
                    {departments.filter((d) => d.divisionId === previewDivision.id).length === 0 && (
                      <div className="p-3 text-center text-slate-400 italic">Belum ada departemen di bawah divisi ini.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Posisi Jabatan di bawah divisi */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Daftar Jabatan Struktural Terdaftar ({orgNodes.filter((n) => n.division === previewDivision.name).length}):
                </label>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
                  {orgNodes.filter((n) => n.division === previewDivision.name).map((node) => {
                    const emp = employees.find((e) => e.id === node.currentEmployeeId);
                    return (
                      <div key={node.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{node.title}</div>
                          <div className="text-[10px] text-slate-400">
                            Level L{node.level} • {useDeptLevel ? node.department : 'Direct to Division'}
                          </div>
                        </div>
                        <div className="text-right">
                          {node.isVacant ? (
                            <span className="text-[10px] text-rose-600 font-semibold">Kosong</span>
                          ) : (
                            <span className="text-[11px] text-indigo-700 font-medium">{emp?.fullName || 'Terisi'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {orgNodes.filter((n) => n.division === previewDivision.name).length === 0 && (
                    <div className="p-3 text-center text-slate-400 italic">Belum ada posisi jabatan di divisi ini.</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {!currentEntityLocked ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus divisi ${previewDivision.name}?`)) {
                          deleteDivision(previewDivision.id);
                          setPreviewDivision(null);
                          showToast(`Divisi ${previewDivision.name} telah dihapus.`);
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Divisi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDivisionFormData({
                          id: previewDivision.id,
                          name: previewDivision.name,
                          code: previewDivision.code,
                          headTitle: previewDivision.headTitle || '',
                          description: previewDivision.description || '',
                        });
                        setPreviewDivision(null);
                        setIsDivisionModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Divisi</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Terkunci oleh Tata Kelola Resmi</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDivision(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs ml-auto"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW DETAIL DEPARTEMEN (KLIK ROW DEPARTEMEN)    */}
      {/* ======================================================== */}
      {previewDepartment && (
        <div
          onClick={() => setPreviewDepartment(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Preview Master Departemen: {previewDepartment.name}</h3>
                  <span className="text-[11px] text-slate-400">Kode: {previewDepartment.code}</span>
                </div>
              </div>
              <button onClick={() => setPreviewDepartment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[11px]">
                    {previewDepartment.code}
                  </span>
                  <span className="text-slate-500 text-[11px]">Entitas: <b>{currentEntity.name}</b></span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">{previewDepartment.name}</h4>
                <div className="text-slate-600 text-xs mt-1">
                  Divisi Induk: <b className="text-indigo-700">{divisions.find(d => d.id === previewDepartment.divisionId)?.name || 'Divisi Umum'}</b>
                </div>
                <div className="text-slate-600 text-xs mt-0.5">
                  Pimpinan / Head: <b>{previewDepartment.headTitle || 'Department Head'}</b>
                </div>
                <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
                  {previewDepartment.description || 'Unit operasional teknis di bawah naungan Divisi.'}
                </p>
              </div>

              {/* Posisi Jabatan di Departemen ini */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Daftar Jabatan Struktural Terdaftar ({entityNodes.filter((n) => n.department === previewDepartment.name).length}):
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {entityNodes
                    .filter((n) => n.department === previewDepartment.name)
                    .map((node) => {
                      const emp = employees.find((e) => e.id === node.currentEmployeeId);
                      return (
                        <div key={node.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{node.title}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Tier L{node.level}</span>
                          </div>
                          <div>
                            {node.isVacant ? (
                              <span className="text-[10px] text-rose-600 font-semibold px-2 py-0.5 bg-rose-50 rounded border border-rose-200">
                                Vacant
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                                {emp?.fullName || 'Terisi'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {entityNodes.filter((n) => n.department === previewDepartment.name).length === 0 && (
                    <div className="p-3 text-center text-slate-400 italic">Belum ada posisi jabatan di departemen ini.</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {!currentEntityLocked ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus departemen ${previewDepartment.name}?`)) {
                          deleteDepartment(previewDepartment.id);
                          setPreviewDepartment(null);
                          showToast(`Departemen ${previewDepartment.name} telah dihapus.`);
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Departemen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepartmentFormData({
                          id: previewDepartment.id,
                          name: previewDepartment.name,
                          code: previewDepartment.code,
                          divisionId: previewDepartment.divisionId,
                          headTitle: previewDepartment.headTitle || '',
                          description: previewDepartment.description || '',
                        });
                        setPreviewDepartment(null);
                        setIsDepartmentModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Departemen</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Terkunci oleh Tata Kelola Resmi</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDepartment(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs ml-auto"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW MASTER JABATAN (DETAIL, EDIT, HAPUS, BUAT FORMASI) */}
      {/* ======================================================== */}
      {previewMasterJobPosition && (
        <div
          onClick={() => setPreviewMasterJobPosition(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-800 text-violet-200 flex items-center justify-center font-bold text-xs border border-violet-700">
                  L{previewMasterJobPosition.defaultLevel}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Preview Master Jabatan</h3>
                  <span className="text-[11px] text-violet-300 font-mono">Kode: {previewMasterJobPosition.code}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewMasterJobPosition(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
                    {previewMasterJobPosition.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {previewMasterJobPosition.jobFamily || 'General'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {previewMasterJobPosition.jobGrade || 'Grade 08'}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-purple-100 text-purple-800">
                    Level {previewMasterJobPosition.defaultLevel} · {previewMasterJobPosition.defaultLevel === 1 ? 'Direksi' : previewMasterJobPosition.defaultLevel === 2 ? 'VP / Head' : previewMasterJobPosition.defaultLevel === 3 ? 'Manager' : previewMasterJobPosition.defaultLevel === 4 ? 'Supervisor' : 'Staff'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">{previewMasterJobPosition.title}</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  {previewMasterJobPosition.description || 'Katalog master jabatan baku dalam struktur organisasi perusahaan.'}
                </p>
              </div>

              {/* Grid detail */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block">Divisi Default:</span>
                  <span className="font-semibold text-slate-800 text-xs">{previewMasterJobPosition.division || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Departemen Default:</span>
                  <span className="font-semibold text-slate-800 text-xs">{previewMasterJobPosition.department || '-'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 text-[10px] block mb-0.5">Kualifikasi Minimum Jabatan:</span>
                  <p className="text-slate-700 text-xs font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
                    {previewMasterJobPosition.requirements || 'Belum ada spesifikasi kualifikasi minimum yang ditentukan.'}
                  </p>
                </div>
              </div>

              {/* Formasi Kursi yang menggunakan Master ini */}
              <div className="space-y-2">
                {(() => {
                  const matchingNodes = entityNodes.filter(
                    (n) => n.masterJobPositionId === previewMasterJobPosition.id || n.title.toLowerCase() === previewMasterJobPosition.title.toLowerCase()
                  );
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Formasi Kursi Aktif Terdaftar ({matchingNodes.length})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {matchingNodes.filter(n => !n.isVacant && n.currentEmployeeId).length} Terisi · {matchingNodes.filter(n => n.isVacant || !n.currentEmployeeId).length} Kosong
                        </span>
                      </div>
                      {matchingNodes.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {matchingNodes.map((n) => {
                            const emp = employees.find(e => e.id === n.currentEmployeeId);
                            return (
                              <div key={n.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-slate-900">{n.title}</div>
                                  <div className="text-[10px] text-slate-500">{n.division} · {n.department}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  !n.isVacant && n.currentEmployeeId
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {!n.isVacant && n.currentEmployeeId ? emp?.fullName || 'Terisi' : 'Vacant'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          Belum ada formasi kursi aktif yang dibuat dari master jabatan ini.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Bottom Card Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {!currentEntityLocked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus master jabatan "${previewMasterJobPosition.title}"?`)) {
                        deleteMasterJobPosition(previewMasterJobPosition.id);
                        setPreviewMasterJobPosition(null);
                        showToast(`Master jabatan ${previewMasterJobPosition.title} telah dihapus.`);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMasterPositionFormData({
                        id: previewMasterJobPosition.id,
                        code: previewMasterJobPosition.code,
                        title: previewMasterJobPosition.title,
                        defaultLevel: previewMasterJobPosition.defaultLevel,
                        division: previewMasterJobPosition.division || '',
                        department: previewMasterJobPosition.department || '',
                        jobFamily: previewMasterJobPosition.jobFamily || 'Teknologi & Engineering',
                        jobGrade: previewMasterJobPosition.jobGrade || 'Grade 08',
                        description: previewMasterJobPosition.description || '',
                        requirements: previewMasterJobPosition.requirements || '',
                      });
                      setPreviewMasterJobPosition(null);
                      setIsMasterPositionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Jabatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMasterJobForPosition(previewMasterJobPosition);
                      setPreviewMasterJobPosition(null);
                      setIsPositionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Formasi Kursi</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setPreviewMasterJobPosition(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs ml-auto transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW USULAN SK RESTRUKTURISASI (DENGAN APPROVE/REJECT) */}
      {/* ======================================================== */}
      {previewProposal && (
        <div
          onClick={() => setPreviewProposal(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Dokumen Usulan Restrukturisasi</h3>
                  <span className="text-[11px] text-slate-400">{previewProposal.skDocNumber || 'Draft Proposal SK'}</span>
                </div>
              </div>
              <button onClick={() => setPreviewProposal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Header Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    previewProposal.status === 'Disetujui'
                      ? 'bg-emerald-100 text-emerald-800'
                      : previewProposal.status === 'Ditolak'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {previewProposal.status}
                  </span>

                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-white text-indigo-900 rounded border">
                    {previewProposal.skDocNumber || 'NO-SK'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{previewProposal.proposalTitle}</h4>
                <div className="text-slate-500 text-xs">
                  Jenis: <b className="text-indigo-700">{previewProposal.changeType}</b> • Efektif: <b className="text-slate-800">{previewProposal.effectiveDate}</b>
                </div>
              </div>

              {/* Rincian Pengajuan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Pengusul:</span>
                  <div className="font-bold text-slate-900 text-xs">{previewProposal.proposedBy}</div>
                  <div className="text-slate-500 text-[10px]">Diajukan pada: {previewProposal.createdAt || previewProposal.effectiveDate}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Pejabat Penyetuju:</span>
                  <div className="font-bold text-slate-900 text-xs">{previewProposal.approvedBy || 'Menunggu Persetujuan Direksi'}</div>
                  <div className="text-slate-500 text-[10px]">Keputusan Dewan Direksi</div>
                </div>
              </div>

              {/* Kajian Rasionalisasi Bisnis */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Kajian Rasionalisasi & Dasar Pertimbangan:</span>
                <p className="text-slate-700 text-xs leading-relaxed">{previewProposal.description}</p>
              </div>

              {/* Draft Perubahan Structure Preview */}
              {previewProposal.payload && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                  <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider block">
                    Draf Penataan Struktur yang Diajukan:
                  </span>
                  {previewProposal.payload.type === 'full_restructure' ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-base font-bold text-indigo-700">{previewProposal.payload.newDivisions?.length || 0}</span>
                        <span className="block text-[10px] text-slate-500">Divisi Diajukan</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-base font-bold text-emerald-700">{previewProposal.payload.newDepartments?.length || 0}</span>
                        <span className="block text-[10px] text-slate-500">Departemen</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-base font-bold text-slate-800">{previewProposal.payload.newNodes?.length || 0}</span>
                        <span className="block text-[10px] text-slate-500">Posisi Jabatan</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-700 font-medium">
                      Aksi: {previewProposal.payload.type} • Target: {previewProposal.payload.data?.title || previewProposal.payload.id || '-'}
                    </div>
                  )}
                </div>
              )}

              {/* Bukti Dokumen SK */}
              {previewProposal.skDocFileName && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{previewProposal.skDocFileName}</div>
                      <div className="text-[10px] text-slate-400">Dokumen Lampiran Sah Direksi</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      openFilePreview({
                        title: `SK Restrukturisasi: ${previewProposal.skDocNumber || previewProposal.proposalTitle}`,
                        documentNumber: previewProposal.skDocNumber || 'SK-RESTRUCT',
                        typeBadge: 'Dokumen SK Legalitas',
                        date: previewProposal.effectiveDate,
                        partyName: currentEntity.name,
                        partyRole: 'Dewan Direksi & Organisasi',
                        statusBadge: {
                          label: previewProposal.status === 'Disetujui' ? 'Sah & Berlaku' : 'Draft Usulan',
                          variant: previewProposal.status === 'Disetujui' ? 'success' : 'warning',
                        },
                        detailsGrid: [
                          { label: 'Nomor Surat SK', value: previewProposal.skDocNumber || '-' },
                          { label: 'Tanggal Efektif', value: previewProposal.effectiveDate },
                          { label: 'Pengusul', value: previewProposal.proposedBy },
                          { label: 'Penyetuju', value: previewProposal.approvedBy || '-' },
                          { label: 'Aksi Perubahan', value: previewProposal.changeType },
                        ],
                        contentParagraphs: [
                          `Menimbang penataan struktur organisasi di lingkungan ${currentEntity.name}, Direksi menetapkan restrukturisasi resmi.`,
                          previewProposal.description,
                          `Keputusan ini mengikat seluruh jajaran divisi dan berlaku efektif sejak tanggal ${previewProposal.effectiveDate}.`,
                        ],
                        signeeName: previewProposal.approvedBy || 'Ir. Budi Santoso, MBA',
                        signeeRole: 'President Director & CEO',
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Buka File SK</span>
                  </button>
                </div>
              )}

              {/* Catatan Penolakan Jika Ditolak */}
              {previewProposal.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <span className="font-bold uppercase text-[10px] tracking-wider block">Alasan Penolakan oleh Direksi:</span>
                  <p className="text-xs">{previewProposal.rejectionReason}</p>
                </div>
              )}

              {/* Area Form Penolakan */}
              {isRejectingInModal && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 animate-in fade-in">
                  <label className="font-bold text-rose-950 block text-xs">
                    Masukkan Catatan / Alasan Penolakan SK:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Belum memenuhi rasio beban kerja anggaran kuartal ini..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs bg-white"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRejectingInModal(false)}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        reviewOrgProposal(previewProposal.id, false, rejectionReasonInput.trim() || 'Ditolak oleh Dewan Direksi');
                        setPreviewProposal(null);
                        showToast(`Usulan restrukturisasi [${previewProposal.proposalTitle}] telah ditolak.`);
                      }}
                      className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Konfirmasi Tolak Usulan
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Actions: Persetujuan dan Penolakan */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewProposal(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                >
                  Tutup
                </button>

                {previewProposal.status === 'Menunggu Approval' && !isRejectingInModal && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejectingInModal(true)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak Usulan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        reviewOrgProposal(previewProposal.id, true);
                        setPreviewProposal(null);
                        showToast(`Restrukturisasi "${previewProposal.proposalTitle}" disetujui! Struktur baru diterapkan dan versi lama diarsipkan ke snapshot.`);
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui Restrukturisasi (Approve)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW SNAPSHOT HISTORI STRUKTUR TERDAHULU       */}
      {/* ======================================================== */}
      {previewSnapshot && (
        <div
          onClick={() => setPreviewSnapshot(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Inspeksi Arsip Snapshot Histori Struktur</h3>
                  <span className="text-[11px] text-slate-400">{previewSnapshot.versionTitle}</span>
                </div>
              </div>
              <button onClick={() => setPreviewSnapshot(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Snapshot Arsip Versi Struktur Organisasi (Read-Only)
                </span>
                <h4 className="text-sm font-bold text-amber-950">{previewSnapshot.versionTitle}</h4>
                <div className="text-amber-800 text-xs">
                  Diarsipkan Tanggal: <b>{previewSnapshot.archivedAt}</b> • Oleh: <b>{previewSnapshot.archivedBy}</b> • SK: <b>{previewSnapshot.skDocNumber || '-'}</b>
                </div>
                <p className="text-[11px] text-amber-900 mt-1">{previewSnapshot.reason}</p>
              </div>

              {/* Rincian Divisi Snapshot */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  Divisi Terdaftar pada Versi Ini ({previewSnapshot.divisions.length}):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {previewSnapshot.divisions.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Kode: {d.code} • Pimpinan: {d.headTitle}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rincian Departemen Snapshot */}
              {previewSnapshot.departments.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block text-xs">
                    Departemen Terdaftar pada Versi Ini ({previewSnapshot.departments.length}):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {previewSnapshot.departments.map((dept) => (
                      <div key={dept.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-900">{dept.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Kode: {dept.code} • Lead: {dept.headTitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rincian Posisi Jabatan Snapshot */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  Posisi & Hierarki Jabatan pada Versi Ini ({previewSnapshot.orgNodes.length}):
                </label>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50">
                  {previewSnapshot.orgNodes.map((node) => {
                    const sup = previewSnapshot.orgNodes.find((n) => n.id === node.reportsToId);
                    return (
                      <div key={node.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{node.title}</div>
                          <div className="text-[10px] text-slate-500">
                            Divisi: {node.division || '-'} • Dept: {node.department} • Level L{node.level}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-600">
                          {sup ? `Lapor ke: ${sup.title}` : <span className="text-indigo-700 italic">Puncak Hierarki</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewSnapshot(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DIRECT: TAMBAH / EDIT MASTER DIVISI (SETUP MODE)   */}
      {/* ======================================================== */}
      {isDivisionModalOpen && (
        <div
          onClick={() => setIsDivisionModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{divisionFormData.id ? 'Edit Divisi' : 'Tambah Divisi Baru'}</span>
              </h3>
              <button onClick={() => setIsDivisionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDivision} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Divisi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operation & Supply Chain"
                  value={divisionFormData.name}
                  onChange={(e) => setDivisionFormData({ ...divisionFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Divisi *</label>
                  <input
                    type="text"
                    required
                    placeholder="DIV-OPS"
                    value={divisionFormData.code}
                    onChange={(e) => setDivisionFormData({ ...divisionFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pimpinan Jabatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Head of Operations"
                    value={divisionFormData.headTitle}
                    onChange={(e) => setDivisionFormData({ ...divisionFormData, headTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Ruang Lingkup Divisi</label>
                <textarea
                  rows={2}
                  placeholder="Fokus operasional..."
                  value={divisionFormData.description}
                  onChange={(e) => setDivisionFormData({ ...divisionFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDivisionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {divisionFormData.id ? 'Perbarui Divisi' : 'Simpan Divisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DIRECT: TAMBAH / EDIT DEPARTEMEN (SETUP MODE)      */}
      {/* ======================================================== */}
      {isDepartmentModalOpen && (
        <div
          onClick={() => setIsDepartmentModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>{departmentFormData.id ? 'Edit Departemen' : 'Tambah Departemen Baru'}</span>
              </h3>
              <button onClick={() => setIsDepartmentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDepartment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Departemen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Warehouse & Logistics"
                  value={departmentFormData.name}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="DEPT-LOG"
                    value={departmentFormData.code}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Divisi Induk *</label>
                  <select
                    value={departmentFormData.divisionId}
                    onChange={(e) => setDepartmentFormData({ ...departmentFormData, divisionId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {entityDivisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pimpinan Departemen</label>
                <input
                  type="text"
                  placeholder="Logistics Manager"
                  value={departmentFormData.headTitle}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, headTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Departemen</label>
                <textarea
                  rows={2}
                  placeholder="Uraian teknis operasional..."
                  value={departmentFormData.description}
                  onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {departmentFormData.id ? 'Perbarui Departemen' : 'Simpan Departemen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DIRECT: TAMBAH / EDIT POSISI JABATAN (SETUP MODE)  */}
      {/* ======================================================== */}
      {isPositionModalOpen && (
        <div
          onClick={() => setIsPositionModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>{positionFormData.id ? 'Edit Posisi Jabatan' : 'Tambah Posisi Jabatan Baru'}</span>
              </h3>
              <button onClick={() => setIsPositionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPosition} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* Dropdown Utama: Nama Posisi / Formasi Jabatan dari Master Jabatan */}
              <div className="space-y-2 p-3.5 bg-violet-50/70 rounded-xl border border-violet-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-violet-950 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-violet-600" />
                    <span>Nama Posisi / Formasi Jabatan * (Pilih dari Master Jabatan)</span>
                  </label>
                  <span className="text-[10px] bg-violet-200 text-violet-900 font-bold px-2 py-0.5 rounded">
                    Kamus Resmi
                  </span>
                </div>

                <select
                  required
                  value={
                    entityMasterPositions.find((m) => m.title.toLowerCase() === positionFormData.title.toLowerCase())?.id ||
                    (entityMasterPositions.length > 0 && !positionFormData.title ? '' : '')
                  }
                  onChange={(e) => {
                    const selected = entityMasterPositions.find((m) => m.id === e.target.value);
                    if (selected) {
                      handleSelectMasterJobForPosition(selected);
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-violet-300 rounded-lg bg-white text-xs font-bold text-slate-900 focus:outline-violet-600 shadow-2xs"
                >
                  <option value="">-- Pilih Judul Jabatan dari Master Jabatan --</option>
                  {entityMasterPositions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.title} — Tier L{m.defaultLevel} ({m.jobFamily || 'General'})
                    </option>
                  ))}
                </select>

                {positionFormData.title ? (
                  <div className="p-2.5 bg-white rounded-lg border border-violet-200/80 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{positionFormData.title}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Tier L{positionFormData.level} · Divisi: {positionFormData.division || currentEntity.name} {useDeptLevel ? `· Dept: ${positionFormData.department}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded shrink-0">
                      Tersinkron Master
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-violet-600">
                    Memilih jabatan dari Master Jabatan akan otomatis menyinkronkan judul formasi, jenjang level tier, divisi, dan deskripsi baku.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Level Tier Organisasi *</label>
                  <select
                    value={positionFormData.level}
                    onChange={(e) => setPositionFormData({ ...positionFormData, level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value={1}>Level 1 - Direksi (Board of Directors)</option>
                    <option value={2}>Level 2 - Vice President / Head of Division</option>
                    <option value={3}>Level 3 - Manager / Department Head</option>
                    <option value={4}>Level 4 - Supervisor / Lead Specialist</option>
                    <option value={5}>Level 5 - Officer / Staff Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Divisi Naungan *</label>
                  <select
                    value={positionFormData.division}
                    onChange={(e) => setPositionFormData({ ...positionFormData, division: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {entityDivisions.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {useDeptLevel && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Departemen</label>
                    <select
                      value={positionFormData.department}
                      onChange={(e) => setPositionFormData({ ...positionFormData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {entityDepartments.map((dept) => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={useDeptLevel ? '' : 'col-span-2'}>
                  <label className="font-semibold text-slate-700 block mb-1">Lapor Ke (Reports To)</label>
                  <select
                    value={positionFormData.reportsToId}
                    onChange={(e) => setPositionFormData({ ...positionFormData, reportsToId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Puncak Hierarki (Tanpa Atasan)</option>
                    {entityNodes
                      .filter((n) => n.id !== positionFormData.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>L{n.level} - {n.title}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Tipe Garis Komando Pelaporan */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Jalur Garis Komando / Pelaporan Atasan *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPositionFormData({ ...positionFormData, relationType: 'struktural' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      positionFormData.relationType === 'struktural'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="w-3.5 h-0.5 bg-slate-500 inline-block" />
                      <span>Komando Struktural Resmi</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Garis komando hierarkis resmi atasan langsung. Ditampilkan solid lurus pada bagan organisasi.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPositionFormData({ ...positionFormData, relationType: 'administratif' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      positionFormData.relationType === 'administratif'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                      <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-600 inline-block" />
                      <span>Koordinasi Administratif</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Garis fungsional, tata kelola, atau staf ahli. Ditampilkan garis putus-putus amber (dotted line).
                    </p>
                  </button>
                </div>
              </div>

              {/* Status Formasi Okupansi & Pemangku Jabatan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 text-xs">
                    Status Okupansi Formasi Jabatan *
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPositionFormData({ ...positionFormData, isVacant: false })}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        !positionFormData.isVacant
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Posisi Terisi
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPositionFormData({
                          ...positionFormData,
                          isVacant: true,
                          currentEmployeeId: '',
                        })
                      }
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        positionFormData.isVacant
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Posisi Kosong (Vacant)
                    </button>
                  </div>
                </div>

                {!positionFormData.isVacant ? (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Pilih Karyawan Pemegang Jabatan (Definitif) *
                    </label>
                    <select
                      value={positionFormData.currentEmployeeId}
                      onChange={(e) =>
                        setPositionFormData({
                          ...positionFormData,
                          currentEmployeeId: e.target.value,
                          isVacant: !e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="">-- Pilih Karyawan Definitif ({employees.length} Karyawan Terdaftar) --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.nik}) · {emp.department || 'Divisi Umum'} · {emp.position || 'Karyawan'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center shrink-0">
                      ?
                    </span>
                    <span>
                      Posisi ini akan ditandai sebagai <b>Posisi Kosong (Vacant)</b> dengan border putus-putus merah pada bagan organisasi, disiapkan untuk kebutuhan formatur rekrutmen.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Uraian Ruang Lingkup Kerja</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi tugas dan tanggung jawab struktural..."
                  value={positionFormData.description}
                  onChange={(e) => setPositionFormData({ ...positionFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPositionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {positionFormData.id ? 'Perbarui Posisi' : 'Simpan Posisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT MASTER JABATAN                      */}
      {/* ======================================================== */}
      {isMasterPositionModalOpen && (
        <div
          onClick={() => setIsMasterPositionModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" />
                <span>{masterPositionFormData.id ? 'Edit Master Jabatan' : 'Tambah Master Jabatan Baru'}</span>
              </h3>
              <button onClick={() => setIsMasterPositionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMasterPosition} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="font-semibold text-slate-700 block mb-1">Kode Jabatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="MJP-018"
                    value={masterPositionFormData.code}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Jabatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lead DevOps & Cloud Engineer"
                    value={masterPositionFormData.title}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Level Jenjang Baku *</label>
                  <select
                    value={masterPositionFormData.defaultLevel}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, defaultLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value={1}>Level 1 - Direksi (BOD)</option>
                    <option value={2}>Level 2 - Vice President / Head</option>
                    <option value={3}>Level 3 - Manager / Dept Head</option>
                    <option value={4}>Level 4 - Supervisor / Lead</option>
                    <option value={5}>Level 5 - Officer / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Job Grade</label>
                  <input
                    type="text"
                    placeholder="Contoh: Grade 08 / E-3"
                    value={masterPositionFormData.jobGrade}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, jobGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rumpun Profesi (Job Family) *</label>
                <select
                  value={masterPositionFormData.jobFamily}
                  onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, jobFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="Executive & Leadership">Executive & Leadership</option>
                  <option value="Human Resources & People">Human Resources & People</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Teknologi & Engineering">Teknologi & Engineering</option>
                  <option value="Commercial & Sales">Commercial & Sales</option>
                  <option value="General Affairs & Legal">General Affairs & Legal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Divisi Default</label>
                  <select
                    value={masterPositionFormData.division}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, division: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Pilih Divisi...</option>
                    {entityDivisions.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departemen Default</label>
                  <input
                    type="text"
                    placeholder="Contoh: Infrastructure"
                    value={masterPositionFormData.department}
                    onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Spesifikasi & Kualifikasi Minimum</label>
                <textarea
                  rows={2}
                  placeholder="Kualifikasi pendidikan, sertifikasi keahlian, pengalaman tahunan..."
                  value={masterPositionFormData.requirements}
                  onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Uraian / Deskripsi Jabatan</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan tanggung jawab utama posisi..."
                  value={masterPositionFormData.description}
                  onChange={(e) => setMasterPositionFormData({ ...masterPositionFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMasterPositionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {masterPositionFormData.id ? 'Perbarui Master Jabatan' : 'Simpan Master Jabatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL QUICK ASSIGN KARYAWAN KE FORMASI JABATAN           */}
      {/* ======================================================== */}
      {assigningPosition && (
        <div
          onClick={() => setAssigningPosition(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Penetapan Pemegang Jabatan</h3>
              </div>
              <button onClick={() => setAssigningPosition(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Formasi Kursi:</div>
                <div className="text-sm font-bold text-slate-900">{assigningPosition.title}</div>
                <div className="text-slate-600 text-[11px]">
                  Divisi: <b>{assigningPosition.division || currentEntity.name}</b> • Level Tier: <b>L{assigningPosition.level}</b>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Pilih Karyawan Aktif Perusahaan *
                </label>
                <select
                  value={selectedAssignEmployeeId}
                  onChange={(e) => setSelectedAssignEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:outline-indigo-600"
                >
                  <option value="">-- Kosongkan Kursi (Status Vacant) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.nik}) - {emp.jobTitle}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Karyawan yang dipilih akan tercatat sebagai pemegang resmi kursi formasi ini di seluruh sistem HRMS.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningPosition(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickAssignment}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Penetapan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PENGAJUAN RESTRUKTURISASI (DENGAN DRAFT LENGKAP) */}
      {/* ======================================================== */}
      {isRestructureModalOpen && (
        <div
          onClick={() => setIsRestructureModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Perancang & Pengajuan Restrukturisasi Organisasi</h3>
                  <span className="text-[11px] text-slate-400">Rancang draft divisi, departemen & posisi sebelum diberlakukan</span>
                </div>
              </div>
              <button onClick={() => setIsRestructureModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab navigation inside restructure modal */}
            <div className="bg-slate-100 px-4 pt-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDraftActiveTab('info')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  draftActiveTab === 'info' ? 'bg-white text-indigo-700 border-slate-200' : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                1. Data SK & Efektif
              </button>
              <button
                type="button"
                onClick={() => setDraftActiveTab('divisions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  draftActiveTab === 'divisions' ? 'bg-white text-indigo-700 border-slate-200' : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                2. Draf Divisi ({draftDivisions.length})
              </button>
              {useDeptLevel && (
                <button
                  type="button"
                  onClick={() => setDraftActiveTab('departments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                    draftActiveTab === 'departments' ? 'bg-white text-indigo-700 border-slate-200' : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  3. Draf Departemen ({draftDepartments.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setDraftActiveTab('positions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  draftActiveTab === 'positions' ? 'bg-white text-indigo-700 border-slate-200' : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                4. Draf Posisi Jabatan ({draftNodes.length})
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRestructuring} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* TAB 1: DATA SK & INFO */}
              {draftActiveTab === 'info' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-[11px] text-indigo-950 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <b>Fitur Perancang Draft Restrukturisasi:</b> Anda dapat merancang struktur baru di tab Draf Divisi, Draf Dept, dan Draf Posisi. Saat usulan SK disetujui, sistem akan <b>mereplace struktur aktif</b> dan struktur lama otomatis diarsipkan ke <b>Snapshot Histori</b>.
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Judul Perubahan Restrukturisasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Restrukturisasi Organisasi Semester I 2026"
                      value={restructureForm.title}
                      onChange={(e) => setRestructureForm({ ...restructureForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nomor Surat Keputusan (SK) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SK-DIR/RESTRUCT/2026/045"
                        value={restructureForm.skDocNumber}
                        onChange={(e) => setRestructureForm({ ...restructureForm, skDocNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>

                    <ValidatedDateInput
                      id="restructureEffectiveDate"
                      label="Tanggal Efektif Berlaku *"
                      value={restructureForm.effectiveDate}
                      onChange={(val) => setRestructureForm({ ...restructureForm, effectiveDate: val })}
                      required
                      helperText="Format YYYY-MM-DD"
                    />
                  </div>

                  {/* Upload Dokumen Bukti Restrukturisasi */}
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                    <label className="font-semibold text-slate-800 block text-xs flex items-center justify-between">
                      <span>Upload Dokumen / Surat Bukti Restrukturisasi *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Format PDF / DOCX / Scan SK</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-700 truncate">
                        {restructureForm.skDocFileName}
                      </div>
                      <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1 shrink-0">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setRestructureForm({
                                ...restructureForm,
                                skDocFileName: file.name,
                                skDocUrl: URL.createObjectURL(file),
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kajian Rasionalisasi Bisnis & Dasar Pertimbangan *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Jelaskan dasar pertimbangan restrukturisasi, efisiensi, dan beban kerja..."
                      value={restructureForm.description}
                      onChange={(e) => setRestructureForm({ ...restructureForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DRAFT DIVISI */}
              {draftActiveTab === 'divisions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Rancangan Divisi Baru ({draftDivisions.length} Divisi):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = `DIV-DRAFT-${Date.now().toString().slice(-3)}`;
                        setDraftDivisions([
                          ...draftDivisions,
                          {
                            id: `draft-div-${Date.now()}`,
                            entityId: currentEntityId,
                            name: `Divisi Baru ${draftDivisions.length + 1}`,
                            code: newCode,
                            headTitle: 'Head of Division',
                            description: 'Draft unit kerja baru',
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Draf Divisi</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {draftDivisions.map((div, idx) => (
                      <div key={div.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={div.name}
                            onChange={(e) => {
                              const next = [...draftDivisions];
                              next[idx].name = e.target.value;
                              setDraftDivisions(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold"
                            placeholder="Nama Divisi"
                          />
                          <input
                            type="text"
                            value={div.code}
                            onChange={(e) => {
                              const next = [...draftDivisions];
                              next[idx].code = e.target.value.toUpperCase();
                              setDraftDivisions(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
                            placeholder="Kode Divisi"
                          />
                          <input
                            type="text"
                            value={div.headTitle}
                            onChange={(e) => {
                              const next = [...draftDivisions];
                              next[idx].headTitle = e.target.value;
                              setDraftDivisions(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                            placeholder="Head Title"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftDivisions(draftDivisions.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus dari Draf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DRAFT DEPARTEMEN */}
              {draftActiveTab === 'departments' && useDeptLevel && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Rancangan Departemen Baru ({draftDepartments.length} Dept):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDepartments([
                          ...draftDepartments,
                          {
                            id: `draft-dept-${Date.now()}`,
                            entityId: currentEntityId,
                            divisionId: draftDivisions[0]?.id || '',
                            name: `Departemen Baru ${draftDepartments.length + 1}`,
                            code: `DEPT-${Date.now().toString().slice(-3)}`,
                            headTitle: 'Department Head',
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Draf Dept</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {draftDepartments.map((dept, idx) => (
                      <div key={dept.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={dept.name}
                            onChange={(e) => {
                              const next = [...draftDepartments];
                              next[idx].name = e.target.value;
                              setDraftDepartments(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold"
                            placeholder="Nama Departemen"
                          />
                          <input
                            type="text"
                            value={dept.code}
                            onChange={(e) => {
                              const next = [...draftDepartments];
                              next[idx].code = e.target.value.toUpperCase();
                              setDraftDepartments(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
                            placeholder="Kode Dept"
                          />
                          <select
                            value={dept.divisionId}
                            onChange={(e) => {
                              const next = [...draftDepartments];
                              next[idx].divisionId = e.target.value;
                              setDraftDepartments(next);
                            }}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                          >
                            {draftDivisions.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftDepartments(draftDepartments.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus dari Draf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DRAFT POSISI JABATAN */}
              {draftActiveTab === 'positions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Rancangan Posisi Jabatan Baru ({draftNodes.length} Posisi):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftNodes([
                          ...draftNodes,
                          {
                            id: `draft-node-${Date.now()}`,
                            entityId: currentEntityId,
                            title: `Posisi Baru ${draftNodes.length + 1}`,
                            level: 3,
                            division: draftDivisions[0]?.name || currentEntity.name,
                            department: useDeptLevel ? (draftDepartments[0]?.name || 'Umum') : 'Direct to Division',
                            relationType: 'struktural',
                            isVacant: true,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Draf Posisi</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {draftNodes.map((node, idx) => (
                      <div key={node.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-6 gap-2">
                          <input
                            type="text"
                            value={node.title}
                            onChange={(e) => {
                              const next = [...draftNodes];
                              next[idx].title = e.target.value;
                              setDraftNodes(next);
                            }}
                            className="col-span-1 sm:col-span-2 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold text-xs"
                            placeholder="Nama Jabatan"
                          />
                          <select
                            value={node.level}
                            onChange={(e) => {
                              const next = [...draftNodes];
                              next[idx].level = Number(e.target.value);
                              setDraftNodes(next);
                            }}
                            className="px-2 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                          >
                            <option value={1}>L1 - Direksi</option>
                            <option value={2}>L2 - VP / Head</option>
                            <option value={3}>L3 - Manager</option>
                            <option value={4}>L4 - Supervisor</option>
                            <option value={5}>L5 - Staff</option>
                          </select>
                          <select
                            value={node.relationType || 'struktural'}
                            onChange={(e) => {
                              const next = [...draftNodes];
                              next[idx].relationType = e.target.value as 'struktural' | 'administratif';
                              setDraftNodes(next);
                            }}
                            className="px-2 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-[11px]"
                            title="Tipe Garis Komando"
                          >
                            <option value="struktural">Solid: Struktural</option>
                            <option value="administratif">Dotted: Administratif</option>
                          </select>
                          <select
                            value={node.reportsToId || ''}
                            onChange={(e) => {
                              const next = [...draftNodes];
                              next[idx].reportsToId = e.target.value || undefined;
                              setDraftNodes(next);
                            }}
                            className="px-2 py-1.5 border border-slate-300 rounded-md bg-white text-[11px]"
                            title="Lapor Ke"
                          >
                            <option value="">Atasan: Puncak</option>
                            {draftNodes.filter((_, i) => i !== idx).map((n) => (
                              <option key={n.id} value={n.id}>{n.title}</option>
                            ))}
                          </select>
                          <select
                            value={node.isVacant ? 'vacant' : 'filled'}
                            onChange={(e) => {
                              const next = [...draftNodes];
                              next[idx].isVacant = e.target.value === 'vacant';
                              setDraftNodes(next);
                            }}
                            className={`px-2 py-1.5 border rounded-md font-semibold text-[11px] ${
                              node.isVacant ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                            title="Status Formasi"
                          >
                            <option value="vacant">Posisi Kosong</option>
                            <option value="filled">Terisi</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftNodes(draftNodes.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus dari Draf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Summary & Actions */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  Total Draf: <b>{draftDivisions.length}</b> Divisi • <b>{draftDepartments.length}</b> Dept • <b>{draftNodes.length}</b> Posisi
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRestructureModalOpen(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Kirim Pengajuan Restrukturisasi (Ber-SK)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: KOREKSI TYPO / PERBAIKAN ADMINISTRATIF RINGAN   */}
      {/* ======================================================== */}
      {isCorrectionModalOpen && (
        <div
          onClick={() => setIsCorrectionModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Koreksi Typo / Perbaikan Administratif Ringan</span>
              </h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Fitur ini digunakan hanya untuk memperbaiki kesalahan ketik (typo) ejaan nama jabatan tanpa mengubah garis hierarki atau restrukturisasi organisasi.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ejaan Nama Jabatan Baru *</label>
                <input
                  type="text"
                  required
                  value={correctionForm.correctedValue}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, correctedValue: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Koreksi Administratif</label>
                <textarea
                  rows={2}
                  value={correctionForm.notes}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  Terapkan Koreksi Typo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

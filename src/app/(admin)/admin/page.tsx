'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLaporKuyStore } from '@/lib/store';
import { Report } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Upload,
  AlertTriangle,
  Search,
  MapPin,
  ExternalLink,
  X,
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  User,
  Calendar,
  AlertCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { sendTelegramLog } from '@/app/actions/telegram';

const dinasOptions = [
  'Dinas Bina Marga & Sumber Daya Air',
  'Dinas Lingkungan Hidup',
  'Dinas Perhubungan',
  'Dinas Sumber Daya Air',
  'Dinas Perumahan Rakyat & Kawasan Permukiman',
  'BPBD & Penanggulangan Bencana'
];

const getCategoryBadgeClass = (category: string) => {
  if (category.includes('Lampu')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  if (category.includes('Banjir')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  if (category.includes('Sampah')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  if (category.includes('Trotoar')) return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

const getStatusBadgeConfig = (status: Report['status']) => {
  switch (status) {
    case 'Pending':
      return {
        label: 'Menunggu Verifikasi',
        dotColor: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
      };
    case 'Terverifikasi':
      return {
        label: 'Terverifikasi',
        dotColor: 'bg-indigo-500',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
      };
    case 'Diproses':
      return {
        label: 'Diproses Lapangan',
        dotColor: 'bg-blue-500',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
      };
    case 'Selesai':
      return {
        label: 'Selesai Beres',
        dotColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
      };
    case 'Ditolak':
      return {
        label: 'Ditolak',
        dotColor: 'bg-rose-500',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
      };
    default:
      return {
        label: status,
        dotColor: 'bg-slate-500',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
      };
  }
};

export default function AdminPage() {
  const { reports, updateReportStatus, deleteReport, deleteAllReports, refreshReports } = useLaporKuyStore();

  const [selectedDinasFilter, setSelectedDinasFilter] = useState<string>('Semua Dinas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja');

  // Delete modal state
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear all modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Photo viewer modal state
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Update Status Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<Report['status']>('Diproses');
  const [assignedDinasInput, setAssignedDinasInput] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [afterPhotoInput, setAfterPhotoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatic real-time polling every 8s to guarantee new frontend reports arrive immediately
  useEffect(() => {
    const interval = setInterval(() => {
      refreshReports();
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshReports]);

  // Statistics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const terverifikasiCount = reports.filter((r) => r.status === 'Terverifikasi').length;
  const inProgressCount = reports.filter((r) => r.status === 'Diproses').length;
  const completedCount = reports.filter((r) => r.status === 'Selesai').length;

  // Filter logic
  const filteredReports = reports.filter((r) => {
    if (selectedDinasFilter !== 'Semua Dinas') {
      if (!r.assignedDinas?.toLowerCase().includes(selectedDinasFilter.toLowerCase())) {
        return false;
      }
    }

    if (selectedStatusFilter !== 'Semua') {
      if (selectedStatusFilter === 'Perlu Verifikasi' && r.status !== 'Pending') return false;
      if (selectedStatusFilter !== 'Perlu Verifikasi' && r.status !== selectedStatusFilter) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchAddress = r.address.toLowerCase().includes(q);
      const matchDistrict = (r.district || '').toLowerCase().includes(q);
      const matchDinas = (r.assignedDinas || '').toLowerCase().includes(q);
      const matchUser = (r.userName || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchAddress && !matchDistrict && !matchDinas && !matchUser) {
        return false;
      }
    }

    return true;
  });

  const handleOpenModal = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status === 'Pending' ? 'Terverifikasi' : report.status);
    setAssignedDinasInput(report.assignedDinas || dinasOptions[0]);
    setStatusNotes('');
    setAfterPhotoInput(report.afterPhotoUrl || '');
  };

  // Quick 1-click verification
  const handleQuickVerify = async (report: Report) => {
    try {
      await updateReportStatus(
        report.id,
        'Terverifikasi',
        'Laporan telah diverifikasi oleh tim Dispatch Admin dan diteruskan ke dinas terkait.',
        report.afterPhotoUrl || '',
        report.assignedDinas || dinasOptions[0]
      );
      toast.success(`Laporan #${report.id} Berhasil Diverifikasi!`, {
        description: 'Status kini Terverifikasi dan langsung tampil di portal publik.'
      });
      sendTelegramLog(`<b>🛡️ Laporan Diverifikasi (Admin)</b>\n\n<b>ID:</b> <code>${report.id}</code>\n<b>Admin:</b> AryaKuy\n<b>Status:</b> Terverifikasi\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);
    } catch {
      toast.error('Gagal memverifikasi laporan.');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsSubmitting(true);
    try {
      await updateReportStatus(
        selectedReport.id,
        newStatus,
        statusNotes,
        afterPhotoInput || selectedReport.afterPhotoUrl || '',
        assignedDinasInput || selectedReport.assignedDinas
      );

      sendTelegramLog(`<b>📝 Tindak Lanjut Laporan (Admin)</b>\n\n<b>ID:</b> <code>${selectedReport.id}</code>\n<b>Admin:</b> AryaKuy\n<b>Status Baru:</b> ${newStatus}\n<b>Dinas:</b> ${assignedDinasInput || selectedReport.assignedDinas}\n<b>Catatan:</b> <i>${statusNotes || '-'}</i>\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);

      toast.success(`Status Laporan #${selectedReport.id} Diperbarui!`, {
        description: `Status: ${newStatus} • Ditangani: ${assignedDinasInput}`
      });
      setSelectedReport(null);
    } catch {
      toast.error('Gagal memperbarui status laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshReports();
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data laporan berhasil disinkronkan dari Supabase.');
    }, 400);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteReport(reportToDelete.id);
      if (ok) {
        sendTelegramLog(`<b>🗑️ Laporan Dihapus (Admin)</b>\n\n<b>ID:</b> <code>${reportToDelete.id}</code>\n<b>Admin:</b> AryaKuy\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);
        toast.success(`Laporan #${reportToDelete.id} berhasil dihapus.`);
        setReportToDelete(null);
      } else {
        toast.error('Gagal menghapus laporan.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus laporan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllReports = async () => {
    setIsClearingAll(true);
    try {
      await deleteAllReports();
      sendTelegramLog(`<b>🚨 SEMUA LAPORAN DIHAPUS (Admin)</b>\n\n<b>Admin:</b> AryaKuy\n<b>Status:</b> Database dikosongkan\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);
      toast.success('Semua laporan di Supabase dan lokal berhasil dihapus.');
      setShowClearAllModal(false);
    } catch {
      toast.error('Gagal mengosongkan data laporan.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Image compressor for After Photo uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAfterPhotoInput(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* ── 1. COMMAND HEADER & LIVE STATUS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#0057B8] dark:text-blue-400 uppercase tracking-wider">
              Pusat Kendali Pengaduan Warga
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Daftar Aduan Infrastruktur Kota
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Verifikasi aduan masuk warga, delegasikan ke dinas teknis, dan perbarui progres perbaikan secara real-time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold gap-2 shadow-xs hover:border-slate-300"
            title="Sinkronkan data dari Supabase sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0057B8] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
          </Button>

          {reports.length > 0 && (
            <Button
              onClick={() => setShowClearAllModal(true)}
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-lg border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold gap-1.5"
              title="Hapus semua laporan di database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kosongkan</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. METRIC CARDS (CLEAN CIVIC OVERVIEW) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Laporan */}
        <Card className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Aduan Masuk</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 tabular-nums">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Data asli tersinkron dari Supabase
          </p>
        </Card>

        {/* Perlu Verifikasi */}
        <Card className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-4 -mt-4 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
              Perlu Verifikasi
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-300 mt-2 tabular-nums">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">
            {pendingCount > 0 ? 'Menunggu peninjauan admin' : 'Semua aduan terverifikasi'}
          </p>
        </Card>

        {/* Dalam Penanganan Dinas */}
        <Card className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Dalam Penanganan
            </span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-300 mt-2 tabular-nums">
            {inProgressCount + terverifikasiCount}
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-1">
            {terverifikasiCount} terverifikasi • {inProgressCount} dikerjakan
          </p>
        </Card>

        {/* Selesai Beres */}
        <Card className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Selesai Tuntas
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-2 tabular-nums">
            {completedCount}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1">
            Infrastruktur telah tuntas diperbaiki
          </p>
        </Card>
      </div>

      {/* ── 3. SEARCH & FILTERS BAR ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nomor aduan (REP-xxxx), judul, kecamatan, atau nama warga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 h-10 text-xs sm:text-sm rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-[#0057B8]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dinas Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedDinasFilter}
              onChange={(e) => setSelectedDinasFilter(e.target.value)}
              className="h-10 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#0057B8]"
            >
              <option value="Semua Dinas">Semua Dinas Penanggung Jawab</option>
              {dinasOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0 py-1">
            {[
              { id: 'Semua', label: 'Semua Aduan' },
              { id: 'Perlu Verifikasi', label: 'Perlu Verifikasi (Pending)' },
              { id: 'Terverifikasi', label: 'Terverifikasi' },
              { id: 'Diproses', label: 'Sedang Diproses' },
              { id: 'Selesai', label: 'Selesai Beres' },
              { id: 'Ditolak', label: 'Ditolak' }
            ].map((tab) => {
              const isActive = selectedStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0057B8] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 hidden md:block whitespace-nowrap pl-3">
            Menampilkan <strong>{filteredReports.length}</strong> dari {reports.length} aduan
          </div>
        </div>
      </div>

      {/* ── 4. TABLE & CARD VIEW ── */}

      {/* ================= MOBILE VIEW (< 768px): TICKET CARDS ================= */}
      <div className="block md:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada aduan ditemukan</p>
            <p className="text-xs text-slate-400">Silakan ubah kata kunci atau ganti filter status aduan.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const statusCfg = getStatusBadgeConfig(report.status);
            return (
              <Card
                key={report.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-xs"
              >
                {/* Header: ID + Category + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      #{report.id}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${getCategoryBadgeClass(report.category)}`}>
                      {report.category}
                    </Badge>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 whitespace-nowrap ${statusCfg.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Content: Photo + Title + Location */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => report.photoUrl && setPhotoPreviewUrl(report.photoUrl)}
                    className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative cursor-pointer group"
                  >
                    {report.photoUrl ? (
                      <img
                        src={report.photoUrl}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    {report.afterPhotoUrl && (
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-600 text-white">
                        ✓ After
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{report.address}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Warga: <strong>{report.userName || 'Warga'}</strong></span>
                      <span>•</span>
                      <span>Keparahan: {report.severity}/10</span>
                    </div>
                  </div>
                </div>

                {/* Dinas detail */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="truncate flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{report.assignedDinas || 'Dinas Bina Marga'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {report.status === 'Pending' && (
                    <Button
                      onClick={() => handleQuickVerify(report)}
                      size="sm"
                      className="h-8.5 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verifikasi
                    </Button>
                  )}
                  <Button
                    onClick={() => handleOpenModal(report)}
                    size="sm"
                    className="flex-1 h-8.5 text-xs font-bold rounded-lg bg-[#0057B8] hover:bg-[#004494] text-white shadow-xs cursor-pointer"
                  >
                    Tindak Lanjut
                  </Button>
                  <Link href={`/laporan/${report.id}`} target="_blank">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8.5 w-8.5 p-0 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 cursor-pointer"
                      title="Buka tampilan warga"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportToDelete(report)}
                    className="h-8.5 w-8.5 p-0 rounded-lg border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="Hapus aduan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ================= TABLET & DESKTOP VIEW (>= 768px): CIVIC DATA TABLE ================= */}
      <div className="hidden md:block">
        <Card className="border-slate-200/80 dark:border-slate-800 overflow-hidden rounded-xl shadow-xs bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold w-44">Bukti & Nomor Aduan</th>
                  <th className="py-3 px-4 font-bold">Judul & Lokasi Kerusakan</th>
                  <th className="py-3 px-4 font-bold w-44">Warga Pelapor</th>
                  <th className="py-3 px-4 font-bold w-48">Dinas Penanggung Jawab</th>
                  <th className="py-3 px-4 font-bold w-40">Status Tindak Lanjut</th>
                  <th className="py-3 px-4 font-bold text-right w-44">Tindakan Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada laporan yang sesuai kriteria pencarian.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter status.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const statusCfg = getStatusBadgeConfig(report.status);
                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* ID & Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => report.photoUrl && setPhotoPreviewUrl(report.photoUrl)}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative cursor-pointer group"
                              title="Klik untuk melihat foto bukti penuh"
                            >
                              {report.photoUrl ? (
                                <img
                                  src={report.photoUrl}
                                  alt={report.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              {report.afterPhotoUrl && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded text-[7px] font-bold bg-emerald-600 text-white">
                                  After
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 block">
                                #{report.id}
                              </span>
                              <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md border mt-1 ${getCategoryBadgeClass(report.category)}`}>
                                {report.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Title & Location */}
                        <td className="py-3 px-4 max-w-xs">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                            {report.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{report.address}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Kecamatan: <strong>{report.district || 'Belum terdata'}</strong> • Keparahan: {report.severity}/10
                          </span>
                        </td>

                        {/* Citizen info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              {report.userAvatar ? (
                                <img src={report.userAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                {report.userName || 'Warga Publik'}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Dinas */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <span className="font-medium line-clamp-2 leading-relaxed">
                            {report.assignedDinas || 'Dinas Bina Marga'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                            {statusCfg.label}
                          </span>
                          {report.isUrgent && (
                            <span className="block mt-1 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                              ⚠️ Kategori Darurat
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {report.status === 'Pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleQuickVerify(report)}
                                className="h-7 px-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs cursor-pointer"
                                title="Verifikasi laporan langsung 1-klik"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verifikasi</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              onClick={() => handleOpenModal(report)}
                              className="h-7 px-2.5 text-xs font-bold rounded-lg bg-[#0057B8] hover:bg-[#004494] text-white shadow-xs cursor-pointer"
                              title="Kelola tindak lanjut dinas"
                            >
                              Kelola
                            </Button>

                            <Link href={`/laporan/${report.id}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 cursor-pointer"
                                title="Lihat di Portal Publik (Tab Baru)"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReportToDelete(report)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                              title="Hapus aduan ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── 5. MODAL TINDAK LANJUT & VERIFIKASI ── */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0057B8] uppercase tracking-wider">
                    Panel Verifikasi & Dispatch
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  Tindak Lanjut Aduan #{selectedReport.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Brief Report Summary */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center gap-3.5 border border-slate-200/80 dark:border-slate-800">
              {selectedReport.photoUrl ? (
                <img
                  src={selectedReport.photoUrl}
                  alt={selectedReport.title}
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0.2 border ${getCategoryBadgeClass(selectedReport.category)}`}>
                    {selectedReport.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    Pelapor: <strong>{selectedReport.userName || 'Warga'}</strong>
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedReport.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  📍 {selectedReport.address}
                </p>
              </div>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              {/* Status Selector */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  1. Perbarui Tahapan Status:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(['Pending', 'Terverifikasi', 'Diproses', 'Selesai', 'Ditolak'] as const).map((st) => {
                    const isSelected = newStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className={`py-2 px-1.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'border-[#0057B8] bg-blue-50 text-[#0057B8] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {st === 'Pending' && '⏳ Pending'}
                        {st === 'Terverifikasi' && '🛡️ Terverifikasi'}
                        {st === 'Diproses' && '⚡ Diproses'}
                        {st === 'Selesai' && '✓ Selesai'}
                        {st === 'Ditolak' && '✕ Ditolak'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dinas Assignment */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  2. Dinas Penanggung Jawab Lapangan:
                </label>
                <select
                  value={assignedDinasInput}
                  onChange={(e) => setAssignedDinasInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-1 focus:ring-[#0057B8]"
                >
                  {dinasOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Official Notes / Respon Dinas */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  3. Catatan Resmi Dinas (Akan Tampil di Portal Publik):
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan instruksi penugasan, jadwal pengerjaan, atau catatan hasil perbaikan lapangan..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-[#0057B8]"
                />
              </div>

              {/* After Photo (If status = Selesai) */}
              {newStatus === 'Selesai' && (
                <div className="space-y-2 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      4. Foto Bukti Hasil Perbaikan (Foto Sesudah / After):
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Tampil di Slider Publik
                    </span>
                  </div>

                  {afterPhotoInput ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800">
                      <img src={afterPhotoInput} className="w-full h-full object-cover" alt="After Proof" />
                      <button
                        type="button"
                        onClick={() => setAfterPhotoInput('')}
                        className="absolute top-2 right-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg cursor-pointer bg-white dark:bg-slate-900 hover:bg-emerald-50/40 transition-colors">
                        <Upload className="h-5 w-5 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Pilih & Unggah Foto Hasil Perbaikan
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Otomatis dikompresi kualitas tinggi
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>

                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500 font-medium">Contoh Cepat:</span>
                        <button
                          type="button"
                          onClick={() => setAfterPhotoInput('https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80')}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:border-emerald-400 cursor-pointer"
                        >
                          Aspal Rapi Selesai
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="text-xs font-semibold h-9 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-bold h-9 px-4 rounded-lg bg-[#0057B8] hover:bg-[#004494] text-white shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. PHOTO FULLSCREEN PREVIEW MODAL ── */}
      {photoPreviewUrl && (
        <div 
          onClick={() => setPhotoPreviewUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2" onClick={(e) => e.stopPropagation()}>
            <img src={photoPreviewUrl} alt="Foto Bukti" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setPhotoPreviewUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 7. DELETE SINGLE REPORT CONFIRMATION MODAL ── */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hapus Aduan #{reportToDelete.id}?
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus aduan dari Supabase secara permanen.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
              &quot;{reportToDelete.title}&quot; di {reportToDelete.address}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportToDelete(null)}
                className="h-8.5 text-xs font-semibold rounded-lg"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteReport}
                disabled={isDeleting}
                className="h-8.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Aduan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. CLEAR ALL REPORTS MODAL ── */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Kosongkan Semua Data Aduan?
                </h3>
                <p className="text-xs text-slate-500">
                  Seluruh ({reports.length}) aduan dan komentar terkait di Supabase akan dihapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearAllModal(false)}
                className="h-8.5 text-xs font-semibold rounded-lg"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleClearAllReports}
                disabled={isClearingAll}
                className="h-8.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isClearingAll ? 'Menghapus...' : 'Ya, Kosongkan Semua'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

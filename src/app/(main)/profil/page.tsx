'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLaporKuyStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  FileText,
  CheckCircle2,
  ChevronRight,
  LogOut,
  MapPin,
  Clock,
  Phone,
  Mail,
  ShieldAlert,
  Camera,
  Flame,
  Star,
  TrendingUp,
  User,
  Award,
  Medal,
  Trophy,
  Copy,
  Check,
  Edit3,
  Sparkles,
  Pencil,
  X,
  Lock,
  UserRoundPen,
  Loader2
} from 'lucide-react';

import { useUserLocation } from '@/lib/location-store';
import { sendTelegramLog } from '@/app/actions/telegram';
import { toast } from 'sonner';

export default function ProfilPage() {
  const router = useRouter();
  const { profile, reports, updateProfile, isInitialized, logout } = useLaporKuyStore();
  const { location: userLoc } = useUserLocation();
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'laporan' | 'pengaturan'>('ringkasan');
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const handleTabChange = (tab: 'ringkasan' | 'laporan' | 'pengaturan') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const myReports = reports.filter((r) => 
    r.userId === profile.id || 
    (profile.name && r.userName === profile.name && r.userId === 'usr-me')
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAvatar(profile.avatar || '');
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const meta = session?.user?.user_metadata;
      const gAvatar = meta?.avatar_url || meta?.picture || meta?.avatar;
      if (gAvatar && (!profile?.avatar || profile?.avatar.includes('/images/avatars/'))) {
        setAvatar(gAvatar);
        if (profile && profile.avatar !== gAvatar) {
          updateProfile({ avatar: gAvatar });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Terverifikasi' | 'Diproses' | 'Selesai' | 'Pending'>('Semua');
  const [hasGoldFrame, setHasGoldFrame] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && profile.id) {
      const isGold = localStorage.getItem(`laporkuy_gold_frame_${profile.id}`) === 'true';
      setHasGoldFrame(isGold);
    }
  }, [profile.id]);

  const filteredReports = myReports.filter((report) => {
    if (statusFilter === 'Semua') return true;
    return report.status === statusFilter;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateProfile({ name, email, phone, avatar });
    setSaveSuccess(true);
    toast.success('Profil berhasil diperbarui!');
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(false);
      setIsEditModalOpen(false);
    }, 500);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return 'Baru saja';
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran foto terlalu besar', {
          description: 'Maksimal ukuran foto adalah 10MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawSrc = event.target?.result as string;
        if (rawSrc) {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 160;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setAvatar(compressed);
            updateProfile({ avatar: compressed });
            toast.success('Foto profil berhasil diperbarui!');
          };
          img.src = rawSrc;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getAvatarFallback = (n: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'U')}&background=003B73&color=fff&size=200&bold=true&format=png`;

  const getReportImgFallback = (title: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 12))}/800/400`;

  const avatarSrc = avatar || profile.avatar || getAvatarFallback(name || profile.name);

  const xpPercent = Math.min(100, Math.round(((profile.xp || 0) / (profile.nextLevelXp || 100)) * 100));

  const humanReadableId = `#LAPOR-${(profile.id || 'C9C4').slice(0, 4).toUpperCase()}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(humanReadableId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusClass = (status: string) => {
    if (status === 'Selesai') return 'bg-[#EDF3EC] text-[#346538] border-[#CFE4CE]';
    if (status === 'Diproses') return 'bg-[#FBF3DB] text-[#956400] border-[#F4E4B6]';
    if (status === 'Terverifikasi') return 'bg-[#E1F3FE] text-[#1F6C9F] border-[#BDE3FD]';
    return 'bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]';
  };

  const navItems = [
    { key: 'ringkasan' as const, label: 'Ringkasan Akun', icon: TrendingUp, iconBg: 'bg-blue-50 text-blue-600' },
    { key: 'laporan' as const, label: 'Laporan Saya', icon: FileText, iconBg: 'bg-emerald-50 text-emerald-600' },
    { key: 'pengaturan' as const, label: 'Ubah Data Pribadi', icon: Settings, iconBg: 'bg-purple-50 text-purple-600' },
  ];

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
        <div className="bg-[#003B73] pt-14 pb-20">
          <div className="max-w-5xl mx-auto px-5 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4" />
            <div className="h-6 w-40 bg-white/10 rounded-lg mx-auto mb-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 md:pb-12">
      
      {/* ── 1. USER HERO HEADER SECTION (MATCHED LIGHT/DARK ADAPTIVE THEME) ── */}
      <section className="relative w-full bg-gradient-to-b from-primary/15 via-primary/5 to-background border-b border-border/60 pt-8 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center flex flex-col items-center">
          
          {/* Avatar with Ring & Status Indicator & Instant Upload */}
          <div 
            className="relative mb-3 group cursor-pointer"
            onClick={() => setIsEditModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditModalOpen(true)}
          >
            <div className="relative block">
              <img
                src={avatarSrc}
                alt={name || profile.name}
                referrerPolicy="no-referrer"
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-background shadow-md ${
                  hasGoldFrame
                    ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                    : 'ring-4 ring-primary/20'
                } bg-card group-hover:brightness-90 transition-all`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getAvatarFallback(name || profile.name);
                }}
              />
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white drop-shadow-md" />
              </div>
            </div>
            <div 
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-2 border-background shadow-xs hover:scale-110 transition-transform flex items-center justify-center"
              title="Ubah Foto Profil"
            >
              <Camera className="w-3 h-3" />
            </div>
          </div>

          {/* User Name & Level Badge */}
          <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {name || profile.name || "Pengguna LaporKuy"}
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              <Trophy className="w-3 h-3 mr-1 text-primary shrink-0" />
              {profile.level || "Pemula"}
            </Badge>
            {hasGoldFrame && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-200" />
                Warga Peduli
              </Badge>
            )}
          </div>

          {/* Location & Human Readable ID */}
          <div className="flex items-center justify-center gap-3 mb-4 text-xs text-muted-foreground font-medium flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{userLoc.isLoading ? 'Mendeteksi lokasi...' : (userLoc.fullLocation || 'Lokasi tidak diketahui')}</span>
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{humanReadableId}</span>
              <button 
                onClick={copyToClipboard}
                className="hover:text-foreground transition-colors p-0.5"
                title="Salin ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
              </button>
            </div>
          </div>

          {/* XP Progress Bar Card */}
          <Card className="w-full max-w-sm p-3.5 border-border/80 bg-card text-card-foreground rounded-2xl shadow-xs space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-foreground">Kemajuan XP</span>
              <span className="font-bold text-primary">{profile.xp || 0} / {profile.nextLevelXp || 100} XP</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </Card>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="group relative inline-flex items-center justify-center gap-2 h-9.5 px-4.5 rounded-xl bg-card/95 hover:bg-card text-foreground border border-border/80 hover:border-primary/50 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-200 text-xs font-semibold cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <Pencil className="w-3 h-3" />
              </div>
              <span className="font-semibold text-foreground tracking-tight">Ubah Profile</span>
            </button>

            <Link href="/tukar-poin">
              <button
                type="button"
                className="group relative inline-flex items-center justify-center gap-2 h-9.5 px-4.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-600/95 text-primary-foreground shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-200 text-xs font-semibold cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform duration-200 shrink-0" />
                <span className="tracking-tight">Tukar Poin</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                  {profile.points || 0}
                </span>
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── 2. AREA KONTEN & FLOATING KARTU STATISTIK ── */}
      <main className="max-w-2xl mx-auto px-4 -mt-6 relative z-30 space-y-6">
        
        {/* Stat Highlights Card */}
        <Card className="p-5 border border-border/80 bg-card text-card-foreground rounded-2xl shadow-xs">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {myReports.length}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">
                Total Laporan
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
                {profile.points || 0}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">
                Poin Aktif
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {profile.streakDays || 0} <span className="text-sm font-semibold text-muted-foreground">Hari</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-0.5">
                Streak Lapor
              </span>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs Bar */}
        <div className="bg-card rounded-2xl border border-border/80 p-1.5 flex items-center gap-1 shadow-2xs">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{key === 'ringkasan' ? 'Ringkasan' : key === 'laporan' ? 'Laporan' : 'Ubah Data'}</span>
            </button>
          ))}
        </div>

        {/* MAIN TAB CONTENT DISPLAY AREA */}
        <section id="main-content" className="pt-1">

            {/* TAB 1: RINGKASAN */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-4">
                
                {/* Status Ringkasan */}
                <Card className="p-4 sm:p-5 border-border/80 bg-card text-card-foreground rounded-2xl shadow-xs">
                  <h3 className="text-xs font-bold text-muted-foreground tracking-wide mb-3">
                    Status Laporan Anda
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: myReports.length, label: 'Total Laporan', color: 'text-foreground' },
                      { value: myReports.filter(r => r.status === 'Selesai').length, label: 'Selesai', color: 'text-emerald-600 dark:text-emerald-400' },
                      { value: myReports.filter(r => r.status === 'Diproses').length, label: 'Diproses', color: 'text-amber-600 dark:text-amber-400' },
                    ].map(({ value, label, color }) => (
                      <div key={label} className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center">
                        <div className={`text-xl font-extrabold ${color} leading-none mb-1`}>{value}</div>
                        <div className="text-xs font-medium text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Aktivitas Terbaru List */}
                <Card className="p-4 sm:p-5 border-border/80 bg-card text-card-foreground rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Laporan Terbaru
                    </h3>
                    <button
                      onClick={() => handleTabChange('laporan')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Lihat semua
                    </button>
                  </div>

                  {myReports.length > 0 ? (
                    <div className="divide-y border-border/40">
                      {myReports.slice(0, 3).map((report) => (
                        <div key={report.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={report.photoUrl || getReportImgFallback(report.title)}
                              alt={report.title}
                              className="w-11 h-11 rounded-xl object-cover border border-border shrink-0 bg-muted"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getReportImgFallback(report.title);
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{report.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5 font-medium">
                                <MapPin className="w-3 h-3 text-primary shrink-0" />
                                {report.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusClass(report.status)}`}>
                              {report.status}
                            </span>
                            <Link href={`/laporan/${report.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs font-bold rounded-lg border-border">
                                Detail
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-xs font-semibold">Belum ada pengaduan dikirim.</p>
                      <Link href="/buat-laporan" className="inline-block mt-3">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl px-4 shadow-xs">
                          Buat Laporan Baru
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>

              </div>
            )}

            {/* TAB 2: LAPORAN SAYA */}
            {activeTab === 'laporan' && (
              <div className="space-y-3">
                <div className="bg-card rounded-2xl border border-border/80 p-1.5 flex items-center gap-1 overflow-x-auto shadow-2xs">
                  {(['Semua', 'Terverifikasi', 'Diproses', 'Selesai', 'Pending'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        statusFilter === f
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {filteredReports.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredReports.map((report) => (
                      <Card key={report.id} className="p-3.5 border-border/80 bg-card text-card-foreground rounded-2xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={report.photoUrl || getReportImgFallback(report.title)}
                            alt={report.title}
                            className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getReportImgFallback(report.title);
                            }}
                          />
                          <div className="min-w-0">
                            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1 ${statusClass(report.status)}`}>
                              {report.status}
                            </span>
                            <h4 className="text-xs font-bold text-foreground truncate">{report.title}</h4>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5 font-medium">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              {report.address}
                            </p>
                          </div>
                        </div>

                        <Link href={`/laporan/${report.id}`} className="shrink-0 ml-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-xl border-border">
                            Detail
                          </Button>
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground border-border/80 rounded-2xl">
                    <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-xs font-bold text-foreground">Tidak Ada Laporan</p>
                  </Card>
                )}
              </div>
            )}

            {/* TAB 3: UBAH DATA PRIBADI */}
            {activeTab === 'pengaturan' && (
              <Card className="p-5 sm:p-6 border-border/80 bg-card text-card-foreground rounded-2xl shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <UserRoundPen className="w-4 h-4 text-primary" />
                      Ubah Data Pribadi
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kelola identitas dan informasi kontak akun LaporKuy Anda
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50">
                    {humanReadableId}
                  </span>
                </div>

                {saveSuccess && (
                  <div className="mb-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Perubahan data berhasil disimpan!
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="relative">
                      <img
                        src={avatarSrc}
                        alt="Avatar"
                        className={`w-14 h-14 rounded-full object-cover border-2 border-background shadow-xs ${
                          hasGoldFrame ? 'ring-2 ring-amber-400' : 'ring-1 ring-border'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAvatarFallback(name || profile.name);
                        }}
                      />
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl px-3 py-1.5 cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileSelect}
                        />
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">Format JPG, PNG, atau WEBP, maks 5MB.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Nama Lengkap</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="emailAddress" className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Alamat Email</span>
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        Terverifikasi
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="emailAddress"
                        type="email"
                        readOnly
                        value={email}
                        className="w-full h-11 pl-3.5 pr-9 bg-muted/50 border border-border/70 rounded-xl text-xs font-medium text-muted-foreground cursor-not-allowed"
                      />
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Email tidak dapat diubah karena terhubung dengan akun login Anda.</p>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>Nomor Telepon</span>
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-11 px-6 rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Perubahan</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

          </section>

          {/* Tombol Keluar Sistem */}
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 h-11 text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30 rounded-xl transition-colors shadow-2xs mt-4"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar Sistem</span>
          </Button>

      </main>

      {/* ── 3. MODAL DIALOG UBAH PROFILE ── */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserRoundPen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Ubah Profile</h2>
                  <p className="text-xs text-muted-foreground">Perbarui informasi dan foto akun Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form (Scrollable) */}
            <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-5">
              {saveSuccess && (
                <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Perubahan data berhasil disimpan!
                </div>
              )}

              {/* Avatar Studio */}
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div className="relative mb-3 group">
                  <img
                    src={avatarSrc}
                    alt={name || profile.name}
                    referrerPolicy="no-referrer"
                    className={`w-20 h-20 rounded-full object-cover border-4 border-background shadow-md ${
                      hasGoldFrame
                        ? 'ring-4 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                        : 'ring-2 ring-primary/20'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAvatarFallback(name || profile.name);
                    }}
                  />
                  <label
                    htmlFor="modal-avatar-file"
                    className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-1.5 border-2 border-background shadow-sm cursor-pointer transition-transform hover:scale-110"
                    title="Ganti Foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      id="modal-avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                    />
                  </label>
                </div>

                <label
                  htmlFor="modal-avatar-file-btn"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl px-3 py-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Pilih Foto Baru</span>
                  <input
                    id="modal-avatar-file-btn"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileSelect}
                  />
                </label>
                <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">Mendukung format JPG, PNG, atau WEBP (maks. 5MB)</span>
              </div>

              {/* Fields */}
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="modal-fullname" className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Nama Lengkap</span>
                  </label>
                  <input
                    id="modal-fullname"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full h-10.5 px-3.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="modal-phone" className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>Nomor Telepon</span>
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full h-10.5 px-3.5 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="modal-email" className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Alamat Email</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Terverifikasi
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-email"
                      type="email"
                      readOnly
                      value={email}
                      className="w-full h-10.5 pl-3.5 pr-8 bg-muted/50 border border-border/70 rounded-xl text-xs font-medium text-muted-foreground cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Email terikat dengan autentikasi akun dan tidak dapat diubah.</p>
                </div>
              </div>

              {/* ID Card info */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-muted-foreground font-medium block">ID Pengguna</span>
                  <span className="text-xs font-bold text-foreground font-mono">{humanReadableId}</span>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-background border border-border hover:bg-muted text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-[11px] text-emerald-600 font-semibold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px]">Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


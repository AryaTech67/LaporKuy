'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useLaporKuyStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Target, 
  ThumbsUp, 
  MessageSquare, 
  Globe, 
  Building2, 
  LightbulbOff, 
  Trash2,
  ArrowLeft
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/map/map-view').then(mod => mod.MapView), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-[#e8ecf1] dark:bg-slate-900 flex flex-col items-center justify-center text-slate-500">
      <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-xs">
        <Loader2 className="w-4 h-4 animate-spin text-[#0057B8]" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Membuka Peta & Titik Laporan...</span>
      </div>
    </div>
  )
});

function DashboardContent() {
  const { reports } = useLaporKuyStore();
  const searchParams = useSearchParams();
  const questParam = searchParams.get('quest');
  const questTitle = searchParams.get('title');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terpopuler' | 'mendesak' | 'terlama'>('terbaru');

  // Bottom Sheet Drag Logic
  const [sheetHeight, setSheetHeight] = useState(40); // 40vh default
  const [isMobile, setIsMobile] = useState(false);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(40);

  const sheetRef = useRef<HTMLDivElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAuth = localStorage.getItem('laporkuy_admin_auth') || document.cookie.includes('laporkuy_admin_session=authenticated');
      setIsAdmin(!!hasAuth);
    }
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animateToHeight = (target: number) => {
    setSheetHeight(target);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    startHeight.current = sheetHeight;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaY = dragStartY.current - e.clientY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;
    
    let newHeight = startHeight.current + deltaPercent;
    if (newHeight < 15) newHeight = 15;
    if (newHeight > 95) newHeight = 95;

    setSheetHeight(newHeight);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const deltaY = dragStartY.current - e.clientY; // positive = dragged up, negative = dragged down
    const moveY = Math.abs(deltaY);
    
    // Directional snapping for better UX
    if (deltaY > 30) {
      // Dragged UP
      if (startHeight.current < 30) animateToHeight(40);
      else animateToHeight(88); // 88% instead of 95% to avoid search bar overlap
    } else if (deltaY < -30) {
      // Dragged DOWN
      if (startHeight.current > 70) animateToHeight(40);
      else animateToHeight(15);
    } else {
      // Didn't drag enough, snap to nearest state
      if (sheetHeight < 25) animateToHeight(15);
      else if (sheetHeight > 70) animateToHeight(88);
      else animateToHeight(40);
    }
  };

  const handleHandleClick = () => {
    // If not actively dragging, toggle between states
    if (sheetHeight < 30) animateToHeight(40);
    else if (sheetHeight < 70) animateToHeight(88);
    else animateToHeight(40);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      report.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      activeCategory === 'Semua' || report.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'terpopuler') {
      return b.upvotes - a.upvotes;
    }
    if (sortBy === 'mendesak') {
      return b.severity - a.severity;
    }
    if (sortBy === 'terlama') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // Default: terbaru
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="relative flex flex-col md:flex-row h-[calc(100dvh-128px)] md:h-[calc(100vh-64px)] bg-[#F5F7FA] overflow-hidden font-sans">
      
      {/* MAP VIEW */}
      <div className="absolute inset-0 md:relative md:inset-auto md:flex-1 md:h-auto z-0 pointer-events-auto">
        {/* Floating Back to Admin button if admin session is active */}
        {isAdmin && (
          <div className="absolute top-4 left-4 z-40 hidden md:block">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700 backdrop-blur-md transition-all hover:scale-105"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Kembali ke Admin</span>
            </Link>
          </div>
        )}
        <MapView
          reports={sortedReports}
          mapMode="marker"
          showPredictiveZone={false}
          className="rounded-none md:rounded-2xl md:border md:shadow-inner"
        />
      </div>

      {/* MOBILE FLOATING HEADER */}
      <div className="md:hidden absolute top-4 inset-x-4 z-30 pointer-events-auto">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="mobile-dashboard-search" className="sr-only">Cari aduan atau lokasi</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="mobile-dashboard-search"
              placeholder="Cari aduan atau lokasi..."
              aria-label="Cari aduan atau lokasi"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full rounded-xl border border-slate-200 bg-white text-base sm:text-xs font-medium focus-visible:ring-1 focus-visible:ring-[#003B73] shadow-md"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none h-10 pl-9 pr-8 w-auto min-w-[120px] rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#003B73] focus-visible:ring-1 focus-visible:ring-[#003B73] shadow-md text-[11px] font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors"
              aria-label="Urutkan laporan"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terpopuler">Terpopuler</option>
              <option value="mendesak">Mendesak</option>
              <option value="terlama">Terlama</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR / BOTTOM SHEET */}
      <div 
        ref={sheetRef}
        className="
          w-full md:w-[400px] lg:w-[450px] 
          absolute bottom-0 inset-x-0 md:relative md:bottom-auto md:inset-x-auto
          bg-white dark:bg-slate-900
          border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800
          rounded-t-2xl md:rounded-none
          flex flex-col z-20 shadow-xl md:shadow-none 
          min-h-0 order-last md:order-first
          transition-[height] duration-200 ease-out
        "
        style={{ 
          height: isMobile ? `${sheetHeight}%` : '100%',
          maxHeight: isMobile ? '88%' : 'auto' // Prevent overlap with top search bar (z-30)
        }}
      >
        <div 
          className="md:hidden w-full flex justify-center pt-2.5 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none group"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleHandleClick}
          aria-label="Tarik atau klik untuk memperluas peta aduan"
        >
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-slate-400 transition-colors" />
        </div>

        {/* ACTIVE QUEST BANNER */}
        {questParam && (
          <div className="mx-4 mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-3 shrink-0 animate-in fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0057B8] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                  <Target className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-100 dark:border-blue-900 text-[10px] font-medium px-2 py-0.5 rounded-md mb-1">
                    Misi Aktif
                  </Badge>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                    {questTitle || 'Verifikator Komunitas'}
                  </h3>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900 text-xs font-semibold shrink-0 px-2.5 py-1 rounded-md">
                +10 Pts Reward
              </Badge>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Panduan Pengerjaan</span>
              <div className="flex items-start gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                  1
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Berikan Dukungan (Upvote) pada 3 laporan warga di bawah ini.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter Horizontal Scroll */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-16 z-30">
          {[
            { id: 'Semua', label: 'Semua', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'Jalan Rusak', label: 'Jalan Rusak', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
            { id: 'Fasilitas Umum', label: 'Fasilitas Umum', icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'Lampu Mati', label: 'Lampu Mati', icon: <LightbulbOff className="w-3.5 h-3.5" /> },
            { id: 'Sampah', label: 'Sampah', icon: <Trash2 className="w-3.5 h-3.5" /> },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                aria-label={`Filter kategori ${cat.label}`}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap border ${
                  isActive 
                    ? 'bg-[#003B73] text-white border-[#003B73] shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Desktop Header */}
        <div className="hidden md:block p-5 border-b border-slate-100 shrink-0">
          <h1 className="text-xl font-bold text-[#003B73] mb-4">Peta Persebaran Aduan</h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="desktop-dashboard-search" className="sr-only">Cari aduan atau lokasi</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="desktop-dashboard-search"
                placeholder="Cari aduan atau lokasi..."
                aria-label="Cari aduan atau lokasi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full rounded-md border-[#D9DEE5] text-sm focus-visible:ring-[#0057B8]"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none h-10 pl-9 pr-8 w-auto min-w-[150px] rounded-md border border-[#D9DEE5] text-slate-600 hover:text-[#0057B8] bg-white hover:bg-slate-50 text-xs font-bold uppercase tracking-wider cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0057B8] transition-colors"
                aria-label="Urutkan aduan"
              >
                <option value="terbaru">Paling Baru</option>
                <option value="terpopuler">Paling Populer</option>
                <option value="mendesak">Paling Mendesak</option>
                <option value="terlama">Paling Lama</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Aduan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">Semua aduan telah dibersihkan atau belum ada laporan yang masuk.</p>
            </div>
          ) : (
            sortedReports.map((report) => (
              <Link key={report.id} href={`/laporan/${report.id}`} className="block">
                <Card className="p-3.5 hover:shadow-md transition-all border-slate-200/80 rounded-xl group bg-white">
                  <div className="flex items-start gap-3">
                    <img
                      src={report.photoUrl || '/images/reports/amblas.jpg'}
                      alt={report.title}
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/reports/amblas.jpg';
                      }}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-semibold text-[#0057B8] border-blue-200 bg-blue-50/50">
                          {report.category}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {report.createdAt.split('T')[0]}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#0057B8] transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{report.address}</span>
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <ThumbsUp className="h-3.5 w-3.5 text-blue-500" /> {report.upvotes} Dukungan
                        </span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${
                          report.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : report.status === 'Diproses'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            : report.status === 'Terverifikasi'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#0057B8] animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}


'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLaporKuyStore } from '@/lib/store';
import {
  MapPin,
  Clock,
  ChevronRight,
  Camera,
  CheckCircle2,
} from 'lucide-react';

const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Baru saja';
    if (hours < 24) return `${hours} jam lalu`;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Baru saja';
  }
};

const getCategoryMeta = (category: string) => {
  if (category.includes('Lampu')) return { bg: 'bg-amber-100/90', text: 'text-amber-800', emoji: '💡' };
  if (category.includes('Banjir')) return { bg: 'bg-blue-100/90', text: 'text-blue-800', emoji: '🌊' };
  if (category.includes('Sampah')) return { bg: 'bg-emerald-100/90', text: 'text-emerald-800', emoji: '🗑️' };
  return { bg: 'bg-slate-100/90', text: 'text-slate-800', emoji: '🛣️' };
};

export default function HomePage() {
  const { reports } = useLaporKuyStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-0">
      {/* HERO SECTION */}
      <section className="relative w-full bg-gradient-to-b from-[#003B73] to-[#00143A] pt-24 pb-32 overflow-hidden">
        {/* Decorative Cityscape Silhouette */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[900px] h-[260px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
          <Image 
            src="/skyline-jakarta.svg" 
            alt="Jakarta Skyline" 
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[center_bottom] opacity-60 select-none pointer-events-none"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto px-5">
          <h1 className="text-[2.5rem] leading-[1.05] font-extrabold tracking-tighter sm:text-6xl md:text-7xl text-white drop-shadow-md">
            Ada fasilitas rusak<br/>di sekitar Anda?
          </h1>
          <p className="text-[1.05rem] sm:text-lg text-blue-100/90 leading-relaxed mt-5 max-w-sm font-medium">
            Kirim foto, biar pihak berwenang menindaklanjuti. Laporan diverifikasi instan.
          </p>

          <div className="flex flex-col sm:flex-row w-full justify-center gap-4 mt-10">
            <Link href="/buat-laporan" className="w-full sm:w-auto">
              <Button variant="liquid-primary" size="xl" className="w-full sm:w-auto">
                <Camera className="w-5 h-5 drop-shadow-md" />
                <span className="drop-shadow-md">Lapor Sekarang</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="liquid-glass" size="xl" className="w-full sm:w-auto">
                <MapPin className="w-5 h-5 text-orange-400 drop-shadow-md" />
                <span className="drop-shadow-md">Buka Peta</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Curved Wave Divider to transition to the light content */}
        <div className="absolute bottom-[-1px] w-full overflow-hidden leading-none z-20">
          <svg className="relative block w-[calc(100%+1.3px)] h-[40px] md:h-[80px]" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,115.34,188.75,99.43,234.84,86.7,278.47,72.26,321.39,56.44Z" className="fill-slate-50"></path>
          </svg>
        </div>
      </section>

      {/* CARA KERJA - Horizontal scroll on mobile for premium app feel */}
      <section className="py-12 md:py-20 bg-slate-50/50 border-y border-slate-100/60">
        <div className="px-5 max-w-6xl mx-auto mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Cara pakai
          </h2>
        </div>

        <div className="w-full overflow-x-auto pb-6 pt-2 hide-scrollbar">
          <div className="flex gap-4 md:grid md:grid-cols-3 md:gap-6 px-5 max-w-6xl mx-auto w-max md:w-auto">
            {/* Step 1 */}
            <div className="w-[260px] md:w-auto shrink-0 bg-white/60 backdrop-blur-xl rounded-[1.75rem] border border-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-slate-100/80 text-slate-800 flex items-center justify-center mb-5 shadow-sm">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1.5">1. Foto kerusakan</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Jalan, lampu, drainase — apa aja yang ganggu fasilitas.</p>
            </div>
            
            {/* Step 2 */}
            <div className="w-[260px] md:w-auto shrink-0 bg-white/60 backdrop-blur-xl rounded-[1.75rem] border border-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center mb-5 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1.5">2. Lokasi ke-detect</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Nggak perlu ketik alamat. HP lo yang kerja otomatis.</p>
            </div>

            {/* Step 3 */}
            <div className="w-[260px] md:w-auto shrink-0 bg-white/60 backdrop-blur-xl rounded-[1.75rem] border border-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-green-50/80 text-green-600 flex items-center justify-center mb-5 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-1.5">3. Diteruskan ke dinas</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Laporan diverifikasi sistem dan diteruskan. Tinggal pantau.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LAPORAN TERBARU */}
      <section className="px-5 py-14 md:py-24 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Laporan terbaru warga
            </h2>
          </div>
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 flex items-center gap-1 group shrink-0 hover:text-blue-700">
            Lihat semua di Peta
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reports.slice(0, 6).map((report) => {
            const cat = getCategoryMeta(report.category);

            const fallbackPhotoUrl = report.category.includes('Lampu')
              ? '/images/reports/streetlight.jpg'
              : report.category.includes('Banjir')
              ? '/images/reports/flood.jpg'
              : report.category.includes('Sampah')
              ? '/images/reports/trash.jpg'
              : '/images/reports/pothole.jpg';

            const getStatusBadge = (status: string) => {
              if (status === 'Selesai') return 'bg-emerald-600 text-white';
              if (status === 'Diproses') return 'bg-blue-600 text-white';
              if (status === 'Terverifikasi') return 'bg-purple-600 text-white';
              return 'bg-amber-500 text-white';
            };

            return (
              <Link
                href={`/laporan/${report.id}`}
                key={report.id}
                className="group flex flex-col bg-white rounded-[2rem] border border-slate-200/80 p-3.5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Borderless Canvas Card Pattern */}
                <div className="w-full relative bg-slate-100 rounded-[1.5rem] overflow-hidden aspect-[4/3] mb-4">
                  <Image
                    src={report.photoUrl || fallbackPhotoUrl}
                    alt={report.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Subtle overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <div className={`${cat.bg} ${cat.text} backdrop-blur-md text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xs border border-white/30`}>
                      {cat.emoji} {report.category}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="px-2 pb-2 flex flex-col flex-1">
                  <h3 className="font-bold text-[1.05rem] leading-[1.35] text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{report.address || report.district || 'Lokasi Terdata'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/90 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-600" suppressHydrationWarning>
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span suppressHydrationWarning>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Enable horizontal scroll hiding */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
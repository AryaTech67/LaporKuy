'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLaporKuyStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, ShieldCheck, LayoutDashboard } from 'lucide-react';

const MapView = dynamic(() => import('@/components/map/map-view').then(mod => mod.MapView), { ssr: false });

export default function EmbedMapPage() {
  const { reports } = useLaporKuyStore();

  return (
    <div className="w-full h-screen relative bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="hover:opacity-90 transition-opacity" title="Kembali ke Admin">
            <Logo size={26} theme="dark" layout="horizontal" />
          </Link>
          <span className="text-xs text-slate-400 border-l border-slate-700 pl-3 hidden sm:inline">
            Peta Sebaran Aduan Kota
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[11px] hidden xs:inline-flex">
            ● Live Data ({reports.length} Titik)
          </Badge>

          {/* Tombol Balik ke Admin */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            id="btn-back-to-admin"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Admin</span>
          </Link>
        </div>
      </div>

      {/* Floating Button on Top of Map for Quick Access */}
      <div className="absolute top-16 left-4 z-30">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold shadow-lg border border-slate-700 backdrop-blur-md transition-all hover:scale-105"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
          <span>Dashboard Admin</span>
        </Link>
      </div>

      {/* Map View Container */}
      <div className="flex-1 relative w-full h-full">
        <MapView reports={reports} className="h-full w-full border-none" />
      </div>
    </div>
  );
}


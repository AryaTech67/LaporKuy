'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Loader2, BarChart3, Map } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { sendTelegramLog } from '@/app/actions/telegram';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<{ username: string; role: string; name?: string } | null>(null);

  useEffect(() => {
    // If on login page, skip authentication check
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    try {
      const storedAuth = typeof window !== 'undefined' ? localStorage.getItem('laporkuy_admin_auth') : null;
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('laporkuy_admin_session=authenticated');

      if (storedAuth || hasCookie) {
        const parsed = storedAuth
          ? JSON.parse(storedAuth)
          : { username: 'AryaKuy', name: 'Arya (Administrator)', role: 'Super Admin Dispatch' };
        setAdminUser(parsed);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      }
    } catch {
      setIsAuthenticated(false);
      router.replace('/admin/login');
    }
  }, [pathname, router]);

  // If on /admin/login, render clean login view without admin navbar/footer
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading state while checking admin session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
          <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
            Memverifikasi Otoritas Admin...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, prevent layout render (redirect will trigger)
  if (!isAuthenticated) {
    return null;
  }

  const handleAdminLogout = () => {
    sendTelegramLog(`<b>🛡️ Admin Logout</b>\n\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);
    document.cookie = 'laporkuy_admin_session=; path=/; max-age=0';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('laporkuy_admin_auth');
    }
    toast.success('Sesi admin berakhir. Anda telah keluar.');
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Accent Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#0057B8] via-blue-500 to-amber-500" />

      {/* Admin Dedicated Navbar - Matching Frontend Clean Civic Style */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="transition-transform duration-200 group-hover:scale-105">
                <Logo size={34} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0057B8] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Admin Dispatch
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Pusat Komando Aduan Kota
                </span>
              </div>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                pathname === '/admin'
                  ? 'text-[#0057B8] dark:text-white bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard Aduan
            </Link>
            <Link
              href="/embed/map"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              Peta Sebaran
            </Link>
            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#0057B8] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-200 dark:border-slate-800"
              title="Buka portal warga di tab baru"
            >
              <span>Portal Warga</span>
              <span className="text-[10px] opacity-70">↗</span>
            </Link>
          </nav>

          {/* Right: Real-time Status, Admin Profile & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* System Live Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Online</span>
            </div>

            {/* Admin User Chip */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="w-6 h-6 rounded-md bg-[#0057B8] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                A
              </div>
              <div className="hidden sm:block text-left leading-none">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {adminUser?.username || 'AryaKuy'}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                  Administrator
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 rounded-lg px-2.5 py-1.5 cursor-pointer shadow-2xs"
              title="Keluar dari Portal Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Nav Row */}
        <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              pathname === '/admin'
                ? 'text-[#0057B8] dark:text-white bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/embed/map"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 whitespace-nowrap"
          >
            <Map className="w-3.5 h-3.5" />
            Peta Sebaran
          </Link>
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-500 hover:text-[#0057B8] whitespace-nowrap"
          >
            <span>Web Warga ↗</span>
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Admin footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} LaporKuy • Pusat Komando Pengelolaan & Dispatch Pelayanan Publik
      </footer>
    </div>
  );
}

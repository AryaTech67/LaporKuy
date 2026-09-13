'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useLaporKuyStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  Home,
  FilePlus,
  MapPin,
  BarChart3,
  Trophy,
  Gift,
  Coins,
  HelpCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const mainNavLinks = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/buat-laporan', label: 'Buat Laporan', icon: FilePlus },
  { href: '/dashboard', label: 'Peta & Lacak', icon: MapPin },
  { href: '/papan-peringkat', label: 'Peringkat', icon: Trophy },
  { href: '/misi', label: 'Misi & Poin', icon: Gift },
  { href: '/tukar-poin', label: 'Tukar Poin', icon: Coins },
  { href: '/bantuan', label: 'Bantuan', icon: HelpCircle },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, quests, isLoggedIn, logout } = useLaporKuyStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unclaimedQuestsCount = quests ? quests.filter(q => q.progress >= q.target && !q.isClaimed).length : 0;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAuth = localStorage.getItem('laporkuy_admin_auth') || document.cookie.includes('laporkuy_admin_session=authenticated');
      setIsAdmin(!!hasAuth);
    }
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-all">
        {/* Top Accent Line */}
        <div className="h-[2.5px] w-full bg-gradient-to-r from-[#0057B8] via-blue-500 to-amber-500" />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <Logo size={34} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hidden sm:block">
                Layanan Pengaduan Publik
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-6 mr-auto">
            {mainNavLinks.map((link) => {
              const isActive = pathname === link.href;
              const isMisiLink = link.href === '/misi';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center text-xs xl:text-sm font-semibold px-3 py-2 rounded-full transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0057B8] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-[#0057B8] dark:hover:text-blue-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{link.label}</span>
                  {isMisiLink && unclaimedQuestsCount > 0 && (
                    <span className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-bounce">
                      {unclaimedQuestsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Quick Panel Admin Shortcut for authenticated admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-xs transition-all hover:scale-105"
                title="Buka Dashboard Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Panel Admin</span>
              </Link>
            )}

            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <div className="relative">
                    <Image
                      src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`}
                      alt={profile.name}
                      width={28}
                      height={28}
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-blue-500/30"
                    />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {profile.name}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{profile.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profile.email || 'Warga Terverifikasi'}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-bold text-[#0057B8] dark:text-blue-300">
                        <Sparkles className="h-3 w-3" />
                        <span>{profile.level || 'Warga Aktif'} • {profile.points || 0} Pts</span>
                      </div>
                    </div>

                    <Link
                      href="/profil"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Profile Saya</span>
                    </Link>

                    <Link
                      href="/tukar-poin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span>Tukar Poin</span>
                    </Link>



                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#0057B8] dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-[#0057B8] dark:text-blue-400" />
                        <span>Panel Admin</span>
                      </Link>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Keluar Sistem</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button className="rounded-full font-bold text-xs px-5 py-2 shadow-md hover:shadow-lg bg-gradient-to-r from-[#0057B8] to-blue-700 hover:from-[#004494] hover:to-blue-800 text-white transition-all duration-200">
                  Masuk
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              {unclaimedQuestsCount > 0 && !mobileOpen && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu (Solid Background, No Opacity Bleed) */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl absolute w-full left-0 right-0 top-full z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-5 space-y-4">
              
              {/* Nav Items with Native App Icons */}
              <nav className="flex flex-col gap-1">
                {mainNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const isMisiLink = link.href === '/misi';
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 text-sm font-semibold rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[#0057B8] text-white shadow-sm font-bold'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{link.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMisiLink && unclaimedQuestsCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white shadow-xs animate-pulse">
                            {unclaimedQuestsCount} Siap Klaim
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white/80' : 'text-slate-300'}`} />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

              {isLoggedIn ? (
                <div className="space-y-2 pt-1">
                  {/* Panel Admin Shortcut (Khusus Admin) */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3.5 py-3 text-sm font-bold text-white bg-slate-900 dark:bg-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-amber-400" />
                        <span>Panel Admin</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  )}

                  {/* Profil Saya */}
                  <Link
                    href="/profil"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3.5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Profile Saya</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>



                  {/* Keluar Sistem */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <span>Keluar Sistem</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-rose-400" />
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl font-bold py-3.5 shadow-md bg-[#0057B8] hover:bg-[#003B73] text-white text-sm">
                      Masuk ke Akun
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Dimmed Backdrop Overlay (Blocks text bleed & page scrolling) */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

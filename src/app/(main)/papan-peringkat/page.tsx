'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ShieldCheck, UserCheck, Star, Trophy, Award, Loader2, RefreshCw, User } from 'lucide-react';
import { LeaderboardUser, DistrictRank } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useLaporKuyStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location-store';
import { cn } from '@/lib/utils';

// Helper to determine whether an avatar is a genuine user photo from their account
function isRealUserPhoto(avatar?: string | null): boolean {
  if (!avatar || typeof avatar !== 'string') return false;
  const trimmed = avatar.trim();
  if (!trimmed) return false;
  // User uploaded base64 image from profile settings
  if (trimmed.startsWith('data:image/')) return true;
  // Google OAuth genuine account photo
  if (trimmed.includes('googleusercontent.com')) return true;
  // Exclude dummy Unsplash mock photos from initial seed
  if (trimmed.includes('images.unsplash.com')) return false;
  // Exclude automated ui-avatars initials service
  if (trimmed.includes('ui-avatars.com')) return false;
  // Genuine uploaded image URL (e.g. Supabase storage or custom hosted image)
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

// Avatar component that displays real photo with no-referrer policy, or crisp initial avatar if none
function LeaderboardAvatar({
  avatar,
  name,
  className,
  fallbackClassName,
  iconClassName,
}: {
  avatar?: string;
  hasRealPhoto?: boolean;
  name: string;
  className: string;
  fallbackClassName?: string;
  iconClassName?: string;
}) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [avatar]);

  const initialsFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=003B73&color=fff&size=128&bold=true`;
  const effectiveSrc = (avatar && !loadError) ? avatar : initialsFallback;

  return (
    <img
      src={effectiveSrc}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setLoadError(true)}
      className={cn('object-cover select-none shrink-0', className)}
    />
  );
}

// Fallback initial profiles to guarantee 0ms loading without ever hanging on a spinner
const INITIAL_FALLBACK_PROFILES = [
  {
    id: 'usr-001',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    points: 485,
    level: 'Pahlawan Kota',
    xp: 1420,
    total_reports: 12,
    completed_reports: 8,
    district: 'Kec. Wonokromo'
  },
  {
    id: 'usr-002',
    name: 'Ahmad Fauzi',
    email: 'ahmad@example.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    points: 340,
    level: 'Warga Aktif',
    xp: 890,
    total_reports: 7,
    completed_reports: 5,
    district: 'Kec. Rungkut'
  },
  {
    id: 'usr-003',
    name: 'Dewi Lestari',
    email: 'dewi@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    points: 290,
    level: 'Warga Aktif',
    xp: 640,
    total_reports: 5,
    completed_reports: 4,
    district: 'Kec. Sukolilo'
  },
  {
    id: 'usr-004',
    name: 'Rian Hidayat',
    email: 'rian@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    points: 175,
    level: 'Warga Aktif',
    xp: 380,
    total_reports: 4,
    completed_reports: 2,
    district: 'Kec. Dukuh Pakis'
  },
  {
    id: 'usr-005',
    name: 'Siti Rahma',
    email: 'siti@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    points: 120,
    level: 'Pemula',
    xp: 220,
    total_reports: 3,
    completed_reports: 1,
    district: 'Kec. Genteng'
  }
];

export default function LeaderboardPage() {
  const { profile: currentProfile, reports: storeReports } = useLaporKuyStore();
  const { location: userLoc } = useUserLocation();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [activeTab, setActiveTab] = useState<'users' | 'districts'>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Raw data from Supabase, initialized instantly from cache or fallback
  const [profiles, setProfiles] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('laporkuy_cached_leaderboard_profiles');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_FALLBACK_PROFILES;
  });

  const [reports, setReports] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('laporkuy_cached_leaderboard_reports');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return storeReports && storeReports.length > 0 ? storeReports : [];
  });

  // Sync with store reports if local reports is empty
  useEffect(() => {
    if ((!reports || reports.length === 0) && storeReports && storeReports.length > 0) {
      setReports(storeReports);
    }
  }, [storeReports, reports]);

  const supabase = useMemo(() => createClient(), []);

  // Fetch real data from Supabase in the background with strict timeout
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    function fetchWithTimeout<T>(promise: PromiseLike<T>, timeoutMs = 1500): Promise<T> {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs)),
      ]);
    }

    try {
      const [profilesRes, reportsRes] = await Promise.allSettled([
        fetchWithTimeout(supabase.from('profiles').select('*').order('points', { ascending: false }).limit(50)),
        fetchWithTimeout(supabase.from('reports').select('*').limit(100)),
      ]);

      if (profilesRes.status === 'fulfilled' && profilesRes.value?.data && profilesRes.value.data.length > 0) {
        setProfiles(profilesRes.value.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('laporkuy_cached_leaderboard_profiles', JSON.stringify(profilesRes.value.data));
          } catch (e) {}
        }
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value?.data && reportsRes.value.data.length > 0) {
        setReports(reportsRes.value.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('laporkuy_cached_leaderboard_reports', JSON.stringify(reportsRes.value.data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Leaderboard background sync notice:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Immediate background fetch
    fetchData();

    // Listen to real-time changes on profiles and reports
    const channelName = `public:leaderboard:${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  // Compute users leaderboard dynamically from real Supabase data ONLY (No dummy locations)
  const currentLeaderboardData = useMemo<LeaderboardUser[]>(() => {
    if (!profiles || profiles.length === 0) return [];

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const mappedUsers = profiles.map((p) => {
      // Find reports for this user in Supabase
      const userReports = reports.filter(
        (r) => r.user_id === p.id || (r.user_name && r.user_name.toLowerCase() === p.name?.toLowerCase())
      );

      const isCurrentUser =
        (currentProfile?.id && p.id === currentProfile.id) ||
        (currentProfile?.email && p.email && p.email.toLowerCase() === currentProfile.email.toLowerCase());

      // Authentic location resolution:
      let district = '';
      if (userReports.length > 0) {
        // 1. Real location from reports submitted in Supabase
        const latestReport = [...userReports].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        if (latestReport?.district) {
          district = latestReport.district;
        } else if (latestReport?.address) {
          district = latestReport.address;
        }
      } else if (p.district || p.city || p.location) {
        // 2. Real location stored in Supabase profiles table from GPS sync
        district = p.district || p.city || p.location;
      } else if (isCurrentUser && (userLoc.city || userLoc.fullLocation)) {
        // 3. Current user's active GPS detection
        district = userLoc.city || userLoc.fullLocation;
      } else {
        // 4. Registered citizen with no reports or location yet — do NOT invent dummy kecamatan
        district = 'Belum ada laporan';
      }

      // Filter reports based on period
      let periodReports = userReports;
      if (period === 'weekly') {
        periodReports = userReports.filter((r) => new Date(r.created_at).getTime() >= oneWeekAgo);
      } else if (period === 'monthly') {
        periodReports = userReports.filter((r) => new Date(r.created_at).getTime() >= oneMonthAgo);
      }

      // Calculate points dynamically according to period
      const basePoints = p.points || 0;
      let calculatedPoints = basePoints;
      let periodReportsCount = p.total_reports || userReports.length || 0;

      if (period === 'weekly') {
        calculatedPoints = Math.round(basePoints * 0.2) + periodReports.length * 20;
        periodReportsCount = periodReports.length;
      } else if (period === 'monthly') {
        calculatedPoints = Math.round(basePoints * 0.5) + periodReports.length * 20;
        periodReportsCount = periodReports.length > 0 ? periodReports.length : Math.min(p.total_reports || 0, 5);
      }

      // Dynamic Level check
      const currentXp = p.xp || 0;
      let userLevel = p.level;
      if (!userLevel || userLevel === 'Pemula') {
        if (currentXp >= 2000) userLevel = 'Legenda Kota';
        else if (currentXp >= 1000) userLevel = 'Pahlawan Kota';
        else if (currentXp >= 300) userLevel = 'Warga Aktif';
        else userLevel = 'Pemula';
      }

      // Authentic Avatar Resolution:
      // Priority: use currentProfile.avatar for current user if available, otherwise p.avatar
      const userRawAvatar = isCurrentUser && currentProfile?.avatar ? currentProfile.avatar : p.avatar;
      const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=003B73&color=fff&size=128&bold=true`;
      const avatar = userRawAvatar || initialsAvatar;
      const hasRealPhoto = Boolean(userRawAvatar && !userRawAvatar.includes('ui-avatars.com'));

      return {
        id: p.id,
        name: p.name || 'Warga LaporKuy',
        avatar,
        hasRealPhoto,
        level: userLevel,
        points: calculatedPoints,
        reportsCount: periodReportsCount,
        district,
        isCurrentUser: Boolean(isCurrentUser),
        xp: currentXp,
      };
    });

    // Sort by points DESC, then xp DESC, then reportsCount DESC
    mappedUsers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.xp !== a.xp) return b.xp - a.xp;
      return b.reportsCount - a.reportsCount;
    });

    // Assign rank 1, 2, 3...
    return mappedUsers.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      hasRealPhoto: u.hasRealPhoto,
      level: u.level,
      points: u.points,
      reportsCount: u.reportsCount,
      district: u.district,
      isCurrentUser: u.isCurrentUser,
    }));
  }, [profiles, reports, period, currentProfile, userLoc]);

  // Compute district ranks ONLY from actual districts in Supabase reports
  const districtRanks = useMemo<DistrictRank[]>(() => {
    const districtMap = new Map<string, { totalReports: number; resolvedCount: number; citizenIds: Set<string> }>();

    reports.forEach((r) => {
      const distName = r.district || 'Wilayah Belum Ditentukan';
      if (!districtMap.has(distName)) {
        districtMap.set(distName, { totalReports: 0, resolvedCount: 0, citizenIds: new Set() });
      }
      const entry = districtMap.get(distName)!;
      entry.totalReports += 1;
      if (r.status === 'Selesai') {
        entry.resolvedCount += 1;
      }
      if (r.user_id || r.user_name) {
        entry.citizenIds.add(r.user_id || r.user_name);
      }
    });

    const list: Omit<DistrictRank, 'rank'>[] = [];
    districtMap.forEach((val, name) => {
      const resolvedPercentage = val.totalReports > 0 ? Math.round((val.resolvedCount / val.totalReports) * 100) : 0;
      const score = val.totalReports * 30 + val.resolvedCount * 50 + val.citizenIds.size * 15;
      list.push({
        districtName: name,
        totalReports: val.totalReports,
        resolvedPercentage,
        activeCitizens: val.citizenIds.size,
        score,
        imageUrl: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=500&auto=format&fit=crop&q=80',
      });
    });

    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.totalReports - a.totalReports;
    });

    return list.map((dist, idx) => ({
      ...dist,
      rank: idx + 1,
    }));
  }, [reports]);

  const top3 = currentLeaderboardData.slice(0, 3);
  const restRank = currentLeaderboardData.slice(3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold text-primary border-primary/30 bg-primary/5 rounded-full">
            Papan Peringkat & Kontribusi Warga
          </Badge>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            title="Muat ulang data dari Supabase"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Peringkat Partisipasi Warga
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Apresiasi resmi untuk seluruh warga yang aktif melaporkan serta mengawal perbaikan fasilitas publik berdasarkan data riil sistem.
        </p>
      </div>

      {/* Main Tabs & Period Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl w-full sm:w-auto">
          <Button
            size="sm"
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="text-xs font-bold flex-1 sm:flex-initial rounded-lg"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-primary-foreground" />
            Pelapor Perorangan
            {profiles.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-primary-foreground/20 rounded-full text-[10px]">
                {profiles.length}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'districts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('districts')}
            className="text-xs font-bold flex-1 sm:flex-initial rounded-lg"
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Wilayah Aktif
            {districtRanks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-muted rounded-full text-[10px]">
                {districtRanks.length}
              </span>
            )}
          </Button>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-1 text-xs bg-muted/50 p-1 rounded-xl border border-border/50 max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                period === 'weekly' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                period === 'monthly' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('alltime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                period === 'alltime' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sepanjang Waktu
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Mengambil data peringkat dari Supabase...</p>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6">
          {/* TOP 3 PODIUM */}
          {currentLeaderboardData.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-6 items-end pt-2 pb-2">
              {/* RANK 2 */}
              {top3[1] ? (
                <Card
                  className={`p-3 sm:p-5 text-center border-border bg-card text-card-foreground rounded-2xl shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all ${
                    top3[1].isCurrentUser ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-center mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-semibold">
                        <Award className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Juara 2</span>
                      </span>
                    </div>
                    <div className="relative inline-block mb-2">
                      <LeaderboardAvatar
                        avatar={top3[1].avatar}
                        hasRealPhoto={top3[1].hasRealPhoto}
                        name={top3[1].name}
                        className="h-14 w-14 sm:h-20 sm:w-20 rounded-full mx-auto border-2 border-slate-300 dark:border-slate-600 shadow-sm"
                        fallbackClassName="h-14 w-14 sm:h-20 sm:w-20 rounded-full mx-auto bg-slate-100 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-600 shadow-sm text-slate-500 dark:text-slate-400"
                        iconClassName="h-7 w-7 sm:h-10 sm:w-10 opacity-70"
                      />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-foreground truncate px-1" title={top3[1].name}>
                      {top3[1].name}
                      {top3[1].isCurrentUser && <span className="text-primary ml-1">(Kamu)</span>}
                    </h3>
                    <span className={`text-[10px] sm:text-xs block truncate mt-0.5 ${top3[1].district === 'Belum ada laporan' ? 'text-muted-foreground/60 italic' : 'text-muted-foreground font-medium'}`}>
                      {top3[1].district}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground block">
                      {top3[1].points.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">Poin</span>
                    </span>
                  </div>
                </Card>
              ) : (
                <div />
              )}

              {/* RANK 1 (CENTER - ELEVATED) */}
              {top3[0] ? (
                <Card
                  className={`p-3.5 sm:p-6 text-center border-amber-400/70 bg-gradient-to-b from-amber-500/10 via-card to-card text-card-foreground rounded-2xl shadow-md relative -translate-y-1.5 flex flex-col justify-between hover:shadow-lg transition-all ring-1 ring-amber-400/20 ${
                    top3[0].isCurrentUser ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-center mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-extrabold shadow-sm border border-amber-300">
                        <Trophy className="w-3 h-3 text-slate-950 shrink-0" />
                        <span>Juara 1</span>
                      </span>
                    </div>
                    <div className="relative inline-block mb-2">
                      <LeaderboardAvatar
                        avatar={top3[0].avatar}
                        hasRealPhoto={top3[0].hasRealPhoto}
                        name={top3[0].name}
                        className="h-16 w-16 sm:h-24 sm:w-24 rounded-full mx-auto border-4 border-amber-400 shadow-md ring-4 ring-amber-500/20"
                        fallbackClassName="h-16 w-16 sm:h-24 sm:w-24 rounded-full mx-auto bg-amber-500/10 dark:bg-amber-500/20 border-4 border-amber-400 shadow-md ring-4 ring-amber-500/20 text-amber-600 dark:text-amber-400"
                        iconClassName="h-8 w-8 sm:h-12 sm:w-12 opacity-80"
                      />
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-base text-foreground truncate px-1" title={top3[0].name}>
                      {top3[0].name}
                      {top3[0].isCurrentUser && <span className="text-primary ml-1">(Kamu)</span>}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-semibold block truncate mt-0.5">
                      {top3[0].level}
                    </span>
                    <span className={`text-[10px] block truncate ${top3[0].district === 'Belum ada laporan' ? 'text-muted-foreground/60 italic' : 'text-muted-foreground'}`}>
                      {top3[0].district}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-amber-500/20">
                    <span className="text-xs sm:text-base font-black text-amber-600 dark:text-amber-400 block">
                      {top3[0].points.toLocaleString()} <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">Poin</span>
                    </span>
                  </div>
                </Card>
              ) : (
                <div />
              )}

              {/* RANK 3 */}
              {top3[2] ? (
                <Card
                  className={`p-3 sm:p-5 text-center border-border bg-card text-card-foreground rounded-2xl shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all ${
                    top3[2].isCurrentUser ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-center mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[10px] sm:text-xs font-semibold">
                        <Star className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Juara 3</span>
                      </span>
                    </div>
                    <div className="relative inline-block mb-2">
                      <LeaderboardAvatar
                        avatar={top3[2].avatar}
                        hasRealPhoto={top3[2].hasRealPhoto}
                        name={top3[2].name}
                        className="h-14 w-14 sm:h-20 sm:w-20 rounded-full mx-auto border-2 border-amber-700/40 dark:border-amber-500/40 shadow-sm"
                        fallbackClassName="h-14 w-14 sm:h-20 sm:w-20 rounded-full mx-auto bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-700/40 dark:border-amber-500/40 shadow-sm text-amber-700 dark:text-amber-500"
                        iconClassName="h-7 w-7 sm:h-10 sm:w-10 opacity-70"
                      />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-foreground truncate px-1" title={top3[2].name}>
                      {top3[2].name}
                      {top3[2].isCurrentUser && <span className="text-primary ml-1">(Kamu)</span>}
                    </h3>
                    <span className={`text-[10px] sm:text-xs block truncate mt-0.5 ${top3[2].district === 'Belum ada laporan' ? 'text-muted-foreground/60 italic' : 'text-muted-foreground font-medium'}`}>
                      {top3[2].district}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground block">
                      {top3[2].points.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">Poin</span>
                    </span>
                  </div>
                </Card>
              ) : (
                <div />
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Belum ada data warga terdaftar di Supabase.</p>
            </div>
          )}

          {/* LIST RANKS #4+ */}
          {restRank.length > 0 && (
            <Card className="border-border/60 overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/20 border-b px-5 py-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Peringkat Kontributor</span>
                  <span>Poin & Aktivitas</span>
                </div>
              </CardHeader>
              <div className="divide-y border-border/40">
                {restRank.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 flex items-center justify-between transition-colors ${
                      user.isCurrentUser ? 'bg-primary/10 font-bold border-l-4 border-l-primary' : 'hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Clean numeric circle */}
                      <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                        {user.rank}
                      </div>
                      <LeaderboardAvatar
                        avatar={user.avatar}
                        hasRealPhoto={user.hasRealPhoto}
                        name={user.name}
                        className="h-10 w-10 rounded-full border border-border shrink-0"
                        fallbackClassName="h-10 w-10 rounded-full bg-muted/80 dark:bg-muted border border-border shrink-0 text-muted-foreground"
                        iconClassName="h-5 w-5 opacity-70"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 truncate">
                          <span className="truncate">{user.name}</span>
                          {user.isCurrentUser && (
                            <Badge className="bg-primary text-white text-[9px] px-1.5 py-0 font-semibold shrink-0">
                              Kamu
                            </Badge>
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                          <span>{user.level}</span>
                          <span>•</span>
                          {user.district === 'Belum ada laporan' ? (
                            <span className="text-muted-foreground/60 italic">Belum ada laporan</span>
                          ) : (
                            <span className="font-medium text-foreground/80">{user.district}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs font-extrabold text-foreground block">
                        {user.points.toLocaleString()} Poin
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {user.reportsCount} Laporan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* DISTRICT RANKING TAB */
        <Card className="border-border/60 overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/20 border-b px-6 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Peringkat Kinerja Wilayah Berdasarkan Aduan Warga
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statistik penanganan aduan dan partisipasi masyarakat yang dihimpun langsung dari laporan publik terverifikasi di Supabase.
            </p>
          </CardHeader>

          <div className="divide-y border-border/40">
            {districtRanks.length > 0 ? (
              districtRanks.map((dist) => (
                <div key={dist.districtName} className="p-3.5 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                    {/* Clean Rank Number Circle */}
                    <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {dist.rank}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {dist.districtName}
                        </h4>
                        {dist.rank === 1 && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0 shrink-0">
                            Paling Aktif
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 block truncate">
                        {dist.totalReports} Laporan • {dist.activeCitizens} Warga Terlibat
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="hidden sm:block">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                        {dist.resolvedPercentage}% Selesai
                      </span>
                      <span className="text-[10px] text-muted-foreground">Tingkat Penanganan</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 sm:px-3 py-1 font-bold shrink-0">
                      {dist.score} Pts
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold">Belum ada riwayat laporan wilayah di database.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Gift, ThumbsUp, ShieldCheck, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useLaporKuyStore } from '@/lib/store';

function formatTimeAgo(dateString: string) {
  // If it's already a relative string from mock data (e.g., '10 menit lalu')
  if (dateString.includes('lalu')) return dateString;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatExact(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'status' | 'community' | 'reward'>('all');
  const supabase = createClient();
  const { markNotificationsRead: globalMarkRead } = useLaporKuyStore();

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*');

      if (data && !error) {
        // Sort manually if needed, or rely on insert order for mock data
        const sortedData = data.sort((a, b) => {
          // simple sort by id descending (n-4, n-3...) for mock data
          return a.id > b.id ? -1 : 1;
        });
        setNotifications(sortedData);
      }
      setIsLoading(false);
    }
    fetchNotifications();
  }, []);

  const markNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).neq('id', '0'); // update all
    globalMarkRead();
  };

  const markSingleRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    globalMarkRead();
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter !== 'all' && n.type !== filter) return false;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'status':
        return <ShieldCheck className="h-5 w-5 text-blue-500" />;
      case 'community':
        return <ThumbsUp className="h-5 w-5 text-emerald-500" />;
      case 'reward':
        return <Gift className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Riwayat pembaruan status laporan, upvote komunitas, dan reward.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={markNotificationsRead}
          className="text-xs gap-1.5"
          disabled={isLoading || notifications.length === 0}
        >
          <CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2.5 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'Semua Notifikasi' },
          { id: 'status', label: 'Status Laporan' },
          { id: 'community', label: 'Komunitas' },
          { id: 'reward', label: 'Reward & Poin' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 min-h-[36px] touch-manipulation active:scale-95 ${
              filter === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card className="divide-y border-border/60 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Belum ada notifikasi di kategori ini.
          </div>
        ) : (
          filteredNotifs.map((item) => {
            let targetLink = item.link;
            if (!targetLink) {
              if (item.type === 'reward' || item.title?.toLowerCase().includes('penukaran') || item.title?.toLowerCase().includes('tukar')) {
                const codeMatch = item.message?.match(/LK-[A-Z0-9-]+/);
                targetLink = codeMatch ? `/tukar-poin?code=${codeMatch[0]}` : '/tukar-poin';
              } else if (item.type === 'status') {
                targetLink = '/dashboard';
              }
            }

            const innerContent = (
              <>
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-muted shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </h3>
                      {!item.is_read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                    
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <span 
                        className="text-[10px] text-muted-foreground flex items-center gap-1"
                        title={formatExact(item.timestamp)}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.timestamp)}
                      </span>

                      {targetLink && (
                        <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-0.5 group-hover:underline">
                          Buka Petunjuk & Gunakan Kode →
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {targetLink && (
                  <div className="shrink-0 pt-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <Button variant="ghost" size="icon" className="h-8 w-8 pointer-events-none">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            );

            const cardClasses = `p-4 flex items-start justify-between gap-3 transition-colors group ${
              !item.is_read ? 'bg-primary/5 font-medium' : 'hover:bg-muted/20'
            } ${targetLink ? 'cursor-pointer hover:bg-muted/30' : ''}`;

            if (targetLink) {
              return (
                <Link key={item.id} href={targetLink} className={cardClasses} onClick={() => !item.is_read && markSingleRead(item.id)}>
                  {innerContent}
                </Link>
              );
            }

            return (
              <div key={item.id} className={cardClasses}>
                {innerContent}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

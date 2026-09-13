'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLaporKuyStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  ThumbsUp,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Bookmark,
  ShieldCheck,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/components/ui/before-after-slider';

const SingleLocationMap = dynamic(
  () => import('@/components/map/single-location-map'),
  { ssr: false }
);

export default function DetailLaporanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { reports, toggleUpvote, addComment } = useLaporKuyStore();

  const report = reports.find((r) => r.id === resolvedParams.id);
  const [commentInput, setCommentInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(report?.hasFollowed || false);

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Laporan Tidak Ditemukan</h1>
        <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block">
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(report.id, commentInput);
    setCommentInput('');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: report.title,
        text: `Lihat laporan infrastruktur kota: ${report.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link laporan disalin ke clipboard!');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Link>

      {/* Main Title & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">{report.category}</Badge>
            <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/30 text-xs">
              Keparahan: {report.severity}/10
            </Badge>
            {report.isUrgent && (
              <Badge className="bg-rose-600 text-white text-xs gap-1">
                <AlertTriangle className="h-3 w-3" /> DARURAT
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{report.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">📍 {report.address}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={`px-3 py-1 text-xs font-bold ${
              report.status === 'Selesai'
                ? 'bg-emerald-600 text-white'
                : report.status === 'Diproses'
                ? 'bg-blue-600 text-white'
                : report.status === 'Terverifikasi'
                ? 'bg-purple-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {report.status === 'Selesai' && '✓ Selesai'}
            {report.status === 'Diproses' && '⚡ Diproses Dinas'}
            {report.status === 'Terverifikasi' && '🛡️ Terverifikasi'}
            {report.status === 'Pending' && '⏳ Menunggu Verifikasi'}
          </Badge>
        </div>
      </div>

      {/* PHOTO DISPLAY / BEFORE AFTER SLIDER */}
      {(() => {
        const fallbackPhotoUrl = report.category.includes('Lampu') 
          ? '/images/reports/streetlight.jpg'
          : report.category.includes('Banjir')
          ? '/images/reports/flood.jpg'
          : report.category.includes('Sampah')
          ? '/images/reports/trash.jpg'
          : '/images/reports/pothole.jpg';

        return report.status === 'Selesai' && report.afterPhotoUrl ? (
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">
              Perbandingan Foto Sebelum & Sesudah Perbaikan:
            </span>
            <BeforeAfterSlider
              beforeImage={report.photoUrl || fallbackPhotoUrl}
              afterImage={report.afterPhotoUrl}
            />
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden border border-border shadow-card">
            <img 
              src={report.photoUrl || fallbackPhotoUrl} 
              alt={report.title} 
              className="w-full h-80 sm:h-96 object-cover" 
              onError={(e) => { e.currentTarget.src = fallbackPhotoUrl }}
            />
          </div>
        );
      })()}

      {/* COMMUNITY SUPPORT & UPVOTE BAR */}
      <Card className="p-4 bg-muted/30 border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {report.upvotes} Warga Mengalami Masalah Ini Juga
            </span>
          </div>
          <div className="w-full sm:w-64 bg-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${Math.min(100, (report.upvotes / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {report.upvotes >= 5 ? '✅ Auto-Terverifikasi oleh Dukungan Komunitas' : `${5 - report.upvotes} upvote lagi untuk auto-verifikasi`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <Button
            variant={report.hasUpvoted ? 'default' : 'outline'}
            onClick={() => toggleUpvote(report.id)}
            className="gap-1.5 shadow-sm flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap"
          >
            <ThumbsUp className="h-4 w-4 shrink-0" />
            {report.hasUpvoted ? 'Didukung' : 'Saya Alami Ini'}
          </Button>

          <Button
            variant={isFollowing ? 'secondary' : 'outline'}
            onClick={() => setIsFollowing(!isFollowing)}
            className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap"
          >
            <Bookmark className="h-4 w-4 shrink-0" />
            {isFollowing ? 'Mengikuti' : 'Ikuti'}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* REPORT METADATA & DESCRIPTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground">Deskripsi Laporan</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Pelapor:</span>
                <span className="font-semibold text-foreground">{report.userName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Waktu Melapor:</span>
                <span className="font-semibold text-foreground" suppressHydrationWarning>{new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Status Verifikasi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.status === 'Pending' ? 'Menunggu Verifikasi Admin' : 'Terverifikasi Valid'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Dinas Ditugaskan:</span>
                <span className="font-semibold text-foreground">{report.assignedDinas || 'Dinas Bina Marga'}</span>
              </div>
            </div>
          </Card>

          {/* COMMENTS SECTION */}
          <Card className="p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Diskusi Komunitas & Respon Dinas ({report.comments.length})
            </h3>

            <div className="space-y-3">
              {report.comments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Belum ada komentar. Jadilah yang pertama memberikan masukan!</p>
              ) : (
                report.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border ${
                      c.isOfficial || c.role === 'admin' || c.role === 'dinas'
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                        : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{c.author}</span>
                        {(c.isOfficial || c.role === 'admin' || c.role === 'dinas') && (
                          <Badge className="bg-blue-600 text-white text-[9px] gap-1 px-2 py-0.5">
                            <Building2 className="h-2.5 w-2.5" /> Resmi Admin / Dinas
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                        {new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 font-medium">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="pt-2 flex gap-2">
              <Textarea
                placeholder="Tulis komentar atau update terkini lokasi..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="h-16 text-xs"
              />
              <Button type="submit" size="sm" className="h-16 px-4">Kirim</Button>
            </form>
          </Card>
        </div>

        {/* TIMELINE & SLA WIDGET */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Target SLA Perbaikan
            </h3>
            {/* Dynamic SLA Card */}
            {report.status === 'Selesai' ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <span className="text-emerald-700 dark:text-emerald-300 font-bold block text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Pekerjaan Telah Selesai
                </span>
                <span className="text-slate-600 dark:text-slate-300 block text-[11px]">
                  Ditangani oleh: <strong>{report.assignedDinas || 'Dinas Terkait'}</strong>
                </span>
                {report.afterPhotoUrl && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold block text-[10px]">
                    ✓ Bukti foto hasil perbaikan tersedia di atas
                  </span>
                )}
              </div>
            ) : report.status === 'Diproses' ? (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                <span className="text-muted-foreground block text-[10px]">Target SLA Lapangan:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 block text-sm">
                  {report.slaTargetDays || 3} Hari Kerja
                </span>
                <span className={`font-semibold block text-[11px] ${(report.slaDaysRemaining ?? 1) <= 1 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  ⏳ Sisa waktu: {report.slaDaysRemaining ?? 1} Hari lagi
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] pt-0.5">
                  Dinas Pelaksana: <strong>{report.assignedDinas || 'Dinas Bina Marga'}</strong>
                </span>
              </div>
            ) : report.status === 'Terverifikasi' ? (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                <span className="text-purple-700 dark:text-purple-300 font-bold block text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  Terverifikasi Valid
                </span>
                <span className="text-slate-600 dark:text-slate-300 block text-[11px]">
                  Ditugaskan ke: <strong>{report.assignedDinas || 'Dinas Terkait'}</strong>
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-medium block text-[10px]">
                  Menunggu pengerahan armada URC lapangan
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <span className="text-amber-800 dark:text-amber-300 font-bold block text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  Antrean Verifikasi
                </span>
                <span className="text-slate-600 dark:text-slate-300 block text-[11px]">
                  Admin sedang memverifikasi laporan & bukti foto kerusakan.
                </span>
              </div>
            )}

            {/* Dynamic Status Timeline Stepper */}
            <div className="space-y-4 pt-3 border-t">
              {/* Step 1: Laporan Dikirim */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</div>
                  <div className="w-0.5 h-10 bg-emerald-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground">Laporan Terkirim</span>
                  <span className="text-[10px] text-muted-foreground block">
                    Foto & koordinat GPS dicatat ({new Date(report.createdAt).toLocaleDateString('id-ID')})
                  </span>
                </div>
              </div>

              {/* Step 2: Verifikasi AI & Admin */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  {report.status === 'Pending' ? (
                    <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold animate-pulse shadow-xs">⏳</div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</div>
                  )}
                  <div className={`w-0.5 h-10 ${report.status === 'Pending' ? 'bg-border' : 'bg-emerald-500'}`} />
                </div>
                <div>
                  <span className={`text-xs font-bold ${report.status === 'Pending' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    Verifikasi Admin & Dinas
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {report.status === 'Pending'
                      ? 'Sedang ditinjau oleh tim verifikator kota'
                      : 'Telah tervalidasi & terdaftar di dinas'}
                  </span>
                </div>
              </div>

              {/* Step 3: Pengerjaan Tim URC Dinas */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  {report.status === 'Diproses' ? (
                    <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-blue-200 dark:ring-blue-900 shadow-xs animate-pulse">●</div>
                  ) : report.status === 'Selesai' ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-border text-muted-foreground flex items-center justify-center text-xs font-bold">○</div>
                  )}
                  <div className={`w-0.5 h-10 ${report.status === 'Selesai' ? 'bg-emerald-500' : 'bg-border'}`} />
                </div>
                <div>
                  <span className={`text-xs font-bold ${report.status === 'Diproses' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : report.status === 'Pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    Pengerjaan Tim URC Dinas
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {report.status === 'Diproses'
                      ? `Sedang dikerjakan oleh ${report.assignedDinas || 'Dinas Lapangan'}`
                      : report.status === 'Selesai'
                      ? `Telah tuntas oleh ${report.assignedDinas || 'Dinas Terkait'}`
                      : `Siap ditugaskan ke ${report.assignedDinas || 'Dinas Terkait'}`}
                  </span>
                </div>
              </div>

              {/* Step 4: Selesai & Validasi Bukti */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  {report.status === 'Selesai' ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-border text-muted-foreground flex items-center justify-center text-xs font-bold">○</div>
                  )}
                </div>
                <div>
                  <span className={`text-xs font-bold ${report.status === 'Selesai' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    Selesai Ditangani
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {report.status === 'Selesai'
                      ? 'Perbaikan tuntas dengan bukti foto lapangan'
                      : 'Menunggu perbaikan dan verifikasi fisik'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* LOCATION PREVIEW CARD */}
          <Card className="p-4 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500" /> Titik Lokasi
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {report.lat ? `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}` : (report.district || 'Titik Koordinat')}
              </Badge>
            </div>
            
            <SingleLocationMap
              lat={report.lat || -6.5246}
              lng={report.lng || 106.8432}
              address={report.address}
              title={report.title}
              category={report.category}
              className="h-44 w-full"
            />

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${report.lat || -7.2575},${report.lng || 112.7521}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="default" className="w-full text-xs font-bold gap-1.5 h-11 rounded-2xl border-border hover:text-primary">
                <MapPin className="h-4 w-4 text-primary" /> Buka di Google Maps
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}

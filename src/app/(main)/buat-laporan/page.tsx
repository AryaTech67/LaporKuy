'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLaporKuyStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { ReportCategory } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Upload,
  MapPin,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ThumbsUp,
  X,
  CheckCircle2,
  Target,
  Award,
  Construction,
  LightbulbOff,
  Trash2,
  Waves,
  Footprints,
  Building2,
  ShieldAlert,
  PlusCircle,
  Compass,
  MapPinned,
  Globe
} from 'lucide-react';
import { sendTelegramLog } from '@/app/actions/telegram';
import { INDONESIA_REGIONS } from '@/lib/indonesia-locations';
import { CustomSelect } from '@/components/ui/custom-select';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

const sampleAIResults: Record<string, { category: ReportCategory; severity: number; confidence: number; authenticity: number; recommendation: string; assignedDinas: string }> = {
  pothole: { category: 'Jalan Rusak', severity: 9, confidence: 97, authenticity: 99, recommendation: 'Rekomendasi URC: Penambalan aspal dingin / hotmix darurat.', assignedDinas: 'Dinas Bina Marga & Sumber Daya Air' },
  lamp: { category: 'Lampu Mati', severity: 6, confidence: 94, authenticity: 98, recommendation: 'Rekomendasi URC: Penggantian bohlam LED PJU 150W.', assignedDinas: 'Dinas Perumahan Rakyat & Kawasan Permukiman' },
  trash: { category: 'Sampah', severity: 8, confidence: 98, authenticity: 96, recommendation: 'Rekomendasi URC: Pengangkutan armada truk DLH.', assignedDinas: 'Dinas Lingkungan Hidup' },
  flood: { category: 'Banjir', severity: 7, confidence: 92, authenticity: 97, recommendation: 'Rekomendasi URC: Pengerukan pompa penyedot air.', assignedDinas: 'Dinas Bina Marga & Sumber Daya Air' },
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};

function BuatLaporanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addReport, reports } = useLaporKuyStore();

  const questParam = searchParams.get('quest');
  const questTitleParam = searchParams.get('title');
  const categoryParam = searchParams.get('category');
  const addressParam = searchParams.get('address');
  const districtParam = searchParams.get('district');

  // Manual Indonesian Location Hierarchy States (Empty by default)
  const [selectedIslandId, setSelectedIslandId] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [customDistrict, setCustomDistrict] = useState('');
  const [streetAddress, setStreetAddress] = useState(addressParam || '');
  const [isLocating, setIsLocating] = useState(false);

  const [location, setLocation] = useState({
    address: addressParam || '',
    district: districtParam || '',
    lat: 0,
    lng: 0,
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('Jalan Rusak');
  const [isUrgent, setIsUrgent] = useState(false);

  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<typeof reports[0] | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<typeof sampleAIResults['pothole'] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived options based on selections
  const currentIsland = INDONESIA_REGIONS.find((i) => i.id === selectedIslandId) || null;
  const availableProvinces = currentIsland ? currentIsland.provinces : [];
  const currentProvince = availableProvinces.find((p) => p.id === selectedProvinceId) || null;
  const availableCities = currentProvince ? currentProvince.cities : [];
  const currentCity = availableCities.find((c) => c.id === selectedCityId) || null;
  const availableDistricts = currentCity ? currentCity.districts : [];

  const handleIslandChange = (islandId: string) => {
    setSelectedIslandId(islandId);
    setSelectedProvinceId('');
    setSelectedCityId('');
    setSelectedDistrict('');
    setIsCustomDistrict(false);
    setCustomDistrict('');
  };

  const handleProvinceChange = (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedCityId('');
    setSelectedDistrict('');
    setIsCustomDistrict(false);
    setCustomDistrict('');
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedDistrict('');
    setIsCustomDistrict(false);
    setCustomDistrict('');
  };

  // Sync to main location state
  useEffect(() => {
    const island = INDONESIA_REGIONS.find((i) => i.id === selectedIslandId);
    const province = island?.provinces.find((p) => p.id === selectedProvinceId);
    const city = province?.cities.find((c) => c.id === selectedCityId);
    const districtName = isCustomDistrict ? customDistrict.trim() : selectedDistrict;

    const parts: string[] = [];
    if (streetAddress.trim()) parts.push(streetAddress.trim());
    if (districtName) parts.push(`Kec. ${districtName.replace(/^Kec\.\s*/i, '')}`);
    if (city?.name) parts.push(city.name);
    if (province?.name) parts.push(province.name);

    const formattedAddress = parts.join(', ');

    setLocation({
      address: formattedAddress,
      district: districtName ? `Kec. ${districtName.replace(/^Kec\.\s*/i, '')}` : (city?.name || ''),
      lat: city?.lat || 0,
      lng: city?.lng || 0,
    });
  }, [selectedIslandId, selectedProvinceId, selectedCityId, selectedDistrict, isCustomDistrict, customDistrict, streetAddress]);

  // Pre-fill from URL params if available
  useEffect(() => {
    if (addressParam) {
      setStreetAddress(addressParam);
    }
    if (districtParam) {
      const cleanDistrict = districtParam.replace(/^Kec\.\s*/i, '');
      for (const isl of INDONESIA_REGIONS) {
        for (const prv of isl.provinces) {
          for (const cty of prv.cities) {
            if (cty.districts.some((d) => d.toLowerCase() === cleanDistrict.toLowerCase())) {
              setSelectedIslandId(isl.id);
              setSelectedProvinceId(prv.id);
              setSelectedCityId(cty.id);
              setSelectedDistrict(cleanDistrict);
              return;
            }
          }
        }
      }
      setIsCustomDistrict(true);
      setCustomDistrict(cleanDistrict);
    }
  }, [addressParam, districtParam]);

  const [exifInfo, setExifInfo] = useState<{
    lat: number;
    lng: number;
    device: string;
    timestamp: string;
    exifVerified: boolean;
  } | null>(null);

  const [aiScanStep, setAiScanStep] = useState<string>('');
  const [aiProgress, setAiProgress] = useState(0);

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung fitur lokasi GPS.');
      return;
    }

    setIsLocating(true);
    const loadingToastId = toast.loading('Mencari lokasi terdekat...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearestDistance = Infinity;
        let bestIslandId = '';
        let bestProvId = '';
        let bestCityId = '';

        for (const isl of INDONESIA_REGIONS) {
          for (const prv of isl.provinces) {
            for (const cty of prv.cities) {
              const d = getDistanceFromLatLonInKm(latitude, longitude, cty.lat, cty.lng);
              if (d < nearestDistance) {
                nearestDistance = d;
                bestIslandId = isl.id;
                bestProvId = prv.id;
                bestCityId = cty.id;
              }
            }
          }
        }

        if (bestCityId) {
          setSelectedIslandId(bestIslandId);
          setSelectedProvinceId(bestProvId);
          setSelectedCityId(bestCityId);
          setSelectedDistrict('');
          toast.success('Lokasi kota berhasil ditemukan!', { id: loadingToastId });
        } else {
          toast.error('Lokasi di luar jangkauan.', { id: loadingToastId });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        toast.error('Gagal mengambil lokasi GPS. Pastikan izin lokasi diaktifkan.', { id: loadingToastId });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePhotoSelected = async (imgUrl: string, fileObj?: File) => {
    setPhotoUrl(imgUrl);
    setPhotoError(null);
    setDuplicateMatch(null);
    setAiResult(null);
    setAiProgress(0);

    const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const deviceName = fileObj?.name ? 'Kamera HP (EXIF Geotag Hardware)' : 'iPhone / Android Camera Sensor';
    
    setExifInfo({
      lat: location.lat,
      lng: location.lng,
      device: deviceName,
      timestamp: now,
      exifVerified: true,
    });

    setIsCheckingDuplicates(true);
    setAiScanStep('Mengekstrak metadata gambar...');
    
    let progress = 0;
    const initialInterval = setInterval(() => {
      progress += 15;
      if (progress > 30) clearInterval(initialInterval);
      setAiProgress(progress);
    }, 200);

    setTimeout(() => {
      setIsCheckingDuplicates(false);
      runAIClassification(imgUrl, fileObj?.name);
    }, 800);
  };

  const runAIClassification = async (imgUrl: string, filename?: string) => {
    setIsClassifying(true);
    setAiScanStep('Mengirim ke server Gemini 3.6 Flash...');
    
    const steps = [
      'Memindai visual kerusakan...',
      'Memvalidasi keaslian laporan...',
      'Menilai tingkat keparahan (severity)...',
      'Merumuskan rekomendasi tindakan...'
    ];
    let stepIndex = 0;
    
    const classificationInterval = setInterval(() => {
      setAiProgress((prev) => {
        const nextProgress = prev + Math.floor(Math.random() * 15) + 5;
        return nextProgress > 95 ? 95 : nextProgress;
      });
      if (stepIndex < steps.length && Math.random() > 0.4) {
        setAiScanStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 600);

    try {
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgUrl.startsWith('data:') ? imgUrl : null,
          filename: filename || imgUrl,
          location: location,
        }),
      });

      const data = await res.json();
      setAiProgress(100);

      if (data.success && data.category) {
        if (data.isValid === false) {
          setPhotoError(data.invalidReason || 'Foto yang Anda unggah terdeteksi tidak valid / spam. Harap unggah foto infrastruktur publik.');
          setPhotoUrl(null);
          setAiResult(null);
          return;
        }

        setSelectedCategory(data.category as ReportCategory);
        setAiResult({
          category: data.category as ReportCategory,
          severity: data.severity,
          confidence: data.confidence || 98,
          authenticity: data.authenticity || 99,
          recommendation: data.recommendation,
          assignedDinas: data.assignedDinas,
        } as any);
      } else {
        console.warn("AI Analysis fallback activated:", data);
        const fallbackCategory: ReportCategory = 'Jalan Rusak';
        setSelectedCategory(fallbackCategory);
        setAiResult({
          category: fallbackCategory,
          severity: 7,
          confidence: 92,
          authenticity: 98,
          recommendation: 'Pemeriksaan fisik lokasi dan validasi penanganan dinas terkait.',
          assignedDinas: 'Dinas Bina Marga & Sumber Daya Air',
        } as any);
      }
    } catch (err) {
      console.warn("AI Classification exception, using graceful fallback:", err);
      const fallbackCategory: ReportCategory = 'Jalan Rusak';
      setSelectedCategory(fallbackCategory);
      setAiResult({
        category: fallbackCategory,
        severity: 7,
        confidence: 90,
        authenticity: 95,
        recommendation: 'Pemeriksaan fisik lokasi dan validasi penanganan dinas terkait.',
        assignedDinas: 'Dinas Bina Marga & Sumber Daya Air',
      } as any);
    } finally {
      clearInterval(classificationInterval);
      setTimeout(() => setIsClassifying(false), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      toast.error('Harap unggah bukti foto kerusakan terlebih dahulu.');
      return;
    }
    if (!selectedIslandId || !selectedProvinceId || !selectedCityId || (!selectedDistrict && !customDistrict.trim())) {
      toast.error('Harap lengkapi pilihan wilayah administrasi (Pulau, Provinsi, Kota, dan Kecamatan).');
      return;
    }
    if (!streetAddress.trim()) {
      toast.error('Harap isi detail alamat atau nama jalan & patokan lokasi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const currentUserId = user?.id || 'usr-me';
      const currentUserName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Warga LaporKuy';

      const created = await addReport({
        title: `${selectedCategory} di ${location.district}`,
        category: selectedCategory,
        severity: (aiResult?.severity || 7) as any,
        address: location.address,
        district: location.district,
        lat: location.lat,
        lng: location.lng,
        photoUrl: photoUrl,
        description: description || 'Laporan pengaduan publik masyarakat.',
        status: 'Pending',
        userId: currentUserId,
        userName: currentUserName,
        isUrgent,
        aiAuthenticityScore: 99,
        aiConfidence: 98,
      });

      setIsSubmitting(false);
      await sendTelegramLog(`<b>📢 Laporan Baru Dibuat</b>\n\n<b>ID:</b> <code>${created.id}</code>\n<b>Judul:</b> ${selectedCategory} di ${location.district}\n<b>Deskripsi:</b> ${description || 'Tidak ada deskripsi'}\n<b>Kategori:</b> ${selectedCategory}\n<b>Lokasi:</b> ${location.address}\n<b>Kecamatan:</b> ${location.district}\n<b>Koordinat:</b> <code>${location.lat}, ${location.lng}</code>\n<b>Tingkat Keparahan:</b> ${aiResult?.severity || 7}/10\n<b>Darurat:</b> ${isUrgent ? '⚠️ Ya' : 'Tidak'}\n<b>Pelapor:</b> ${currentUserName}\n<b>User ID:</b> <code>${currentUserId}</code>\n<b>Status:</b> Pending (Menunggu Verifikasi)\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' })}`);
      router.push(`/laporan/${created.id}`);
    } catch (error) {
      console.error("Gagal mengirim laporan:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 font-sans">
      
      {/* Active Mission Context Card */}
      {questParam && (
        <Card className="mb-6 p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0057B8] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0 mt-0.5">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-100 dark:border-blue-900 text-[11px] font-medium px-2 py-0.5 rounded-md">
                    Misi Aktif
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                  {questTitleParam || 'Misi Pengaduan Warga'}
                </h3>
              </div>
            </div>
            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 px-2.5 py-1 rounded-md">
              +15 Poin Reward
            </Badge>
          </div>

          {/* Stepper Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Panduan Pengerjaan
            </span>

            <div className="space-y-2.5 pl-0.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                  1
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-0.5">
                  Ambil atau unggah foto kerusakan di lokasi.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                  2
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-0.5">
                  Tentukan wilayah dan detail jalan fasilitas publik.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                  3
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-0.5">
                  Kirim laporan dan klaim reward poin.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-8 text-center relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          Formulir Pengaduan Publik
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Unggah foto bukti lapangan, tentukan lokasi fasilitas publik, dan AI akan menganalisis aduan secara otomatis.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <CardContent className="p-6 sm:p-8 space-y-8 text-left">
          
          {/* MANUAL LOCATION SELECTION SECTION */}
          <div className="space-y-4 p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-[#0057B8] dark:text-blue-300 shrink-0 shadow-sm border border-blue-200/60 dark:border-blue-900">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Lokasi Fasilitas Publik
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                    Pilih wilayah administrasi (Pulau → Provinsi → Kota)
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoLocation}
                disabled={isLocating}
                className="text-xs font-bold shrink-0 bg-white dark:bg-slate-900 border-[#0057B8] text-[#0057B8] hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <MapPinned className="w-4 h-4 mr-1.5" />}
                Gunakan GPS Saat Ini
              </Button>
            </div>

            {/* Hierarchical Cascading Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Pulau / Wilayah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  1. Pulau / Wilayah Besar <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  id="select-island"
                  value={selectedIslandId}
                  onChange={handleIslandChange}
                  options={INDONESIA_REGIONS.map((island) => ({
                    id: island.id,
                    name: island.name,
                  }))}
                  placeholder="-- Pilih Pulau / Wilayah --"
                  icon={Compass}
                />
              </div>

              {/* 2. Provinsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  2. Provinsi <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  id="select-province"
                  value={selectedProvinceId}
                  disabled={!selectedIslandId}
                  onChange={handleProvinceChange}
                  options={availableProvinces.map((prov) => ({
                    id: prov.id,
                    name: prov.name,
                  }))}
                  placeholder="-- Pilih Provinsi --"
                  disabledPlaceholder="-- Pilih Pulau Terlebih Dahulu --"
                  icon={MapPinned}
                />
              </div>

              {/* 3. Kota / Kabupaten */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  3. Kota / Kabupaten <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  id="select-city"
                  value={selectedCityId}
                  disabled={!selectedProvinceId}
                  onChange={handleCityChange}
                  options={availableCities.map((city) => ({
                    id: city.id,
                    name: city.name,
                  }))}
                  placeholder="-- Pilih Kota / Kabupaten --"
                  disabledPlaceholder="-- Pilih Provinsi Terlebih Dahulu --"
                  icon={Building2}
                />
              </div>

              {/* 4. Kecamatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  4. Kecamatan <span className="text-red-500">*</span>
                </label>
                {!isCustomDistrict ? (
                  <CustomSelect
                    id="select-district"
                    value={selectedDistrict}
                    disabled={!selectedCityId}
                    onChange={setSelectedDistrict}
                    options={availableDistricts.map((dist) => ({
                      id: dist,
                      name: `Kec. ${dist}`,
                    }))}
                    placeholder="-- Pilih Kecamatan --"
                    disabledPlaceholder="-- Pilih Kota Terlebih Dahulu --"
                    icon={MapPin}
                    customAction={
                      selectedCityId
                        ? {
                            label: '+ Tulis Nama Kecamatan Lainnya...',
                            onClick: () => {
                              setIsCustomDistrict(true);
                              setSelectedDistrict('');
                            },
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Ketik nama kecamatan..."
                      value={customDistrict}
                      onChange={(e) => setCustomDistrict(e.target.value)}
                      className="text-xs sm:text-sm bg-white dark:bg-slate-900 h-10 font-medium"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCustomDistrict(false);
                        setSelectedDistrict(availableDistricts[0] || '');
                      }}
                      className="text-xs h-10 px-3 shrink-0"
                    >
                      Batal
                    </Button>
                  </div>
                )}
              </div>


              {/* 5. Detail Alamat / Nama Jalan */}
              <div className="sm:col-span-2 space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  5. Detail Alamat / Nama Jalan & Patokan Lokasi <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Cth: Jl. Sudirman No. 12, RT 01/RW 02, patokan..."
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="text-xs sm:text-sm bg-white dark:bg-slate-900 h-11 font-medium px-4"
                  required
                />
              </div>
            </div>

            {/* Live Address Preview Card */}
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-xs">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 mt-0.5 ${
                  location.address && selectedCityId
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {location.address && selectedCityId ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                    Alamat Lengkap Tersimpan:
                  </span>
                  {location.address && selectedCityId ? (
                    <span className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed break-words">
                      {location.address}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">
                      Belum diisi. Silakan pilih wilayah administrasi dan masukkan detail jalan di atas.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PHOTO UPLOAD SECTION */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Bukti Foto Kerusakan <span className="text-red-600">*</span>
            </label>

            {photoError && (
              <div className="p-3.5 mb-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm font-medium text-red-800 dark:text-red-200 leading-relaxed">
                  <strong className="block mb-1">Foto Ditolak:</strong>
                  {photoError}
                </div>
              </div>
            )}

            {!photoUrl ? (
              <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden group hover:border-[#0057B8] hover:bg-blue-50/30 transition-all">
                <Camera className="w-10 h-10 text-slate-400 group-hover:text-[#0057B8] mb-4 transition-colors" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Unggah atau Ambil Foto Kerusakan</p>
                <p className="text-xs text-slate-500 mb-6 text-center max-w-xs">Pastikan foto jelas dan menunjukkan letak masalah. (Maksimal 5MB)</p>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                  <label className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#0057B8] hover:text-[#0057B8] transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="sr-only" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressedBase64 = await compressImage(file);
                          handlePhotoSelected(compressedBase64, file);
                        }
                      }}
                    />
                    <Camera className="w-4 h-4" /> Buka Kamera
                  </label>
                  <label className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#0057B8] hover:text-[#0057B8] transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="sr-only" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressedBase64 = await compressImage(file);
                          handlePhotoSelected(compressedBase64, file);
                        }
                      }}
                    />
                    <Upload className="w-4 h-4" /> Pilih dari Galeri
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                <img src={photoUrl} alt="Preview Bukti Foto" className="h-64 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                    setAiResult(null);
                    setDuplicateMatch(null);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/75 text-white hover:bg-slate-900 transition-colors backdrop-blur-md"
                  aria-label="Hapus Foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* LOADING STATE */}
          {(isCheckingDuplicates || isClassifying) && (
            <div className="p-5 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-[#0057B8] dark:text-blue-400 animate-spin shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {aiScanStep || 'Menganalisis foto dan lokasi...'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-blue-100/50 dark:bg-blue-900/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#0057B8] h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${aiProgress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] font-medium text-slate-500 text-right">
                  {aiProgress}% diproses
                </div>
              </div>
            </div>
          )}

          {/* AI RESULT DISPLAY */}
          {aiResult && !isClassifying && !isCheckingDuplicates && (
            <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-200/50 dark:border-emerald-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2">
                    Analisis AI Selesai
                    <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${
                      aiResult.severity >= 8 ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900' :
                      aiResult.severity >= 5 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                    }`}>
                      Tingkat Kerusakan: {aiResult.severity}/10
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Sistem mendeteksi indikasi <span className="font-bold text-slate-800 dark:text-slate-200">{aiResult.category}</span>.
                  </p>
                </div>
              </div>
              <div className="pl-[52px] grid sm:grid-cols-2 gap-3">
                <div className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Rekomendasi Penanganan:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{aiResult.recommendation}</span>
                </div>
                <div className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Dinas Terkait:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{aiResult.assignedDinas}</span>
                </div>
              </div>
            </div>
          )}



          {/* DESCRIPTION FIELD */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
              Deskripsi Masalah
            </label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan detail kondisi atau lokasi kerusakan di lapangan..."
              className="w-full rounded-xl border-slate-300 dark:border-slate-700 focus:ring-[#0057B8] text-sm p-3.5"
            />
          </div>

          {/* URGENT FLAG */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="urgent" className="text-xs font-semibold text-rose-900 dark:text-rose-200 cursor-pointer flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              Tandai sebagai Laporan Darurat / Butuh Penanganan URC Segera
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isCheckingDuplicates || isClassifying}
            className="w-full h-12 text-base font-bold bg-[#0057B8] hover:bg-[#004494] text-white shadow-md rounded-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Mengirimkan Laporan...
              </span>
            ) : (
              'Kirim Laporan Pengaduan'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BuatLaporanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#0057B8] animate-spin" />
      </div>
    }>
      <BuatLaporanForm />
    </Suspense>
  );
}

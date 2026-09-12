'use client';

import { useState, useRef, useEffect } from 'react';
import { Report } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, ThumbsUp, Eye, Compass } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  reports: Report[];
  mapMode?: 'marker' | 'heatmap';
  showPredictiveZone?: boolean;
  onSelectReport?: (report: Report) => void;
  className?: string;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'qNmsb52QZkhFrzAr5QnL';

// Component to handle map interactions
function MapController({ selectedPin }: { selectedPin: Report | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPin && selectedPin.lat && selectedPin.lng) {
      map.flyTo([selectedPin.lat, selectedPin.lng], 15, { duration: 1.5 });
    }
  }, [selectedPin, map]);
  return null;
}

export function MapView({
  reports,
  mapMode = 'marker',
  showPredictiveZone = false,
  onSelectReport,
  className = '',
}: MapViewProps) {
  const [selectedPin, setSelectedPin] = useState<Report | null>(reports[0] || null);
  const [mapTheme, setMapTheme] = useState<'dataviz-dark' | 'streets-v2' | 'satellite'>('streets-v2');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('Geoloc warning:', err.message || 'Permission denied or unavailable');
          if (err.code === 1) {
            setLocationDenied(true);
            toast.error("Akses lokasi ditolak", {
              description: "Aplikasi ini mewajibkan akses lokasi. Silakan izinkan di pengaturan browser."
            });
          }
          // Error code != 1 diabaikan tanpa toast agar tidak mengganggu jika refresh terus menerus
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const getTileUrl = () => {
    return `https://api.maptiler.com/maps/${mapTheme}/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
  };

  const getCategoryColorHex = (category: string) => {
    switch (category) {
      case 'Jalan Rusak': return '#f43f5e'; // rose-500
      case 'Lampu Mati': return '#f59e0b'; // amber-500
      case 'Sampah': return '#10b981'; // emerald-500
      case 'Banjir': return '#3b82f6'; // blue-500
      case 'Trotoar Rusak': return '#a855f7'; // purple-500
      default: return '#334155'; // slate-700
    }
  };

  const createCustomIcon = (report: Report, isSelected: boolean) => {
    const color = getCategoryColorHex(report.category);
    const ring = isSelected ? 'box-shadow: 0 0 0 4px white;' : '';
    const zIndex = isSelected ? 1000 : 1;
    
    const htmlString = `
      <div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 999px; font-weight: bold; font-size: 11px; white-space: nowrap; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s; ${ring}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        ${report.category}
      </div>
    `;

    return L.divIcon({
      html: htmlString,
      className: 'custom-leaflet-marker',
      iconSize: [100, 24],
      iconAnchor: [50, 24],
      popupAnchor: [0, -24],
    });
  };

  // Dynamic Center based on actual user location or available reports from Supabase
  const defaultLat = reports[0]?.lat || -6.5246;
  const defaultLng = reports[0]?.lng || 106.8432;
  const centerPosition: [number, number] = userLocation || [defaultLat, defaultLng];

  if (locationDenied) {
    return (
      <div className={`relative w-full h-full min-h-[350px] overflow-hidden border-border bg-slate-950 flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-md shadow-2xl z-10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Izin Lokasi Diperlukan</h3>
          <p className="text-sm text-slate-400 mb-6">
            Aplikasi LaporKuy memerlukan izin lokasi presisi perangkat Anda untuk memetakan laporan masalah infrastruktur publik secara akurat.
          </p>
          <div className="bg-slate-950 p-4 rounded-lg text-left mb-6 border border-slate-800 text-xs text-slate-300">
            <strong>Petunjuk Mengaktifkan Izin Lokasi:</strong>
            <ol className="list-decimal pl-4 mt-2 space-y-1">
              <li>Klik ikon gembok (🔒) atau informasi situs di sebelah kiri bilah URL browser Anda.</li>
              <li>Pilih menu &quot;Location&quot; atau &quot;Lokasi&quot;.</li>
              <li>Ubah pengaturannya menjadi &quot;Allow&quot; atau &quot;Izinkan&quot;.</li>
              <li>Muat ulang (Refresh) halaman ini untuk melanjutkan.</li>
            </ol>
          </div>
          <Button 
            className="w-full bg-[#0057B8] hover:bg-[#004494] text-white font-bold"
            onClick={() => window.location.reload()}
          >
            Izin Telah Diaktifkan, Muat Ulang Halaman
          </Button>
        </div>
        {/* Blurred background effect */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://api.maptiler.com/maps/dataviz-dark/13/6575/4232.png?key=qNmsb52QZkhFrzAr5QnL')] bg-cover bg-center filter blur-sm"></div>
      </div>
    );
  }



  return (
    <div className={`relative w-full h-full min-h-[350px] overflow-hidden border-border bg-slate-950 text-slate-100 ${className}`}>
      
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={centerPosition} 
          zoom={13} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#020617' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url={getTileUrl()}
          />
          
          <MapController selectedPin={selectedPin} />

          {reports.map((report, idx) => {
            // Generate deterministic pseudo-random coordinates near default center if missing
            const pseudoRandomX = (idx * 0.13) % 0.05;
            const pseudoRandomY = (idx * 0.17) % 0.05;
            const lat = report.lat || defaultLat + pseudoRandomX - 0.025;
            const lng = report.lng || defaultLng + pseudoRandomY - 0.025;
            
            // Just update the object so it stays consistent on click
            if (!report.lat || !report.lng) {
              report.lat = lat;
              report.lng = lng;
            }

            const isSelected = selectedPin?.id === report.id;

            return (
              <Marker 
                key={report.id} 
                position={[lat, lng]} 
                icon={createCustomIcon(report, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedPin(report);
                    onSelectReport?.(report);
                  },
                }}
              >
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ════ STATIC UI LAYER ════ */}
      <div className="relative z-10 p-4 pointer-events-none flex flex-col justify-between h-full">
        
        {/* Top Map Control Bar */}
        <div className="pointer-events-auto hidden md:flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Peta Sebaran Laporan Warga
            </Badge>
            <span className="text-xs text-slate-400 font-medium">
              {reports.length} Laporan Terdaftar
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-semibold text-[#0084FF]">
              🗺️ Mode Peta Jalan
            </div>
          </div>
        </div>

        {/* Selected Pin Popup Card */}
        <div className="pointer-events-auto mt-24 md:mt-0 max-w-[90vw] md:max-w-none mx-auto md:mx-0">
          {selectedPin && (
            <Card className="relative z-10 bg-slate-900/95 text-slate-100 border-slate-800 p-4 rounded-xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedPin.photoUrl}
                    alt={selectedPin.title}
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-14 w-14 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                        {selectedPin.category}
                      </Badge>
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                        Keparahan: {selectedPin.severity}/10
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 line-clamp-1 mt-0.5">
                      {selectedPin.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      📍 {selectedPin.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mr-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-blue-400" />
                    <span>{selectedPin.upvotes} Dukungan</span>
                  </div>
                  <Link href={`/laporan/${selectedPin.id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90">
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Required CSS to ensure Leaflet renders properly inside container */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
          background: transparent !important;
          isolation: isolate;
          z-index: 0 !important;
        }
        .custom-leaflet-marker {
          background: transparent;
          border: none;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}} />
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Report } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, ThumbsUp, Eye, Compass, Layers } from 'lucide-react';
import Link from 'next/link';

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  reports: Report[];
  mapMode?: 'marker' | 'heatmap';
  showPredictiveZone?: boolean;
  onSelectReport?: (report: Report) => void;
  className?: string;
}

// Ultra-fast CDN tile servers with zero API key requirement & clean visuals
const TILE_PRESETS = {
  streets: {
    id: 'streets',
    label: 'Peta Jalan',
    icon: '🗺️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: ['server'],
    attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  dark: {
    id: 'dark',
    label: 'Mode Gelap',
    icon: '🌙',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    subdomains: ['server'],
    attribution: '&copy; Esri &copy; OpenStreetMap',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    label: 'Satelit',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: ['server'],
    attribution: '&copy; Esri World Imagery',
    maxZoom: 19,
  },
} as const;

type TilePresetKey = keyof typeof TILE_PRESETS;

// Component to handle map sizing, auto fit bounds, and smooth pan
function MapController({ selectedPin, reports }: { selectedPin: Report | null; reports: Report[] }) {
  const map = useMap();
  const hasFitted = useRef(false);

  // Invalidate size immediately so Leaflet recalculates dimensions without blank tiles
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  // Automatically fit map bounds to display all reports in view
  useEffect(() => {
    if (reports && reports.length > 0 && !hasFitted.current) {
      const validPoints = reports
        .filter((r) => typeof r.lat === 'number' && typeof r.lng === 'number' && !isNaN(r.lat) && !isNaN(r.lng))
        .map((r) => [r.lat, r.lng] as [number, number]);

      if (validPoints.length === 1) {
        map.setView(validPoints[0], 14, { animate: false });
        hasFitted.current = true;
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        hasFitted.current = true;
      }
    }
  }, [reports, map]);

  // Pan smoothly to selected pin on click
  useEffect(() => {
    if (selectedPin && typeof selectedPin.lat === 'number' && typeof selectedPin.lng === 'number') {
      map.flyTo([selectedPin.lat, selectedPin.lng], 15, { duration: 0.8 });
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
  const [mapTheme, setMapTheme] = useState<TilePresetKey>('streets');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Keep selectedPin updated if reports change
  useEffect(() => {
    if (reports.length > 0 && (!selectedPin || !reports.some(r => r.id === selectedPin.id))) {
      setSelectedPin(reports[0]);
    }
  }, [reports, selectedPin]);

  // Fast, non-blocking user geolocation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Graceful silent fallback to reports center
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 120000 }
      );
    }
  }, []);

  const getCategoryColorHex = (category: string) => {
    switch (category) {
      case 'Jalan Rusak': return '#e11d48'; // rose-600
      case 'Lampu Mati': return '#d97706'; // amber-600
      case 'Sampah': return '#059669'; // emerald-600
      case 'Banjir': return '#2563eb'; // blue-600
      case 'Trotoar Rusak': return '#9333ea'; // purple-600
      default: return '#0284c7'; // sky-600
    }
  };

  const createCustomIcon = (report: Report, isSelected: boolean) => {
    const color = getCategoryColorHex(report.category);
    const ring = isSelected ? 'box-shadow: 0 0 0 3px #ffffff, 0 4px 12px rgba(0,0,0,0.4); transform: scale(1.1);' : 'box-shadow: 0 2px 6px rgba(0,0,0,0.25);';

    const htmlString = `
      <div style="
        background-color: ${color};
        color: white;
        padding: 4px 10px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        border: 1.5px solid rgba(255,255,255,0.9);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        ${ring}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${report.category}</span>
      </div>
    `;

    return L.divIcon({
      html: htmlString,
      className: 'custom-leaflet-marker',
      iconSize: [110, 26],
      iconAnchor: [55, 26],
      popupAnchor: [0, -26],
    });
  };

  // Center based on first available report or user location
  const defaultLat = reports[0]?.lat || -6.5246;
  const defaultLng = reports[0]?.lng || 106.8432;
  const centerPosition: [number, number] = useMemo(() => {
    return userLocation || [defaultLat, defaultLng];
  }, [userLocation, defaultLat, defaultLng]);

  const activeTile = TILE_PRESETS[mapTheme];

  return (
    <div className={`relative w-full h-full min-h-[350px] overflow-hidden bg-[#e8ecf1] dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${className}`}>
      
      {/* ════ MAP VIEWPORT ════ */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={centerPosition} 
          zoom={13} 
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#e8ecf1' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            key={mapTheme}
            attribution={activeTile.attribution}
            url={activeTile.url}
            subdomains={activeTile.subdomains as unknown as string[]}
            maxZoom={activeTile.maxZoom}
            crossOrigin="anonymous"
          />
          
          <MapController selectedPin={selectedPin} reports={reports} />

          {reports.map((report, idx) => {
            // Deterministic coordinates fallback if coordinate is missing
            const pseudoRandomX = (idx * 0.035) % 0.04;
            const pseudoRandomY = (idx * 0.045) % 0.04;
            const lat = report.lat || defaultLat + pseudoRandomX - 0.02;
            const lng = report.lng || defaultLng + pseudoRandomY - 0.02;
            
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
              />
            );
          })}
        </MapContainer>
      </div>

      {/* ════ FLOATING UI CONTROLS ════ */}
      <div className="relative z-10 p-4 pointer-events-none flex flex-col justify-between h-full">
        
        {/* Top Header & Layer Switcher Bar */}
        <div className="pointer-events-auto hidden md:flex flex-wrap items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-slate-800 text-[#0057B8] dark:text-cyan-400 border-blue-200 dark:border-slate-700 flex items-center gap-1.5 font-bold text-xs">
              <Compass className="w-3.5 h-3.5 text-[#0057B8] dark:text-cyan-400" />
              Peta Sebaran Laporan Warga
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {reports.length} Laporan Aktif
            </span>
          </div>

          {/* Quick Map Tile Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(Object.keys(TILE_PRESETS) as TilePresetKey[]).map((key) => {
              const item = TILE_PRESETS[key];
              const isActive = mapTheme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMapTheme(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-[#0057B8] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  title={`Ganti ke mode ${item.label}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pin Popup Card */}
        <div className="pointer-events-auto mt-24 md:mt-0 max-w-[95vw] md:max-w-xl mx-auto md:mx-0">
          {selectedPin && (
            <Card className="relative z-10 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedPin.photoUrl || '/images/reports/amblas.jpg'}
                    alt={selectedPin.title}
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/reports/amblas.jpg';
                    }}
                    className="h-14 w-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-slate-800 text-[#0057B8] dark:text-blue-300 border-blue-200 dark:border-slate-700 text-[10px] font-bold">
                        {selectedPin.category}
                      </Badge>
                      <Badge className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-semibold">
                        Keparahan: {selectedPin.severity}/10
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {selectedPin.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{selectedPin.address}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-semibold">
                    <ThumbsUp className="h-3.5 w-3.5 text-[#0057B8]" />
                    <span>{selectedPin.upvotes} Dukungan</span>
                  </div>
                  <Link href={`/laporan/${selectedPin.id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0057B8] hover:bg-[#004494] text-white font-bold rounded-lg shadow-sm">
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
      
      {/* Required CSS to ensure Leaflet renders crisp & cleanly */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
          background: #e8ecf1 !important;
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

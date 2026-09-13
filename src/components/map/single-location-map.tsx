'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SingleLocationMapProps {
  lat: number;
  lng: number;
  address?: string;
  title?: string;
  category?: string;
  className?: string;
  zoom?: number;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 100);
    map.setView([lat, lng], map.getZoom());
    return () => clearTimeout(t);
  }, [lat, lng, map]);
  return null;
}

const createPinIcon = () => {
  const htmlString = `
    <div style="
      background-color: #f43f5e;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.95);
      transform: translate(-50%, -50%);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  `;

  return L.divIcon({
    html: htmlString,
    className: 'custom-single-pin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export default function SingleLocationMap({
  lat,
  lng,
  address,
  title,
  category,
  className = 'h-48 w-full',
  zoom = 15,
}: SingleLocationMapProps) {
  const position: [number, number] = [lat, lng];

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900 ${className}`}>
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={true}
        style={{ width: '100%', height: '100%', background: '#e2e8f0' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri &copy; OpenStreetMap contributors'
          maxZoom={19}
        />
        <MapRecenter lat={lat} lng={lng} />
        <Marker position={position} icon={createPinIcon()}>
          {title && (
            <Popup>
              <div className="text-xs font-semibold p-1">
                {category && <span className="text-[10px] text-rose-500 font-bold block">{category}</span>}
                <p className="font-bold text-slate-900">{title}</p>
                {address && <p className="text-[10px] text-slate-600 mt-0.5">{address}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>

      {address && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-md z-10 pointer-events-none">
          <span className="font-semibold truncate max-w-[85%] text-slate-800">📍 {address}</span>
          <span className="text-[9px] text-slate-400 font-mono font-medium">Peta Lokasi</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-single-pin-marker {
          background: transparent;
          border: none;
        }
        .leaflet-container {
          font-family: inherit;
          isolation: isolate;
          z-index: 0 !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}} />
    </div>
  );
}

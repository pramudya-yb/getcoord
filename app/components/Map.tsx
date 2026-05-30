"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js/Leaflet
// @ts-expect-error - Icon.Default.mergeOptions is not typed correctly in some environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  position: [number, number];
  zoom?: number;
  basemapUrl: string;
}

// Helper component to update map view when position changes
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map && position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

// Helper component to handle zoom and center
export function MapControls({ onCenter }: { onCenter?: () => void }) {
  const map = useMap();
  
  return (
    <>
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <button 
            onClick={() => map.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            onClick={() => map.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
            </svg>
          </button>
        </div>

        <button 
          onClick={onCenter}
          className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800 transition-colors shadow-xl"
          title="Lokasi Sekarang"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </>
  );
}

export default function Map({ position, zoom = 13, basemapUrl, children }: MapProps & { children?: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[220px] md:h-[350px] rounded-[1.5rem] md:rounded-[2rem] bg-zinc-950 border border-zinc-800 animate-pulse" />
    );
  }

  return (
    <div className="w-full h-[180px] md:h-[350px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-950">
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={basemapUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={basemapUrl}
        />
        <Marker position={position} />
        <MapUpdater position={position} />
        {children}
      </MapContainer>
    </div>
  );
}

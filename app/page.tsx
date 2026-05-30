"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] md:h-[350px] bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center border border-zinc-800">
      <span className="text-zinc-500 text-sm">Memuat peta...</span>
    </div>
  ),
});

// Import MapControls dynamically as well if needed
const MapControls = dynamic(() => import("./components/Map").then(mod => mod.MapControls), { ssr: false });

interface Coord {
  id: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  label: string;
}

const BASEMAPS = [
  {
    id: "street",
    name: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  {
    id: "satellite",
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
  {
    id: "topo",
    name: "Topography",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  },
];

export default function Home() {
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState<Coord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState(BASEMAPS[0]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [settings, setSettings] = useState({
    format: "DD", // DD or DMS
    precision: 7,
    keepAwake: false,
  });

  // Helper: Convert Decimal to DMS
  const toDMS = (val: number, isLat: boolean) => {
    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    const direction = isLat ? (val >= 0 ? "N" : "S") : (val >= 0 ? "E" : "W");
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  // Default position: Jakarta
  const defaultPosition: [number, number] = [-6.2088, 106.8456];

  const mapPosition = useMemo((): [number, number] => {
    if (current) return [current.lat, current.lng];
    if (coords.length > 0) return [coords[coords.length - 1].lat, coords[coords.length - 1].lng];
    return defaultPosition;
  }, [current, coords, defaultPosition]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoord: Coord = {
          id: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toLocaleString("id-ID"),
          label: label.trim() || `Titik ${coords.length + 1}`,
        };
        setCurrent(newCoord);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [label, coords.length]);

  const saveCoord = () => {
    if (!current) return;
    setCoords((prev) => [...prev, current]);
    setLabel("");
    setCurrent(null);
  };

  const copyCoord = async (c: Coord) => {
    await navigator.clipboard.writeText(`${c.lat}, ${c.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportCSV = () => {
    if (!coords.length) return;
    const header = "No,Label,Latitude,Longitude,Akurasi (m),Waktu";
    const rows = coords.map((c, i) =>
      `${i + 1},"${c.label}",${c.lat},${c.lng},${c.accuracy},"${c.timestamp}"`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `getcoord_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteCoord = (id: number) =>
    setCoords((prev) => prev.filter((c) => c.id !== id));

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] animate-in fade-in duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-zinc-900 border-r border-zinc-800 z-[3001] transform transition-transform duration-300 ease-out shadow-2xl ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Pengaturan</h2>
          <button onClick={() => setShowSidebar(false)} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Format Koordinat</label>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-zinc-800">
              <button 
                onClick={() => setSettings(prev => ({ ...prev, format: 'DD' }))}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${settings.format === 'DD' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                Decimal
              </button>
              <button 
                onClick={() => setSettings(prev => ({ ...prev, format: 'DMS' }))}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${settings.format === 'DMS' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                DMS
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Presisi Desimal</label>
            <input 
              type="range" min="4" max="10" 
              value={settings.precision} 
              onChange={(e) => setSettings(prev => ({ ...prev, precision: parseInt(e.target.value) }))}
              className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5"
            />
            <div className="flex justify-between text-[10px] font-bold text-zinc-600">
              <span>Low (4)</span>
              <span className="text-emerald-500">{settings.precision}</span>
              <span>High (10)</span>
            </div>
          </div>
          <div className="space-y-6 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-200">Keep Awake</p>
                <p className="text-[10px] text-zinc-500">Cegah layar mati</p>
              </div>
              <button 
                onClick={() => setSettings(prev => ({ ...prev, keepAwake: !prev.keepAwake }))}
                className={`w-10 h-5 rounded-full transition-all flex items-center px-1 ${settings.keepAwake ? 'bg-emerald-500' : 'bg-zinc-800'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.keepAwake ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <button 
              onClick={() => { if(confirm('Hapus semua titik tersimpan?')) setCoords([]) }}
              className="w-full py-3 text-xs font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/5 border border-red-500/10 rounded-xl transition-all"
            >
              Hapus Semua Data
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col px-4 pt-4 overflow-hidden">
        
        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-4 shrink-0">
          <button 
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">GetCoord</h1>
            <p className="text-[10px] text-zinc-600 font-medium mt-1">Spatial Capture Utility</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-zinc-900/40 px-3 py-1.5 rounded-full border border-zinc-800/30 min-w-[40px] justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
            {current && (
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                ±{current.accuracy}m
              </span>
            )}
          </div>
        </div>

        {/* Map Section - Integrated Look */}
        <div className="mb-4 group shrink-0">
          <div className="relative rounded-[1.5rem] md:rounded-[2rem] p-0.5 bg-zinc-900/50 border border-zinc-800/50 shadow-xl transition-all duration-500 group-hover:border-emerald-500/20">
            <Map position={mapPosition} basemapUrl={activeBasemap.url}>
              <MapControls onCenter={getLocation} />
              
              {/* Bottom Right: Action Button - High Contrast Emerald */}
              <div className="absolute bottom-6 right-6 z-[1000]">
                <button
                  onClick={getLocation}
                  disabled={loading}
                  className="w-16 h-16 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 border border-emerald-400/20"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="5" fill="currentColor"/>
                    </svg>
                  )}
                </button>
              </div>
            </Map>
          </div>
        </div>

        {/* Compact Basemap Selector */}
        <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/50 backdrop-blur-xl mb-4 shrink-0">
          {BASEMAPS.map((bm) => (
            <button
              key={bm.id}
              onClick={() => setActiveBasemap(bm)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeBasemap.id === bm.id ? "bg-zinc-800 text-white shadow-md" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {bm.name}
            </button>
          ))}
        </div>

        {/* Data Cards - Fixed Viewport Space */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {(current || coords.length > 0) && (
            <div className="mb-4 animate-in fade-in duration-500 shrink-0">
               <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-zinc-800/50">
                    <div className="p-4">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Longitude</span>
                      <span className="text-lg font-light tracking-tighter text-white font-mono leading-none">
                        {settings.format === "DD" 
                          ? (current || coords[coords.length-1]).lng.toFixed(settings.precision)
                          : toDMS((current || coords[coords.length-1]).lng, false)}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Latitude</span>
                      <span className="text-lg font-light tracking-tighter text-white font-mono leading-none">
                        {settings.format === "DD" 
                          ? (current || coords[coords.length-1]).lat.toFixed(settings.precision)
                          : toDMS((current || coords[coords.length-1]).lat, true)}
                      </span>
                    </div>
                  </div>

                  {current && (
                    <div className="p-3 bg-zinc-900/50 border-t border-zinc-800/50 flex gap-3">
                      <input
                        type="text"
                        placeholder="Nama titik..."
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="flex-1 bg-black/40 border border-zinc-800/50 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700"
                      />
                      <button
                        onClick={saveCoord}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-xl text-xs font-black transition-all"
                      >
                        SIMPAN
                      </button>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Saved Table - Scrollable Region */}
          {coords.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50 shrink-0">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Database ({coords.length})</h2>
                <button onClick={exportCSV} className="text-[9px] font-bold text-zinc-500 hover:text-emerald-500 uppercase tracking-widest transition-all">CSV EXPORT</button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-zinc-800/30">
                    {[...coords].reverse().map((c, i) => (
                      <tr key={c.id} className="group hover:bg-zinc-800/30 transition-colors">
                        <td className="pl-4 py-3 w-8 text-[10px] text-zinc-700 font-mono italic">{coords.length - i}</td>
                        <td className="px-3 py-3">
                          <span className="text-[11px] font-bold text-zinc-300 block leading-tight">{c.label}</span>
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
                            {settings.format === "DD" ? `${c.lng.toFixed(5)}, ${c.lat.toFixed(5)}` : 'Captured'}
                          </span>
                        </td>
                        <td className="pr-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyCoord(c)} className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-white"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                            <button onClick={() => deleteCoord(c.id)} className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

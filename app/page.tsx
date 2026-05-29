"use client";

import { useState, useCallback } from "react";

interface Coord {
  id: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  label: string;
}

export default function Home() {
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState<Coord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini.");
      return;
    }
    setLoading(true);
    setError("");
    setCurrent(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrent({
          id: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toLocaleString("id-ID"),
          label: label.trim() || `Titik ${coords.length + 1}`,
        });
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">GetCoord</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Rekam koordinat GPS dari perangkat</p>
        </div>

        {/* Label */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Nama titik (opsional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getLocation()}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Main button */}
        <button
          onClick={getLocation}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium py-4 rounded-xl text-base transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Mengambil lokasi...
            </span>
          ) : (
            "Ambil Koordinat"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-3 bg-red-950 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Result */}
        {current && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Hasil</span>
                <span className="text-xs text-emerald-500">±{current.accuracy}m akurasi</span>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Latitude</p>
                  <p className="font-mono text-sm font-medium">{current.lat.toFixed(7)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Longitude</p>
                  <p className="font-mono text-sm font-medium">{current.lng.toFixed(7)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-zinc-500 text-xs mb-1">Waktu</p>
                  <p className="text-sm text-zinc-300">{current.timestamp}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyCoord(current)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 text-sm font-medium py-3 rounded-lg transition-colors"
                >
                  {copied ? "Tersalin!" : "Salin"}
                </button>
                <button
                  onClick={saveCoord}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium py-3 rounded-lg transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved table */}
        {coords.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-400">
                {coords.length} titik tersimpan
              </span>
              <button
                onClick={exportCSV}
                className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
              >
                Export CSV
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 w-8">#</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-3 py-3">Label</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-3 py-3">Latitude</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-3 py-3">Longitude</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-3 py-3">±m</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {coords.map((c, i) => (
                      <tr key={c.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 text-zinc-600 text-xs">{i + 1}</td>
                        <td className="px-3 py-3 font-medium max-w-[100px] truncate">{c.label}</td>
                        <td className="px-3 py-3 font-mono text-xs text-zinc-300">{c.lat.toFixed(6)}</td>
                        <td className="px-3 py-3 font-mono text-xs text-zinc-300">{c.lng.toFixed(6)}</td>
                        <td className="px-3 py-3 text-xs text-zinc-500">{c.accuracy}</td>
                        <td className="pr-2 py-3">
                          <button
                            onClick={() => deleteCoord(c.id)}
                            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-red-400 transition-colors"
                            aria-label="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

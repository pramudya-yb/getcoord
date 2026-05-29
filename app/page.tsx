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

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: Coord = {
          id: Date.now(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toLocaleString("id-ID"),
          label: label.trim() || `Titik ${coords.length + 1}`,
        };
        setCurrent(c);
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

  const exportCSV = () => {
    if (!coords.length) return;
    const header = "No,Label,Latitude,Longitude,Akurasi (m),Waktu";
    const rows = coords.map((c, i) =>
      `${i + 1},"${c.label}",${c.lat},${c.lng},${c.accuracy},"${c.timestamp}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
    <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-400">📍 GetCoord</h1>
        <p className="text-gray-400 text-sm mt-1">Ambil & simpan koordinat GPS</p>
      </div>

      {/* Label input */}
      <input
        type="text"
        placeholder="Label titik (opsional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-emerald-500"
      />

      {/* Get location button */}
      <button
        onClick={getLocation}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
      >
        {loading ? "Mengambil lokasi..." : "🎯 Ambil Koordinat"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Current result */}
      {current && (
        <div className="mt-4 bg-gray-800 border border-emerald-700 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold mb-2">📌 Koordinat Saat Ini</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Latitude</p>
              <p className="font-mono font-bold">{current.lat.toFixed(7)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Longitude</p>
              <p className="font-mono font-bold">{current.lng.toFixed(7)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Akurasi</p>
              <p className="font-mono font-bold">±{current.accuracy}m</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Waktu</p>
              <p className="font-mono text-xs">{current.timestamp}</p>
            </div>
          </div>
          <button
            onClick={saveCoord}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            💾 Simpan ke Daftar
          </button>
        </div>
      )}

      {/* Saved list */}
      {coords.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-200">
              Tersimpan ({coords.length})
            </h2>
            <button
              onClick={exportCSV}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              ⬇️ Export CSV
            </button>
          </div>
          <div className="space-y-2">
            {coords.map((c, i) => (
              <div
                key={c.id}
                className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{c.label}</p>
                  <p className="font-mono text-xs text-gray-400">
                    {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">±{c.accuracy}m · {c.timestamp}</p>
                </div>
                <button
                  onClick={() => deleteCoord(c.id)}
                  className="text-red-400 hover:text-red-300 text-xl ml-3"
                  aria-label="Hapus"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

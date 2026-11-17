import React, { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  Users,
  Eye,
  ThumbsUp,
  Compass,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  X,
  Play,
  RotateCw,
  Activity,
} from "lucide-react";
import { fetchRobloxPortfolio, RealtimeRobloxMap } from "@/services/robloxService";

interface PortfolioProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ onNotify }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedMap, setSelectedMap] = useState<RealtimeRobloxMap | null>(null);
  const [maps, setMaps] = useState<RealtimeRobloxMap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // 7 Kategori Resmi (Semua + 6 Kategori Map). 3D Model telah dihapus total.
  const categories = [
    "Semua",
    "Map Ekspedisi",
    "Map Obstacle",
    "Map Obby Tower",
    "Map Hangout",
    "Map Horor",
    "Map Club",
  ];

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await fetchRobloxPortfolio(isManualRefresh);
      setMaps(result);
      setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      if (isManualRefresh && onNotify) {
        onNotify("Data real-time map Roblox berhasil disinkronisasi!", "success");
      }
    } catch (err) {
      console.error("Gagal memuat portfolio:", err);
      if (onNotify) {
        onNotify("Gagal memperbarui data map Roblox.", "error");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onNotify]);

  // Load saat mount & refresh otomatis setiap 60 detik
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter map berdasarkan kategori terpilih
  const filteredMaps =
    selectedCategory === "Semua"
      ? maps
      : maps.filter((m) => m.category === selectedCategory);

  // Statistik Real-time yang dihitung dari data live
  const totalMaps = maps.length;
  const totalEkspedisi = maps.filter((m) => m.category === "Map Ekspedisi").length;
  const totalObstacle = maps.filter((m) => m.category === "Map Obstacle").length;
  const totalHangout = maps.filter((m) => m.category === "Map Hangout").length;
  const totalPublished = maps.filter((m) => m.status === "published").length;
  const totalActivePlayers = maps.reduce((acc, m) => acc + (m.stats.online || 0), 0);

  return (
    <div className="wrap py-10 max-w-7xl animate-fadeIn space-y-12">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>ROBLOX MAP SHOWCASE &amp; REAL-TIME API</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Sora']">
            Hasil Karya &amp; Showcase Kami
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Koleksi map Roblox resmi karya Joverse Studio yang terhubung langsung dengan sistem API Roblox untuk mendeteksi status, player aktif, dan thumbnail secara real-time.
          </p>
        </div>

        {/* Action Controls: Refresh Real-time & Verifikasi */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Perbarui data real-time dari Roblox API"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-white" : "text-zinc-400"}`} />
            <span>{isRefreshing ? "Memperbarui..." : "Sinkronisasi Live"}</span>
          </button>

          <a
            href="https://www.roblox.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <span>Verifikasi Roblox</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-800" />
          </a>
        </div>
      </div>

      {/* ── STATISTIK DINAMIS REAL-TIME PORTOFOLIO ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Total Map</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora']">{totalMaps}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Showcase Resmi</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Ekspedisi</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora']">{totalEkspedisi}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Rute Survival</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Obstacle</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora']">{totalObstacle}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Parkour &amp; Race</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Hangout</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora']">{totalHangout}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Area Santai</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Status Public</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora'] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{totalPublished}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Live di Roblox</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Active Player</div>
          <div className="text-2xl font-black text-white mt-1 font-['Sora'] flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>{totalActivePlayers}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Sedang Main</div>
        </div>
      </div>

      {/* ── FILTER KATEGORI (CHIPS) & STATUS BAR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 w-full sm:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-zinc-950 font-bold shadow-lg"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {lastUpdated && (
          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5 self-end sm:self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Terakhir sinkron: {lastUpdated}</span>
          </div>
        )}
      </div>

      {/* ── GRID MAP SHOWCASE (REAL-TIME DATA) ── */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400 tracking-wider">
            Menghubungkan ke API Roblox &amp; Mendeteksi status real-time...
          </p>
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/10 space-y-3">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Map di Kategori Ini</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Karya map untuk kategori ini sedang dalam tahap pengembangan studio kami dan akan segera dipublikasikan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaps.map((item) => {
            const isPublished = item.status === "published";
            return (
              <div
                key={item.id}
                className="group rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/25 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1"
              >
                <div>
                  {/* Map Image Thumbnail Real-Time */}
                  <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden border-b border-white/5">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback jika direct CDN Roblox terblokir CORS
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes("hero-bg.jpg")) {
                          target.src = "/hero-bg.jpg";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                    {/* Kategori Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-white border border-white/15">
                        {item.category}
                      </span>
                    </div>

                    {/* Status Badge Real-Time (Public / Private) */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                            : "bg-zinc-800/80 text-zinc-400 border border-white/10 backdrop-blur-md"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPublished ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                          }`}
                        />
                        {isPublished ? "Public" : "Private"}
                      </span>
                    </div>

                    {/* Place ID Display */}
                    <div className="absolute bottom-2 left-3">
                      <span className="text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                        ID: {item.placeId}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors font-['Sora'] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Live Stats Row dari API Roblox */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                      <div className="text-center p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-xs font-bold text-white font-mono flex items-center justify-center gap-1">
                          <Users className="w-3 h-3 text-zinc-400" />
                          <span>{item.stats.online}</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">Online</div>
                      </div>

                      <div className="text-center p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-xs font-bold text-white font-mono flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3 text-zinc-400" />
                          <span>{item.stats.visits}</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">Visits</div>
                      </div>

                      <div className="text-center p-2 rounded-lg bg-black/40 border border-white/5">
                        <div className="text-xs font-bold text-white font-mono flex items-center justify-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-zinc-400" />
                          <span>{item.stats.likePercent}%</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">Like</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMap(item)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
                  >
                    Lihat Detail
                  </button>

                  {isPublished ? (
                    <a
                      href={item.robloxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-b from-white to-zinc-300 hover:to-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Kunjungi Map</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-500 bg-zinc-800/50 border border-white/5 cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Tahap Dev</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETAIL PROJECT (Dengan CTA Resmi) ── */}
      {selectedMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-white/15 p-6 space-y-5 shadow-2xl relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedMap(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                  {selectedMap.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  selectedMap.status === "published"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-white/10"
                }`}>
                  {selectedMap.status === "published" ? "Public (Bisa Dimainkan Langsung)" : "Private (Tahap Development)"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2 font-['Sora']">
                {selectedMap.title}
              </h2>
            </div>

            {/* Image Preview Real-Time */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 relative">
              <img
                src={selectedMap.thumbnailUrl}
                alt={selectedMap.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("hero-bg.jpg")) {
                    target.src = "/hero-bg.jpg";
                  }
                }}
              />
            </div>

            {/* Live Stats di Modal */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Active Online</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMap.stats.online} Pemain</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Total Visits</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMap.stats.visits}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Like Rating</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMap.stats.likePercent}%</div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Deskripsi Project:</h4>
              <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                {selectedMap.description}
              </p>
            </div>

            {/* CALL TO ACTION RESMI */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-white" />
                <span>Eksplorasi Langsung di Roblox</span>
              </div>
              <p className="text-xs text-zinc-300 italic">
                &ldquo;Coba langsung hasil karya saya di Roblox dan rasakan pengalaman map yang telah kami kembangkan.&rdquo;
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMap(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Tutup
              </button>

              <a
                href={selectedMap.robloxUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-b from-white to-zinc-300 hover:to-zinc-200 transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
              >
                <span>Buka Map di Roblox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

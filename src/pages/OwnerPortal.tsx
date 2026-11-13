import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Crown,
  Settings,
  Image,
  Globe,
  Music,
  LayoutGrid,
  Users,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  getSiteConfig,
  saveSiteConfig,
  SiteConfig,
  PortfolioMapItem,
} from "@/config/siteConfig";
import { UserFeedback } from "@/components/home/FeedbackAndLikeSection";

interface OwnerPortalProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({ onNotify }) => {
  const { user, openStaffLogin, updateStaffCredentials } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());
  const [activeTab, setActiveTab] = useState<
    "branding" | "website" | "audio" | "portfolio" | "feedback" | "security"
  >("branding");

  // State untuk form tambah map baru
  const [newMap, setNewMap] = useState<Partial<PortfolioMapItem>>({
    title: "",
    category: "Map Ekspedisi",
    robloxUrl: "",
    placeId: "",
    description: "",
    thumbnailUrl: "/hero-bg.jpg",
    status: "published",
    stats: { online: 0, visits: "0", likePercent: 95 },
  });

  // State untuk form ganti password staf
  const [newOwnerPass, setNewOwnerPass] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  // Audio Preview State
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  // Feedbacks & Likes State
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => {
    try {
      const raw = localStorage.getItem("joverse_user_feedbacks_v3");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const likesCount = (() => {
    try {
      const raw = localStorage.getItem("joverse_user_likes_v3");
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  })();

  // Keamanan: Hanya Owner & Admin yang bisa membuka portal
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <div className="wrap py-20 max-w-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 mx-auto shadow-2xl">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white font-['Sora']">
            Akses Khusus Owner &amp; Admin
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Halaman ini diproteksi untuk pengelolaan situs terpusat JOVERSE LIBRARY. Silakan login menggunakan akun staf resmi Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={openStaffLogin}
          className="btn-white px-6 py-3 rounded-xl text-xs font-bold text-zinc-950 inline-flex items-center gap-2 shadow-lg"
        >
          <Lock className="w-4 h-4" />
          <span>Buka Login Staf</span>
        </button>
      </div>
    );
  }

  const isOwner = user.role === "owner";

  const handleSaveConfig = () => {
    saveSiteConfig(config);
    if (onNotify) {
      onNotify("Semua pengaturan berhasil disimpan dan diterapkan!", "success");
    }
  };

  const handleAddMap = () => {
    if (!newMap.title || !newMap.robloxUrl) {
      if (onNotify) onNotify("Judul map dan URL Roblox wajib diisi!", "error");
      return;
    }

    const placeMatch = (newMap.robloxUrl || "").match(/games\/(\d+)/);
    const placeId = placeMatch ? placeMatch[1] : `p_${Date.now()}`;

    const created: PortfolioMapItem = {
      id: `map_${Date.now()}`,
      placeId: newMap.placeId || placeId,
      title: newMap.title || "Map Roblox",
      category: newMap.category as any,
      description: newMap.description || "Deskripsi map Roblox resmi.",
      robloxUrl: newMap.robloxUrl || "https://www.roblox.com",
      thumbnailUrl: newMap.thumbnailUrl || "/hero-bg.jpg",
      status: (newMap.status as any) || "published",
      stats: newMap.stats || { online: 50, visits: "10K", likePercent: 95 },
    };

    const updated = {
      ...config,
      portfolioMaps: [created, ...config.portfolioMaps],
    };
    setConfig(updated);
    saveSiteConfig(updated);
    setNewMap({
      title: "",
      category: "Map Ekspedisi",
      robloxUrl: "",
      placeId: "",
      description: "",
      thumbnailUrl: "/hero-bg.jpg",
      status: "published",
      stats: { online: 0, visits: "0", likePercent: 95 },
    });
    if (onNotify) onNotify(`Map "${created.title}" berhasil ditambahkan!`, "success");
  };

  const handleDeleteMap = (id: string) => {
    const updated = {
      ...config,
      portfolioMaps: config.portfolioMaps.filter((m) => m.id !== id),
    };
    setConfig(updated);
    saveSiteConfig(updated);
    if (onNotify) onNotify("Map berhasil dihapus dari showcase!", "info");
  };

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter((f) => f.id !== id);
    setFeedbacks(updated);
    localStorage.setItem("joverse_user_feedbacks_v3", JSON.stringify(updated));
    if (onNotify) onNotify("Feedback berhasil dimoderasi / dihapus!", "info");
  };

  return (
    <div className="wrap py-10 max-w-7xl animate-fadeIn space-y-8">
      {/* ── HEADER PORTAL ── */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {isOwner ? (
              <Crown className="w-6 h-6 text-zinc-200" />
            ) : (
              <Shield className="w-6 h-6 text-zinc-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-['Sora']">
                Portal Manajemen Terpusat
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                {isOwner ? "OWNER ACCESS" : "ADMIN ACCESS"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kelola branding, demo audio, portofolio map, payment link, dan moderasi tanpa perlu mengubah source code.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          className="btn-white px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Perubahan</span>
        </button>
      </div>

      {/* ── TABS NAVIGATION PORTAL ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: "branding", label: "A. Branding", icon: <Image className="w-3.5 h-3.5" /> },
          { id: "website", label: "B. Info Web", icon: <Globe className="w-3.5 h-3.5" /> },
          { id: "audio", label: "C. Audio Demo", icon: <Music className="w-3.5 h-3.5" /> },
          { id: "portfolio", label: "D. Portofolio Map", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
          { id: "feedback", label: "E. Feedback & Like", icon: <Users className="w-3.5 h-3.5" /> },
          { id: "security", label: "Keamanan Akun", icon: <Lock className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-zinc-950 font-bold shadow-md"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-6 shadow-2xl">
        {/* A. BRANDING */}
        {activeTab === "branding" && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Pengaturan Identitas Visual &amp; Logo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Path / URL Logo Utama (512×512 px):</label>
                <input
                  type="text"
                  value={config.branding.logoUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, logoUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Path / URL Hero Background (1920×1080 px):</label>
                <input
                  type="text"
                  value={config.branding.heroBgUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, heroBgUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Tagline Singkat Brand:</label>
                <input
                  type="text"
                  value={config.branding.siteTagline}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, siteTagline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* B. WEBSITE INFO */}
        {activeTab === "website" && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Informasi Situs &amp; Komunitas
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Link Undangan Discord Resmi:</label>
                <input
                  type="url"
                  value={config.branding.discordInvite}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, discordInvite: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Headline Utama Beranda:</label>
                <input
                  type="text"
                  value={config.branding.headline}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, headline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Subheadline / Deskripsi Beranda:</label>
                <textarea
                  rows={3}
                  value={config.branding.subheadline}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, subheadline: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* C. AUDIO DEMO */}
        {activeTab === "audio" && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Pengaturan Audio Demo Resmi (DJ NEGORO ANGIN)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Judul Lagu Demo:</label>
                <input
                  type="text"
                  value={config.audioDemo.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      audioDemo: { ...config.audioDemo, title: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Path File MP3 Lokal / URL Audio:</label>
                <input
                  type="text"
                  value={config.audioDemo.fileUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      audioDemo: { ...config.audioDemo, fileUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Link YouTube Referensi:</label>
                <input
                  type="url"
                  value={config.audioDemo.youtubeUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      audioDemo: { ...config.audioDemo, youtubeUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              {/* Preview Audio Player Sebelum Publikasi */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{config.audioDemo.title}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{config.audioDemo.fileUrl}</div>
                </div>

                <audio
                  ref={audioPreviewRef}
                  src={config.audioDemo.fileUrl}
                  onEnded={() => setAudioPreviewPlaying(false)}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!audioPreviewRef.current) return;
                    if (audioPreviewPlaying) {
                      audioPreviewRef.current.pause();
                      setAudioPreviewPlaying(false);
                    } else {
                      audioPreviewRef.current.play();
                      setAudioPreviewPlaying(true);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {audioPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{audioPreviewPlaying ? "Pause" : "Test Play Audio"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* D. PORTOFOLIO MAP */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Kelola Showcase Map Roblox
            </h3>

            {/* Form Tambah Map Baru */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Tambah Map Baru
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nama Map:</label>
                  <input
                    type="text"
                    value={newMap.title}
                    onChange={(e) => setNewMap({ ...newMap, title: e.target.value })}
                    placeholder="Contoh: Petanahan Expedition"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Kategori Map:</label>
                  <select
                    value={newMap.category}
                    onChange={(e) => setNewMap({ ...newMap, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="Map Ekspedisi">Map Ekspedisi</option>
                    <option value="Map Obstacle">Map Obstacle</option>
                    <option value="Map Obby Tower">Map Obby Tower</option>
                    <option value="Map Hangout">Map Hangout</option>
                    <option value="Map Horor">Map Horor</option>
                    <option value="Map Club">Map Club</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">URL Link Map Roblox:</label>
                  <input
                    type="url"
                    value={newMap.robloxUrl}
                    onChange={(e) => setNewMap({ ...newMap, robloxUrl: e.target.value })}
                    placeholder="https://www.roblox.com/games/..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Status Publikasi:</label>
                  <select
                    value={newMap.status}
                    onChange={(e) => setNewMap({ ...newMap, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                  >
                    <option value="published">Published (Dapat Dimainkan)</option>
                    <option value="private">Private (Tahap Uji Coba)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={newMap.description}
                  onChange={(e) => setNewMap({ ...newMap, description: e.target.value })}
                  placeholder="Ceritakan fitur map dan pengalaman pemain..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMap}
                className="btn-white px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Portofolio</span>
              </button>
            </div>

            {/* List Map Aktif */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Daftar Map Aktif Saat Ini ({config.portfolioMaps.length})
              </h4>
              <div className="space-y-2.5">
                {config.portfolioMaps.map((map) => (
                  <div
                    key={map.id}
                    className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{map.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
                          {map.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {map.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{map.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={map.robloxUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteMap(map.id)}
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* E. FEEDBACK & LIKE */}
        {activeTab === "feedback" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-['Sora']">
                Moderasi Komentar &amp; Total Likes ({likesCount} Like)
              </h3>
            </div>

            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-xs text-zinc-400">Belum ada feedback dari pengguna.</p>
              ) : (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{fb.username}</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          ★ {fb.rating} / 5
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{fb.date}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">"{fb.comment}"</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                      title="Hapus review spam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* KEAMANAN AKUN STAF */}
        {activeTab === "security" && (
          <div className="space-y-5 max-w-md">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Ganti Kredensial Password Staf
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 block mb-1">Password Baru Owner (Joverse Studio):</label>
                <input
                  type="password"
                  value={newOwnerPass}
                  onChange={(e) => setNewOwnerPass(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Password Baru Admin (Admin Joverse):</label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const success = updateStaffCredentials(newOwnerPass, newAdminPass);
                  if (success) {
                    if (onNotify) onNotify("Kredensial staf berhasil diperbarui!", "success");
                    setNewOwnerPass("");
                    setNewAdminPass("");
                  } else {
                    if (onNotify) onNotify("Gagal memperbarui kredensial staf!", "error");
                  }
                }}
                className="btn-white px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Kredensial Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

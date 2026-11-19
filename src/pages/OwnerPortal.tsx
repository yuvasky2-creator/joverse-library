import React, { useState, useEffect, useRef } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
  Shield,
  Crown,
  Settings,
  Image as ImageIcon,
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
  TrendingUp,
  Activity,
  Zap,
  Sliders,
  Compass,
  Code,
  QrCode,
  Copy,
  Tag,
  CheckCheck,
  Eye,
  RotateCcw,
  Images,
  AlertCircle,
  FileText,
  Volume2,
} from "lucide-react";
import {
  getSiteConfig,
  saveSiteConfig,
  SiteConfig,
  PortfolioMapItem,
} from "@/config/siteConfig";
import { UserFeedback } from "@/components/home/FeedbackAndLikeSection";
import { GlobalStatsService, LiveGlobalStats } from "@/services/analytics/GlobalStatsService";

interface OwnerPortalProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({ onNotify }) => {
  const { user, openStaffLogin, updateStaffCredentials } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());

  // Active Admin Tabs
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "tools"
    | "gallery"
    | "pricing"
    | "payment"
    | "audio"
    | "portfolio"
    | "website"
    | "feedback"
    | "security"
  >("overview");

  // Real-time Global Stats
  const [stats, setStats] = useState<LiveGlobalStats>({
    totalRegisteredUsers: 142,
    uniqueVisitors: 1289,
    totalVisits: 3840,
    activeUsers: 8,
    totalToolUsage: 1475,
    toolsBreakdown: { bypass: 680, editor: 420, skybox: 215, obfuscator: 160 },
    dailyUsage: [],
    recentEvents: [],
  });

  // Tools Active Status State
  const [toolsState, setToolsState] = useState(() => {
    try {
      const stored = localStorage.getItem("joverse_admin_tools_status");
      return stored
        ? JSON.parse(stored)
        : {
            bypass: true,
            editor: true,
            skybox: true,
            obfuscator: true,
            gallery: true,
            portfolio: true,
          };
    } catch {
      return {
        bypass: true,
        editor: true,
        skybox: true,
        obfuscator: true,
        gallery: true,
        portfolio: true,
      };
    }
  });

  // Website Config extra: Announcement banner
  const [announcement, setAnnouncement] = useState(() => {
    try {
      const raw = localStorage.getItem("joverse_announcement_banner");
      return raw
        ? JSON.parse(raw)
        : { enabled: true, text: "Promo Spesial: Diskon Layanan Map Studio Hingga 20% & Unlimited Bypass Audio Aktif!" };
    } catch {
      return { enabled: true, text: "Promo Spesial: Diskon Layanan Map Studio Hingga 20% & Unlimited Bypass Audio Aktif!" };
    }
  });

  // Gallery Albums State
  const [albums, setAlbums] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("joverse_user_uploaded_albums");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Registered Users list (managed)
  const [userList, setUserList] = useState([
    { id: "usr-1", username: "Alex_RobloxDev", role: "member" as UserRole, quota: "10/10", lastActive: "10 mnt lalu" },
    { id: "usr-2", username: "DimasStudio", role: "member" as UserRole, quota: "Unlimited", lastActive: "25 mnt lalu" },
    { id: "usr-3", username: "Rian_Creative", role: "member" as UserRole, quota: "Unlimited", lastActive: "1 jam lalu" },
    { id: "usr-4", username: "Admin_Joverse", role: "admin" as UserRole, quota: "Unlimited", lastActive: "Online" },
    { id: "usr-5", username: "JoverseStudio_Owner", role: "owner" as UserRole, quota: "Unlimited", lastActive: "Online" },
  ]);

  // Audio Previews State
  const [sampleTracks, setSampleTracks] = useState([
    { id: "sample-1", title: "DJ I WILL BE FINE", file: "/samples/dj-i-will-be-fine.mp3", desc: "TikTok Jedag-Jedug" },
    { id: "sample-2", title: "DJ NEGORO ANGIN", file: "/samples/dj-negoro-angin.mp3", desc: "Koplo Bass Boost Viral" },
    { id: "sample-3", title: "MERRY CHRISTMAS", file: "/samples/merry-christmas.mp3", desc: "Holiday EDM Remix Edit" },
  ]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

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

  // Password Staf
  const [newOwnerPass, setNewOwnerPass] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => {
    try {
      const raw = localStorage.getItem("joverse_user_feedbacks_v3");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Fetch live stats & gallery albums
  useEffect(() => {
    const fetchStats = async () => {
      const data = await GlobalStatsService.getLiveStats();
      setStats(data);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);

    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.albums)) {
            setAlbums(json.albums);
          }
        }
      } catch {}
    };
    fetchGallery();

    return () => clearInterval(interval);
  }, []);

  // Protected Gate: Hanya Owner & Admin
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return (
      <div className="wrap py-20 max-w-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 mx-auto shadow-2xl">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white font-['Sora']">
            Akses Terproteksi &middot; Portal Staf Resmi
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Halaman ini khusus untuk manajemen sistem JOVERSE LIBRARY. Silakan login sebagai Owner atau Admin resmi.
          </p>
        </div>
        <button
          type="button"
          onClick={openStaffLogin}
          className="px-6 py-3 rounded-xl bg-white text-zinc-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Buka Login Staf</span>
        </button>
      </div>
    );
  }

  const isOwner = user.role === "owner";

  const handleSaveAll = () => {
    saveSiteConfig(config);
    localStorage.setItem("joverse_admin_tools_status", JSON.stringify(toolsState));
    localStorage.setItem("joverse_announcement_banner", JSON.stringify(announcement));
    onNotify?.("Semua konfigurasi berhasil disimpan & diterapkan secara langsung!", "success");
  };

  const toggleTool = (toolKey: string) => {
    setToolsState((prev: any) => {
      const next = { ...prev, [toolKey]: !prev[toolKey] };
      localStorage.setItem("joverse_admin_tools_status", JSON.stringify(next));
      return next;
    });
    onNotify?.(`Status tool ${toolKey} berhasil diubah!`, "info");
  };

  const handleUserRoleChange = (userId: string, newRole: UserRole) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    onNotify?.(`Role user ${userId} berhasil diubah menjadi ${newRole}!`, "success");
  };

  const handleDeleteAlbum = async (albumId: string) => {
    setAlbums((prev) => prev.filter((a) => a.id !== albumId));
    try {
      await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_album", albumId }),
      });
      onNotify?.("Showcase album berhasil dihapus dari galeri!", "success");
    } catch {
      onNotify?.("Album dihapus dari memori lokal.", "info");
    }
  };

  const handleAddMap = () => {
    if (!newMap.title || !newMap.robloxUrl) {
      onNotify?.("Judul map dan URL Roblox wajib diisi!", "error");
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
    onNotify?.(`Map "${created.title}" berhasil ditambahkan ke portofolio!`, "success");
  };

  const handleDeleteMap = (id: string) => {
    const updated = {
      ...config,
      portfolioMaps: config.portfolioMaps.filter((m) => m.id !== id),
    };
    setConfig(updated);
    saveSiteConfig(updated);
    onNotify?.("Map berhasil dihapus dari showcase portofolio!", "info");
  };

  const handleDeleteFeedback = (id: string) => {
    const updated = feedbacks.filter((f) => f.id !== id);
    setFeedbacks(updated);
    localStorage.setItem("joverse_user_feedbacks_v3", JSON.stringify(updated));
    onNotify?.("Feedback berhasil dimoderasi / dihapus!", "info");
  };

  const handlePlaySample = (track: { id: string; file: string }) => {
    if (playingTrackId === track.id) {
      audioPreviewRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = track.file;
        audioPreviewRef.current.play();
        setPlayingTrackId(track.id);
      }
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "users", label: "Users", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "tools", label: "Tools", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "gallery", label: "Gallery", icon: <Images className="w-3.5 h-3.5" /> },
    { id: "pricing", label: "Pricing", icon: <Tag className="w-3.5 h-3.5" /> },
    { id: "payment", label: "QRIS", icon: <QrCode className="w-3.5 h-3.5" /> },
    { id: "audio", label: "Audio Previews", icon: <Music className="w-3.5 h-3.5" /> },
    { id: "portfolio", label: "Portofolio", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "website", label: "Web Config", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "feedback", label: "Reviews", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "security", label: "Security", icon: <Lock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="wrap py-10 max-w-7xl animate-fadeIn space-y-8 text-left">
      <audio
        ref={audioPreviewRef}
        onEnded={() => setPlayingTrackId(null)}
        onError={() => {
          setPlayingTrackId(null);
          onNotify?.("File audio tidak dapat diputar atau sedang dimuat.", "error");
        }}
      />

      {/* ── HEADER PORTAL ── */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white">
            {isOwner ? <Crown className="w-6 h-6 text-white" /> : <Shield className="w-6 h-6 text-zinc-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Sora']">
                Admin &amp; Owner Control Panel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                {isOwner ? "OWNER ACCESS" : "ADMIN ACCESS"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pusat kendali website, user management, status tool, pricing, QRIS Gopay, audio sampel, dan moderasi real-time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer shrink-0 font-mono"
        >
          <Save className="w-4 h-4 text-zinc-950" />
          <span>Simpan Seluruh Perubahan</span>
        </button>
      </div>

      {/* ── TAB NAVIGATION BAR ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-zinc-950 font-bold shadow-md border border-white"
                : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT CONTAINERS ── */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-2xl">
        {/* 1. OVERVIEW DASHBOARD */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white font-['Sora']">
                  Ringkasan Sistem &amp; Metrik Real-Time
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aktivitas terkini pengguna terhubung langsung dengan backend serverless.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">User Terdaftar</span>
                <div className="text-2xl font-black text-white font-mono">{stats.totalRegisteredUsers}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Pengunjung Unik</span>
                <div className="text-2xl font-black text-white font-mono">{stats.uniqueVisitors}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Total Eksekusi Tools</span>
                <div className="text-2xl font-black text-white font-mono">{stats.totalToolUsage}</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">User Aktif Saat Ini</span>
                <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                  <span>{stats.activeUsers}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Recent audit log */}
            <div className="space-y-3 pt-3">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Log Aktivitas Pengguna Terakhir
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {stats.recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-white font-bold">{ev.event}</span>
                      <span className="text-zinc-500 text-[10px] ml-2">oleh {ev.user}</span>
                    </div>
                    <span className="text-zinc-400 text-[10px]">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">
                Daftar &amp; Manajemen Pengguna
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ubah peran (role) pengguna secara dinamis antara User, Admin, dan Owner.
              </p>
            </div>

            <div className="space-y-2.5">
              {userList.map((usr) => (
                <div
                  key={usr.id}
                  className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                      {usr.username.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{usr.username}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            usr.role === "owner"
                              ? "bg-white text-zinc-950"
                              : usr.role === "admin"
                              ? "bg-zinc-800 text-white border border-white/20"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          {usr.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Kuota: {usr.quota} &middot; Aktivitas: {usr.lastActive}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-400 font-mono">Ubah Role:</label>
                    <select
                      value={usr.role}
                      onChange={(e) => handleUserRoleChange(usr.id, e.target.value as UserRole)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="member">User Biasa (Member)</option>
                      <option value="admin">Admin Staf</option>
                      <option value="owner">Owner Studio</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TOOLS MANAGEMENT */}
        {activeTab === "tools" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">
                Status &amp; Pengaturan Tools Suite
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Aktifkan atau nonaktifkan fitur tools secara global jika sedang pemeliharaan (maintenance).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "bypass", name: "Bypass Transcoder", desc: "Algoritma Semitone & Speed Multiplier (2.3x)", icon: <Zap className="w-4 h-4" /> },
                { key: "editor", name: "Manual 9-Band EQ", desc: "Realtime WebAudio DSP Equalizer & DJ Filter", icon: <Sliders className="w-4 h-4" /> },
                { key: "skybox", name: "Skybox 360° Converter", desc: "Panorama equirectangular ke 6 sisi cubemap", icon: <Compass className="w-4 h-4" /> },
                { key: "obfuscator", name: "Lua Obfuscator", desc: "Enkripsi script Roblox Luau bytecode", icon: <Code className="w-4 h-4" /> },
                { key: "gallery", name: "Showcase Gallery", desc: "Unggah 1-20 foto dokumentasi map studio", icon: <Images className="w-4 h-4" /> },
                { key: "portfolio", name: "Map Portofolio", desc: "Live Roblox API status & thumbnail loader", icon: <LayoutGrid className="w-4 h-4" /> },
              ].map((tool) => {
                const isEnabled = toolsState[tool.key] !== false;
                return (
                  <div
                    key={tool.key}
                    className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        {tool.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{tool.name}</div>
                        <div className="text-[10px] text-zinc-400">{tool.desc}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTool(tool.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        isEnabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {isEnabled ? "AKTIF" : "DISABLED"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. GALLERY MANAGEMENT */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-['Sora']">
                  Manajemen Showcase Galeri ({albums.length} Album)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Moderasi dan hapus showcase foto map yang diunggah dari web secara langsung.
                </p>
              </div>
            </div>

            {albums.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono border border-dashed border-white/10 rounded-xl">
                Belum ada album showcase tersimpan di database galeri.
              </div>
            ) : (
              <div className="space-y-3">
                {albums.map((alb) => (
                  <div
                    key={alb.id}
                    className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                        {alb.images && alb.images[0]?.url ? (
                          <img src={alb.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate font-['Sora']">{alb.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">
                          {alb.category} &middot; {alb.images?.length || 0} Foto &middot; {alb.likesCount || 0} Likes
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAlbum(alb.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer border border-rose-500/20"
                      title="Hapus Showcase Album Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. PRICING MANAGEMENT */}
        {activeTab === "pricing" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">
                Pengaturan Harga Paket &amp; Layanan
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ubah nominal harga dan payment link Paywuz untuk masing-masing paket langganan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(config.paymentPlans).map(([key, plan]) => (
                <div key={key} className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-white font-mono uppercase">{plan.name} PLAN</span>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Harga Ditampilkan:</label>
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => {
                        const next = { ...config.paymentPlans, [key]: { ...plan, price: e.target.value } };
                        setConfig({ ...config, paymentPlans: next as any });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Payment URL (Paywuz):</label>
                    <input
                      type="text"
                      value={plan.paymentUrl}
                      onChange={(e) => {
                        const next = { ...config.paymentPlans, [key]: { ...plan, paymentUrl: e.target.value } };
                        setConfig({ ...config, paymentPlans: next as any });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PAYMENT / QRIS MANAGEMENT */}
        {activeTab === "payment" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">
                Pengaturan Gopay Merchant QRIS
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Detail QRIS resmi yang ditampilkan pada halaman Pricing untuk transaksi transfer langsung.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 bg-white p-1 rounded-lg shrink-0">
                  <img src="/images/qris-joverse.jpg" alt="QRIS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">JOVERSE STUDIO DEVELOPMEN</h4>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">NMID: ID1025427438631</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">Terminal: A01 &middot; Cetak 93600914</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">File Path Gambar QRIS:</label>
                <input
                  type="text"
                  readOnly
                  value="/images/qris-joverse.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>

              <div className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                QRIS ini aktif menerima pembayaran dari GoPay, BCA Mobile, Livin' Mandiri, BRImo, BNI, DANA, OVO, ShopeePay, dan seluruh perbankan QRIS di Indonesia.
              </div>
            </div>
          </div>
        )}

        {/* 7. AUDIO PREVIEWS MANAGEMENT */}
        {activeTab === "audio" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">
                Pengaturan 3 Audio Sampel Resmi
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kelola 3 audio demo untuk pengujian Bypass Transcoder &amp; Equalizer.
              </p>
            </div>

            <div className="space-y-3">
              {sampleTracks.map((track) => (
                <div
                  key={track.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-bold text-white font-mono">{track.title}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{track.file} &middot; {track.desc}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlaySample(track)}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 transition-all"
                  >
                    {playingTrackId === track.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{playingTrackId === track.id ? "Stop" : "Test Play"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. PORTOFOLIO MAPS */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Kelola Showcase Map Roblox
            </h3>

            {/* Form Tambah Map Baru */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4">
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
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Kategori Map:</label>
                  <select
                    value={newMap.category}
                    onChange={(e) => setNewMap({ ...newMap, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Status Publikasi:</label>
                  <select
                    value={newMap.status}
                    onChange={(e) => setNewMap({ ...newMap, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMap}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
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
                    className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{map.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
                          {map.category}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {map.status}
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
                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
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

        {/* 9. WEBSITE & BRANDING */}
        {activeTab === "website" && (
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Pengaturan Branding &amp; Banner Pengumuman
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              {/* Announcement Banner Toggle */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">Tampilkan Banner Pengumuman Web:</span>
                  <input
                    type="checkbox"
                    checked={announcement.enabled}
                    onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </div>
                {announcement.enabled && (
                  <input
                    type="text"
                    value={announcement.text}
                    onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                    placeholder="Teks pengumuman beranda..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* 10. REVIEWS & FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white font-['Sora']">
              Moderasi Ulasan &amp; Komentar Pengguna
            </h3>

            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-xs text-zinc-400">Belum ada review dari pengguna.</p>
              ) : (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{fb.username}</span>
                        <span className="text-xs text-zinc-400 font-mono">★ {fb.rating} / 5</span>
                        <span className="text-[10px] font-mono text-zinc-500">{fb.date}</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">"{fb.comment}"</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
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

        {/* 11. SECURITY & PASSWORDS */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 block mb-1">Password Baru Admin (Admin Joverse):</label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const success = updateStaffCredentials(newOwnerPass, newAdminPass);
                  if (success) {
                    onNotify?.("Kredensial staf berhasil diperbarui!", "success");
                    setNewOwnerPass("");
                    setNewAdminPass("");
                  } else {
                    onNotify?.("Gagal memperbarui kredensial staf!", "error");
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                <span>Simpan Kredensial Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

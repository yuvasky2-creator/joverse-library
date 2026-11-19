import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Images,
  Heart,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Filter,
  Plus,
  Trash2,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  category: "Map Ekspedisi" | "Map Obstacle" | "Map Hangout" | "Lighting Showcase" | "Realistic Terrain";
  description: string;
  author: string;
  date: string;
  likesCount: number;
  likedUserIds: string[];
  images: GalleryImage[];
}

interface GalleryProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onNotify }) => {
  const { user, openAuthModal } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";

  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lightbox Modal State
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Upload Modal State (Owner/Admin)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<GalleryAlbum["category"]>("Map Obstacle");
  const [newDescription, setNewDescription] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<{ url: string; caption?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch albums & real-time polling every 5s
  useEffect(() => {
    let isCancelled = false;

    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery", {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.albums)) {
            setAlbums(data.albums);
          }
        }
      } catch (err) {
        console.warn("Gallery fetch warning:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchGallery();
    const timer = setInterval(fetchGallery, 5000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeAlbum) return;
      if (e.key === "Escape") {
        setActiveAlbum(null);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : activeAlbum.images.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev < activeAlbum.images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAlbum]);

  // Handle Like Toggle Real-Time
  const handleToggleLike = async (albumId: string) => {
    const currentUserId = user?.username || "guest_" + (localStorage.getItem("joverse_guest_id") || "visitor");
    if (!localStorage.getItem("joverse_guest_id")) {
      localStorage.setItem("joverse_guest_id", Math.random().toString(36).substring(2, 8));
    }

    // Optimistic UI update
    setAlbums((prev) =>
      prev.map((alb) => {
        if (alb.id !== albumId) return alb;
        const hasLiked = alb.likedUserIds.includes(currentUserId);
        return {
          ...alb,
          likesCount: hasLiked ? Math.max(0, alb.likesCount - 1) : alb.likesCount + 1,
          likedUserIds: hasLiked
            ? alb.likedUserIds.filter((id) => id !== currentUserId)
            : [...alb.likedUserIds, currentUserId],
        };
      })
    );

    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_like",
          albumId,
          userId: currentUserId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums((prev) =>
          prev.map((alb) => (alb.id === albumId ? { ...alb, likesCount: data.likesCount } : alb))
        );
      }
    } catch (err) {
      console.warn("Like sync warning:", err);
    }
  };

  // Handle File Selection (1-20 Images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const remainingSlots = 20 - uploadedImages.length;
    if (remainingSlots <= 0) {
      onNotify?.("Maksimal 20 gambar per showcase album telah tercapai!", "error");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => {
            if (prev.length >= 20) return prev;
            return [...prev, { url: event.target!.result as string, caption: file.name.replace(/\.[^/.]+$/, "") }];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remainingSlots) {
      onNotify?.(`Hanya ${remainingSlots} gambar yang dapat ditambahkan (batas 20 gambar).`, "info");
    }
  };

  // Submit Album Baru
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwnerOrAdmin) {
      onNotify?.("Hanya Owner & Admin yang memiliki izin upload galeri showcase!", "error");
      return;
    }

    if (!newTitle.trim()) {
      onNotify?.("Harap isi judul showcase album!", "error");
      return;
    }

    if (uploadedImages.length === 0) {
      onNotify?.("Harap pilih minimal 1 foto showcase (maksimal 20 foto)!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_album",
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
          author: `${user?.username || "Owner"} (${user?.role === "owner" ? "Owner" : "Admin"})`,
          images: uploadedImages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.album) {
          setAlbums((prev) => [data.album, ...prev]);
        }
        onNotify?.("Showcase album berhasil dipublikasikan secara real-time!", "success");
        setIsUploadModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setUploadedImages([]);
      } else {
        const errData = await res.json();
        onNotify?.(errData.error || "Gagal mempublikasikan album.", "error");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      onNotify?.("Terjadi kesalahan jaringan saat upload.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "Semua",
    "Map Ekspedisi",
    "Map Obstacle",
    "Map Hangout",
    "Lighting Showcase",
    "Realistic Terrain",
  ];

  const filteredAlbums =
    selectedCategory === "Semua"
      ? albums
      : albums.filter((alb) => alb.category === selectedCategory);

  const currentUserId = user?.username || "guest_" + (localStorage.getItem("joverse_guest_id") || "visitor");

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono mb-3">
            <Images className="w-3.5 h-3.5 text-white" />
            <span>ROBLOX BUILD SHOWCASE &middot; LIVE GALLERY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Sora']">
            Joverse Build Gallery
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Kumpulan dokumentasi visual &amp; screenshot hasil map yang telah kami bangun di Roblox Studio. Setiap album memuat 1 hingga 20 gambar visual resolusi tinggi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOwnerOrAdmin ? (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 font-mono"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Upload Showcase Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                openAuthModal("login");
                onNotify?.("Masuk sebagai Owner atau Admin untuk mengunggah showcase.", "info");
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span>Login Staff/Owner</span>
            </button>
          )}
        </div>
      </div>

      {/* ── CATEGORY FILTER PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-1 mr-2" />
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? "bg-white text-zinc-950 shadow-md border border-white"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── ALBUMS GRID (KOTAK-KOTAK PORTOFOLIO) ── */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 text-sm font-mono animate-pulse">
          Memuat showcase galeri real-time...
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950/40 border border-white/5 text-zinc-500 text-sm">
          Belum ada showcase album untuk kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map((album) => {
            const hasLiked = album.likedUserIds.includes(currentUserId);
            const coverImage = album.images[0]?.url || "";
            const previewThumbnails = album.images.slice(1, 4);
            const extraCount = Math.max(0, album.images.length - 4);

            return (
              <div
                key={album.id}
                className="group rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-white/25 transition-all overflow-hidden flex flex-col shadow-xl hover:shadow-2xl"
              >
                {/* Main Cover Image Container */}
                <div
                  className="relative aspect-video w-full bg-zinc-900 cursor-pointer overflow-hidden"
                  onClick={() => {
                    setActiveAlbum(album);
                    setActiveImageIndex(0);
                  }}
                >
                  <img
                    src={coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Photo Count Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold text-white flex items-center gap-1.5 shadow">
                    <Images className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{album.images.length} Gambar</span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow uppercase font-mono">
                    {album.category}
                  </div>

                  {/* Hover Overlay Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                    <span className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-xl">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Buka Showcase</span>
                    </span>
                  </div>
                </div>

                {/* Mini Preview Thumbnails (Up to 3 thumbnails + Extra count) */}
                {album.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-zinc-900/60 border-b border-white/5">
                    {previewThumbnails.map((img, idx) => (
                      <div
                        key={img.id}
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-white/5"
                        onClick={() => {
                          setActiveAlbum(album);
                          setActiveImageIndex(idx + 1);
                        }}
                      >
                        <img
                          src={img.url}
                          alt="preview"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div
                        className="aspect-video rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white cursor-pointer transition-all"
                        onClick={() => {
                          setActiveAlbum(album);
                          setActiveImageIndex(3);
                        }}
                      >
                        +{extraCount}
                      </div>
                    )}
                  </div>
                )}

                {/* Album Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1 font-['Sora']">
                      {album.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  </div>

                  {/* Footer & Real-Time Like Button */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                      <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{album.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Like Action */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(album.id)}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                          hasLiked
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                          } transition-transform`}
                        />
                        <span>{album.likesCount}</span>
                      </button>

                      {/* View All Photos Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAlbum(album);
                          setActiveImageIndex(0);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 cursor-pointer transition-all"
                        title="Lihat Semua Foto"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FULLSCREEN LIGHTBOX / CAROUSEL MODAL ── */}
      {activeAlbum && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setActiveAlbum(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-zinc-950 border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-5 py-3.5 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10 border border-white/15">
                  {activeImageIndex + 1} / {activeAlbum.images.length}
                </span>
                <h4 className="text-sm font-bold text-white truncate font-['Sora']">
                  {activeAlbum.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLike(activeAlbum.id)}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                    activeAlbum.likedUserIds.includes(currentUserId)
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-white/5 text-zinc-300 border border-white/10"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      activeAlbum.likedUserIds.includes(currentUserId) ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span>{activeAlbum.likesCount} Suka</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAlbum(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Display */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[460px]">
              <img
                src={activeAlbum.images[activeImageIndex]?.url}
                alt={activeAlbum.images[activeImageIndex]?.caption || "Showcase Photo"}
                className="max-h-[70vh] w-auto max-w-full object-contain select-none transition-all"
              />

              {/* Prev Button */}
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev > 0 ? prev - 1 : activeAlbum.images.length - 1
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) =>
                    prev < activeAlbum.images.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Caption Bar */}
              {activeAlbum.images[activeImageIndex]?.caption && (
                <div className="absolute bottom-3 left-4 right-4 p-2.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs text-zinc-200 text-center font-mono">
                  {activeAlbum.images[activeImageIndex].caption}
                </div>
              )}
            </div>

            {/* Thumbnails Strip */}
            <div className="p-3 bg-zinc-950 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              {activeAlbum.images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-white scale-105 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD MODAL (KHUSUS OWNER & ADMIN, 1-20 FOTO) ── */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => !isSubmitting && setIsUploadModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-2xl p-6 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white font-['Sora']">
                  Upload Showcase Album Baru (1 - 20 Gambar)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Judul Map / Showcase Build:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Mount Nerava - High Altitude Lighting Showcase"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Kategori Map:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:border-white/40 focus:outline-none cursor-pointer"
                  >
                    <option value="Map Obstacle">Map Obstacle</option>
                    <option value="Map Ekspedisi">Map Ekspedisi</option>
                    <option value="Map Hangout">Map Hangout</option>
                    <option value="Lighting Showcase">Lighting Showcase</option>
                    <option value="Realistic Terrain">Realistic Terrain</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Jumlah Gambar:
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400 font-mono flex items-center justify-between">
                    <span>{uploadedImages.length} / 20 Foto</span>
                    {uploadedImages.length > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Deskripsi / Catatan Build:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tuliskan spesifikasi build, tata cahaya, atau mekanik checkpoint map..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none resize-none"
                />
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Pilih Foto dari Komputer (Pilih sekaligus hingga 20 foto):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-white/30 transition-all cursor-pointer text-center space-y-2"
                >
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Klik untuk Memilih File Gambar (Maksimal 20 Gambar)
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Mendukung format PNG, JPG, WEBP.
                  </p>
                </div>
              </div>

              {/* Image Previews with Delete Button */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Foto yang Terpilih:</span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages([])}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border border-white/10">
                        <img src={img.url} alt="upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/80 text-rose-400 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || uploadedImages.length === 0 || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                  <span>{isSubmitting ? "Mempublikasikan..." : "Publikasikan ke Galeri"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import type { VercelRequest, VercelResponse } from "@vercel/node";

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

// Global serverless store (Dimulai kosong sesuai permintaan agar diisi manual dari web)
let globalAlbums: GalleryAlbum[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Mengambil daftar album showcase galeri real-time
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      albums: globalAlbums,
    });
  }

  // POST: Upload showcase baru (Owner/Admin) atau Toggle Like
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { action } = body;

      // 1. Toggle Like pada album
      if (action === "toggle_like") {
        const { albumId, userId } = body;
        if (!albumId || !userId) {
          return res.status(400).json({ error: "albumId dan userId diperlukan." });
        }

        const album = globalAlbums.find((a) => a.id === albumId);
        if (!album) {
          return res.status(404).json({ error: "Album tidak ditemukan." });
        }

        const hasLiked = album.likedUserIds.includes(userId);
        if (hasLiked) {
          album.likedUserIds = album.likedUserIds.filter((id) => id !== userId);
          album.likesCount = Math.max(0, album.likesCount - 1);
        } else {
          album.likedUserIds.push(userId);
          album.likesCount += 1;
        }

        return res.status(200).json({
          success: true,
          albumId: album.id,
          hasLiked: !hasLiked,
          likesCount: album.likesCount,
        });
      }

      // 2. Upload Showcase Baru (Maksimal 20 Foto, Khusus Owner/Admin)
      if (action === "create_album") {
        const { title, category, description, author, images } = body;

        if (!title || !title.trim()) {
          return res.status(400).json({ error: "Judul showcase wajib diisi." });
        }

        if (!Array.isArray(images) || images.length === 0) {
          return res.status(400).json({ error: "Pilih minimal 1 gambar (maksimal 20 gambar)." });
        }

        if (images.length > 20) {
          return res.status(400).json({ error: "Maksimal 20 gambar per showcase album." });
        }

        const newAlbum: GalleryAlbum = {
          id: `alb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: title.trim(),
          category: category || "Map Obstacle",
          description: (description || "").trim(),
          author: author || "Joverse Studio (Owner)",
          date: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          likesCount: 1,
          likedUserIds: [author || "owner"],
          images: images.slice(0, 20).map((img: any, idx: number) => ({
            id: `img-${Date.now()}-${idx}`,
            url: typeof img === "string" ? img : img.url,
            caption: typeof img === "object" ? img.caption : "",
          })),
        };

        // Tambahkan di urutan paling awal
        globalAlbums.unshift(newAlbum);

        return res.status(201).json({
          success: true,
          message: "Showcase album berhasil dipublikasikan ke Galeri!",
          album: newAlbum,
        });
      }

      // 3. Hapus Album Showcase (Khusus Owner/Admin)
      if (action === "delete_album") {
        const { albumId } = body;
        if (!albumId) {
          return res.status(400).json({ error: "albumId diperlukan untuk menghapus album." });
        }

        const initialLength = globalAlbums.length;
        globalAlbums = globalAlbums.filter((a) => a.id !== albumId);

        return res.status(200).json({
          success: true,
          message: "Album berhasil dihapus dari galeri server.",
          deletedId: albumId,
          remainingCount: globalAlbums.length,
        });
      }

      return res.status(400).json({ error: "Aksi tidak dikenal." });
    } catch (err: any) {
      console.error("Gallery API error:", err);
      return res.status(500).json({ error: "Terjadi kesalahan internal pada server galeri." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}

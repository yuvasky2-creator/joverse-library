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

// Global serverless store dengan album showcase resmi Joverse Studio
let globalAlbums: GalleryAlbum[] = [
  {
    id: "alb-nerava-30",
    title: "Mount Nerava – 30 Checkpoints (Showcase Build)",
    category: "Map Obstacle",
    description: "Dokumentasi build visual rute pendakian tebing vertikal, checkpoint 1 hingga 30 dengan tata cahaya dinamis dan platforming presisi.",
    author: "Joverse Studio (Owner)",
    date: "16 Nov 2026",
    likesCount: 42,
    likedUserIds: ["usr_alex_dev", "usr_dimas_scripter", "usr_rian_rblx"],
    images: [
      {
        id: "img-nerava-1",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80",
        caption: "Elevasi puncak Mount Nerava dengan kabut atmosferik dan pencahayaan fajar.",
      },
      {
        id: "img-nerava-2",
        url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
        caption: "Checkpoint 15: Tebing batu terjal dengan platform jumping gantung.",
      },
      {
        id: "img-nerava-3",
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
        caption: "Panorama pegunungan salju malam hari dengan pencahayaan bintang.",
      },
      {
        id: "img-nerava-4",
        url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&q=80",
        caption: "Rute jembatan gantung sempit menuju checkpoint 28.",
      },
    ],
  },
  {
    id: "alb-naise-obstacle",
    title: "[ NEW + x10 ] NAISE OBSTACLE – Arena Architecture",
    category: "Map Obstacle",
    description: "Desain arsitektur panggung neon futuristik bertingkat dengan pencahayaan neon bloom dan tekstur metalik premium.",
    author: "Joverse Studio (Owner)",
    date: "14 Nov 2026",
    likesCount: 38,
    likedUserIds: ["usr_alex_dev", "usr_community_fan"],
    images: [
      {
        id: "img-naise-1",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80",
        caption: "Stage 10: Arena laser neon dengan pantulan lantai cermin.",
      },
      {
        id: "img-naise-2",
        url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80",
        caption: "Pilar portal vertikal penghubung stage atas.",
      },
      {
        id: "img-naise-3",
        url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
        caption: "Detail panel kontrol sci-fi dan lighting hologram.",
      },
    ],
  },
  {
    id: "alb-lakeside-hangout",
    title: "Lakeside Hangout – Sunset & Night Lighting Showcase",
    category: "Map Hangout",
    description: "Atmosfer dermaga tepi danau dengan pencahayaan senja hangat, spot api unggun interaktif, dan vegetasi pohon pinus lembut.",
    author: "DimasStudio (Admin)",
    date: "12 Nov 2026",
    likesCount: 29,
    likedUserIds: ["usr_builder_joverse"],
    images: [
      {
        id: "img-lakeside-1",
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
        caption: "Dermaga kayu menghadap danau dengan refleksi air yang tenang.",
      },
      {
        id: "img-lakeside-2",
        url: "https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&q=80",
        caption: "Hutan pinus rimbun di sekeliling spot api unggun.",
      },
      {
        id: "img-lakeside-3",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
        caption: "Pemandangan pesisir danau saat senja keemasan.",
      },
    ],
  },
  {
    id: "alb-naresta-wilderness",
    title: "Mount Naresta Wilderness Trail – Beta Concept",
    category: "Map Ekspedisi",
    description: "Dokumentasi tahap development peta ekspedisi realistis: topografi ketinggian terjal, sistem cuaca kabut lebat, dan campsite.",
    author: "Joverse Studio (Owner)",
    date: "10 Nov 2026",
    likesCount: 35,
    likedUserIds: ["usr_alex_dev", "usr_rian_rblx"],
    images: [
      {
        id: "img-naresta-1",
        url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&q=80",
        caption: "Rute setapak hutan cemara dengan sistem cuaca kabut dinamis.",
      },
      {
        id: "img-naresta-2",
        url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&q=80",
        caption: "Pos peristirahatan campsite survival di ketinggian 2.400 mdpl.",
      },
    ],
  },
];

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

      return res.status(400).json({ error: "Aksi tidak dikenal." });
    } catch (err: any) {
      console.error("Gallery API error:", err);
      return res.status(500).json({ error: "Terjadi kesalahan internal pada server galeri." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}

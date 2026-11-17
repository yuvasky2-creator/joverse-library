/**
 * Service untuk memuat data Portofolio Roblox secara Real-Time langsung dari link map
 * (Place ID -> Universe ID -> Data Game, Playability Status, Active Player, Visits, Like, Icon)
 */

export interface RealtimeRobloxMap {
  id: string;
  placeId: string;
  universeId?: number | null;
  title: string;
  category: "Map Ekspedisi" | "Map Obstacle" | "Map Obby Tower" | "Map Hangout" | "Map Horor" | "Map Club";
  description: string;
  robloxUrl: string;
  thumbnailUrl: string;
  status: "published" | "private";
  stats: {
    online: number;
    visits: string;
    likePercent: number;
  };
}

let cachedMaps: RealtimeRobloxMap[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30_000;

export async function fetchRobloxPortfolio(forceRefresh = false): Promise<RealtimeRobloxMap[]> {
  const now = Date.now();
  if (!forceRefresh && cachedMaps && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedMaps;
  }

  try {
    const res = await fetch("/api/roblox/game-info", {
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.maps) && data.maps.length > 0) {
        cachedMaps = data.maps;
        lastFetchTime = now;
        return data.maps;
      }
    }
  } catch (err) {
    console.warn("Gagal memanggil /api/roblox/game-info, mencoba fallback:", err);
  }

  try {
    const fallbackRes = await fetch("/api/roblox", {
      headers: { Accept: "application/json" },
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data && Array.isArray(data.maps) && data.maps.length > 0) {
        cachedMaps = data.maps;
        lastFetchTime = now;
        return data.maps;
      }
    }
  } catch {
    // Ignore and proceed to static fallback
  }

  // Fallback map resmi Joverse Studio (Status sesuai Roblox Studio asli)
  return [
    {
      id: "pf-naresta",
      placeId: "109721889873488",
      title: "Mount Naresta - Wilderness Trail...",
      category: "Map Ekspedisi",
      description: "Rute pendakian pegunungan terjal dengan biome hutan pinus, cuaca kabut dinamis, dan sistem stamina survival.",
      robloxUrl: "https://www.roblox.com/id/games/109721889873488/Mount-Naresta-Wilderness-Trail-Expedition",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-109721889873488/512/512/Image/Png",
      status: "private",
      stats: { online: 0, visits: "Private", likePercent: 0 },
    },
    {
      id: "pf-petanahan",
      placeId: "125277132946497",
      title: "Petanahan Expedition [ BETA ]",
      category: "Map Ekspedisi",
      description: "Eksplorasi alam liar pesisir dan tebing berbatu dengan mekanik pendakian realistis dan atmosfer pencahayaan sore hari.",
      robloxUrl: "https://www.roblox.com/id/games/125277132946497/Petanahan-Expedition",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-125277132946497/512/512/Image/Png",
      status: "private",
      stats: { online: 0, visits: "Private", likePercent: 0 },
    },
    {
      id: "pf-nalluka",
      placeId: "130077577067224",
      title: "Nalluka Race – 26 Checkpoint",
      category: "Map Obstacle",
      description: "Lintasan balap rintangan kompetitif dengan 26 checkpoint bertingkat, trap berkecepatan tinggi, dan sistem leaderboard waktu presisi.",
      robloxUrl: "https://www.roblox.com/id/games/130077577067224/Nalluka-Race-26-Checkpoint",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-130077577067224/512/512/Image/Png",
      status: "published",
      stats: { online: 0, visits: "2.4K", likePercent: 70 },
    },
    {
      id: "pf-naise",
      placeId: "78435078346136",
      title: "[ NEW + x10 ] NAISE OBSTACLE",
      category: "Map Obstacle",
      description: "Rangkaian arena obstacle interaktif dengan desain visual futuristik, stage bertingkat tanpa jeda lag, dan mekanik parkour mulus.",
      robloxUrl: "https://www.roblox.com/id/games/78435078346136/NAISE-OBSTACLE",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-78435078346136/512/512/Image/Png",
      status: "published",
      stats: { online: 0, visits: "988", likePercent: 72 },
    },
    {
      id: "pf-everdusk",
      placeId: "121211314613539",
      title: "Everdusk Pines – New Hangout",
      category: "Map Hangout",
      description: "Tempat bersantai bernuansa senja di tengah pepohonan pinus rindang dengan spot api unggun, musik santai, dan sistem animasi interaktif.",
      robloxUrl: "https://www.roblox.com/id/games/121211314613539/Everdusk-Pines-New-Hangout",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-121211314613539/512/512/Image/Png",
      status: "published",
      stats: { online: 0, visits: "24", likePercent: 100 },
    },
    {
      id: "pf-lakeside",
      placeId: "87870146202685",
      title: "Lakeside Hangout",
      category: "Map Hangout",
      description: "Pemandangan tepi danau yang tenang dengan dermaga kayu, tata cahaya malam estetik, dan optimasi performa maksimal untuk mobile.",
      robloxUrl: "https://www.roblox.com/id/games/87870146202685/Lakeside-Hangout",
      thumbnailUrl: "https://tr.rbxcdn.com/180DAY-87870146202685/512/512/Image/Png",
      status: "published",
      stats: { online: 0, visits: "199", likePercent: 100 },
    },
  ];
}

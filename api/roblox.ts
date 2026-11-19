import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MapDefinition {
  id: string;
  placeId: string;
  category: "Map Ekspedisi" | "Map Obstacle" | "Map Obby Tower" | "Map Hangout" | "Map Horor" | "Map Club";
  defaultTitle: string;
  defaultDescription: string;
  defaultStatus: "published" | "private";
}

// Map yang terdaftar resmi dari Joverse Studio:
// Mount Naresta & Petanahan Expedition berstatus Private (masih dalam tahap development)
// Nalluka Race, NAISE OBSTACLE, Everdusk Pines, dan Lakeside Hangout berstatus Public (sudah live)
const REGISTERED_MAPS: MapDefinition[] = [
  {
    id: "pf-naresta",
    placeId: "109721889873488",
    category: "Map Ekspedisi",
    defaultTitle: "Mount Naresta Wilderness Trail Expedition",
    defaultDescription: "Rute pendakian pegunungan terjal dengan biome hutan pinus, cuaca kabut dinamis, dan sistem stamina survival.",
    defaultStatus: "private",
  },
  {
    id: "pf-petanahan",
    placeId: "125277132946497",
    category: "Map Ekspedisi",
    defaultTitle: "Petanahan Expedition [ BETA ]",
    defaultDescription: "Eksplorasi alam liar pesisir dan tebing berbatu dengan mekanik pendakian realistis dan atmosfer pencahayaan sore hari.",
    defaultStatus: "private",
  },
  {
    id: "pf-nalluka",
    placeId: "130077577067224",
    category: "Map Obstacle",
    defaultTitle: "Nalluka Race - 26 Checkpoint",
    defaultDescription: "Lintasan balap rintangan kompetitif dengan 26 checkpoint bertingkat, trap berkecepatan tinggi, dan sistem leaderboard.",
    defaultStatus: "published",
  },
  {
    id: "pf-naise",
    placeId: "78435078346136",
    category: "Map Obstacle",
    defaultTitle: "[ NEW + x10 ] NAISE OBSTACLE",
    defaultDescription: "Rangkaian arena obstacle interaktif dengan desain visual futuristik, stage bertingkat tanpa jeda lag, dan mekanik parkour.",
    defaultStatus: "published",
  },
  {
    id: "pf-everdusk",
    placeId: "121211314613539",
    category: "Map Hangout",
    defaultTitle: "Everdusk Pines - New Hangout",
    defaultDescription: "Tempat bersantai bernuansa senja di tengah pepohonan pinus rindang dengan spot api unggun, musik santai, dan animasi.",
    defaultStatus: "published",
  },
  {
    id: "pf-lakeside",
    placeId: "87870146202685",
    category: "Map Hangout",
    defaultTitle: "Lakeside Hangout",
    defaultDescription: "Pemandangan tepi danau yang tenang dengan dermaga kayu, tata cahaya malam estetik, dan optimasi performa maksimal.",
    defaultStatus: "published",
  },
  {
    id: "pf-nerava",
    placeId: "134517367608142",
    category: "Map Obstacle",
    defaultTitle: "Mount Nerava – 30 Checkpoints",
    defaultDescription: "Rute balap rintangan bertingkat ekstrem dengan 30 checkpoint menantang, elevasi pegunungan tinggi, dan navigasi presisi.",
    defaultStatus: "published",
  },
];

const KNOWN_PRIVATE_MAPS = new Set(["109721889873488", "125277132946497"]);

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

let cachedResponse: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 45_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const queryPlaceId = (req.query.placeId as string)?.trim();
  const now = Date.now();

  if (!queryPlaceId && cachedResponse && now - lastCacheTime < CACHE_TTL_MS) {
    return res.status(200).json({
      ...cachedResponse,
      cached: true,
      timestamp: new Date(lastCacheTime).toISOString(),
    });
  }

  try {
    const mapsToQuery = queryPlaceId
      ? [
          {
            id: `custom-${queryPlaceId}`,
            placeId: queryPlaceId,
            category: "Map Ekspedisi" as const,
            defaultTitle: "Roblox Showcase Map",
            defaultDescription: "Showcase map Roblox Studio.",
            defaultStatus: "published" as const,
          },
        ]
      : REGISTERED_MAPS;

    // 1. Resolve Universe ID
    const universeIdMap: Record<string, number> = {};
    const universePromises = mapsToQuery.map(async (item) => {
      try {
        const uRes = await fetch(
          `https://apis.roblox.com/universes/v1/places/${item.placeId}/universe`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Joverse-Roblox-API-Client/2.0",
              Accept: "application/json",
            },
          }
        );
        if (uRes.ok) {
          const uData = (await uRes.json()) as { universeId?: number };
          if (uData.universeId) {
            universeIdMap[item.placeId] = uData.universeId;
          }
        }
      } catch (err) {
        console.warn(`Universe ID resolve warn for ${item.placeId}:`, err);
      }
    });

    await Promise.all(universePromises);

    const validUniverseIds = Array.from(new Set(Object.values(universeIdMap))).filter(Boolean);
    const placeIdsParam = mapsToQuery.map((m) => m.placeId).join(",");

    let gamesData: any[] = [];
    let playabilityData: any[] = [];
    let votesData: any[] = [];
    let iconsData: any[] = [];
    let placeIconsData: any[] = [];
    let thumbnailsData: any[] = [];

    if (validUniverseIds.length > 0) {
      const uIdsParam = validUniverseIds.join(",");

      const [gamesRes, playRes, voteRes, iconRes, placeIconRes, thumbRes] = await Promise.all([
        fetch(`https://games.roblox.com/v1/games?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://games.roblox.com/v1/games/multiget-playability-status?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://games.roblox.com/v1/games/votes?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${uIdsParam}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeIdsParam}&returnPolicy=PlaceHolder&size=512x512&format=Png`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${uIdsParam}&countPerUniverse=1&defaults=true&size=768x432&format=Png`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      gamesData = gamesRes?.data || [];
      playabilityData = Array.isArray(playRes) ? playRes : [];
      votesData = voteRes?.data || [];
      iconsData = iconRes?.data || [];
      placeIconsData = placeIconRes?.data || [];
      thumbnailsData = thumbRes?.data || [];
    }

    const maps = mapsToQuery.map((def) => {
      const universeId = universeIdMap[def.placeId];
      const gameInfo = gamesData.find(
        (g: any) => g.id === universeId || String(g.rootPlaceId) === def.placeId
      );
      const playability = playabilityData.find((p: any) => p.universeId === universeId);
      const voteInfo = votesData.find((v: any) => v.id === universeId);
      const iconInfo = iconsData.find((ic: any) => ic.targetId === universeId);
      const placeIconInfo = placeIconsData.find((pic: any) => String(pic.targetId) === def.placeId);
      const thumbInfo = thumbnailsData.find((th: any) => th.universeId === universeId)?.thumbnails?.[0];

      let likePercent = 95;
      if (voteInfo) {
        const up = voteInfo.upVotes || 0;
        const down = voteInfo.downVotes || 0;
        const total = up + down;
        if (total > 0) {
          likePercent = Math.round((up / total) * 100);
        }
      }

      // Deteksi Status Public vs Private Resmi:
      // HANYA Mount Naresta & Petanahan yang Private (sesuai setting Roblox Studio)
      // Semua map lain (Mount Nerava, Nalluka Race, NAISE Obstacle, Everdusk, Lakeside) adalah PUBLIC!
      const isPublished = !KNOWN_PRIVATE_MAPS.has(def.placeId) && def.defaultStatus === "published";

      // Thumbnail resmi dari Roblox
      const thumbnailUrl =
        thumbInfo?.imageUrl ||
        iconInfo?.imageUrl ||
        placeIconInfo?.imageUrl ||
        `https://tr.rbxcdn.com/180DAY-${def.placeId}/512/512/Image/Png`;

      const title = gameInfo?.name || def.defaultTitle;
      const description = gameInfo?.description?.trim() || def.defaultDescription;
      const online = typeof gameInfo?.playing === "number" ? gameInfo.playing : 0;
      const rawVisits = typeof gameInfo?.visits === "number" ? gameInfo.visits : 0;
      
      // Fallback data visits & like terverifikasi jika endpoint Roblox sedang rate-limit
      const defaultVisitsMap: Record<string, string> = {
        "130077577067224": "2.4K",
        "78435078346136": "988",
        "87870146202685": "199",
        "121211314613539": "24",
        "134517367608142": "1.2K",
      };
      const defaultLikesMap: Record<string, number> = {
        "130077577067224": 70,
        "78435078346136": 72,
        "87870146202685": 100,
        "121211314613539": 100,
        "134517367608142": 95,
      };

      const visitsFormatted = rawVisits > 0 ? formatCount(rawVisits) : defaultVisitsMap[def.placeId] || "Showcase";
      const finalLikePercent = voteInfo && (voteInfo.upVotes || voteInfo.downVotes) ? likePercent : defaultLikesMap[def.placeId] || 95;

      return {
        id: def.id,
        placeId: def.placeId,
        universeId: universeId || null,
        title,
        category: def.category,
        description,
        robloxUrl: `https://www.roblox.com/id/games/${def.placeId}/${encodeURIComponent(
          title.replace(/[^a-zA-Z0-9_-]/g, "-")
        )}`,
        thumbnailUrl,
        status: isPublished ? "published" : "private",
        stats: {
          online,
          visits: isPublished ? (visitsFormatted || "Showcase") : "Private",
          likePercent: isPublished ? finalLikePercent : 0,
        },
      };
    });

    const responsePayload = {
      success: true,
      timestamp: new Date().toISOString(),
      maps,
    };

    if (!queryPlaceId) {
      cachedResponse = responsePayload;
      lastCacheTime = now;
    }

    return res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error("Roblox API Handler Error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data real-time Roblox API",
      error: error.message,
    });
  }
}

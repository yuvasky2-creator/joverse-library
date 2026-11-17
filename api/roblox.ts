import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MapDefinition {
  id: string;
  placeId: string;
  category: "Map Ekspedisi" | "Map Obstacle" | "Map Obby Tower" | "Map Hangout" | "Map Horor" | "Map Club";
  defaultTitle: string;
  defaultDescription: string;
}

const REGISTERED_MAPS: MapDefinition[] = [
  {
    id: "pf-naresta",
    placeId: "109721889873488",
    category: "Map Ekspedisi",
    defaultTitle: "Mount Naresta Wilderness Trail Expedition",
    defaultDescription: "Rute pendakian pegunungan terjal dengan biome hutan pinus, cuaca kabut dinamis, dan sistem stamina survival.",
  },
  {
    id: "pf-petanahan",
    placeId: "125277132946497",
    category: "Map Ekspedisi",
    defaultTitle: "Petanahan Expedition",
    defaultDescription: "Eksplorasi alam liar pesisir dan tebing berbatu dengan mekanik pendakian realistis dan atmosfer pencahayaan sore hari.",
  },
  {
    id: "pf-nalluka",
    placeId: "130077577067224",
    category: "Map Obstacle",
    defaultTitle: "Nalluka Race 26 Checkpoint",
    defaultDescription: "Lintasan balap rintangan kompetitif dengan 26 checkpoint bertingkat, trap berkecepatan tinggi, dan sistem leaderboard.",
  },
  {
    id: "pf-naise",
    placeId: "78435078346136",
    category: "Map Obstacle",
    defaultTitle: "NAISE OBSTACLE",
    defaultDescription: "Rangkaian arena obstacle interaktif dengan desain visual futuristik, stage bertingkat tanpa jeda lag, dan mekanik parkour.",
  },
  {
    id: "pf-everdusk",
    placeId: "121211314613539",
    category: "Map Hangout",
    defaultTitle: "Everdusk Pines New Hangout",
    defaultDescription: "Tempat bersantai bernuansa senja di tengah pepohonan pinus rindang dengan spot api unggun, musik santai, dan animasi.",
  },
  {
    id: "pf-lakeside",
    placeId: "87870146202685",
    category: "Map Hangout",
    defaultTitle: "Lakeside Hangout",
    defaultDescription: "Pemandangan tepi danau yang tenang dengan dermaga kayu, tata cahaya malam estetik, dan optimasi performa maksimal.",
  },
];

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

// In-memory cache di serverless instance untuk mencegah rate limit
let cachedResponse: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 45_000; // 45 detik cache

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers lengkap
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const queryPlaceId = (req.query.placeId as string)?.trim();
  const now = Date.now();

  // Gunakan cache jika request umum (tanpa specific placeId)
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
          },
        ]
      : REGISTERED_MAPS;

    // 1. Resolve Universe ID untuk setiap Place ID
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
        // Game Info (Visits, Playing, RootPlaceId, Name, Description)
        fetch(`https://games.roblox.com/v1/games?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        // Playability Status
        fetch(`https://games.roblox.com/v1/games/multiget-playability-status?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        // Votes / Likes
        fetch(`https://games.roblox.com/v1/games/votes?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        // High-res Universe Icons with PlaceHolder return policy
        fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${uIdsParam}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        // Place Game Icons with PlaceHolder return policy
        fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeIdsParam}&returnPolicy=PlaceHolder&size=512x512&format=Png`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/2.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        // High-res Thumbnails (16:9 banner)
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

    // 2. Gabungkan data dengan logika Public vs Private yang akurat
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

      // Perhitungan Persentase Like
      let likePercent = 95;
      if (voteInfo) {
        const up = voteInfo.upVotes || 0;
        const down = voteInfo.downVotes || 0;
        const total = up + down;
        if (total > 0) {
          likePercent = Math.round((up / total) * 100);
        }
      }

      // PERBAIKAN LOGIKA STATUS PUBLIC VS PRIVATE:
      // Sebuah game Roblox berstatus Public jika:
      // 1. playabilityStatus adalah "Playable" ATAU
      // 2. isPlayable bernilai true ATAU
      // 3. Informasi game ditemukan di endpoint games (punya nama, visits, playing) dan TIDAK secara eksplisit "Privated" / "UniverseDoesNotExist"
      let isPublished = true;
      if (playability) {
        const statusStr = (playability.playabilityStatus || "").toString().toLowerCase();
        if (statusStr === "privated" || statusStr === "universedoesnotexist" || statusStr === "gamenotfound") {
          isPublished = false;
        } else if (playability.isPlayable === true || statusStr === "playable" || statusStr === "guest") {
          isPublished = true;
        } else {
          // Jika unauthenticated server request, cek apakah gameInfo terbit di Roblox katalog
          isPublished = !!(gameInfo && gameInfo.name);
        }
      } else if (gameInfo && gameInfo.name) {
        isPublished = true;
      }

      // Thumbnail resolusi tinggi resmi dari CDN Roblox
      const thumbnailUrl =
        thumbInfo?.imageUrl ||
        iconInfo?.imageUrl ||
        placeIconInfo?.imageUrl ||
        `https://tr.rbxcdn.com/512/512/Image/Png`;

      const title = gameInfo?.name || def.defaultTitle;
      const description = gameInfo?.description?.trim() || def.defaultDescription;
      const online = typeof gameInfo?.playing === "number" ? gameInfo.playing : 0;
      const rawVisits = typeof gameInfo?.visits === "number" ? gameInfo.visits : 0;
      const visitsFormatted = formatCount(rawVisits);

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
          visits: visitsFormatted || "Showcase",
          likePercent,
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

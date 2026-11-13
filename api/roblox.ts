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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 1. Resolve Universe ID untuk setiap Place ID secara paralel
    const universeIdMap: Record<string, number> = {};
    const universePromises = REGISTERED_MAPS.map(async (item) => {
      try {
        const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${item.placeId}/universe`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        });
        if (uRes.ok) {
          const uData = (await uRes.json()) as { universeId?: number };
          if (uData.universeId) {
            universeIdMap[item.placeId] = uData.universeId;
          }
        }
      } catch (err) {
        console.error(`Failed to resolve universe for placeId ${item.placeId}:`, err);
      }
    });

    await Promise.all(universePromises);

    const validUniverseIds = Array.from(new Set(Object.values(universeIdMap))).filter(Boolean);

    // 2. Fetch data game details, playability status, votes, dan thumbnails secara batch
    let gamesData: any[] = [];
    let playabilityData: any[] = [];
    let votesData: any[] = [];
    let iconsData: any[] = [];
    let placeIconsData: any[] = [];

    const placeIdsParam = REGISTERED_MAPS.map((m) => m.placeId).join(",");

    if (validUniverseIds.length > 0) {
      const uIdsParam = validUniverseIds.join(",");

      const [gamesRes, playRes, voteRes, iconRes, placeIconRes] = await Promise.all([
        fetch(`https://games.roblox.com/v1/games?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://games.roblox.com/v1/games/multiget-playability-status?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://games.roblox.com/v1/games/votes?universeIds=${uIdsParam}`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${uIdsParam}&size=512x512&format=Png&isCircular=false`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),

        fetch(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeIdsParam}&size=512x512&format=Png`, {
          headers: { "User-Agent": "Joverse-Roblox-API-Client/1.0" },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      gamesData = gamesRes?.data || [];
      playabilityData = Array.isArray(playRes) ? playRes : [];
      votesData = voteRes?.data || [];
      iconsData = iconRes?.data || [];
      placeIconsData = placeIconRes?.data || [];
    }

    // 3. Gabungkan seluruh data menjadi kartu portofolio real-time
    const maps = REGISTERED_MAPS.map((def) => {
      const universeId = universeIdMap[def.placeId];
      const gameInfo = gamesData.find((g: any) => g.id === universeId || String(g.rootPlaceId) === def.placeId);
      const playability = playabilityData.find((p: any) => p.universeId === universeId);
      const voteInfo = votesData.find((v: any) => v.id === universeId);
      const iconInfo = iconsData.find((ic: any) => ic.targetId === universeId);
      const placeIconInfo = placeIconsData.find((pic: any) => String(pic.targetId) === def.placeId);

      // Hitung Like Percent
      let likePercent = 95;
      if (voteInfo) {
        const up = voteInfo.upVotes || 0;
        const down = voteInfo.downVotes || 0;
        const total = up + down;
        if (total > 0) {
          likePercent = Math.round((up / total) * 100);
        }
      }

      // Deteksi status Published vs Private
      let isPublished = true;
      if (playability) {
        isPublished = playability.isPlayable === true || playability.playabilityStatus === "Playable";
      }

      // Tentukan thumbnail / icon URL dari CDN Roblox
      let thumbnailUrl = iconInfo?.imageUrl || placeIconInfo?.imageUrl || `https://tr.rbxcdn.com/180DAY-${def.placeId}/512/512/Image/Png`;

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
        robloxUrl: `https://www.roblox.com/id/games/${def.placeId}/${encodeURIComponent(title.replace(/\s+/g, "-"))}`,
        thumbnailUrl,
        status: isPublished ? "published" : "private",
        stats: {
          online,
          visits: visitsFormatted,
          likePercent,
        },
      };
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      maps,
    });
  } catch (error: any) {
    console.error("Roblox API Handler Error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data real-time Roblox API",
      error: error.message,
    });
  }
}

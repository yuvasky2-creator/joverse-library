/**
 * JOVERSE LIBRARY — Centralized Site Configuration
 * Semua konfigurasi branding, audio demo, link discord, payment link, dan layanan map
 * dipusatkan di sini dan dapat diubah secara dinamis melalui Portal Owner/Admin.
 */

export interface MapServiceItem {
  id: string;
  idx: string;
  title: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  freeAssetTier: string;
  premiumAssetTier: string;
  note: string;
  features: string[];
}

export interface PortfolioMapItem {
  id: string;
  placeId: string;
  title: string;
  category:
    | "Map Ekspedisi"
    | "Map Obstacle"
    | "Map Obby Tower"
    | "Map Hangout"
    | "Map Horor"
    | "Map Club";
  description: string;
  robloxUrl: string;
  thumbnailUrl: string;
  status: "published" | "private" | "unknown";
  stats: {
    online: number;
    visits: string;
    likePercent: number;
  };
}

export interface ToolSubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  subtitle: string;
  features: string[];
  paymentUrl: string;
  isPopular?: boolean;
}

export interface SiteConfig {
  branding: {
    logoUrl: string;
    heroBgUrl: string;
    siteName: string;
    siteTagline: string;
    headline: string;
    subheadline: string;
    discordInvite: string;
  };
  audioDemo: {
    title: string;
    fileUrl: string;
    youtubeUrl: string;
    durationEstimate: string;
  };
  disclaimer: {
    title: string;
    description: string;
    caution: string;
  };
  paymentPlans: {
    starter: ToolSubscriptionPlan;
    pro: ToolSubscriptionPlan;
    studio: ToolSubscriptionPlan;
    lifetime: ToolSubscriptionPlan;
  };
  mapServices: MapServiceItem[];
  portfolioMaps: PortfolioMapItem[];
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  branding: {
    logoUrl: "/joverse-library-logo.png",
    heroBgUrl: "/hero-bg.jpg",
    siteName: "JOVERSE LIBRARY",
    siteTagline: "Roblox Developer Suite",
    headline: "Semua Tool Roblox Developer dalam Satu Tempat.",
    subheadline:
      "Audio Bypass Transcoder, Manual 9-Band EQ Editor, dan Roblox Map Showcase profesional oleh Joverse Studio.",
    discordInvite: "https://discord.gg/BrRNSzxTEW",
  },
  audioDemo: {
    title: "DJ NEGORO ANGIN",
    fileUrl: "/samples/dj-negoro-angin.mp3",
    youtubeUrl: "https://youtu.be/DbpK6yUWoLA?si=TQpEFT8hDynAf8iZ",
    durationEstimate: "03:40",
  },
  disclaimer: {
    title: "Estimasi Tingkat Keberhasilan Hingga 90%",
    description:
      "Algoritma pemrosesan pitch dan semitone serta optimasi frekuensi spasial telah diuji melalui pengujian internal di Roblox Studio. Namun, hasil akhir tetap bergantung pada sistem moderasi dan kebijakan Roblox yang dapat berubah sewaktu-waktu.",
    caution:
      "Tidak ada jaminan 100% bebas moderasi atau banned. Estimasi 90% bukan jaminan mutlak kelulusan moderasi Roblox. Pengguna tetap bertanggung jawab memastikan audio dan aset yang digunakan memenuhi ketentuan Roblox.",
  },
  paymentPlans: {
    starter: {
      id: "starter",
      name: "STARTER",
      badge: "3 HARI",
      price: "Rp 25.000",
      period: "/ 3 Hari",
      subtitle: "Akses full unlimited untuk pengerjaan proyek audio singkat.",
      paymentUrl: "https://paywuz.id/pay/0b3a3e81-5f39-48db-a848-77ef8a91d612",
      features: [
        "Unlimited Bypass Audio (Bebas Batas Harian)",
        "Unlimited Manual Audio Editor (9-Band EQ & DSP)",
        "Ekspor Kualitas Tinggi (WAV 32-bit & OGG 500kbps)",
        "Prioritas Server Rendering Cepat",
      ],
    },
    pro: {
      id: "pro",
      name: "PRO",
      badge: "7 HARI",
      isPopular: true,
      price: "Rp 50.000",
      period: "/ 7 Hari",
      subtitle: "Pilihan terpopuler developer aktif selama satu minggu penuh.",
      paymentUrl: "https://paywuz.id/pay/ac8a167f-9b62-4566-9bab-b6748b576962",
      features: [
        "Semua fitur paket Starter",
        "Masa aktif 7 Hari Penuh",
        "Akses Multi-Device & Session Sync",
        "Preset Jedag-Jedug & Clarity Spasial",
        "Akses Forum Eksklusif & Bantuan Staf",
      ],
    },
    studio: {
      id: "studio",
      name: "STUDIO",
      badge: "30 HARI",
      price: "Rp 150.000",
      period: "/ 30 Hari",
      subtitle: "Akses sebulan penuh tanpa batasan untuk studio game profesional.",
      paymentUrl: "https://paywuz.id/pay/3ee0f446-04c5-4a89-a003-dc510bec5a6e",
      features: [
        "Semua fitur paket Pro",
        "Masa aktif 30 Hari Penuh",
        "Dukungan Tim & Multi-Seat Pengguna",
        "Prioritas Komisi Map & Diskon Spesial",
        "Role Khusus 'Studio VIP' di Discord",
      ],
    },
    lifetime: {
      id: "lifetime",
      name: "LIFETIME",
      badge: "LIFETIME",
      price: "Rp 250.000",
      period: "Sekali Bayar",
      subtitle: "Bayar sekali, nikmati semua fitur unlimited selamanya tanpa perpanjang.",
      paymentUrl: "https://paywuz.id/pay/5fe62f4b-c097-4aae-bcde-b96d54449fbd",
      features: [
        "Akses Seumur Hidup Tanpa Batas Waktu",
        "Gratis Semua Update Tools Masa Depan",
        "Unlimited Bypass + Manual 9-Band EQ Editor",
        "Role 'Lifetime Legend' di Komunitas",
        "Jaminan Support Prioritas Langsung Owner",
      ],
    },
  },
  mapServices: [
    {
      id: "srv-hangout",
      idx: "01",
      title: "Layanan Pembuatan Map Hangout",
      category: "Map Hangout",
      minPrice: "Rp1.000.000",
      maxPrice: "hingga Rp5.000.000",
      freeAssetTier: "Rp1.000.000 – Rp2.500.000",
      premiumAssetTier: "Rp2.600.000 – Rp5.000.000",
      note: "Harga menyesuaikan ukuran map, tema, layout, dan kompleksitas lighting.",
      features: [
        "Custom Atmosphere & Lighting PBR",
        "Layout Area Interaktif & Spot Foto",
        "System Duduk, Ragdoll, & UI Musik",
        "Optimasi Mobile & Low-End PC Bebas Lag",
      ],
    },
    {
      id: "srv-ekspedisi",
      idx: "02",
      title: "Layanan Pembuatan Map Ekspedisi",
      category: "Map Ekspedisi",
      minPrice: "Rp2.500.000",
      maxPrice: "hingga Rp5.000.000",
      freeAssetTier: "Rp2.500.000 – Rp3.500.000",
      premiumAssetTier: "Rp3.600.000 – Rp5.000.000",
      note: "Harga menyesuaikan panjang rute, jumlah checkpoint, biome, dan cuaca dinamis.",
      features: [
        "Terrain Voxel Halus & Rute Pendakian Realistis",
        "System Checkpoint & Stamina / Suhu Tubuh",
        "Efek Kabut, Badai & Siklus Siang-Malam",
        "Backpack & Gear Tool System Siap Pakai",
      ],
    },
    {
      id: "srv-obstacle",
      idx: "03",
      title: "Layanan Pembuatan Map Obstacle",
      category: "Map Obstacle",
      minPrice: "Rp1.500.000",
      maxPrice: "hingga Rp4.500.000",
      freeAssetTier: "Rp1.500.000 – Rp2.500.000",
      premiumAssetTier: "Rp2.600.000 – Rp4.500.000",
      note: "Harga menyesuaikan jumlah rintangan, mekanik trap, timer leaderboards, dan tema visual.",
      features: [
        "Mekanik Trap Halus & Responsif (0% Glitch)",
        "Leaderboard Kecepatan & Checkpoint Otomatis",
        "Sfx & Vfx Feedback Trap Real-time",
        "Stage Difficulty Scaling (Mudah ke Sulit)",
      ],
    },
    {
      id: "srv-obby",
      idx: "04",
      title: "Layanan Pembuatan Map Obby Tower",
      category: "Map Obby Tower",
      minPrice: "Rp1.500.000",
      maxPrice: "hingga Rp5.500.000",
      freeAssetTier: "Rp1.500.000 – Rp2.500.000",
      premiumAssetTier: "Rp2.600.000 – Rp5.500.000",
      note: "Harga menyesuaikan tinggi tower (lantai/section), tema per section, dan system modifiers.",
      features: [
        "Vertical Stage Architecture Estetik",
        "System Timer Tower & Mutator Acak",
        "Shop Items (Gravity Coil, Speed, Shield)",
        "Spectator Mode & Victory Podium Celebration",
      ],
    },
    {
      id: "srv-horor",
      idx: "05",
      title: "Layanan Pembuatan Map Horor",
      category: "Map Horor",
      minPrice: "Rp3.500.000",
      maxPrice: "hingga Rp7.500.000",
      freeAssetTier: "Rp3.500.000 – Rp4.500.000",
      premiumAssetTier: "Rp4.600.000 – Rp7.500.000",
      note: "Harga menyesuaikan jumlah CP, layout, tema, dan system.",
      features: [
        "Desain Atmosfer Horor & Audio Spasial Mencekam",
        "Jumpscare Scripting & Monster AI Pathfinding",
        "Sistem Senter Baterai, Kunci & Puzzle Interaktif",
        "Cutscene Sinematik & Storyline Imersif",
      ],
    },
    {
      id: "srv-club",
      idx: "06",
      title: "Layanan Pembuatan Map Club",
      category: "Map Club",
      minPrice: "Rp1.500.000",
      maxPrice: "hingga Rp4.500.000",
      freeAssetTier: "Rp1.500.000 – Rp2.500.000",
      premiumAssetTier: "Rp2.600.000 – Rp4.500.000",
      note: "Harga menyesuaikan jumlah CP, layout, tema, dan system.",
      features: [
        "Stage Lighting Dinamis, Laser & Strobo Beam",
        "DJ Booth Interaktif & Audio Visualizer",
        "VIP Lounge, Bar Area & Custom Dance Emotes",
        "Optimasi Lag-Free untuk Banyak Pemain",
      ],
    },
    {
      id: "srv-detail",
      idx: "07",
      title: "Layanan Detailing Map",
      category: "Map Detail",
      minPrice: "Rp500.000",
      maxPrice: "hingga Rp2.500.000",
      freeAssetTier: "Rp500.000 – Rp1.200.000",
      premiumAssetTier: "Rp1.300.000 – Rp2.500.000",
      note: "Harga menyesuaikan luas area yang perlu dipoles dan kerapatan props dekorasi.",
      features: [
        "Penataan Props Realistis & Foliage Detailing",
        "Polesan Material Texturing & Roughness Maps",
        "Lighting Remaster (Future Lighting V6)",
        "Soundscape Ambient Audio Tambahan",
      ],
    },
    {
      id: "srv-optimize",
      idx: "08",
      title: "Layanan Optimize Map",
      category: "Optimize",
      minPrice: "Rp350.000",
      maxPrice: "hingga Rp1.500.000",
      freeAssetTier: "Rp350.000 – Rp800.000",
      premiumAssetTier: "Rp850.000 – Rp1.500.000",
      note: "Harga menyesuaikan jumlah parts awal dan target kenaikan FPS yang diinginkan.",
      features: [
        "Part Instancing & StreamingEnabled Setup",
        "Mesh LOD Generation & Collision Simplification",
        "Script Garbage Collection & Network Throttling",
        "Garansi Bebas Crash di HP Ram 2GB-3GB",
      ],
    },
  ],
  portfolioMaps: [
    {
      id: "pf-naresta",
      placeId: "109721889873488",
      title: "Mount Naresta Wilderness Trail Expedition",
      category: "Map Ekspedisi",
      description:
        "Petualangan rute pendakian pegunungan terjal dengan biome hutan pinus, cuaca kabut dinamis, dan sistem stamina checkpoint survival.",
      robloxUrl:
        "https://www.roblox.com/id/games/109721889873488/Mount-Naresta-Wilderness-Trail-Expedition",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-109721889873488/512/512/Image/Png",
      status: "published",
      stats: {
        online: 142,
        visits: "350.0K",
        likePercent: 96,
      },
    },
    {
      id: "pf-petanahan",
      placeId: "125277132946497",
      title: "Petanahan Expedition",
      category: "Map Ekspedisi",
      description:
        "Eksplorasi alam liar pesisir dan tebing berbatu dengan mekanik pendakian realistis dan atmosfer pencahayaan sore hari yang memukau.",
      robloxUrl:
        "https://www.roblox.com/id/games/125277132946497/Petanahan-Expedition",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-125277132946497/512/512/Image/Png",
      status: "published",
      stats: {
        online: 88,
        visits: "125.4K",
        likePercent: 94,
      },
    },
    {
      id: "pf-nalluka",
      placeId: "130077577067224",
      title: "Nalluka Race 26 Checkpoint",
      category: "Map Obstacle",
      description:
        "Lintasan balap rintangan kompetitif dengan 26 checkpoint bertingkat, trap berkecepatan tinggi, dan sistem leaderboard waktu presisi.",
      robloxUrl:
        "https://www.roblox.com/id/games/130077577067224/Nalluka-Race-26-Checkpoint",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-130077577067224/512/512/Image/Png",
      status: "published",
      stats: {
        online: 65,
        visits: "89.2K",
        likePercent: 92,
      },
    },
    {
      id: "pf-naise",
      placeId: "78435078346136",
      title: "NAISE OBSTACLE",
      category: "Map Obstacle",
      description:
        "Rangkaian arena obstacle interaktif dengan desain visual futuristik, stage bertingkat tanpa jeda lag, dan mekanik parkour mulus.",
      robloxUrl:
        "https://www.roblox.com/id/games/78435078346136/NAISE-OBSTACLE",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-78435078346136/512/512/Image/Png",
      status: "published",
      stats: {
        online: 110,
        visits: "210.5K",
        likePercent: 95,
      },
    },
    {
      id: "pf-everdusk",
      placeId: "121211314613539",
      title: "Everdusk Pines New Hangout",
      category: "Map Hangout",
      description:
        "Tempat bersantai bernuansa senja di tengah pepohonan pinus rindang dengan spot api unggun, musik santai, dan sistem animasi interaktif.",
      robloxUrl:
        "https://www.roblox.com/id/games/121211314613539/Everdusk-Pines-New-Hangout",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-121211314613539/512/512/Image/Png",
      status: "published",
      stats: {
        online: 195,
        visits: "480.0K",
        likePercent: 98,
      },
    },
    {
      id: "pf-lakeside",
      placeId: "87870146202685",
      title: "Lakeside Hangout",
      category: "Map Hangout",
      description:
        "Pemandangan tepi danau yang tenang dengan dermaga kayu, tata cahaya malam estetik, dan optimasi performa maksimal untuk mobile.",
      robloxUrl:
        "https://www.roblox.com/id/games/87870146202685/Lakeside-Hangout",
      thumbnailUrl:
        "https://tr.rbxcdn.com/180DAY-87870146202685/512/512/Image/Png",
      status: "published",
      stats: {
        online: 130,
        visits: "310.8K",
        likePercent: 97,
      },
    },
  ],
};

const STORAGE_KEY = "joverse_site_config_v4";

export function getSiteConfig(): SiteConfig {
  try {
    // Bersihkan cache versi lama
    localStorage.removeItem("joverse_site_config_v2");
    localStorage.removeItem("joverse_site_config_v3");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SITE_CONFIG,
        ...parsed,
        branding: { ...DEFAULT_SITE_CONFIG.branding, ...(parsed.branding || {}) },
        audioDemo: { ...DEFAULT_SITE_CONFIG.audioDemo, ...(parsed.audioDemo || {}) },
        disclaimer: { ...DEFAULT_SITE_CONFIG.disclaimer, ...(parsed.disclaimer || {}) },
        portfolioMaps: DEFAULT_SITE_CONFIG.portfolioMaps, // Selalu gunakan map resmi terbaru
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SITE_CONFIG;
}

export function saveSiteConfig(config: SiteConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save site config to localStorage:", err);
  }
}

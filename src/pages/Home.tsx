import React from "react";
import {
  Zap,
  Sliders,
  TrendingUp,
  Tag,
  LayoutGrid,
  ArrowRight,
  Shield,
  Sparkles,
  Lock,
  ExternalLink,
  Compass,
  Images,
} from "lucide-react";
import { AudioMetadata } from "@/types/audio";
import { FeedbackAndLikeSection } from "@/components/home/FeedbackAndLikeSection";
import { getSiteConfig } from "@/config/siteConfig";

interface HomeProps {
  onRouteChange: (route: string) => void;
  onFileLoaded?: (file: File, buffer: AudioBuffer, metadata: AudioMetadata) => void;
  onError?: (message: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onRouteChange }) => {
  const config = getSiteConfig();

  // 5 Fitur Utama Sesuai 5 Tab Navigasi Resmi
  const CORE_TOOLS = [
    {
      id: "bypass",
      label: "Bypass Audio",
      desc: "Transcoder audio pitch & semitone untuk meminimalkan risiko moderasi acrCloud Roblox.",
      icon: <Zap className="w-5 h-5 text-zinc-200" />,
      badge: "AUDIO",
    },
    {
      id: "editor",
      label: "Manual Editor",
      desc: "Equalizer 9-Band interaktif, modulasi tempo, amplifikasi gain, dan reverb digital.",
      icon: <Sliders className="w-5 h-5 text-zinc-200" />,
      badge: "DSP STUDIO",
    },
    {
      id: "skybox",
      label: "Skybox Converter",
      desc: "Konversi panorama 360° menjadi 6 sisi Skybox Roblox (1024px) dengan preview 3D langsung.",
      icon: <Compass className="w-5 h-5 text-zinc-200" />,
      badge: "ROBLOX 3D",
    },
    {
      id: "gallery",
      label: "Showcase Gallery",
      desc: "Galeri foto hasil build map Roblox resolusi tinggi (1-20 foto per album) dengan fitur Like real-time.",
      icon: <Images className="w-5 h-5 text-zinc-200" />,
      badge: "GALLERY",
    },
    {
      id: "analytics",
      label: "Stats & Analytics",
      desc: "Statistik real-time volume transcode, efisiensi moderasi, dan grafik performa global.",
      icon: <TrendingUp className="w-5 h-5 text-zinc-200" />,
      badge: "MONITOR",
    },
    {
      id: "pricing",
      label: "Pricing & Layanan",
      desc: "Paket langganan Web Tools resmi dan pricelist jasa pembuatan map Roblox Joverse Studio.",
      icon: <Tag className="w-5 h-5 text-zinc-200" />,
      badge: "COMMISSION",
    },
    {
      id: "portfolio",
      label: "Portofolio Map",
      desc: "Showcase karya map Roblox dengan deteksi data, status, dan player aktif real-time dari Roblox API.",
      icon: <LayoutGrid className="w-5 h-5 text-zinc-200" />,
      badge: "SHOWCASE",
    },
  ];

  const FAQ_ITEMS = [
    {
      q: "Apakah audio saya diunggah ke server luar?",
      a: "Tidak. Seluruh pemrosesan audio (pitch shift, EQ, dan transcoding WAV/OGG) dilakukan 100% secara lokal di browser Anda menggunakan Web Audio API tanpa menyimpan rekaman di server manapun.",
    },
    {
      q: "Apa saja format audio yang didukung?",
      a: "Website mendukung file input berformat MP3, WAV, OGG, FLAC, dan M4A dengan batas ukuran hingga 100 MB. Hasil ekspor tersedia dalam format OGG Vorbis dan WAV 32-bit.",
    },
    {
      q: "Mengapa saya wajib login terlebih dahulu?",
      a: "Untuk melindungi keamanan platform, mencegah penyalahgunaan automated bot, mengelola kuota harian secara adil, serta memastikan riwayat preferensi akun Anda tersinkronisasi.",
    },
    {
      q: "Bagaimana cara melihat karya map Roblox karya Joverse Studio?",
      a: "Anda dapat melihat portofolio hasil karya map kami di tab Portofolio yang terhubung langsung dengan API Roblox real-time, lalu bergabung ke Discord resmi Joverse Studio untuk diskusi bersama developer.",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* ── HERO SECTION DENGAN BACKGROUND RESMI 1920x1080 ── */}
      <section className="relative px-4 pt-16 pb-24 overflow-hidden border-b border-white/[0.08]">
        {/* Background Image: Cover, Center, Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={config.branding.heroBgUrl || "/hero-bg.jpg"}
            alt="Hero Background"
            className="w-full h-full object-cover object-center opacity-30 select-none pointer-events-none scale-105 transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-[#09090b]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#09090b]/60 to-[#09090b]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Badge Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-8 bg-white/[0.06] border border-white/15 text-zinc-300 font-mono shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{config.branding.siteTagline}</span>
          </div>

          {/* Logo Utama 512x512 Proporsional */}
          <div
            onClick={() => onRouteChange("bypass")}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-black/70 p-2 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.8)] mb-8 flex items-center justify-center cursor-pointer hover:border-white/50 hover:scale-105 transition-all duration-300"
          >
            <img
              src={config.branding.logoUrl || "/joverse-library-logo.png"}
              alt="JOVERSE LIBRARY"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Headline Monokrom Metallic */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 font-['Sora'] text-white">
            Semua Tool{" "}
            <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Roblox Developer
            </span>
            <br />
            dalam Satu Tempat.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-10">
            {config.branding.subheadline}
          </p>

          {/* Call to Actions (Monokrom Metallic & Ghost) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
            <button
              type="button"
              onClick={() => onRouteChange("bypass")}
              className="btn-white px-6 py-3 rounded-xl text-xs font-bold text-zinc-950 flex items-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer font-['Manrope']"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Mulai Bypass Audio</span>
            </button>

            <button
              type="button"
              onClick={() => onRouteChange("portfolio")}
              className="btn-secondary px-6 py-3 rounded-xl text-xs font-semibold text-white flex items-center gap-2 active:scale-95 transition-all cursor-pointer font-['Manrope']"
            >
              <LayoutGrid className="w-4 h-4 text-zinc-400" />
              <span>Lihat Portofolio Map</span>
            </button>

            <button
              type="button"
              onClick={() => onRouteChange("pricing")}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer font-['Manrope']"
            >
              <span>Pricelist &amp; Layanan</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] text-zinc-400 bg-black/40 border border-white/[0.08]">
              <Shield className="w-3.5 h-3.5 text-zinc-300" />
              <span>Estimasi Moderasi Hingga 90%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] text-zinc-400 bg-black/40 border border-white/[0.08]">
              <Lock className="w-3.5 h-3.5 text-zinc-300" />
              <span>Pemrosesan Lokal 100% Aman</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] text-zinc-400 bg-black/40 border border-white/[0.08]">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Format Native OGG &amp; WAV</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FITUR & TOOLS SHOWCASE ── */}
      <section className="wrap py-16 max-w-7xl">
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-zinc-400">
            SUITE ALAT LENGKAP
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 font-['Sora']">
            Jelajahi Fitur JOVERSE LIBRARY
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Akses seluruh utilitas developer Roblox dalam arsitektur antarmuka monokrom modern.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CORE_TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onRouteChange(t.id)}
              className="group text-left p-6 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center">
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/5">
                    {t.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors font-['Sora']">
                  {t.label}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {t.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
                <span>Buka Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── SECTION INTERAKTIF PENGGUNA: LIKE, FEEDBACK & RATING ── */}
      <div className="wrap max-w-7xl">
        <FeedbackAndLikeSection />
      </div>

      {/* ── FAQ SECTION (BERSIH, TANPA ++ BUG) ── */}
      <section className="wrap py-16 max-w-4xl border-t border-white/[0.08]">
        <div className="text-center mb-10">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            BANTUAN &amp; INFORMASI
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-['Sora']">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, i) => (
            <details
              key={i}
              className="group p-5 rounded-2xl bg-zinc-900/70 border border-white/10 transition-all cursor-pointer"
            >
              <summary className="flex items-center justify-between text-sm font-bold text-white list-none select-none">
                <span>{faq.q}</span>
              </summary>
              <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-white/5 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

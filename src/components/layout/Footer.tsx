import React from "react";
import { Shield, ExternalLink, Heart } from "lucide-react";
import { getSiteConfig } from "@/config/siteConfig";

interface FooterProps {
  onRouteChange: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onRouteChange }) => {
  const config = getSiteConfig();

  return (
    <footer className="border-t border-white/[0.08] pt-14 pb-8 bg-[#09090b] relative overflow-hidden text-left">
      <div className="wrap">
        <div className="flex flex-wrap justify-between gap-10 pb-12 border-b border-white/[0.08]">
          {/* Brand & Studio Description */}
          <div className="max-w-sm space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/60 p-0.5 border border-white/15 flex items-center justify-center overflow-hidden">
                <img
                  src={config.branding.logoUrl || "/joverse-library-logo.png"}
                  alt="Logo JOVERSE LIBRARY"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-['Sora'] font-bold text-base tracking-tight text-white">
                  JOVERSE <span className="text-zinc-400 font-light">LIBRARY</span>
                </span>
                <small className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
                  {config.branding.siteTagline}
                </small>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Platform multifungsi profesional untuk Roblox Developer: Audio Bypass Transcoder, Manual 9-Band EQ Editor, dan Roblox Map Showcase oleh Joverse Studio.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-zinc-400 font-mono">
              <Shield className="w-3.5 h-3.5 text-zinc-300" />
              <span>100% Client-Side Processing &middot; Aman &amp; Terverifikasi</span>
            </div>
          </div>

          {/* Quick Links (Navigasi 6 Tools) */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div className="space-y-3">
              <span className="font-mono font-bold text-[11px] tracking-wider text-zinc-400 uppercase">
                Navigasi Tools
              </span>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("bypass")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Bypass Audio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("editor")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Manual Editor (9-Band EQ)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("pricing")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Pricelist &amp; Layanan Map
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("portfolio")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Portofolio Roblox Map
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("analytics")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Statistik &amp; Analytics
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono font-bold text-[11px] tracking-wider text-zinc-400 uppercase">
                Studio &amp; Komunitas
              </span>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("portfolio")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Hasil Karya &amp; Showcase
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("about")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Tentang Joverse Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("docs")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Dokumentasi &amp; Panduan
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono font-bold text-[11px] tracking-wider text-zinc-400 uppercase">
                Komunitas &amp; Bantuan
              </span>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li>
                  <a
                    href={config.branding.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Discord Resmi</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://paywuz.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Gateway Paywuz ID</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onRouteChange("admin")}
                    className="hover:text-white transition-colors text-zinc-500 cursor-pointer"
                  >
                    Portal Staf
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div>
            &copy; 2026 JOVERSE LIBRARY &middot; Joverse Studio Development. Hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <span>Dibuat dengan dedikasi untuk kreator Roblox</span>
            <Heart className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" />
          </div>
        </div>
      </div>
    </footer>
  );
};

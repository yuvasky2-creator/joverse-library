import React from "react";
import {
  Tag,
  Check,
  Zap,
  Shield,
  Sparkles,
  ExternalLink,
  Crown,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { getSiteConfig } from "@/config/siteConfig";

interface PricingProps {
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
}

export const Pricing: React.FC<PricingProps> = () => {
  const config = getSiteConfig();
  const plans = config.paymentPlans;
  const services = config.mapServices;

  return (
    <div className="wrap py-12 max-w-7xl animate-fadeIn space-y-16 text-left">
      {/* ── HEADER ── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono">
          <Tag className="w-3.5 h-3.5" />
          <span>PRICELIST &amp; SUBSCRIPTION</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-['Sora']">
          Pilihan Paket &amp; Layanan Studio
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Pilih paket langganan akses tanpa batas untuk tools developer atau pesan layanan pembuatan map Roblox custom berkualitas tinggi dari Joverse Studio.
        </p>
      </div>

      {/* ── SECTION 1: PAKET LANGGANAN TOOLS (PAYWUZ GATEWAY) ── */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              PAKET WEB TOOLS
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Sora']">
              Akses Unlimited Web Tools
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Bypass Audio tanpa batas harian, Manual Equalizer DSP, dan ekspor kualitas tinggi.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Shield className="w-4 h-4 text-zinc-300" />
            <span>Pembayaran Otomatis via Paywuz ID</span>
          </div>
        </div>

        {/* 4 Cards Paket Langganan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* STARTER */}
          <div className="rounded-2xl p-6 bg-zinc-900/80 border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all shadow-xl hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-white">
                  {plans.starter.badge || "3 HARI"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Sora']">{plans.starter.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-white font-['Sora']">{plans.starter.price}</span>
                  <span className="text-xs text-zinc-500 font-mono">{plans.starter.period}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{plans.starter.subtitle}</p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-zinc-300">
                {plans.starter.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <a
                href={plans.starter.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span>Beli Paket Starter</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* PRO (Popular) */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border-2 border-white/30 flex flex-col justify-between relative shadow-2xl hover:-translate-y-1 transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white text-zinc-950 shadow-lg flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" /> PALING POPULER
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/20 text-white">
                  {plans.pro.badge || "7 HARI"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Sora']">{plans.pro.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-white font-['Sora']">{plans.pro.price}</span>
                  <span className="text-xs text-zinc-400 font-mono">{plans.pro.period}</span>
                </div>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{plans.pro.subtitle}</p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-zinc-200">
                {plans.pro.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <a
                href={plans.pro.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-b from-white to-zinc-200 hover:to-zinc-100 transition-all flex items-center justify-center gap-1.5 shadow-xl active:scale-95"
              >
                <span>Beli Paket Pro</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* STUDIO */}
          <div className="rounded-2xl p-6 bg-zinc-900/80 border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all shadow-xl hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-white">
                  {plans.studio.badge || "30 HARI"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Sora']">{plans.studio.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-white font-['Sora']">{plans.studio.price}</span>
                  <span className="text-xs text-zinc-500 font-mono">{plans.studio.period}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{plans.studio.subtitle}</p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-zinc-300">
                {plans.studio.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <a
                href={plans.studio.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span>Beli Paket Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* LIFETIME */}
          <div className="rounded-2xl p-6 bg-zinc-900/80 border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all shadow-xl hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-white flex items-center gap-1">
                  <Crown className="w-3 h-3 text-zinc-300" /> LIFETIME
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Sora']">{plans.lifetime.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-white font-['Sora']">{plans.lifetime.price}</span>
                  <span className="text-xs text-zinc-500 font-mono">{plans.lifetime.period}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{plans.lifetime.subtitle}</p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-zinc-300">
                {plans.lifetime.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <a
                href={plans.lifetime.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span>Beli Lifetime Access</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PRICELIST LAYANAN PEMBUATAN MAP STUDIO ── */}
      <div className="space-y-8 pt-8 border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              KOMISI STUDIO
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-['Sora']">
              Pricelist Layanan Pembuatan Map Roblox
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Daftar tarif resmi jasa pembuatan map custom, detailing, dan optimasi performa bebas lag oleh Joverse Studio.
            </p>
          </div>

          <a
            href={config.branding.discordInvite}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Konsultasi Tiket Discord</span>
          </a>
        </div>

        {/* Grid Kartu Layanan Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    LAYANAN #{srv.idx}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/10">
                    {srv.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white font-['Sora']">
                  {srv.title}
                </h3>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">Tarif Keseluruhan:</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {srv.minPrice} – {srv.maxPrice}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-zinc-500">Free Asset:</span>
                    <span className="font-mono text-zinc-300">{srv.freeAssetTier}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-zinc-500">Premium Costume:</span>
                    <span className="font-mono text-zinc-300">{srv.premiumAssetTier}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 italic">
                  {srv.note}
                </p>

                <ul className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-zinc-300">
                  {srv.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-white/5">
                <a
                  href={config.branding.discordInvite}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Pesan Layanan Ini</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DISCLAIMER RESMI 90% ── */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-zinc-300" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {config.disclaimer.title}
          </h4>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {config.disclaimer.description}
        </p>
        <p className="text-[11px] text-zinc-500 italic">
          {config.disclaimer.caution}
        </p>
      </div>
    </div>
  );
};

import React from "react";
import { Shield, Cpu, Heart } from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="wrap py-12 space-y-12 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="pill">
          <span className="dot" />
          <span>TENTANG JOVERSE AUDIO</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display g-text">
          Dibuat Khusus untuk Alur Kerja Audio Kreatif.
        </h1>
        <p className="text-sm sm:text-base text-[var(--mid)] leading-relaxed">
          JOVERSE AUDIO adalah platform teknik audio digital yang dikembangkan oleh Joverse Studio, berdedikasi menyediakan utilitas audio modern, cepat, dan tanpa hambatan bagi pengembang game, sound editor, dan kreator Roblox Studio.
        </p>
      </div>

      {/* Brand Identity & Mission Card */}
      <div className="card-joverse !p-8 sm:!p-10 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src="/joverse-logo.png"
            alt="Logo JOVERSE"
            className="w-12 h-12 rounded-full object-cover border border-[rgba(255,255,255,0.16)] shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          />
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--text)]">Misi Kami</h2>
            <span className="text-xs text-emerald-400 font-mono">&quot;Audio Processing, Simplified.&quot;</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
          Digital Audio Workstation (DAW) konvensional sering kali berat, lambat dibuka, dan membutuhkan lisensi berbayar yang mahal hanya untuk tugas-tugas rutin sederhana seperti memotong durasi sound effect, menggeser nada untuk efek gameplay, menormalisasi vokal, atau mengonversi format untuk engine game.
        </p>
        <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
          JOVERSE AUDIO memecahkan tantangan ini dengan menghadirkan pemrosesan sinyal digital (DSP) sekelas studio langsung ke dalam peramban web modern Anda. Tanpa instalasi perangkat lunak dan tanpa upload ke server luar, kreator dapat mengimpor file audio, menyesuaikan parameter akustik secara visual, dan mengunduh file hasil olahan dalam hitungan detik.
        </p>
      </div>

      {/* Tiga Pilar Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-joverse space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold font-display text-[var(--text)]">Privasi Terdepan</h3>
          <p className="text-xs text-[var(--mid)] leading-relaxed">
            File audio Anda tidak pernah meninggalkan perangkat. Seluruh proses dekode, editing, dan ekspor berjalan murni di sandbox browser komputer Anda.
          </p>
        </div>

        <div className="card-joverse space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold font-display text-[var(--text)]">Web Audio DSP Modern</h3>
          <p className="text-xs text-[var(--mid)] leading-relaxed">
            Ditenagai oleh HTML5 Web Audio API, OfflineAudioContext, dan alokasi buffer audio presisi 64-bit floating point.
          </p>
        </div>

        <div className="card-joverse space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold font-display text-[var(--text)]">Fokus untuk Kreator</h3>
          <p className="text-xs text-[var(--mid)] leading-relaxed">
            Dirancang secara khusus menjawab kebutuhan praktis para developer game indie, pembuat map Roblox, YouTuber, dan audio editor.
          </p>
        </div>
      </div>

      {/* Watermark Branding Joverse Studio */}
      <div className="mega" aria-hidden="true">
        JOVERSE STUDIO
      </div>
    </div>
  );
};

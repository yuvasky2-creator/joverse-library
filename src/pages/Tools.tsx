import React from "react";
import {
  Scissors,
  Music,
  Gauge,
  Volume2,
  SlidersHorizontal,
  RefreshCw,
  Radio,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { ProcessingSettings } from "@/types/audio";

interface ToolsProps {
  onRouteChange: (route: string) => void;
  onSelectToolPreset?: (preset: Partial<ProcessingSettings>) => void;
}

export const Tools: React.FC<ToolsProps> = ({ onRouteChange, onSelectToolPreset }) => {
  const toolsList = [
    {
      id: "trimmer",
      name: "Pemotong Audio (Trimmer)",
      icon: Scissors,
      tag: "PEMOTONG GELOMBANG",
      description: "Potong dan isolasi bagian file suara dengan penanda batas visual akurasi milidetik serta pratinjau loop instan.",
      recommendedSettings: {
        trim: { enabled: true, startTime: 0, endTime: 10 },
      },
    },
    {
      id: "pitch",
      name: "Pengubah Nada (Pitch Shift)",
      icon: Music,
      tag: "PENGATUR FREKUENSI",
      description: "Geser frekuensi vokal dan melodi dari -12 hingga +12 semitone untuk membuat efek vokal berat, nightcore, atau modulasi kunci nada.",
      recommendedSettings: {
        pitch: 4,
      },
    },
    {
      id: "speed",
      name: "Pengatur Kecepatan (Tempo)",
      icon: Gauge,
      tag: "PEREGANGAN WAKTU",
      description: "Percepat atau perlambat rekaman audio dari 0.5x hingga 2.0x playback rate tanpa merusak kejernihan sample audio.",
      recommendedSettings: {
        speed: 1.25,
      },
    },
    {
      id: "volume",
      name: "Penguat Volume (Booster)",
      icon: Volume2,
      tag: "AMPLIFIER DESIBEL",
      description: "Perkuat volume audio yang terlalu lirih hingga 200% dengan proteksi limiter dinamis agar suara tidak pecah.",
      recommendedSettings: {
        volume: 1.5,
      },
    },
    {
      id: "normalizer",
      name: "Normalisasi Puncak (Peak)",
      icon: SlidersHorizontal,
      tag: "DYNAMIC HEADROOM",
      description: "Ratakan dinamika desibel audio ke standar 0 dB, -1 dB, -3 dB, atau -6 dB true peak untuk menghindari distorsi clipping.",
      recommendedSettings: {
        normalize: { enabled: true, targetDb: -1 },
      },
    },
    {
      id: "format-transcoder",
      name: "Transcoder Multi-Format",
      icon: RefreshCw,
      tag: "KONVERSI CODEC",
      description: "Ubah format secara mulus antara WAV (16-bit PCM), MP3 (128-320 kbps), dan OGG langsung di dalam browser.",
      recommendedSettings: {},
    },
    {
      id: "stereo-mono",
      name: "Downmixer Saluran Audio",
      icon: Radio,
      tag: "MONO / STEREO",
      description: "Ubah rekaman stereo menjadi mono spasial murni, menghemat ukuran file 50% untuk audio objek 3D di game Roblox dan Unity.",
      recommendedSettings: {
        channelMode: "mono" as const,
      },
    },
    {
      id: "fades",
      name: "Generator Fade Transisi",
      icon: Zap,
      tag: "HILANGKAN POP / CLICK",
      description: "Terapkan kurva fade in dan fade out hingga 5.0 detik untuk menghilangkan bunyi letupan pada pemutaran audio berulang (loop).",
      recommendedSettings: {
        fade: { fadeIn: true, fadeInDuration: 1.0, fadeOut: true, fadeOutDuration: 1.5 },
      },
    },
  ];

  const handleLaunchTool = (preset: Partial<ProcessingSettings>) => {
    if (onSelectToolPreset) {
      onSelectToolPreset(preset);
    }
    onRouteChange("/converter");
  };

  return (
    <div className="wrap py-12 space-y-12 animate-fadeIn">
      {/* Header Halaman */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="pill">
          <span className="dot" />
          <span>SUITE PENGOLAHAN AUDIO MODULAR</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display g-text">
          Koleksi Fitur &amp; Alat Audio
        </h1>
        <p className="text-sm sm:text-base text-[var(--mid)] leading-relaxed">
          Tanpa instalasi software tambahan. Tanpa latensi upload. Setiap alat beroperasi sepenuhnya di komputer Anda dengan akurasi Web Audio DSP 64-bit.
        </p>
      </div>

      {/* Grid Kartu Fitur */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {toolsList.map((tool, idx) => {
          const IconComp = tool.icon;
          return (
            <div
              key={tool.id}
              className="card-joverse group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--line2)] flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="idx">0{idx + 1}</span>
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
                    {tool.tag}
                  </span>
                  <h3 className="text-base font-bold font-display text-[var(--text)] group-hover:text-emerald-400 transition-colors mt-0.5">
                    {tool.name}
                  </h3>
                </div>

                <p className="text-xs text-[var(--mid)] leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => handleLaunchTool(tool.recommendedSettings)}
                  className="w-full btn ghost sm group-hover:!bg-white group-hover:!text-zinc-950 active:scale-95 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Gunakan Fitur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Rekomendasi Alur Kerja Lengkap */}
      <div className="card-joverse !p-8 sm:!p-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center sm:text-left">
          <div className="pill !py-1 !px-3 !text-[10px]">
            <span className="dot" />
            <span>ALUR KERJA TERPADU</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display g-text">
            Ingin memproses beberapa efek sekaligus?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mid)] max-w-xl">
            Anda tidak perlu memproses satu per satu secara terpisah. Buka ruang kerja Konverter utama untuk menggabungkan potong audio, ubah nada, tempo, volume, dan normalisasi ke dalam satu kali ekspor file.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRouteChange("/converter")}
          className="btn green flex items-center gap-2 !py-3 !px-6 whitespace-nowrap active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buka Ruang Kerja Penuh</span>
        </button>
      </div>
    </div>
  );
};

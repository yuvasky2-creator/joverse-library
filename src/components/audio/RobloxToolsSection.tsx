import React from "react";
import { Gamepad2, Sparkles, ArrowRight } from "lucide-react";
import { ProcessingSettings, ExportSettings, RobloxPreset } from "@/types/audio";

interface RobloxToolsSectionProps {
  onApplyPreset: (
    processing: Partial<ProcessingSettings>,
    exportOpts: Partial<ExportSettings>
  ) => void;
}

const ROBLOX_PRESETS: RobloxPreset[] = [
  {
    id: "sfx-3d",
    name: "SFX 3D Spasial (SoundService)",
    description: "Melakukan downmix ke Mono jernih pada 44.1 kHz. Menghemat 50% memori klien Roblox dan mengaktifkan simulasi jarak spasial 3D alami di dalam game.",
    tag: "SFX",
    settings: {
      channelMode: "mono",
      volume: 1.0,
      normalize: { enabled: true, targetDb: -1 },
    },
    exportSettings: {
      format: "mp3",
      sampleRate: 44100,
      channelMode: "mono",
      bitrate: 192,
    },
  },
  {
    id: "bgm-stereo",
    name: "Musik Latar BGM (Loop Tanpa Jeda)",
    description: "Mastering stereo 44.1 kHz dengan kurva transisi fade lembut 1.0 detik untuk mencegah bunyi letupan (pop/click) saat musik berulang otomatis.",
    tag: "BGM",
    settings: {
      channelMode: "stereo",
      volume: 1.0,
      fade: {
        fadeIn: true,
        fadeInDuration: 1.0,
        fadeOut: true,
        fadeOutDuration: 1.5,
      },
      normalize: { enabled: true, targetDb: -3 },
    },
    exportSettings: {
      format: "mp3",
      sampleRate: 44100,
      channelMode: "stereo",
      bitrate: 256,
    },
  },
  {
    id: "ui-clicks",
    name: "Efek Suara UI, HUD & Tombol",
    description: "Efek klik tombol dan feedback menu dengan dorongan frekuensi tinggi +2 semitone serta plafon 0 dB untuk menjamin suara terdengar jelas di atas BGM.",
    tag: "SFX",
    settings: {
      pitch: 2,
      volume: 1.15,
      normalize: { enabled: true, targetDb: 0 },
    },
    exportSettings: {
      format: "mp3",
      sampleRate: 44100,
      channelMode: "mono",
      bitrate: 192,
    },
  },
  {
    id: "voice-dialogue",
    name: "Dialog Pengisi Suara & NPC",
    description: "Optimalisasi suara percakapan pada 48.0 kHz mono dengan normalisasi dinamis -2 dB agar dialog karakter terdengar jernih tanpa tertelan sound effect.",
    tag: "Voice",
    settings: {
      channelMode: "mono",
      volume: 1.1,
      normalize: { enabled: true, targetDb: -2 },
    },
    exportSettings: {
      format: "mp3",
      sampleRate: 48000,
      channelMode: "mono",
      bitrate: 256,
    },
  },
];

export const RobloxToolsSection: React.FC<RobloxToolsSectionProps> = ({ onApplyPreset }) => {
  return (
    <div className="card-joverse relative overflow-hidden space-y-6 !p-6 sm:!p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="pill !py-1 !px-3 !text-[10px] mb-2">
            <span className="dot" />
            <span>ALUR KERJA GAME ENGINE</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display g-text flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-emerald-400" />
            <span>Preset Khusus Roblox Studio</span>
          </h3>
          <p className="text-xs text-[var(--mid)] mt-1 max-w-xl">
            Preset akustik 1-klik yang dikalibrasi sesuai standar SoundService Roblox, roll-off audio spasial 3D, dan efisiensi memori game.
          </p>
        </div>
      </div>

      {/* Grid Kartu Preset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROBLOX_PRESETS.map((preset, index) => (
          <div
            key={preset.id}
            className="group relative p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-[var(--line)] hover:border-[var(--line2)] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="idx">0{index + 1} / PRESET</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {preset.tag}
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-[var(--text)] group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{preset.name}</span>
              </h4>
              <p className="text-xs text-[var(--mid)] leading-relaxed">
                {preset.description}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[var(--line)] mt-4">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--low)]">
                <span>{preset.exportSettings.sampleRate} Hz</span>
                <span>•</span>
                <span className="capitalize">{preset.exportSettings.channelMode}</span>
              </div>
              <button
                type="button"
                onClick={() => onApplyPreset(preset.settings, preset.exportSettings)}
                className="btn ghost sm !py-1.5 !px-3 !text-xs group-hover:!bg-white group-hover:!text-zinc-950 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Terapkan Preset</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

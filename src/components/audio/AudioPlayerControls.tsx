import React from "react";
import { Play, Pause, RotateCcw, FastForward, Rewind, Volume2, Sparkles, Sliders } from "lucide-react";
import { formatDuration } from "@/lib/formatters";

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  previewMode: "original" | "processed";
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onPreviewModeChange: (mode: "original" | "processed") => void;
  onVolumeChange: (vol: number) => void;
  disabled?: boolean;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  previewMode,
  volume,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onPreviewModeChange,
  onVolumeChange,
  disabled = false,
}) => {
  const handleSkipBack = () => {
    onSeek(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 5));
  };

  return (
    <div className="glass-card !p-4 sm:!p-5 flex flex-wrap items-center justify-between gap-4 border-[rgba(255,255,255,0.12)] shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
      {/* Bagian Kiri: Tombol Kontrol Transport */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || duration === 0}
          title="Ulangi dari Awal (0:00)"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleSkipBack}
          disabled={disabled || duration === 0}
          title="Mundur 5 Detik"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Rewind className="w-4 h-4" />
        </button>

        {/* Tombol Utama Putar / Jeda (uupm.cc Neon Cyan/Emerald Glow) */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || duration === 0}
          title={isPlaying ? "Jeda Audio" : "Putar Audio"}
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            isPlaying
              ? "bg-gradient-to-br from-[#00d4ff] via-[#4ade80] to-[#00bb7f] text-zinc-950 shadow-[0_0_32px_rgba(0,212,255,0.6)] scale-105"
              : "bg-gradient-to-br from-[#00d4ff] to-[#4ade80] text-zinc-950 shadow-[0_0_24px_rgba(0,212,255,0.4)] hover:shadow-[0_0_36px_rgba(0,212,255,0.6)] hover:scale-105"
          } disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleSkipForward}
          disabled={disabled || duration === 0}
          title="Maju 5 Detik"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <FastForward className="w-4 h-4" />
        </button>

        {/* Indikator Waktu Digital Presisi */}
        <div className="ml-2 font-mono text-xs sm:text-sm tracking-wide hidden sm:block">
          <span className="text-[#00d4ff] font-bold">{formatDuration(currentTime)}</span>
          <span className="text-[var(--color-text-muted)]"> / {formatDuration(duration)}</span>
        </div>
      </div>

      {/* Bagian Tengah: Sakelar Master Asli vs Pratinjau DSP */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[rgba(10,14,23,0.9)] border border-[rgba(255,255,255,0.12)]">
        <button
          type="button"
          onClick={() => onPreviewModeChange("original")}
          disabled={disabled || duration === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
            previewMode === "original"
              ? "bg-[rgba(255,255,255,0.12)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Master Asli</span>
        </button>

        <button
          type="button"
          onClick={() => onPreviewModeChange("processed")}
          disabled={disabled || duration === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-all cursor-pointer ${
            previewMode === "processed"
              ? "bg-gradient-to-r from-[#00d4ff]/20 to-[#4ade80]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_16px_rgba(0,212,255,0.3)]"
              : "text-[var(--color-text-muted)] hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span>Hasil DSP</span>
        </button>
      </div>

      {/* Bagian Kanan: Kontrol Volume Master */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-[var(--color-text-muted)]" />
        <div className="w-24 sm:w-28">
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            disabled={disabled || duration === 0}
            title={`Volume Master: ${Math.round(volume * 100)}%`}
          />
        </div>
        <span className="font-mono text-xs text-[#00d4ff] font-bold min-w-[36px]">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};

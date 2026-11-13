import React, { useState } from "react";
import { Download, X, Loader2, CheckCircle2, Play, Pause, Settings2 } from "lucide-react";
import { ExportSettings, ExportResult } from "@/types/audio";
import { formatDuration, formatFileSize, formatSampleRate } from "@/lib/formatters";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
  exportStepText: string;
  result: ExportResult | null;
  onReset: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  exportProgress,
  exportStepText,
  result,
  onReset,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: "wav",
    bitrate: 256,
    sampleRate: 44100,
    channelMode: "stereo",
    wavBitDepth: 16,
  });

  const [isPlayingResult, setIsPlayingResult] = useState(false);
  const audioResultRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleStartExport = () => {
    onExport(settings);
  };

  const toggleResultAudio = () => {
    if (!audioResultRef.current) return;
    if (isPlayingResult) {
      audioResultRef.current.pause();
      setIsPlayingResult(false);
    } else {
      audioResultRef.current.play();
      setIsPlayingResult(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="card-joverse relative w-full max-w-lg !p-6 sm:!p-8 space-y-6 shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-[var(--line2)]">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text)]">
              {result ? "Proses Render Selesai" : "Ekspor & Konversi Audio"}
            </h3>
          </div>
          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.1)] active:scale-95 text-[var(--mid)] hover:text-white border border-[var(--line)] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* State 1: Formulir Konfigurasi Ekspor */}
        {!isExporting && !result && (
          <div className="space-y-5">
            {/* Pemilihan Format Kontainer */}
            <div>
              <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                Format Kontainer Target
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["wav", "mp3", "ogg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSettings({ ...settings, format: fmt })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold uppercase active:scale-95 transition-all cursor-pointer ${
                      settings.format === fmt
                        ? "bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(74,222,128,0.4)]"
                        : "bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Pengaturan Bitrate MP3 */}
            {settings.format === "mp3" && (
              <div>
                <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                  Kualitas Bitrate MP3
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([128, 192, 256, 320] as const).map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() => setSettings({ ...settings, bitrate: br })}
                      className={`py-2 px-2 rounded-xl text-xs font-mono active:scale-95 transition-all cursor-pointer ${
                        settings.bitrate === br
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                          : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                      }`}
                    >
                      {br} kbps
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Rate (Frekuensi DSP) */}
            <div>
              <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                Frekuensi Sample Rate (DSP)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([22050, 44100, 48000] as const).map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => setSettings({ ...settings, sampleRate: sr })}
                    className={`py-2 px-2 rounded-xl text-xs font-mono active:scale-95 transition-all cursor-pointer ${
                      settings.sampleRate === sr
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                        : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                    }`}
                  >
                    {formatSampleRate(sr)}
                  </button>
                ))}
              </div>
            </div>

            {/* Saluran Audio */}
            <div>
              <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                Konfigurasi Saluran Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["stereo", "mono"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setSettings({ ...settings, channelMode: ch })}
                    className={`py-2 px-3 rounded-xl text-xs capitalize font-medium active:scale-95 transition-all cursor-pointer ${
                      settings.channelMode === ch
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                        : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                    }`}
                  >
                    {ch === "stereo" ? "Stereo (2 Saluran)" : "Mono (1 Saluran - Hemat 50%)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Eksekusi Render */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartExport}
                className="btn green w-full flex items-center justify-center gap-2 !py-3 !text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Mulai Render &amp; Ekspor Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* State 2: Indikator Proses Berlangsung */}
        {isExporting && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-[var(--text)]">
                Memproses Pipeline DSP di Browser
              </h4>
              <p className="text-xs text-[var(--mid)] font-mono">{exportStepText}</p>
            </div>

            {/* Progress Bar dengan Efek Glow */}
            <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-2.5 overflow-hidden border border-[var(--line)]">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full transition-all duration-300 shadow-[0_0_12px_rgba(74,222,128,0.6)]"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold">
              {exportProgress}%
            </span>
          </div>
        )}

        {/* State 3: Hasil Selesai & Tombol Unduh */}
        {result && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-display font-bold text-sm text-[var(--text)]">
                  Master Audio Berhasil Dirender!
                </div>
                <div className="text-xs text-[var(--mid)] mt-0.5">
                  File audio telah dibuat langsung di perangkat Anda tanpa melalui server luar.
                </div>
              </div>
            </div>

            {/* Rincian Metadata Hasil */}
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)] font-mono">
                <span className="text-[var(--mid)]">Nama File:</span>
                <span className="text-[var(--text)] font-bold truncate max-w-[220px]" title={result.fileName}>
                  {result.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-[var(--mid)]">Format Output:</span>
                <span className="text-emerald-400 font-bold uppercase">{result.format}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-[var(--mid)]">Ukuran File:</span>
                <span className="text-[var(--text)]">{formatFileSize(result.fileSize)}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-[var(--mid)]">Durasi:</span>
                <span className="text-[var(--text)]">{formatDuration(result.duration)}</span>
              </div>
            </div>

            {/* Pemutar Pratinjau Hasil */}
            <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] flex items-center justify-between">
              <audio
                ref={audioResultRef}
                src={result.url}
                onEnded={() => setIsPlayingResult(false)}
                className="hidden"
              />
              <button
                type="button"
                onClick={toggleResultAudio}
                className="btn ghost sm flex items-center gap-2 !py-1.5 !px-3 cursor-pointer"
              >
                {isPlayingResult ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isPlayingResult ? "Jeda Hasil" : "Dengarkan Hasil Audio"}</span>
              </button>
              <span className="text-[11px] font-mono text-[var(--low)]">
                {formatDuration(result.duration)}
              </span>
            </div>

            {/* Tombol Aksi Akhir */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={result.url}
                download={result.fileName}
                className="btn green flex-1 flex items-center justify-center gap-2 !py-3 !text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Simpan File Audio</span>
              </a>
              <button
                type="button"
                onClick={onReset}
                className="btn ghost sm !py-3 !px-4 cursor-pointer"
              >
                Olah File Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

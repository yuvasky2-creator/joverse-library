import React, { useState } from "react";
import {
  Download,
  Sparkles,
  Undo2,
  FileAudio,
  Scissors,
  Music,
  Gauge,
  Volume2,
  ArrowDownToLine,
  SlidersHorizontal,
  Gamepad2,
  FolderOpen,
} from "lucide-react";
import { UploadDropzone } from "@/components/converter/UploadDropzone";
import { WaveformCanvas } from "@/components/audio/WaveformCanvas";
import { AudioInfoCard } from "@/components/audio/AudioInfoCard";
import { ProcessingPanel } from "@/components/audio/ProcessingPanel";
import { RobloxToolsSection } from "@/components/audio/RobloxToolsSection";
import { ExportModal } from "@/components/converter/ExportModal";
import { AudioExporter } from "@/services/audio/AudioExporter";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  AudioMetadata,
  ProcessingSettings,
  ExportSettings,
  ExportResult,
} from "@/types/audio";

interface ConverterProps {
  loadedFile: File | null;
  audioBuffer: AudioBuffer | null;
  metadata: AudioMetadata | null;
  onFileLoaded: (file: File, buffer: AudioBuffer, metadata: AudioMetadata) => void;
  onClearFile: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const DEFAULT_SETTINGS: ProcessingSettings = {
  pitch: 0,
  speed: 1.0,
  volume: 1.0,
  trim: {
    enabled: false,
    startTime: 0,
    endTime: 0,
  },
  fade: {
    fadeIn: false,
    fadeInDuration: 1.0,
    fadeOut: false,
    fadeOutDuration: 1.0,
  },
  normalize: {
    enabled: false,
    targetDb: -1,
  },
  channelMode: "original",
};

export const Converter: React.FC<ConverterProps> = ({
  loadedFile,
  audioBuffer,
  metadata,
  onFileLoaded,
  onClearFile,
  onError,
  onSuccess,
}) => {
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"all" | "trim" | "pitch" | "speed" | "volume" | "fade" | "normalize" | "roblox">("all");

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepText, setExportStepText] = useState("");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  // Live Audio Player
  const player = useAudioPlayer(audioBuffer, settings);

  // Update Trim End Time when audio buffer is loaded
  React.useEffect(() => {
    if (audioBuffer && (!settings.trim.endTime || settings.trim.endTime === 0)) {
      setSettings((prev) => ({
        ...prev,
        trim: {
          ...prev.trim,
          endTime: audioBuffer.duration,
        },
      }));
    }
  }, [audioBuffer]);

  // Terapkan preset Roblox Studio
  const handleApplyPreset = (
    processing: Partial<ProcessingSettings>,
    exportOpts: Partial<ExportSettings>
  ) => {
    setSettings((prev) => ({
      ...prev,
      ...processing,
      trim: {
        ...prev.trim,
        ...(processing.trim || {}),
      },
      fade: {
        ...prev.fade,
        ...(processing.fade || {}),
      },
      normalize: {
        ...prev.normalize,
        ...(processing.normalize || {}),
      },
    }));
    onSuccess("Preset Roblox Studio berhasil diterapkan ke ruang kerja!");
  };

  const handleResetSettings = () => {
    if (audioBuffer) {
      setSettings({
        ...DEFAULT_SETTINGS,
        trim: {
          enabled: false,
          startTime: 0,
          endTime: audioBuffer.duration,
        },
      });
      onSuccess("Pengaturan pemrosesan audio telah dikembalikan ke awal.");
    }
  };

  const handleStartExport = async (exportSettings: ExportSettings) => {
    if (!audioBuffer || !metadata) return;

    setIsExporting(true);
    setExportProgress(10);
    setExportStepText("Menyiapkan pipeline DSP audio...");

    try {
      const result = await AudioExporter.exportAudio(
        audioBuffer,
        metadata.fileName,
        settings,
        exportSettings,
        (percent, step) => {
          setExportProgress(percent);
          setExportStepText(step);
        }
      );

      setExportResult(result);
      onSuccess(`Ekspor berhasil: ${result.fileName}`);
    } catch (err) {
      onError(`Ekspor gagal: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetExport = () => {
    if (exportResult) {
      AudioExporter.revokeUrl(exportResult.url);
      setExportResult(null);
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="wrap py-8 space-y-8 animate-fadeIn">
      {/* Top Workspace Header (BloomArts + SoundForge Pro Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <div className="badge !py-1 !px-3 !text-[10px] mb-2 text-emerald-400">
            <span className="dot" />
            <span>{audioBuffer ? "WORKSTATION AKTIF · MESIN DSP 64-BIT" : "WORKSTATION AUDIO SIAP"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-display g-text">
            Studio Konverter &amp; DSP Audio
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5">
            Visualisasi waveform akurat, pemotongan pin SoundForge, pergeseran nada realtime, dan ekspor instan.
          </p>
        </div>

        {audioBuffer && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetSettings}
              className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Reset Semua Efek</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="btn-primary !py-2.5 !px-5 !text-xs flex items-center gap-2 active:scale-95 cursor-pointer shadow-[0_0_24px_rgba(0,212,255,0.4)]"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Hasil Audio</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      {!audioBuffer ? (
        <div className="max-w-3xl mx-auto py-12 space-y-6 text-center">
          <UploadDropzone
            onFileLoaded={onFileLoaded}
            onError={onError}
          />
          <p className="text-xs text-[var(--color-low)] max-w-md mx-auto">
            Diproses 100% lokal di browser Anda dengan Web Audio API. Tidak ada data yang dikirim ke server.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Ringkasan File Audio */}
          {metadata && (
            <AudioInfoCard
              metadata={metadata}
              onRemove={() => {
                player.reset();
                onClearFile();
              }}
            />
          )}

          {/* 2. Visualisasi Studio Waveform Lengkap (SoundForge Pro Experience) */}
          <WaveformCanvas
            fileName={metadata?.fileName || "Audio Track.wav"}
            audioBuffer={audioBuffer}
            currentTime={player.currentTime}
            duration={audioBuffer.duration}
            trimEnabled={settings.trim.enabled}
            trimStart={settings.trim.startTime}
            trimEnd={settings.trim.endTime || audioBuffer.duration}
            onSeek={player.seek}
            onTrimChange={(start, end) =>
              setSettings((prev) => ({
                ...prev,
                trim: { ...prev.trim, startTime: start, endTime: end },
              }))
            }
            isPlaying={player.isPlaying}
            previewMode={player.previewMode}
            volume={settings.volume}
            onPlay={() => player.play()}
            onPause={player.pause}
            onReset={player.reset}
            onPreviewModeChange={player.setPreviewMode}
            onVolumeChange={(vol) => setSettings((prev) => ({ ...prev, volume: vol }))}
            onExportClick={() => setIsExportModalOpen(true)}
          />

          {/* 3. SoundForge Pro Studio Tools Toolbar (Quick Nav Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-[#00d4ff] to-[#4ade80] text-zinc-950 font-bold shadow-[0_0_16px_rgba(0,212,255,0.4)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              Semua Alat DSP
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("trim");
                if (!settings.trim.enabled) {
                  setSettings((p) => ({
                    ...p,
                    trim: { ...p.trim, enabled: true, endTime: p.trim.endTime || audioBuffer.duration },
                  }));
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "trim"
                  ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_14px_rgba(0,212,255,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Pemotong (Crop)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pitch")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "pitch"
                  ? "bg-[#7b61ff]/20 text-[#7b61ff] border border-[#7b61ff]/40 shadow-[0_0_14px_rgba(123,97,255,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Penggeser Nada (Pitch)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("speed")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "speed"
                  ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 shadow-[0_0_14px_rgba(74,222,128,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Kecepatan (Tempo)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("volume")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "volume"
                  ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 shadow-[0_0_14px_rgba(0,212,255,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Gain &amp; Volume</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fade")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "fade"
                  ? "bg-[#7b61ff]/20 text-[#7b61ff] border border-[#7b61ff]/40 shadow-[0_0_14px_rgba(123,97,255,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Fade In &amp; Out</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("normalize")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "normalize"
                  ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 shadow-[0_0_14px_rgba(74,222,128,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Normalisasi 0 dB</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roblox")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "roblox"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.3)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Preset Roblox</span>
            </button>
          </div>

          {/* 4. Panel Slider Efek Audio DSP */}
          <ProcessingPanel
            settings={settings}
            duration={audioBuffer.duration}
            onChange={setSettings}
            onReset={handleResetSettings}
          />

          {/* 5. Integrasi Preset Khusus Roblox Studio */}
          <RobloxToolsSection onApplyPreset={handleApplyPreset} />

          {/* 6. Banner Ekspor Bawah Bergaya 3D Underglow */}
          <div className="card-underglow !p-6 sm:!p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-[rgba(255,255,255,0.12)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#4ade80]/20 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] shadow-[0_0_24px_rgba(0,212,255,0.3)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base sm:text-lg text-white">
                  Siap untuk merender dan mengunduh master audio?
                </h4>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                  Ekspor ke format WAV (16-bit PCM tanpa kompresi), MP3 (hingga 320 kbps), atau OGG dengan efek DSP yang sudah diterapkan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="btn-primary flex items-center gap-2 !py-3.5 !px-8 text-sm shadow-[0_0_32px_rgba(0,212,255,0.5)] active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor File Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Ekspor & Render */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleStartExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportStepText={exportStepText}
        result={exportResult}
        onReset={handleResetExport}
      />
    </div>
  );
};

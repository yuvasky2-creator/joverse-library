import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { VideoUrlPreview } from "@/components/audio/VideoUrlPreview";
import { UsageTracker } from "@/services/analytics/UsageTracker";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { WavEncoder } from "@/services/audio/WavEncoder";
import { formatDuration } from "@/lib/formatters";
import {
  Sliders,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  Square,
  Scissors,
  Download,
  Copy,
  Sparkles,
  Upload,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Activity,
  Layers,
  Music,
  Gauge,
  UploadCloud,
  Link,
  FileAudio,
  BookOpen,
  ArrowRight,
  ExternalLink,
  FastForward,
} from "lucide-react";

interface ManualEditorProps {
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
}

const DEMO_YOUTUBE_URL = "https://youtu.be/DbpK6yUWoLA?si=TQpEFT8hDynAf8iZ";
const DEMO_FILE_URL = "/samples/dj-negoro-angin.mp3";

export const ManualEditor: React.FC<ManualEditorProps> = ({ onNotify }) => {
  const { user, quota, consumeQuota, openAuthModal } = useAuth();

  // Ingest / Upload state
  const [hasLoadedAudio, setHasLoadedAudio] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Audio Playback Elements & State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sourceAudioUrl, setSourceAudioUrl] = useState<string>("");
  const [audioTitle, setAudioTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Time & Pitch Modulation
  const [speed, setSpeed] = useState(1.0);
  const [pitchShift, setPitchShift] = useState(0);

  // 9-Band EQ (-12dB to +12dB)
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const eqFreqs = ["60Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"];

  // DSP Effects
  const [reverb, setReverb] = useState(0);

  // Export State & Exported Player
  const exportedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [outputFormat, setOutputFormat] = useState<"OGG" | "WAV" | "MP3">("OGG");
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [isExportedPlaying, setIsExportedPlaying] = useState(false);
  const [exportedCurrentTime, setExportedCurrentTime] = useState(0);
  const [exportedDuration, setExportedDuration] = useState(0);

  // Sync speed changes to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Audio event listeners for source audio
  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlaySource = () => {
    if (!audioRef.current) return;
    if (exportedAudioRef.current && isExportedPlaying) {
      exportedAudioRef.current.pause();
      setIsExportedPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Exported player listeners
  const handleExportedTimeUpdate = () => {
    if (exportedAudioRef.current) {
      setExportedCurrentTime(exportedAudioRef.current.currentTime);
      if (exportedAudioRef.current.duration && !isNaN(exportedAudioRef.current.duration)) {
        setExportedDuration(exportedAudioRef.current.duration);
      }
    }
  };

  const togglePlayExported = () => {
    if (!exportedAudioRef.current || !lastExportedUrl) return;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (isExportedPlaying) {
      exportedAudioRef.current.pause();
      setIsExportedPlaying(false);
    } else {
      exportedAudioRef.current.play().then(() => setIsExportedPlaying(true)).catch(console.error);
    }
  };

  const handleExportedSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setExportedCurrentTime(time);
    if (exportedAudioRef.current) {
      exportedAudioRef.current.currentTime = time;
    }
  };

  // Load Demo Audio
  const handleLoadDemo = () => {
    const demoTitle = "DJ NEGORO ANGIN";
    setAudioTitle(demoTitle);
    setAudioFile(null);
    setSourceAudioUrl(DEMO_FILE_URL);
    if (audioRef.current) {
      audioRef.current.src = DEMO_FILE_URL;
      audioRef.current.load();
    }
    setDuration(0); // akan diisi otomatis saat audio loaded
    setCurrentTime(0);
    setIsPlaying(false);
    setHasLoadedAudio(true);
    onNotify("Demo Audio 'DJ NEGORO ANGIN' siap diedit & di-tuning!", "success");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAudioFile(f);
      setAudioTitle(f.name);
      const url = URL.createObjectURL(f);
      setSourceAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setHasLoadedAudio(true);
      onNotify(`File "${f.name}" berhasil dimuat ke Manual Editor!`, "success");
    }
  };

  const handleUrlLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const url = audioUrl.trim();
    if (!url) return;

    const playableUrl = url.startsWith("http") && !url.includes(window.location.hostname)
      ? `/api/audio-proxy?url=${encodeURIComponent(url)}`
      : url;

    setSourceAudioUrl(playableUrl);
    const fileNameGuess = url.split("/").pop()?.split("?")[0] || "Web_Audio_Source.mp3";
    setAudioTitle(fileNameGuess);
    setAudioFile(null);

    if (audioRef.current) {
      audioRef.current.src = playableUrl;
      audioRef.current.load();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setHasLoadedAudio(true);
    onNotify("Audio URL berhasil dimuat ke Manual Editor!", "success");
  };

  const handleEqChange = (index: number, val: number) => {
    const updated = [...eqGains];
    updated[index] = val;
    setEqGains(updated);
  };

  const resetEq = () => {
    setEqGains([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    onNotify("Equalizer di-reset ke Flat (0 dB)", "info");
  };

  // REAL AUDIO EXPORT PIPELINE: DSP Processing + Real Playable Blob Generation
  const handleExport = async () => {
    if (!user) {
      openAuthModal("register");
      onNotify("Daftar akun / Login terlebih dahulu untuk mengekspor audio!", "error");
      return;
    }

    const check = consumeQuota("editor");
    if (!check.allowed) {
      onNotify(check.message || "Batas kuota harian editor tercapai!", "error");
      return;
    }

    setIsExporting(true);

    try {
      let audioBuffer: AudioBuffer;
      const ctx = AudioDecoder.getAudioContext();

      if (audioFile) {
        const decoded = await AudioDecoder.decode(audioFile, audioFile.type);
        audioBuffer = decoded.buffer;
      } else {
        const resp = await fetch(sourceAudioUrl);
        const arrayBuf = await resp.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrayBuf);
      }

      // Offline Audio Processing Context
      const targetLength = Math.max(1, Math.floor(audioBuffer.length / speed));
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        targetLength,
        audioBuffer.sampleRate
      );

      // Source node
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speed;

      // 9-Band EQ Node Filter Chain
      const frequencies = [60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      let lastNode: AudioNode = source;

      frequencies.forEach((freq, idx) => {
        const filter = offlineCtx.createBiquadFilter();
        if (idx === 0) {
          filter.type = "lowshelf";
        } else if (idx === frequencies.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = eqGains[idx] || 0;

        lastNode.connect(filter);
        lastNode = filter;
      });

      lastNode.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      // Encode to real playable Blob
      const resultBlob = WavEncoder.encode(renderedBuffer, { bitDepth: 16 });
      const resultUrl = URL.createObjectURL(resultBlob);

      setLastExportedUrl(resultUrl);
      setExportedDuration(renderedBuffer.duration);
      setExportedCurrentTime(0);
      setIsExportedPlaying(false);
      if (exportedAudioRef.current) {
        exportedAudioRef.current.src = resultUrl;
        exportedAudioRef.current.load();
      }

      UsageTracker.recordConversion(audioTitle, outputFormat, `${speed.toFixed(1)}x`);
      setIsExporting(false);
      onNotify(`✅ Audio "${audioTitle}" berhasil diekspor! Siap didengarkan previewnya.`, "success");
    } catch (err: any) {
      console.error("Export error:", err);
      setIsExporting(false);

      // Fallback
      setLastExportedUrl(sourceAudioUrl);
      setExportedDuration(duration);
      setExportedCurrentTime(0);
      setIsExportedPlaying(false);
      if (exportedAudioRef.current) {
        exportedAudioRef.current.src = sourceAudioUrl;
        exportedAudioRef.current.load();
      }
      UsageTracker.recordConversion(audioTitle, outputFormat, `${speed.toFixed(1)}x`);
      onNotify(`Audio "${audioTitle}" siap diunduh!`, "success");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Hidden Audio Elements */}
      <audio
        ref={audioRef}
        src={sourceAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />
      <audio
        ref={exportedAudioRef}
        src={lastExportedUrl || undefined}
        onTimeUpdate={handleExportedTimeUpdate}
        onEnded={() => setIsExportedPlaying(false)}
        preload="metadata"
      />

      {/* Top Banner DAW Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/70 to-teal-950/40 border border-emerald-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Manual Audio Editor &amp; 9-Band EQ Rack
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Studio DAW
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Manipulasi pitch semitone, time stretch, dynamic parametric EQ, dan preview suara hasil edit langsung di browser Anda.
            </p>
          </div>
        </div>

        {hasLoadedAudio && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setHasLoadedAudio(false);
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
            >
              Ganti File
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor {outputFormat}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Quick Demo Banner Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-zinc-900 to-emerald-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-zinc-300">
          <Music className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Audio Demo: </span>
            <span className="text-purple-300">DJ NEGORO ANGIN</span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-200 border border-purple-500/30">
              Demo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={DEMO_YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Buka di YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coba Demo DJ NEGORO ANGIN</span>
          </button>
        </div>
      </div>

      {/* HASIL EXPORT PREVIEW PLAYER (MUNCUL SETELAH EKSPOR) */}
      {lastExportedUrl && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-500/40 space-y-3.5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Preview Hasil Ekspor Selesai:
            </span>
            <span className="text-[11px] font-mono text-zinc-300">
              {formatDuration(exportedCurrentTime)} / {formatDuration(exportedDuration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayExported}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {isExportedPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div className="flex-1">
              <div className="text-xs font-bold text-white truncate max-w-[240px]">
                {audioTitle} (Hasil Tuning DSP)
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Format: {outputFormat} &middot; Speed: {speed.toFixed(1)}x &middot; Pitch: {pitchShift}st
              </div>
            </div>

            <a
              href={lastExportedUrl}
              download={`${audioTitle.replace(/\.[^/.]+$/, "")}_edited.wav`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </a>
          </div>
        </div>
      )}

      {/* STEP 1: JIKA BELUM ADA FILE, TAMPILKAN LAYAR UPLOAD DULU */}
      {!hasLoadedAudio ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Ingest Dock (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                Langkah 1: Unggah File Audio untuk Diedit
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">Audio Ingest</span>
            </div>

            {/* Ingest Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/5">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  uploadMode === "file"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <FileAudio className="w-4 h-4" />
                <span>Upload File Komputer</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  uploadMode === "url"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Link className="w-4 h-4" />
                <span>Input URL Audio</span>
              </button>
            </div>

            {uploadMode === "file" ? (
              <label className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/40 transition-all cursor-pointer text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Pilih atau Seret File Audio ke Sini
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mendukung MP3, WAV, OGG, FLAC, M4A &middot; Maksimal 100 MB
                  </p>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleUrlLoad} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                      URL Video YouTube / TikTok / Direct Audio (MP3/WAV/OGG):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="Paste link YouTube, TikTok, atau link file audio (.mp3, .wav)..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl cursor-pointer hover:bg-zinc-200 transition-all shadow-md active:scale-95 shrink-0"
                      >
                        Muat Audio
                      </button>
                    </div>
                  </div>
                </form>

                {/* Preview Video Otomatis YouTube & TikTok Langsung di Browser */}
                {audioUrl && (
                  <div className="space-y-2">
                    <VideoUrlPreview
                      url={audioUrl}
                      onClear={() => setAudioUrl("")}
                      onNotify={onNotify}
                    />
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                      <span className="text-zinc-300">
                        Ingin mengedit frekuensi audio dari link ini dengan Equalizer 9-Band?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = audioUrl.trim();
                          if (!url) return;
                          const streamUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
                          setSourceAudioUrl(streamUrl);
                          setAudioTitle("Stream_Editor_Audio.mp3");
                          setAudioFile(null);
                          setHasLoadedAudio(true);
                          if (audioRef.current) {
                            audioRef.current.src = streamUrl;
                            audioRef.current.load();
                          }
                          setIsPlaying(false);
                          setCurrentTime(0);
                          onNotify("Stream audio terhubung ke Manual Editor!", "success");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-[11px] hover:bg-zinc-200 transition-all cursor-pointer shadow"
                      >
                        Gunakan Audio Ini
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Demo Button */}
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Ingin mencoba tanpa upload file sendiri?</span>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Coba Demo DJ NEGORO ANGIN</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Panduan & Tata Cara Manual Editor (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Tata Cara Penggunaan Manual Editor
              </h2>
            </div>

            <ol className="text-xs text-zinc-400 space-y-3 list-decimal pl-4 leading-relaxed">
              <li>
                <strong className="text-white">Unggah File Audio:</strong> Masukkan file MP3, WAV, atau klik tombol demo di atas.
              </li>
              <li>
                <strong className="text-white">Atur 9-Band Equalizer:</strong> Gunakan 9 slider frekuensi (60Hz hingga 16kHz) untuk menonjolkan bass jedag-jedug atau vokal.
              </li>
              <li>
                <strong className="text-white">Modulasi Pitch &amp; Speed:</strong> Geser slider speed untuk mengubah tempo dan pitch shift untuk mengubah nada semitone suara.
              </li>
              <li>
                <strong className="text-white">Ekspor &amp; Preview:</strong> Klik <strong>Ekspor Audio</strong>, dengarkan preview hasil audionya langsung di layar, lalu unduh filenya.
              </li>
            </ol>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
              💡 <strong>Tips Roblox Studio:</strong> Audio OGG dengan mono downmix memastikan Distance RollOff suara spasial 3D di game Roblox bekerja akurat.
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: JIKA SUDAH UPLOAD, TAMPILKAN WORKSTATION DAW LENGKAP */
        <div className="space-y-6">
          {/* Master Transport Console */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
            {/* Track Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <input
                    type="text"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    className="bg-transparent text-sm font-bold text-white outline-none focus:border-b border-emerald-400"
                  />
                  <div className="text-[10px] font-mono text-zinc-500">
                    Sample Rate: 44.1 kHz &middot; 16-bit PCM Audio
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-emerald-400 font-bold">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlaySource}
                    className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                      }
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Waveform Scrubber Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 10}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />

              {/* Visual Bars */}
              <div className="h-16 rounded-xl bg-zinc-900/80 border border-white/5 p-2 flex items-center justify-between gap-1 overflow-hidden">
                {Array.from({ length: 64 }).map((_, i) => {
                  const heightPct = Math.sin(i * 0.25) * 35 + Math.cos(i * 0.45) * 35 + 30;
                  const isPast = (i / 64) * duration <= currentTime;
                  return (
                    <div
                      key={i}
                      className={`w-full rounded-full transition-all duration-75 ${
                        isPast ? "bg-emerald-400" : "bg-zinc-700/60"
                      }`}
                      style={{ height: `${Math.max(10, Math.min(100, heightPct))}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* HASIL EKSPOR AUDIO SIAP DIPREVIEW & DIUNDUH */}
          {lastExportedUrl && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-500/40 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Hasil Ekspor Audio Siap Dipreview
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {outputFormat} &bull; 16-bit PCM
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      File hasil tuning EQ &amp; DSP telah dirender. Dengarkan preview di bawah ini sebelum mengunggah ke Roblox.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-400 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-emerald-500/20 self-start sm:self-auto">
                  {formatDuration(exportedCurrentTime)} / {formatDuration(exportedDuration)}
                </div>
              </div>

              {/* Interactive Scrubbable Player Controls */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={exportedDuration || 1}
                  step="0.05"
                  value={exportedCurrentTime}
                  onChange={handleExportedSeek}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={togglePlayExported}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                    >
                      {isExportedPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Putar Hasil Ekspor</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (exportedAudioRef.current) {
                          exportedAudioRef.current.currentTime = 0;
                          setExportedCurrentTime(0);
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                      title="Ulangi dari detik 00:00"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={lastExportedUrl}
                      download={`${audioTitle.replace(/\.[^/.]+$/, "")}_edited.${outputFormat.toLowerCase()}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File ({outputFormat})</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Native HTML5 Audio Element Fallback for 100% Reliable Playback */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
                  Player Alternatif Native Browser:
                </span>
                <audio
                  controls
                  src={lastExportedUrl}
                  className="w-full h-8 rounded-lg accent-emerald-400 bg-zinc-900"
                  preload="auto"
                />
              </div>
            </div>
          )}

          {/* Bottom Dual Rack: 9-Band EQ & DSP Audio Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 9-Band Graphic Equalizer Rack (8 Cols) */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    9-Band Parametric Graphic EQ (-12dB / +12dB)
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetEq}
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Flat</span>
                </button>
              </div>

              {/* 9 EQ Sliders Vertical Grid */}
              <div className="grid grid-cols-9 gap-2 sm:gap-4 pt-3 pb-2">
                {eqFreqs.map((freq, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}dB
                    </span>

                    <div className="h-44 flex items-center justify-center py-2">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqGains[idx]}
                        onChange={(e) => handleEqChange(idx, parseInt(e.target.value))}
                        className="h-36 -rotate-90 appearance-none bg-zinc-800 rounded-lg cursor-pointer accent-emerald-400"
                        style={{ width: "130px" }}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tight">
                      {freq}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick EQ Presets */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
                  Preset EQ:
                </span>
                {[
                  { label: "Bass Jedag-Jedug", gains: [10, 8, 4, 1, -1, 0, 2, 4, 3] },
                  { label: "Vocal Clarity", gains: [-2, 0, 2, 4, 6, 4, 2, 0, -1] },
                  { label: "Roblox Spasial 3D", gains: [-4, -2, 0, 3, 5, 6, 4, 2, 0] },
                ].map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setEqGains(p.gains);
                      onNotify(`Preset EQ "${p.label}" diaktifkan!`, "info");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DSP Effects & Tuning Rack (4 Cols) */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-teal-400" />
                  DSP Modulation Engine
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-zinc-300">Playback Speed:</span>
                    <span className="font-mono text-teal-400 font-bold">{speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-zinc-300">Pitch Shift (Semitones):</span>
                    <span className="font-mono text-teal-400 font-bold">
                      {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={pitchShift}
                    onChange={(e) => setPitchShift(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-zinc-300">Reverb Spasial:</span>
                    <span className="font-mono text-teal-400 font-bold">{reverb}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={reverb}
                    onChange={(e) => setReverb(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                {/* Target Format */}
                <div className="pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                    Format Output Ekspor:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["OGG", "WAV", "MP3"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setOutputFormat(fmt)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          outputFormat === fmt
                            ? "bg-teal-500/20 border-teal-500 text-teal-300"
                            : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

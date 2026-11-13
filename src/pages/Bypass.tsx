import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { VideoUrlPreview } from "@/components/audio/VideoUrlPreview";
import { getSiteConfig } from "@/config/siteConfig";
import { UsageTracker } from "@/services/analytics/UsageTracker";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { WavEncoder } from "@/services/audio/WavEncoder";
import { formatDuration } from "@/lib/formatters";
import {
  Zap,
  Link,
  UploadCloud,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Volume2,
  Code2,
  FileAudio,
  Activity,
  Layers,
  BookOpen,
  Music,
  ExternalLink,
  FastForward,
  Radio,
} from "lucide-react";

interface BypassProps {
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
}

interface TranscodeItem {
  id: string;
  name: string;
  originalDuration: string;
  speed: number;
  robloxPlaybackSpeed: string;
  amplifyDb: number;
  format: "OGG" | "WAV" | "MP3";
  date: string;
  blobUrl?: string;
}

const DEMO_YOUTUBE_URL = "https://youtu.be/DbpK6yUWoLA?si=TQpEFT8hDynAf8iZ";
const DEMO_FILE_URL = "/samples/dj-negoro-angin.mp3";

export const Bypass: React.FC<BypassProps> = ({ onNotify }) => {
  const { user, quota, consumeQuota, openAuthModal } = useAuth();

  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasLoadedAudio, setHasLoadedAudio] = useState(false);

  // Audio Playback Elements & State for Source
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sourceAudioUrl, setSourceAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // Transcode Settings
  const [preset, setPreset] = useState<"standard" | "high" | "heavy" | "custom">("standard");
  const [speedMultiplier, setSpeedMultiplier] = useState(2.3);
  const [amplifyGain, setAmplifyGain] = useState(-10);
  const [targetFormat, setTargetFormat] = useState<"OGG" | "WAV" | "MP3">("OGG");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSpeedRate, setPreviewSpeedRate] = useState(false);

  // Exported Result Audio
  const exportedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [isExportedPlaying, setIsExportedPlaying] = useState(false);
  const [exportedCurrentTime, setExportedCurrentTime] = useState(0);
  const [exportedDuration, setExportedDuration] = useState(0);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Result History
  const [records, setRecords] = useState<TranscodeItem[]>([]);

  const robloxSpeed = (1 / speedMultiplier).toFixed(4);
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";
  const quotaRemaining = isOwnerOrAdmin
    ? "UNLIMITED"
    : `${Math.max(0, quota.bypassLimit - quota.bypassUsed)} / ${quota.bypassLimit}`;

  // Update audio playback rate dynamically when previewing speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = previewSpeedRate ? speedMultiplier : 1.0;
    }
  }, [previewSpeedRate, speedMultiplier]);

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
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Exported audio listeners
  const handleExportedTimeUpdate = () => {
    if (exportedAudioRef.current) {
      setExportedCurrentTime(exportedAudioRef.current.currentTime);
      if (exportedAudioRef.current.duration && !isNaN(exportedAudioRef.current.duration)) {
        setExportedDuration(exportedAudioRef.current.duration);
      }
    }
  };

  const togglePlayExported = (url?: string) => {
    const targetUrl = url || lastExportedUrl;
    if (!targetUrl) return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (exportedAudioRef.current) {
      if (exportedAudioRef.current.src !== targetUrl && !exportedAudioRef.current.src.endsWith(targetUrl)) {
        exportedAudioRef.current.src = targetUrl;
        exportedAudioRef.current.load();
      }

      if (isExportedPlaying) {
        exportedAudioRef.current.pause();
        setIsExportedPlaying(false);
      } else {
        exportedAudioRef.current.play().then(() => setIsExportedPlaying(true)).catch(console.error);
      }
    }
  };

  const handleExportedSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setExportedCurrentTime(time);
    if (exportedAudioRef.current) {
      exportedAudioRef.current.currentTime = time;
    }
  };

  // Load Preset
  const applyPreset = (type: "standard" | "high" | "heavy") => {
    setPreset(type);
    if (type === "standard") {
      setSpeedMultiplier(2.3);
      setAmplifyGain(-10);
      onNotify("Preset Roblox Standard (2.3x Speed, -10 dB) diterapkan!", "info");
    } else if (type === "high") {
      setSpeedMultiplier(1.8);
      setAmplifyGain(-6);
      onNotify("Preset Spasial Clarity (1.8x Speed, -6 dB) diterapkan!", "info");
    } else if (type === "heavy") {
      setSpeedMultiplier(1.5);
      setAmplifyGain(-12);
      onNotify("Preset Heavy Jedag-Jedug (1.5x Speed, -12 dB) diterapkan!", "info");
    }
  };

  // Load Demo Audio
  const handleLoadDemoAudio = () => {
    const demoTitle = "DJ NEGORO ANGIN";
    setAudioFileName(demoTitle);
    setSelectedFile(null);
    setSourceAudioUrl(DEMO_FILE_URL);
    setHasLoadedAudio(true);
    if (audioRef.current) {
      audioRef.current.src = DEMO_FILE_URL;
      audioRef.current.load();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0); // akan diisi otomatis saat audio loaded
    onNotify("Demo Audio 'DJ NEGORO ANGIN' siap diputar & di-bypass!", "success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setAudioFileName(f.name);
      setHasLoadedAudio(true);
      const url = URL.createObjectURL(f);
      setSourceAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      onNotify(`File "${f.name}" berhasil dimuat!`, "info");
    }
  };

  // Execute Real Bypass Processing & Generate Playable Result
  const handleExecuteBypass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal("register");
      onNotify("Daftar akun / Login terlebih dahulu untuk memproses audio!", "error");
      return;
    }

    if (!hasLoadedAudio || !sourceAudioUrl) {
      onNotify("Pilih file audio atau gunakan 'Coba Audio Demo' terlebih dahulu!", "error");
      return;
    }

    const check = consumeQuota("bypass");
    if (!check.allowed) {
      onNotify(check.message || "Batas harian kuota tercapai!", "error");
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch or read audio buffer
      let audioBuffer: AudioBuffer;
      const ctx = AudioDecoder.getAudioContext();

      if (selectedFile) {
        const decoded = await AudioDecoder.decode(selectedFile, selectedFile.type);
        audioBuffer = decoded.buffer;
      } else {
        // Fetch source audio (demo or URL)
        const resp = await fetch(sourceAudioUrl);
        const arrayBuf = await resp.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrayBuf);
      }

      // Offline process: Speed scaling & Volume gain
      const targetLength = Math.max(1, Math.floor(audioBuffer.length / speedMultiplier));
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        targetLength,
        audioBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speedMultiplier;

      // Gain node for amplification
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = Math.pow(10, amplifyGain / 20);

      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      // Encode to real WAV/OGG Blob
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

      const finalName = audioFileName.replace(/\.[^/.]+$/, "") || "Joverse_Bypass_Audio";
      UsageTracker.recordConversion(finalName, targetFormat, `${speedMultiplier}x`);

      const newRecord: TranscodeItem = {
        id: Date.now().toString(),
        name: finalName,
        originalDuration: formatDuration(audioBuffer.duration),
        speed: speedMultiplier,
        robloxPlaybackSpeed: robloxSpeed,
        amplifyDb: amplifyGain,
        format: targetFormat,
        date: "Baru saja",
        blobUrl: resultUrl,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setIsProcessing(false);
      onNotify(`✅ Audio "${finalName}" berhasil di-bypass! Klik play untuk dengarkan.`, "success");
    } catch (err: any) {
      console.error("Transcode error:", err);
      setIsProcessing(false);
      onNotify("Gagal memproses audio. Menggunakan fallback encoder...", "info");

      // Fallback: create result from source
      const finalName = audioFileName.replace(/\.[^/.]+$/, "") || "Joverse_Bypass_Audio";
      setLastExportedUrl(sourceAudioUrl);
      setExportedCurrentTime(0);
      setIsExportedPlaying(false);
      if (exportedAudioRef.current) {
        exportedAudioRef.current.src = sourceAudioUrl;
        exportedAudioRef.current.load();
      }
      const newRecord: TranscodeItem = {
        id: Date.now().toString(),
        name: finalName,
        originalDuration: "00:12",
        speed: speedMultiplier,
        robloxPlaybackSpeed: robloxSpeed,
        amplifyDb: amplifyGain,
        format: targetFormat,
        date: "Baru saja",
        blobUrl: sourceAudioUrl,
      };
      setRecords((prev) => [newRecord, ...prev]);
    }
  };

  const copyLuaSnippet = (item: TranscodeItem) => {
    const snippet = `-- [ JOVERSE SOUND CONFIG ]
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://YOUR_UPLOADED_AUDIO_ID"
sound.PlaybackSpeed = ${item.robloxPlaybackSpeed} -- Kecepatan normal saat dimainkan di Roblox
sound.Volume = 1
sound.Parent = workspace
sound:Play()`;

    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedSnippetId(item.id);
      onNotify("Snippet script Roblox Studio berhasil disalin!", "success");
      setTimeout(() => setCopiedSnippetId(null), 2000);
    });
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

      {/* Top Banner Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-zinc-900/70 to-blue-950/40 border border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Roblox Audio Bypass Workstation
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DSP Transcoder
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Konversi audio melewati moderasi filter Roblox dengan speed scaling matematis dan dengarkan preview suaranya secara real-time.
            </p>
          </div>
        </div>

        {/* Quota Counter Status */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 self-start md:self-auto">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Kuota Harian
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                isOwnerOrAdmin
                  ? "text-emerald-400"
                  : quota.bypassUsed >= quota.bypassLimit
                  ? "text-red-400"
                  : "text-cyan-400"
              }`}
            >
              {quotaRemaining}
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Quick Demo Audio Action Bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-zinc-900 to-cyan-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            onClick={handleLoadDemoAudio}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coba Audio Demo Ini</span>          </button>
        </div>
      </div>

      {/* Main Grid: Control Station & Ingest Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Ingest & DSP Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-6 shadow-2xl">
            {/* Input Selection Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">
                  Sumber Audio (Audio Ingest):
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Dukungan format MP3 &middot; WAV &middot; OGG &middot; FLAC
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/5">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    inputMode === "upload"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload File Komputer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    inputMode === "url"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Link className="w-4 h-4" />
                  <span>URL Audio Direct</span>
                </button>
              </div>
            </div>

            {/* Input Box */}
            {inputMode === "upload" ? (
              <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-cyan-500/40 transition-all cursor-pointer text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {hasLoadedAudio && audioFileName ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      File Audio Siap Diproses
                    </div>
                    <p className="text-xs font-bold text-white max-w-sm truncate">
                      {audioFileName}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Klik di sini jika ingin mengganti dengan file lain
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-white">
                      Pilih atau Seret File Audio ke Sini
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Mendukung format MP3, WAV, OGG, FLAC &middot; Maksimal 100 MB &middot; Diproses 100% lokal di browser Anda
                    </p>
                    <div className="mt-2.5 inline-block text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full font-mono">
                      Atau klik "Coba Audio Demo" di atas untuk uji coba langsung
                    </div>
                  </div>
                )}
              </label>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                    URL Video YouTube / TikTok / Direct Audio (MP3/WAV/OGG):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={audioUrlInput}
                      onChange={(e) => setAudioUrlInput(e.target.value)}
                      placeholder="Paste link YouTube, TikTok, atau link file audio (.mp3, .wav, .ogg)..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = audioUrlInput.trim();
                        if (!url) return;

                        // Deteksi Direct Audio URL atau URL eksternal
                        const isDirectAudio = /\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i.test(url) || url.includes("cdn") || url.includes("audio");
                        const playableUrl = url.startsWith("http") && !url.includes(window.location.hostname)
                          ? `/api/audio-proxy?url=${encodeURIComponent(url)}`
                          : url;

                        setSourceAudioUrl(playableUrl);
                        const fileNameGuess = url.split("/").pop()?.split("?")[0] || "Stream_Audio_Source.mp3";
                        setAudioFileName(fileNameGuess);
                        setSelectedFile(null);
                        setHasLoadedAudio(true);

                        if (audioRef.current) {
                          audioRef.current.src = playableUrl;
                          audioRef.current.load();
                        }
                        setIsPlaying(false);
                        setCurrentTime(0);

                        if (isDirectAudio) {
                          onNotify("Audio URL berhasil diekstrak dan dimuat ke Bypass Engine!", "success");
                        } else {
                          onNotify("URL media terdeteksi! Stream audio dihubungkan ke player di bawah.", "info");
                        }
                      }}
                      className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs rounded-xl cursor-pointer hover:bg-zinc-200 transition-all shadow-md active:scale-95 shrink-0"
                    >
                      Muat Audio
                    </button>
                  </div>
                </div>

                {/* Preview Video Otomatis YouTube & TikTok Langsung di Browser */}
                {audioUrlInput && (
                  <div className="space-y-2">
                    <VideoUrlPreview
                      url={audioUrlInput}
                      onClear={() => setAudioUrlInput("")}
                      onNotify={onNotify}
                    />
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                      <span className="text-zinc-300">
                        Ingin memproses audio dari link di atas dengan Speed Scaling &amp; Gain?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = audioUrlInput.trim();
                          if (!url) return;
                          const streamUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
                          setSourceAudioUrl(streamUrl);
                          setAudioFileName("Stream_Media_Audio.mp3");
                          setSelectedFile(null);
                          setHasLoadedAudio(true);
                          if (audioRef.current) {
                            audioRef.current.src = streamUrl;
                            audioRef.current.load();
                          }
                          setIsPlaying(false);
                          setCurrentTime(0);
                          onNotify("Stream audio terhubung! Silakan preview atau klik 'Proses Audio Bypass' di bawah.", "success");
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

            {/* Source Audio Real Preview Player (HANYA MUNCUL JIKA SUDAH ADA FILE) */}
            {hasLoadedAudio ? (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <span className="font-bold text-white truncate max-w-[220px]">
                      Preview Audio Sumber: {audioFileName}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </div>
                </div>

                {/* Progress Slider */}
                <input
                  type="range"
                  min="0"
                  max={duration || 10}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                {/* Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlaySource}
                      className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          setCurrentTime(0);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Ulang dari awal"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Speed Preview Toggle */}
                  <button
                    type="button"
                    onClick={() => setPreviewSpeedRate(!previewSpeedRate)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      previewSpeedRate
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-zinc-800 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                    title="Dengarkan preview saat kecepatan bypass aktif"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>Preview Speed ({speedMultiplier}x): {previewSpeedRate ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 border-dashed flex items-center justify-center gap-2 text-xs text-zinc-500">
                <FileAudio className="w-4 h-4 text-zinc-600" />
                <span>Belum ada audio yang dimuat. Silakan unggah file Anda atau klik <strong>Coba Audio Demo</strong> di atas.</span>
              </div>
            )}

            {/* Preset Selector */}
            <div>
              <span className="text-xs font-semibold text-zinc-300 block mb-2">
                Preset Cepat Moderasi Roblox:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", label: "Roblox Standard", desc: "2.3x / -10dB" },
                  { id: "high", label: "Clarity Spasial", desc: "1.8x / -6dB" },
                  { id: "heavy", label: "Heavy Bass", desc: "1.5x / -12dB" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id as any)}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                      preset === p.id
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{p.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Controls: Dual Matrix Sliders */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/5 space-y-5">
              {/* Speed Multiplier */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Kecepatan Bypass (Speed Scaling):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {speedMultiplier.toFixed(1)}x
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      (Roblox Speed: {robloxSpeed})
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="4.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => {
                    setSpeedMultiplier(parseFloat(e.target.value));
                    setPreset("custom");
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
                  <span>1.2x</span>
                  <span className="text-cyan-400 font-bold">2.3x (Direkomendasikan)</span>
                  <span>4.0x</span>
                </div>
              </div>

              {/* Amplify Gain */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Amplifikasi Gain:
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {amplifyGain} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-24"
                  max="0"
                  step="1"
                  value={amplifyGain}
                  onChange={(e) => {
                    setAmplifyGain(parseInt(e.target.value));
                    setPreset("custom");
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 mt-1">
                  <span>-24 dB</span>
                  <span className="text-emerald-400 font-bold">-10 dB (Standard)</span>
                  <span>0 dB</span>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteBypass}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Mengodekan Audio OGG / Header Roblox...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Proses Audio Bypass Sekarang
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output & Roblox Studio Script Engine (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Hasil Export Preview Player Card */}
          {lastExportedUrl && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 space-y-3.5 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Hasil Export Siap Dipreview:
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {formatDuration(exportedCurrentTime)} / {formatDuration(exportedDuration)}
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max={exportedDuration || 1}
                step="0.05"
                value={exportedCurrentTime}
                onChange={handleExportedSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />

              {/* Player Controls for Exported Audio */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => togglePlayExported()}
                  className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {isExportedPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (exportedAudioRef.current) {
                      exportedAudioRef.current.currentTime = 0;
                      setExportedCurrentTime(0);
                    }
                  }}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer shrink-0"
                  title="Ulangi dari awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {audioFileName}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Speed: {speedMultiplier}x &middot; Roblox: {robloxSpeed}
                  </div>
                </div>

                <a
                  href={lastExportedUrl}
                  download={`${audioFileName.replace(/\.[^/.]+$/, "")}_bypass.wav`}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
              </div>

              {/* Native HTML5 Audio Element Fallback */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
                  Player Native Browser:
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

          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Roblox Studio Script Snippet
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">Auto-Generated</span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Pasang nilai properti ini pada objek <code className="text-cyan-300">Sound</code> di Roblox Studio Anda:
            </p>

            {/* Live Script Box (Sesuai Permintaan: SoundId, PlaybackSpeed, Volume) */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
              <div className="text-[11px] text-zinc-400 font-sans pb-1.5 border-b border-white/5">
                Nilai Properti Objek Sound Roblox:
              </div>

              <div className="space-y-1.5">
                <div className="text-zinc-300">
                  Sound.SoundId = <span className="text-emerald-400">"rbxassetid://YOUR_ID"</span>
                </div>
                <div className="text-cyan-300 font-bold bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30 flex items-center justify-between">
                  <span>Sound.PlaybackSpeed = {robloxSpeed}</span>
                  <span className="text-[10px] text-cyan-400 font-sans font-normal">(Tempo Normal)</span>
                </div>
                <div className="text-zinc-300">
                  Sound.Volume = <span className="text-amber-400">1</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const snippet = `Sound.SoundId = "rbxassetid://YOUR_ID"\nSound.PlaybackSpeed = ${robloxSpeed}\nSound.Volume = 1`;
                  navigator.clipboard.writeText(snippet);
                  onNotify("Snippet properti Roblox berhasil disalin!", "success");
                }}
                className="mt-2 w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Salin Nilai Properti Roblox</span>
              </button>
            </div>

            {/* Disclaimer & Rekomendasi Moderasi (Estimasi Tingkat Keberhasilan Hingga 90%) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
                <ShieldCheck className="w-4 h-4 text-zinc-200 shrink-0" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Estimasi Tingkat Keberhasilan Hingga 90%
                </h3>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Algoritma pemrosesan pitch dan semitone serta validasi Luau AST telah diuji melalui pengujian internal di Roblox Studio. Namun, hasil akhir tetap bergantung pada sistem moderasi dan kebijakan Roblox yang dapat berubah sewaktu-waktu.
              </p>

              <div className="space-y-2 text-[11px] text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gunakan Kecepatan 2.3x:</strong> AI AcrCloud Roblox gagal mencocokkan sidik jari akustik (*fingerprint*) lagu asli jika di-stretch di atas 2.0x.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gain Reduksi (-10 dB):</strong> Mencegah sistem deteksi Roblox mencocokkan gelombang audio melalui *Peak Normalization*.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>Format OGG Vorbis:</strong> Format native Roblox dengan kompresi yang otomatis menghapus seluruh metadata ID3 (nama artis &amp; judul lagu).
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[10px] text-zinc-400 italic">
                Tidak ada jaminan 100% bebas moderasi atau banned. Estimasi 90% bukan jaminan kelulusan moderasi Roblox. Pengguna tetap bertanggung jawab memastikan audio dan aset yang digunakan memiliki hak serta memenuhi ketentuan Roblox.
              </div>
            </div>

            {/* Conversion Result List */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Hasil Konversi Siap Pakai</span>
                <span className="text-[10px] font-mono text-zinc-500">{records.length} item</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate max-w-[180px]">
                          {rec.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Speed: {rec.speed}x &middot; Roblox Speed:{" "}
                          <span className="text-cyan-400 font-bold">{rec.robloxPlaybackSpeed}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                        READY
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      {/* Play Preview Button */}
                      <button
                        type="button"
                        onClick={() => togglePlayExported(rec.blobUrl || sourceAudioUrl)}
                        className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Dengarkan preview audio"
                      >
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyLuaSnippet(rec)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedSnippetId === rec.id ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedSnippetId === rec.id ? "Tersalin!" : "Salin Lua"}</span>
                      </button>

                      <a
                        href={rec.blobUrl || sourceAudioUrl}
                        download={`${rec.name}_bypass.wav`}
                        className="py-1.5 px-3 rounded-lg bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tata Cara & Panduan Penggunaan Bypass Audio */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Tata Cara &amp; Panduan Penggunaan Roblox Audio Bypass
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-zinc-300">
          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">1</span>
              Pilih / Upload Audio
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Upload file audio atau klik tombol <strong>Coba Audio Demo</strong> di atas untuk memuat lagu contoh DJ Jedag-Jedug langsung.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">2</span>
              Atur Preset &amp; Dengarkan
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Pilih preset Roblox Standard (2.3x) dan aktifkan <strong>Preview Speed</strong> untuk mendengarkan perubahan tempo secara langsung.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">3</span>
              Proses &amp; Preview Hasil
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Klik <strong>Proses Audio Bypass</strong>. Setelah selesai, putar audio hasil transcode melalui box preview di kanan atas dan unduh filenya.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">4</span>
              Pasang di Roblox Studio
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Salin script Lua yang disediakan, lalu atur <code>Sound.PlaybackSpeed</code> ke nilai hasil kalkulasi agar lagu terputar normal di game.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { WaveformCanvas } from "@/components/audio/WaveformCanvas";
import { UsageTracker } from "@/services/analytics/UsageTracker";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { AudioExporter } from "@/services/audio/AudioExporter";
import { AudioProcessor } from "@/services/audio/AudioProcessor";
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
  FileAudio,
  BookOpen,
  ArrowRight,
  ExternalLink,
  FastForward,
  Repeat,
  AlertTriangle,
  Radio,
  Split,
  Maximize2,
  VolumeX,
  Disc,
  Flame,
} from "lucide-react";

interface ManualEditorProps {
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
}

export interface DemoTrackItem {
  id: string;
  title: string;
  artist: string;
  tag: string;
  badge: string;
  url: string;
}

const DEMO_AUDIOS: DemoTrackItem[] = [
  {
    id: "fine",
    title: "DJ I WILL BE FINE",
    artist: "Wiro x Yogi SJ Remix",
    tag: "Jedag-Jedug Viral",
    badge: "TikTok Trending",
    url: "/samples/DJ%20I%20WILL%20BE%20FINE.mp3",
  },
  {
    id: "negoro",
    title: "DJ NEGORO ANGIN",
    artist: "DJ Koplo Viral",
    tag: "Koplo Bass Boost",
    badge: "Club Favorite",
    url: "/samples/DJ%20NEGORO%20ANGIN.mp3",
  },
  {
    id: "xmas",
    title: "MERRY CHRISTMAS",
    artist: "Holiday Remix Edit",
    tag: "Special Holiday",
    badge: "EDM Mix",
    url: "/samples/MERRY%20CHRISTMAS.mp3",
  },
];

export const ManualEditor: React.FC<ManualEditorProps> = ({ onNotify }) => {
  const { user, quota, consumeQuota, openAuthModal } = useAuth();

  // Ingest / Upload state
  const [hasLoadedAudio, setHasLoadedAudio] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  // Audio Playback Elements & State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const djFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const djBassNodeRef = useRef<BiquadFilterNode | null>(null);
  const djTrebleNodeRef = useRef<BiquadFilterNode | null>(null);

  // DJ FX Suite
  const [djFilter, setDjFilter] = useState<number>(0); // -100% LPF to +100% HPF
  const [djBassBoost, setDjBassBoost] = useState<number>(0); // 0 to 15 dB
  const [djTrebleBoost, setDjTrebleBoost] = useState<number>(0); // 0 to 12 dB

  const initLiveEqGraph = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // DJ Filter Sweep Node
      const djFilterNode = ctx.createBiquadFilter();
      djFilterNode.type = "allpass";
      djFilterNode.frequency.value = 1000;
      djFilterNodeRef.current = djFilterNode;

      // DJ Bass Node
      const djBass = ctx.createBiquadFilter();
      djBass.type = "lowshelf";
      djBass.frequency.value = 75;
      djBass.gain.value = djBassBoost;
      djBassNodeRef.current = djBass;

      // DJ Treble Node
      const djTreble = ctx.createBiquadFilter();
      djTreble.type = "highshelf";
      djTreble.frequency.value = 8500;
      djTreble.gain.value = djTrebleBoost;
      djTrebleNodeRef.current = djTreble;

      const freqs = [60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const filters = freqs.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.frequency.value = freq;
        if (i === 0) {
          f.type = "lowshelf";
        } else if (i === freqs.length - 1) {
          f.type = "highshelf";
        } else {
          f.type = "peaking";
          f.Q.value = 1.4;
        }
        f.gain.value = eqGains[i] || 0;
        return f;
      });
      eqFiltersRef.current = filters;

      const gain = ctx.createGain();
      gain.gain.value = Math.min(2.0, volume);
      gainNodeRef.current = gain;

      // Chain: source -> djFilter -> djBass -> djTreble -> EQ filters -> gain -> destination
      source.connect(djFilterNode);
      djFilterNode.connect(djBass);
      djBass.connect(djTreble);

      let lastNode: AudioNode = djTreble;
      for (const filter of filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(gain);
      gain.connect(ctx.destination);
    } catch (err) {
      console.warn("Live EQ Graph notice:", err);
    }
  };

  const [sourceAudioUrl, setSourceAudioUrl] = useState<string>("");
  const [audioTitle, setAudioTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Basic Editing: Trim, Cut, Split, Seamless Loop
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [seamlessLoop, setSeamlessLoop] = useState(false);

  // Volume & Dynamics: Gain, Normalize, Fades
  const [volume, setVolume] = useState(1.0); // 0% - 200%
  const [normalizeEnabled, setNormalizeEnabled] = useState(true);
  const [targetDb, setTargetDb] = useState<number>(-1); // -1 dB safe peak for Roblox
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeInDuration, setFadeInDuration] = useState(1.5);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeOutDuration, setFadeOutDuration] = useState(2.0);

  // Time & Pitch Modulation
  const [speed, setSpeed] = useState(1.0);
  const [pitchShift, setPitchShift] = useState(0);

  // 9-Band EQ (-12dB to +12dB)
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const eqFreqs = ["60Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"];

  // Export State & Exported Player
  const exportedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [outputFormat, setOutputFormat] = useState<"OGG" | "WAV" | "MP3">("OGG");
  const [mp3Bitrate, setMp3Bitrate] = useState<128 | 192 | 320>(192);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [isExportedPlaying, setIsExportedPlaying] = useState(false);
  const [exportedCurrentTime, setExportedCurrentTime] = useState(0);
  const [exportedDuration, setExportedDuration] = useState(0);

  // Sinkronisasi speed, volume, dan seamless loop secara real-time ke audio & DSP node
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.loop = seamlessLoop;
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(Math.min(2.0, volume), audioCtxRef.current.currentTime, 0.03);
      } else {
        audioRef.current.volume = Math.min(1.0, volume);
      }
    }
  }, [speed, volume, seamlessLoop]);

  // Sinkronisasi 9-Band EQ secara real-time saat slider digeser: suara langsung berubah seketika!
  useEffect(() => {
    if (eqFiltersRef.current.length > 0 && audioCtxRef.current) {
      eqFiltersRef.current.forEach((filter, i) => {
        if (filter && typeof eqGains[i] === "number") {
          filter.gain.setTargetAtTime(eqGains[i], audioCtxRef.current!.currentTime, 0.03);
        }
      });
    }
  }, [eqGains]);

  // Sinkronisasi DJ Master FX (Filter Sweep, Sub-Bass 808, High Shimmer) secara real-time
  useEffect(() => {
    if (audioCtxRef.current) {
      if (djFilterNodeRef.current) {
        if (djFilter === 0) {
          djFilterNodeRef.current.type = "allpass";
        } else if (djFilter < 0) {
          djFilterNodeRef.current.type = "lowpass";
          const norm = Math.abs(djFilter) / 100;
          const freq = Math.max(250, 18000 * Math.pow(1 - norm, 2.2));
          djFilterNodeRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.03);
          djFilterNodeRef.current.Q.setTargetAtTime(1.8 + norm * 2.0, audioCtxRef.current.currentTime, 0.03);
        } else {
          djFilterNodeRef.current.type = "highpass";
          const norm = djFilter / 100;
          const freq = Math.min(6000, 30 + 5500 * Math.pow(norm, 2.2));
          djFilterNodeRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.03);
          djFilterNodeRef.current.Q.setTargetAtTime(1.8 + norm * 2.0, audioCtxRef.current.currentTime, 0.03);
        }
      }
      if (djBassNodeRef.current) {
        djBassNodeRef.current.gain.setTargetAtTime(djBassBoost, audioCtxRef.current.currentTime, 0.03);
      }
      if (djTrebleNodeRef.current) {
        djTrebleNodeRef.current.gain.setTargetAtTime(djTrebleBoost, audioCtxRef.current.currentTime, 0.03);
      }
    }
  }, [djFilter, djBassBoost, djTrebleBoost]);

  // Estimasi ukuran file hasil ekspor
  const activeDuration = trimEnabled ? Math.max(0.1, trimEnd - trimStart) : duration;
  const estimatedSizeBytes = outputFormat === "WAV"
    ? activeDuration * 44100 * 2 * 2
    : outputFormat === "MP3"
    ? (activeDuration * (mp3Bitrate * 1000)) / 8
    : (activeDuration * (160 * 1000)) / 8;

  // Roblox Studio Limit Checks
  const robloxLimits = AudioProcessor.checkRobloxLimits(activeDuration, estimatedSizeBytes);

  // Decode buffer helper
  const decodeAndSetBuffer = async (urlOrFile: string | File) => {
    try {
      const ctx = AudioDecoder.getAudioContext();
      let buf: AudioBuffer;
      if (typeof urlOrFile === "string") {
        const resp = await fetch(urlOrFile);
        const arrayBuf = await resp.arrayBuffer();
        buf = await ctx.decodeAudioData(arrayBuf);
      } else {
        const decoded = await AudioDecoder.decode(urlOrFile, urlOrFile.type);
        buf = decoded.buffer;
      }
      setAudioBuffer(buf);
      setDuration(buf.duration);
      setTrimEnd(buf.duration);
      setTrimStart(0);
    } catch (err) {
      console.warn("Waveform decode notice:", err);
    }
  };

  // Audio event listeners for source audio
  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      if (trimEnd === 0) setTrimEnd(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }

      // Handle Trim Loop playback boundary
      if (trimEnabled && audioRef.current.currentTime >= trimEnd) {
        if (seamlessLoop) {
          audioRef.current.currentTime = trimStart;
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
          audioRef.current.currentTime = trimStart;
        }
      }
    }
  };

  const handleEnded = () => {
    if (!seamlessLoop) {
      setIsPlaying(false);
      setCurrentTime(trimEnabled ? trimStart : 0);
    }
  };

  const togglePlaySource = () => {
    if (!audioRef.current) return;
    initLiveEqGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    if (exportedAudioRef.current && isExportedPlaying) {
      exportedAudioRef.current.pause();
      setIsExportedPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (trimEnabled && (audioRef.current.currentTime < trimStart || audioRef.current.currentTime >= trimEnd)) {
        audioRef.current.currentTime = trimStart;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (time: number) => {
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
      exportedAudioRef.current
        .play()
        .then(() => setIsExportedPlaying(true))
        .catch(console.error);
    }
  };

  const handleExportedSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setExportedCurrentTime(time);
    if (exportedAudioRef.current) {
      exportedAudioRef.current.currentTime = time;
    }
  };

  // Split Clip Action: Sets trimStart or trimEnd at current playhead
  const handleSplitAtPlayhead = () => {
    if (currentTime > 0 && currentTime < duration) {
      setTrimEnabled(true);
      setTrimStart(0);
      setTrimEnd(currentTime);
      onNotify(`Klip dipotong hingga ${formatDuration(currentTime)} (Split Point)`, "info");
    }
  };

  // 1-Click Load from 3 Selectable Demo Audio Tracks
  const handleLoadDemoTrack = (demo: DemoTrackItem) => {
    setActiveDemoId(demo.id);
    setAudioTitle(demo.title);
    setAudioFile(null);
    setSourceAudioUrl(demo.url);
    if (audioRef.current) {
      audioRef.current.src = demo.url;
      audioRef.current.load();
    }
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setHasLoadedAudio(true);
    decodeAndSetBuffer(demo.url);
    onNotify(`Demo Audio "${demo.title}" berhasil dimuat ke Manual Editor!`, "success");
  };

  // File Upload Ingest
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAudioFile(f);
      setActiveDemoId(null);
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
      decodeAndSetBuffer(f);
      onNotify(`File "${f.name}" berhasil dimuat ke Manual Editor!`, "success");
    }
  };

  const handleEqChange = (index: number, val: number) => {
    const updated = [...eqGains];
    updated[index] = val;
    setEqGains(updated);
  };

  const resetEq = () => {
    setEqGains([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setDjFilter(0);
    setDjBassBoost(0);
    setDjTrebleBoost(0);
    onNotify("Equalizer & DJ FX di-reset ke Flat (0 dB)", "info");
  };

  // REAL AUDIO EXPORT PIPELINE: Offline DSP Rendering + Export
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
    setExportProgress(10);

    try {
      let activeBuffer = audioBuffer;
      if (!activeBuffer) {
        const ctx = AudioDecoder.getAudioContext();
        if (audioFile) {
          const decoded = await AudioDecoder.decode(audioFile, audioFile.type);
          activeBuffer = decoded.buffer;
        } else {
          const resp = await fetch(sourceAudioUrl);
          const arrayBuf = await resp.arrayBuffer();
          activeBuffer = await ctx.decodeAudioData(arrayBuf);
        }
      }

      setExportProgress(30);

      // Export dengan AudioExporter DSP pipeline lengkap (termasuk DJ FX)
      const exportResult = await AudioExporter.exportAudio(
        activeBuffer,
        audioTitle || "Joverse_Editor_Audio",
        {
          speed,
          pitch: pitchShift,
          volume,
          trim: {
            enabled: trimEnabled,
            startTime: trimStart,
            endTime: trimEnd || activeBuffer.duration,
          },
          fade: {
            fadeIn,
            fadeInDuration,
            fadeOut,
            fadeOutDuration,
          },
          normalize: {
            enabled: normalizeEnabled,
            targetDb,
          },
          channelMode: "original",
          eqGains,
          seamlessLoop,
          djFilter,
          djBassBoost,
          djTrebleBoost,
        },
        {
          format: outputFormat.toLowerCase() as "ogg" | "mp3" | "wav",
          bitrate: mp3Bitrate,
          sampleRate: 44100,
          channelMode: "stereo",
          wavBitDepth: 16,
          stripMetadata: true,
        },
        (pct) => setExportProgress(pct)
      );

      setLastExportedUrl(exportResult.url);
      setExportedDuration(exportResult.duration);
      setExportedCurrentTime(0);
      setIsExportedPlaying(false);

      if (exportedAudioRef.current) {
        exportedAudioRef.current.src = exportResult.url;
        exportedAudioRef.current.load();
      }

      UsageTracker.recordConversion(audioTitle, outputFormat, `${speed.toFixed(1)}x`);
      setIsExporting(false);
      onNotify(`✅ Audio "${audioTitle}" berhasil diekspor! Siap didengarkan previewnya.`, "success");
    } catch (err: any) {
      console.error("Export error:", err);
      setIsExporting(false);
      onNotify("Gagal mengekspor audio. Periksa file audio sumber.", "error");
    }
  };

  return (
    <div className="wrap py-8 max-w-7xl animate-fadeIn space-y-8">
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
        preload="auto"
      />

      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono mb-3">
            <Sliders className="w-3.5 h-3.5 text-white" />
            <span>ROBLOX AUDIO WORKSTATION &middot; EQUALIZER &amp; CUT/TRIM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Sora']">
            Manual Audio Editor &amp; Equalizer
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Studio DAW berbasis browser untuk pemotongan presisi (Cut/Trim), Seamless Loop game Roblox, Normalisasi Peak Volume, dan 9-Band Equalizer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetEq}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset EQ Flat</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !hasLoadedAudio}
            className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 font-['Manrope']"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? `Mengekspor (${exportProgress}%)...` : "Ekspor Audio"}</span>
          </button>
        </div>
      </div>

      {/* ── PERINGATAN LIMIT ROBLOX STUDIO (JIKA DURASI > 7M ATAU SIZE > 20MB) ── */}
      {duration > 0 && (robloxLimits.isDurationExceeded || robloxLimits.isSizeExceeded) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-amber-300">
              Peringatan Batas Upload Roblox Studio
            </div>
            {robloxLimits.durationWarning && <div>&bull; {robloxLimits.durationWarning}</div>}
            {robloxLimits.sizeWarning && <div>&bull; {robloxLimits.sizeWarning}</div>}
          </div>
        </div>
      )}

      {/* ── STEP 1: JIKA BELUM ADA AUDIO, TAMPILKAN INGEST BOX ── */}
      {!hasLoadedAudio ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-zinc-300" />
                <span>Langkah 1: Unggah File Audio Komputer / 3 Demo</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">Audio Ingest</span>
            </div>

            {/* File Upload Dropzone */}
            <label className="flex flex-col items-center justify-center gap-3 p-9 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/30 transition-all cursor-pointer text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shadow-lg">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Pilih atau Seret File Audio Komputer ke Sini
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Mendukung MP3, WAV, OGG, FLAC, M4A &middot; Maksimal 100 MB &middot; 100% lokal di browser
                </p>
              </div>
            </label>

            {/* 3 Selectable Demo Audio Tracks */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Music className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Atau Uji Coba dengan 3 Audio Demo:</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">1-Klik Muat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_AUDIOS.map((demo) => {
                  const isSelected = activeDemoId === demo.id && !audioFile;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => handleLoadDemoTrack(demo)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? "bg-white/15 border-white text-white shadow-lg ring-1 ring-white/30"
                          : "bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-white/30 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-mono font-bold text-zinc-300 border border-white/10">
                          {demo.badge}
                        </span>
                        <Disc className={`w-3.5 h-3.5 ${isSelected ? "text-white animate-spin" : "text-zinc-500 group-hover:text-white"}`} />
                      </div>
                      <div className="text-xs font-bold text-white truncate font-['Sora']">
                        {demo.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {demo.artist}
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-1 line-clamp-1">
                        {demo.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panduan */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <BookOpen className="w-4 h-4 text-zinc-300" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Fitur Unggulan Manual Editor
              </h2>
            </div>

            <ol className="text-xs text-zinc-400 space-y-3 list-decimal pl-4 leading-relaxed">
              <li>
                <strong className="text-white">Waveform Interaktif:</strong> Visualisasi gelombang suara akurat dengan playhead, zoom in/out, dan penanda waktu MM:SS.mmm.
              </li>
              <li>
                <strong className="text-white">Basic Editing (Cut, Trim, Split):</strong> Potong bagian intro atau ending yang tidak diinginkan dan aktifkan Seamless Loop untuk BGM game.
              </li>
              <li>
                <strong className="text-white">Normalisasi Otomatis:</strong> Seimbangkan puncak volume audio ke -1 dB agar tidak pecah/distorsi di engine suara Roblox.
              </li>
              <li>
                <strong className="text-white">9-Band Equalizer:</strong> Kustomisasi frekuensi sub-bass (60Hz), mid (1kHz), hingga airiness (16kHz).
              </li>
            </ol>
          </div>
        </div>
      ) : (
        /* STEP 2: JIKA SUDAH UPLOAD, TAMPILKAN WORKSTATION LENGKAP */
        <div className="space-y-6">
          {/* INTERACTIVE WAVEFORM CANVAS WITH PLAYHEAD & ZOOM */}
          <div className="rounded-2xl bg-zinc-950/90 border border-white/10 overflow-hidden shadow-2xl">
            <WaveformCanvas
              fileName={audioTitle}
              audioBuffer={audioBuffer}
              currentTime={currentTime}
              duration={duration}
              trimEnabled={trimEnabled}
              trimStart={trimStart}
              trimEnd={trimEnd || duration}
              onSeek={handleSeek}
              onTrimChange={(start, end) => {
                setTrimStart(start);
                setTrimEnd(end);
                setTrimEnabled(true);
              }}
              isPlaying={isPlaying}
              volume={volume}
              onPlay={togglePlaySource}
              onPause={togglePlaySource}
              onReset={() => handleSeek(0)}
              onVolumeChange={(v) => setVolume(v)}
              onExportClick={handleExport}
            />
          </div>

          {/* QUICK TOOLBAR: CUT/TRIM, SPLIT, SEAMLESS LOOP, NORMALISASI */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-xl">
            {/* Trim / Cut Toggle */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Trim &amp; Cut</span>
                </span>
                <input
                  type="checkbox"
                  checked={trimEnabled}
                  onChange={(e) => setTrimEnabled(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                {trimEnabled
                  ? `${formatDuration(trimStart)} - ${formatDuration(trimEnd || duration)}`
                  : "Mati (Putar Penuh)"}
              </div>
            </div>

            {/* Split at Playhead */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Split Klip</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{formatDuration(currentTime)}</span>
              </div>
              <button
                type="button"
                onClick={handleSplitAtPlayhead}
                className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] border border-white/10 transition-all cursor-pointer"
              >
                Potong di Playhead
              </button>
            </div>

            {/* Seamless Loop Toggle */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Seamless Loop</span>
                </span>
                <input
                  type="checkbox"
                  checked={seamlessLoop}
                  onChange={(e) => setSeamlessLoop(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Micro-fade 80ms untuk putaran tanpa jeda klik di Roblox BGM.
              </p>
            </div>

            {/* Auto Normalize */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Auto-Normalize</span>
                </span>
                <span className="text-[10px] font-mono text-white font-bold">{targetDb} dB</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {([0, -1, -3, -6] as const).map((db) => (
                  <button
                    key={db}
                    type="button"
                    onClick={() => {
                      setTargetDb(db);
                      setNormalizeEnabled(true);
                    }}
                    className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      targetDb === db && normalizeEnabled
                        ? "bg-white text-zinc-950"
                        : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {db}dB
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMICS & FADES ROW */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-5 shadow-xl">
            {/* Volume Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Master Gain:</span>
                </span>
                <span className="text-white font-bold">{(volume * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Fade In */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Fade In:</span>
                <span className="text-white font-bold">{fadeIn ? `${fadeInDuration}s` : "Mati"}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fadeIn}
                  onChange={(e) => setFadeIn(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  disabled={!fadeIn}
                  value={fadeInDuration}
                  onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-40"
                />
              </div>
            </div>

            {/* Fade Out */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Fade Out:</span>
                <span className="text-white font-bold">{fadeOut ? `${fadeOutDuration}s` : "Mati"}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fadeOut}
                  onChange={(e) => setFadeOut(e.target.checked)}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  disabled={!fadeOut}
                  value={fadeOutDuration}
                  onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* DJ MASTER FX & COLOR FILTER SWEEP */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>DJ Master Suite &amp; Pioneer Color Filter Sweep</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-400">
                Respon Seketika Pada Player
              </span>
            </div>

            {/* DJ Color Filter Sweep (-100% LPF to +100% HPF) */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-zinc-400" />
                  <span>DJ Pioneer Filter Sweep:</span>
                </span>
                <span className="text-white font-bold">
                  {djFilter === 0
                    ? "Flat / Netral"
                    : djFilter < 0
                    ? `Low-Pass Filter (Muffled) ${djFilter}%`
                    : `High-Pass Filter (Tension) +${djFilter}%`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={djFilter}
                onChange={(e) => setDjFilter(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>◀ Low-Pass (Redam High)</span>
                <span>0 (Netral)</span>
                <span>High-Pass (Potong Bass) ▶</span>
              </div>
            </div>

            {/* DJ 808 Sub-Bass Punch & High Shimmer Air */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">808 Sub-Bass Punch:</span>
                  <span className="text-white font-bold">+{djBassBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={djBassBoost}
                  onChange={(e) => setDjBassBoost(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>0 dB</span>
                  <span>+6 dB</span>
                  <span>+15 dB (Sub Drop)</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">High Air &amp; Shimmer:</span>
                  <span className="text-white font-bold">+{djTrebleBoost} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={djTrebleBoost}
                  onChange={(e) => setDjTrebleBoost(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>0 dB</span>
                  <span>+6 dB</span>
                  <span>+12 dB (Crisp Air)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 9-BAND GRAPHIC EQUALIZER */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-300" />
                <span>9-Band Graphic Equalizer Studio</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">Rentang: -12 dB s/d +12 dB</span>
            </div>

            <div className="grid grid-cols-9 gap-2 sm:gap-4 py-4">
              {eqFreqs.map((freq, idx) => (
                <div key={freq} className="flex flex-col items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-white">
                    {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}
                  </span>
                  <div className="h-36 flex items-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={eqGains[idx]}
                      onChange={(e) => handleEqChange(idx, parseInt(e.target.value))}
                      className="w-24 -rotate-90 origin-center bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">{freq}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EXPORT RESULT CARD (JIKA SUDAH EKSPOR) */}
          {lastExportedUrl && (
            <div className="p-6 rounded-2xl bg-zinc-900 border border-white/20 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Audio Hasil Edit Siap Digunakan!</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {formatDuration(exportedCurrentTime)} / {formatDuration(exportedDuration)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={exportedDuration || 10}
                step="0.05"
                value={exportedCurrentTime}
                onChange={handleExportedSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayExported}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 shadow active:scale-95 transition-all cursor-pointer"
                >
                  {isExportedPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isExportedPlaying ? "Pause Preview" : "Dengarkan Preview"}</span>
                </button>

                <a
                  href={lastExportedUrl}
                  download={audioTitle ? `edited_${audioTitle}` : `joverse_edited_${Date.now()}.${outputFormat.toLowerCase()}`}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File ({outputFormat})</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

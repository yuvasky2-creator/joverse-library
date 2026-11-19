import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsageTracker } from "@/services/analytics/UsageTracker";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { AudioExporter } from "@/services/audio/AudioExporter";
import { AudioProcessor } from "@/services/audio/AudioProcessor";
import { formatDuration } from "@/lib/formatters";
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  Code2,
  ChevronRight,
  TrendingDown,
  Download,
  Upload,
  Activity,
  Radio,
  AlertTriangle,
  Info,
  Disc,
  Flame,
  Music,
} from "lucide-react";

interface TranscodeItem {
  id: string;
  name: string;
  originalDuration: string;
  speed: number;
  pitchCents: number;
  robloxPlaybackSpeed: string;
  amplifyDb: number;
  format: "OGG" | "WAV" | "MP3";
  date: string;
  blobUrl: string;
}

interface BypassProps {
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
}

export interface DemoAudioItem {
  id: string;
  title: string;
  artist: string;
  tag: string;
  badge: string;
  url: string;
  description: string;
}

const DEMO_AUDIOS: DemoAudioItem[] = [
  {
    id: "fine",
    title: "DJ I WILL BE FINE",
    artist: "Wiro x Yogi SJ Remix",
    tag: "Jedag-Jedug Viral",
    badge: "TikTok Trending",
    url: "/samples/dj-i-will-be-fine.mp3",
    description: "Bass jedag-jedug khas remix TikTok dengan drop punchy.",
  },
  {
    id: "negoro",
    title: "DJ NEGORO ANGIN",
    artist: "DJ Koplo Viral",
    tag: "Koplo Bass Boost",
    badge: "Club Favorite",
    url: "/samples/dj-negoro-angin.mp3",
    description: "Koplo modern beat cepat cocok untuk testing bypass speed 2.3x.",
  },
  {
    id: "xmas",
    title: "MERRY CHRISTMAS",
    artist: "Holiday Remix Edit",
    tag: "Special Holiday",
    badge: "EDM Mix",
    url: "/samples/merry-christmas.mp3",
    description: "Melodi pesta bertempo energik dengan spektrum frekuensi luas.",
  },
];

export const Bypass: React.FC<BypassProps> = ({ onNotify }) => {
  const { user, quota, consumeQuota, openAuthModal } = useAuth();

  // Ingest mode: File upload & 3 selectable demo audio tracks
  const [audioFileName, setAudioFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasLoadedAudio, setHasLoadedAudio] = useState(false);
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);

  // Audio Playback Elements & State for Source
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassBoostNodeRef = useRef<BiquadFilterNode | null>(null);
  const highShelfNodeRef = useRef<BiquadFilterNode | null>(null);
  const djFilterNodeRef = useRef<BiquadFilterNode | null>(null);
  const djBassNodeRef = useRef<BiquadFilterNode | null>(null);
  const djTrebleNodeRef = useRef<BiquadFilterNode | null>(null);

  // Bypass Engine Parameters (Micro-tuning, Speed, Phase, Noise, Sub-bass, Reverb)
  const [speedMultiplier, setSpeedMultiplier] = useState(2.3);
  const [pitchCents, setPitchCents] = useState(0); // -50 to +50 cents
  const [amplifyGain, setAmplifyGain] = useState(-10); // dB
  const [phaseInvert, setPhaseInvert] = useState(true);
  const [stereoWidth, setStereoWidth] = useState(1.25); // 0.0 to 2.2
  const [microNoise, setMicroNoise] = useState(3); // 0% to 10%
  const [subBassLayer, setSubBassLayer] = useState(3); // 0% to 10%
  const [microReverb, setMicroReverb] = useState(4); // 0% to 20%

  // DJ FX Suite Parameters (Filter Sweep, Sub Punch, High Air)
  const [djFilter, setDjFilter] = useState<number>(0); // -100% LPF to +100% HPF
  const [djBassBoost, setDjBassBoost] = useState<number>(0); // 0 to 15 dB
  const [djTrebleBoost, setDjTrebleBoost] = useState<number>(0); // 0 to 12 dB

  const initLiveDspGraph = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // DJ Filter Sweep Node (Pioneer Style)
      const djFilterNode = ctx.createBiquadFilter();
      djFilterNode.type = "allpass";
      djFilterNode.frequency.value = 1000;
      djFilterNodeRef.current = djFilterNode;

      // DJ 808 Sub-Bass Node
      const djBass = ctx.createBiquadFilter();
      djBass.type = "lowshelf";
      djBass.frequency.value = 75;
      djBass.gain.value = djBassBoost;
      djBassNodeRef.current = djBass;

      // Sub-bass Layer Node
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 85;
      bass.gain.value = subBassLayer * 1.5;
      bassBoostNodeRef.current = bass;

      // DJ High Air Node
      const djTreble = ctx.createBiquadFilter();
      djTreble.type = "highshelf";
      djTreble.frequency.value = 8500;
      djTreble.gain.value = djTrebleBoost;
      djTrebleNodeRef.current = djTreble;

      // High Shelf Shimmer Node
      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 6000;
      high.gain.value = microNoise * 0.8;
      highShelfNodeRef.current = high;

      // Gain Node untuk Amplify Gain
      const gain = ctx.createGain();
      const linearGain = Math.pow(10, amplifyGain / 20);
      gain.gain.value = linearGain;
      gainNodeRef.current = gain;

      // Chain: source -> djFilter -> djBass -> bass -> djTreble -> high -> gain -> destination
      source.connect(djFilterNode);
      djFilterNode.connect(djBass);
      djBass.connect(bass);
      bass.connect(djTreble);
      djTreble.connect(high);
      high.connect(gain);
      gain.connect(ctx.destination);
    } catch (err) {
      console.warn("Live Web Audio DSP notice:", err);
    }
  };

  const [sourceAudioUrl, setSourceAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // A/B Testing Mode: 'bypassed' (preview DSP speed/pitch) vs 'original' (pure raw)
  const [abTestMode, setAbTestMode] = useState<"bypassed" | "original">("bypassed");

  // Preset selector
  const [activePreset, setActivePreset] = useState<"light" | "medium" | "aggressive" | "custom">("aggressive");

  // Export Settings
  const [targetFormat, setTargetFormat] = useState<"OGG" | "WAV" | "MP3">("OGG");
  const [mp3Bitrate, setMp3Bitrate] = useState<128 | 192 | 320>(192);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);

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

  // Estimasi ukuran file hasil ekspor
  const estimatedSizeBytes = targetFormat === "WAV"
    ? duration * 44100 * 2 * 2
    : targetFormat === "MP3"
    ? (duration * (mp3Bitrate * 1000)) / 8
    : (duration * (160 * 1000)) / 8;

  // Roblox Studio Limit Checks
  const robloxLimits = AudioProcessor.checkRobloxLimits(duration, estimatedSizeBytes);

  // Sinkronisasi Real-Time DSP Parameters (Speed, Gain, Bass, Noise, DJ Filter & FX) saat slider digeser
  useEffect(() => {
    if (audioRef.current) {
      if (abTestMode === "bypassed") {
        audioRef.current.playbackRate = speedMultiplier;
        if (gainNodeRef.current && audioCtxRef.current) {
          const linearGain = Math.pow(10, amplifyGain / 20);
          gainNodeRef.current.gain.setTargetAtTime(linearGain, audioCtxRef.current.currentTime, 0.04);
        }
        if (bassBoostNodeRef.current && audioCtxRef.current) {
          bassBoostNodeRef.current.gain.setTargetAtTime(subBassLayer * 1.5, audioCtxRef.current.currentTime, 0.04);
        }
        if (highShelfNodeRef.current && audioCtxRef.current) {
          highShelfNodeRef.current.gain.setTargetAtTime(microNoise * 0.8, audioCtxRef.current.currentTime, 0.04);
        }
        // DJ Filter Sweep Live
        if (djFilterNodeRef.current && audioCtxRef.current) {
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
        // DJ 808 Bass Boost Live
        if (djBassNodeRef.current && audioCtxRef.current) {
          djBassNodeRef.current.gain.setTargetAtTime(djBassBoost, audioCtxRef.current.currentTime, 0.03);
        }
        // DJ Treble Air Live
        if (djTrebleNodeRef.current && audioCtxRef.current) {
          djTrebleNodeRef.current.gain.setTargetAtTime(djTrebleBoost, audioCtxRef.current.currentTime, 0.03);
        }
      } else {
        audioRef.current.playbackRate = 1.0;
        if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(1.0, audioCtxRef.current.currentTime, 0.04);
        }
        if (bassBoostNodeRef.current && audioCtxRef.current) {
          bassBoostNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.04);
        }
        if (highShelfNodeRef.current && audioCtxRef.current) {
          highShelfNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.04);
        }
        if (djFilterNodeRef.current && audioCtxRef.current) {
          djFilterNodeRef.current.type = "allpass";
        }
        if (djBassNodeRef.current && audioCtxRef.current) {
          djBassNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.03);
        }
        if (djTrebleNodeRef.current && audioCtxRef.current) {
          djTrebleNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.03);
        }
      }
    }
  }, [abTestMode, speedMultiplier, amplifyGain, subBassLayer, microNoise, djFilter, djBassBoost, djTrebleBoost]);

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
    initLiveDspGraph();
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
        exportedAudioRef.current
          .play()
          .then(() => setIsExportedPlaying(true))
          .catch((e) => console.error(e));
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

  // 1-Click Preset Handlers
  const applyPreset = (type: "light" | "medium" | "aggressive") => {
    setActivePreset(type);
    if (type === "light") {
      setSpeedMultiplier(1.04);
      setPitchCents(15);
      setAmplifyGain(-3);
      setPhaseInvert(false);
      setStereoWidth(1.1);
      setMicroNoise(1);
      setSubBassLayer(1);
      setMicroReverb(2);
      onNotify("Preset 'Light Bypass (Aman & Jernih)' aktif: micro-shift tipis untuk vokal/lagu santai.", "info");
    } else if (type === "medium") {
      setSpeedMultiplier(1.12);
      setPitchCents(30);
      setAmplifyGain(-6);
      setPhaseInvert(true);
      setStereoWidth(1.25);
      setMicroNoise(3);
      setSubBassLayer(3);
      setMicroReverb(4);
      onNotify("Preset 'Medium Bypass' aktif: modifikasi spektral seimbang untuk BGM umum.", "info");
    } else {
      setSpeedMultiplier(2.3);
      setPitchCents(45);
      setAmplifyGain(-10);
      setPhaseInvert(true);
      setStereoWidth(1.35);
      setMicroNoise(6);
      setSubBassLayer(4);
      setMicroReverb(6);
      onNotify("Preset 'Aggressive Bypass' aktif: speed scaling 2.3x + dual hash scrambler.", "info");
    }
  };

  // DJ Special FX Presets
  const applyDjPreset = (presetName: "club" | "pioneer" | "lofi" | "extreme") => {
    setActivePreset("custom");
    if (presetName === "club") {
      setSpeedMultiplier(2.3);
      setDjBassBoost(12);
      setDjTrebleBoost(6);
      setDjFilter(0);
      setStereoWidth(1.6);
      setSubBassLayer(4);
      setPhaseInvert(true);
      onNotify("Preset DJ 'Club Jedag-Jedug Drop' aktif! 808 Sub-bass punch + Shimmer + 2.3x Bypass.", "success");
    } else if (presetName === "pioneer") {
      setSpeedMultiplier(2.3);
      setDjFilter(70);
      setDjBassBoost(0);
      setDjTrebleBoost(8);
      setStereoWidth(1.8);
      setPhaseInvert(true);
      onNotify("Preset DJ 'Pioneer Filter Build-Up' aktif! HPF +70% memotong bass untuk build-up.", "info");
    } else if (presetName === "lofi") {
      setSpeedMultiplier(2.3);
      setDjFilter(-55);
      setDjBassBoost(6);
      setDjTrebleBoost(0);
      setStereoWidth(1.1);
      setMicroNoise(5);
      onNotify("Preset DJ 'Underground Lo-Fi Drop' aktif! LPF -55% suara hangat teredam.", "info");
    } else if (presetName === "extreme") {
      setSpeedMultiplier(2.3);
      setPitchCents(45);
      setAmplifyGain(-10);
      setPhaseInvert(true);
      setStereoWidth(1.4);
      setMicroNoise(6);
      setSubBassLayer(4);
      setDjFilter(0);
      setDjBassBoost(5);
      setDjTrebleBoost(4);
      onNotify("Preset 'Extreme Roblox Bypass' aktif: 2.3x Speed + Dual Hash Scrambler.", "success");
    }
  };

  // 1-Click Load from 3 Selectable Demo Audio Tracks
  const handleLoadDemoTrack = (demo: DemoAudioItem) => {
    setActiveDemoId(demo.id);
    setAudioFileName(`${demo.title}.mp3`);
    setSelectedFile(null);
    setSourceAudioUrl(demo.url);
    if (audioRef.current) {
      audioRef.current.src = demo.url;
      audioRef.current.load();
    }
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setHasLoadedAudio(true);
    onNotify(`Demo Audio "${demo.title}" berhasil dimuat! Siap di-play & di-bypass.`, "success");
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setActiveDemoId(null);
      setAudioFileName(file.name);
      const url = URL.createObjectURL(file);
      setSourceAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setHasLoadedAudio(true);
      onNotify(`File "${file.name}" siap diproses!`, "success");
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
    setProcessProgress(10);

    try {
      let audioBuffer: AudioBuffer;
      const ctx = AudioDecoder.getAudioContext();

      if (selectedFile) {
        const decoded = await AudioDecoder.decode(selectedFile, selectedFile.type);
        audioBuffer = decoded.buffer;
      } else {
        const resp = await fetch(sourceAudioUrl);
        const arrayBuf = await resp.arrayBuffer();
        audioBuffer = await ctx.decodeAudioData(arrayBuf);
      }

      setProcessProgress(30);

      // Render audio offline dengan AudioExporter pipeline lengkap
      const exportResult = await AudioExporter.exportAudio(
        audioBuffer,
        audioFileName || "Joverse_Bypass_Audio",
        {
          speed: speedMultiplier,
          pitch: 0,
          pitchCents: pitchCents,
          volume: Math.pow(10, amplifyGain / 20),
          trim: { enabled: false, startTime: 0, endTime: audioBuffer.duration },
          fade: { fadeIn: false, fadeInDuration: 0, fadeOut: false, fadeOutDuration: 0 },
          normalize: { enabled: false, targetDb: 0 },
          channelMode: "original",
          phaseInvert,
          stereoWidth,
          microNoise,
          subBassLayer,
          microReverb,
          djFilter,
          djBassBoost,
          djTrebleBoost,
        },
        {
          format: targetFormat.toLowerCase() as "ogg" | "mp3" | "wav",
          bitrate: mp3Bitrate,
          sampleRate: 44100,
          channelMode: "stereo",
          wavBitDepth: 16,
          stripMetadata,
        },
        (pct) => setProcessProgress(pct)
      );

      setLastExportedUrl(exportResult.url);
      setExportedDuration(exportResult.duration);
      setExportedCurrentTime(0);
      setIsExportedPlaying(false);

      if (exportedAudioRef.current) {
        exportedAudioRef.current.src = exportResult.url;
        exportedAudioRef.current.load();
      }

      const finalName = exportResult.fileName;
      UsageTracker.recordConversion(finalName, targetFormat, `${speedMultiplier}x`);

      const newRecord: TranscodeItem = {
        id: Date.now().toString(),
        name: finalName,
        originalDuration: formatDuration(audioBuffer.duration),
        speed: speedMultiplier,
        pitchCents,
        robloxPlaybackSpeed: robloxSpeed,
        amplifyDb: amplifyGain,
        format: targetFormat,
        date: "Baru saja",
        blobUrl: exportResult.url,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setIsProcessing(false);
      onNotify(`✅ Audio "${finalName}" berhasil di-bypass dan di-render!`, "success");
    } catch (err: any) {
      console.error("Transcode error:", err);
      setIsProcessing(false);
      onNotify("Gagal memproses audio. Menggunakan fallback stream...", "error");
    }
  };

  const copyLuaSnippet = (item: TranscodeItem) => {
    const snippet = `-- [ JOVERSE SOUND CONFIG - ROBLOX STUDIO ]
-- File: ${item.name} | Format: ${item.format}
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://YOUR_UPLOADED_AUDIO_ID"
sound.PlaybackSpeed = ${item.robloxPlaybackSpeed} -- Mengembalikan pitch & tempo asli di Roblox
sound.Volume = 1
sound.RollOffMode = Enum.RollOffMode.InverseTapered
sound.Parent = workspace
sound:Play()`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(item.id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
    onNotify("Script Luau Roblox berhasil disalin ke clipboard!", "success");
  };

  return (
    <div className="wrap py-8 max-w-7xl animate-fadeIn space-y-8">
      {/* Hidden Audio Elements for Playback */}
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
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>ROBLOX AUDIO BYPASS SUITE &middot; DJ FX &amp; SAFE LUAU DSP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Sora']">
            Roblox Audio Bypass &amp; DJ Master Suite
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Algoritma proteksi audio Roblox Studio dengan Speed Scaling (2.3x), DJ Pioneer Filter Sweep, 808 Sub-Bass Punch, Phase Inversion, dan Noise Layering untuk melewati sistem moderasi otomatis Roblox.
          </p>
        </div>

        {/* Quota & Info Box */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-zinc-400">Sisa Kuota: </span>
            <span className="text-white font-bold">{quotaRemaining}</span>
          </div>
        </div>
      </div>

      {/* ── PERINGATAN LIMIT ROBLOX STUDIO (JIKA DURASI > 7M ATAU SIZE > 20MB) ── */}
      {duration > 0 && (robloxLimits.isDurationExceeded || robloxLimits.isSizeExceeded) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-amber-300">
              Peringatan Limit Upload Roblox Studio
            </div>
            {robloxLimits.durationWarning && <div>&bull; {robloxLimits.durationWarning}</div>}
            {robloxLimits.sizeWarning && <div>&bull; {robloxLimits.sizeWarning}</div>}
          </div>
        </div>
      )}

      {/* ── WORKSTATION GRID (2 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: AUDIO INGEST & SETTINGS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: INGEST CARD (FILE UPLOAD & 3 DEMO AUDIO TRACKS) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-zinc-300" />
                <span>Sumber Audio (File Komputer / 3 Demo Audio)</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                Format: MP3 &middot; WAV &middot; OGG &middot; FLAC
              </span>
            </div>

            {/* File Upload Dropzone */}
            <label className="flex flex-col items-center justify-center gap-3 p-7 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/30 transition-all cursor-pointer text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {selectedFile ? selectedFile.name : "Pilih atau Seret File Audio ke Sini"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Mendukung MP3, WAV, OGG, FLAC &middot; Maksimal 100 MB &middot; 100% diproses lokal di browser
                </p>
              </div>
            </label>

            {/* 3 Selectable Demo Audio Tracks */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Music className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Atau Coba 3 Audio Demo Populer:</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">1-Klik Muat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_AUDIOS.map((demo) => {
                  const isSelected = activeDemoId === demo.id && !selectedFile;
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

          {/* STEP 2: PREVIEW AUDIO & A/B TESTING CONSOLE */}
          {hasLoadedAudio && (
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-white font-mono truncate max-w-xs">
                    {audioFileName || "Preview Audio"}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 shrink-0">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </div>
              </div>

              {/* Scrubber Range */}
              <input
                type="range"
                min="0"
                max={duration || 10}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />

              {/* Transport & A/B Test Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlaySource}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                      }
                      setCurrentTime(0);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* A/B Testing Toggle */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase px-2 font-bold">A/B Test:</span>
                  <button
                    type="button"
                    onClick={() => setAbTestMode("bypassed")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      abTestMode === "bypassed"
                        ? "bg-white text-zinc-950 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Bypassed ({speedMultiplier}x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbTestMode("original")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      abTestMode === "original"
                        ? "bg-white text-zinc-950 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Original (1.0x)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRESET 1-KLIK & DJ SPECIAL FX */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Preset DJ &amp; Moderasi Roblox</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">1-Klik Eksekusi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => applyDjPreset("club")}
                className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span>🎧 Club Drop</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Sub-Bass 808 + Shimmer + 2.3x</div>
              </button>

              <button
                type="button"
                onClick={() => applyDjPreset("pioneer")}
                className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span>🎛️ Filter Build</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">HPF +70% Sweep + Wide</div>
              </button>

              <button
                type="button"
                onClick={() => applyDjPreset("lofi")}
                className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span>📻 Lo-Fi Muffled</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">LPF -55% Underground Sound</div>
              </button>

              <button
                type="button"
                onClick={() => applyDjPreset("extreme")}
                className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <span>🚀 2.3x Bypass</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Dual Hash Scrambler Roblox</div>
              </button>
            </div>
          </div>

          {/* STEP 4: DJ SUITE & REAL-TIME CONTROLS */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-300" />
                <span>DJ FX Suite &amp; Live Filter Sweep</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-400">
                Respon Langsung Saat Audio Berputar
              </span>
            </div>

            {/* DJ Filter Sweep (-100% LPF to +100% HPF) */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-zinc-400" />
                  <span>DJ Color Filter Sweep (Pioneer Style):</span>
                </span>
                <span className="text-white font-bold">
                  {djFilter === 0
                    ? "Flat / Netral"
                    : djFilter < 0
                    ? `LPF (Low-Pass) ${djFilter}%`
                    : `HPF (High-Pass) +${djFilter}%`}
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
                <span>◀ Low Pass (Redam Treble)</span>
                <span>0 (Netral)</span>
                <span>High Pass (Potong Bass) ▶</span>
              </div>
            </div>

            {/* DJ 808 Sub-Bass & High Shimmer */}
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
                  <span>+15 dB (Deep Punch)</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">High Crisp / Shimmer:</span>
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
                  <span>+12 dB (Sizzle)</span>
                </div>
              </div>
            </div>

            {/* Slider 1: Speed Scaling */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Kecepatan Bypass (Speed Scaling):</span>
                <span className="text-white font-bold">{speedMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.90"
                max="2.50"
                step="0.01"
                value={speedMultiplier}
                onChange={(e) => {
                  setSpeedMultiplier(parseFloat(e.target.value));
                  setActivePreset("custom");
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>0.90x</span>
                <span>1.04x</span>
                <span>1.80x</span>
                <span>2.30x (Standar Roblox)</span>
                <span>2.50x</span>
              </div>
            </div>

            {/* Slider 2: Micro-tuning Pitch Shifter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Pitch Shifter (Micro-Tuning):</span>
                <span className="text-white font-bold">
                  {pitchCents > 0 ? `+${pitchCents}` : pitchCents} cents ({(pitchCents / 100).toFixed(2)} semitone)
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={pitchCents}
                onChange={(e) => {
                  setPitchCents(parseInt(e.target.value));
                  setActivePreset("custom");
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>-50 cents</span>
                <span>0 cents (Netral)</span>
                <span>+50 cents</span>
              </div>
            </div>

            {/* Slider 3: Amplifikasi Gain */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Amplifikasi Gain (Volume):</span>
                <span className="text-white font-bold">{amplifyGain} dB</span>
              </div>
              <input
                type="range"
                min="-24"
                max="6"
                step="1"
                value={amplifyGain}
                onChange={(e) => {
                  setAmplifyGain(parseInt(e.target.value));
                  setActivePreset("custom");
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>-24 dB</span>
                <span>-10 dB (Standar Roblox)</span>
                <span>0 dB</span>
                <span>+6 dB</span>
              </div>
            </div>

            {/* Advanced Grid: Phase Invert, Noise, Sub-Bass, Stereo Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
              {/* Phase Invert Toggle */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Phase Inversion (L/R)</span>
                  <input
                    type="checkbox"
                    checked={phaseInvert}
                    onChange={(e) => setPhaseInvert(e.target.checked)}
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Membalik fase kanal stereo 180&deg; untuk menghancurkan korelasi akustik bot moderasi.
                </p>
              </div>

              {/* Stereo Width */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Stereo Club Widener</span>
                  <span className="text-zinc-400 font-mono">{(stereoWidth * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.2"
                  step="0.05"
                  value={stereoWidth}
                  onChange={(e) => setStereoWidth(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPORT CONSOLE & RESULTS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* EXPORT CONFIGURATION & ACTION */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-300" />
                <span>Pengaturan Ekspor Roblox Studio</span>
              </h2>
            </div>

            {/* Format Selection (OGG Vorbis, MP3, WAV) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">
                Format Kontainer Resmi Roblox:
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/5">
                {(["OGG", "MP3", "WAV"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      targetFormat === fmt
                        ? "bg-white text-zinc-950 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {fmt} {fmt === "OGG" ? "(Rekomendasi)" : ""}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                Roblox Studio sangat merekomendasikan format <strong>OGG (Vorbis)</strong> untuk audio streaming mulus dan ukuran file hemat.
              </p>
            </div>

            {/* MP3 Bitrate (jika format MP3) */}
            {targetFormat === "MP3" && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-zinc-300 block">Bitrate MP3:</label>
                <div className="grid grid-cols-3 gap-2">
                  {([128, 192, 320] as const).map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() => setMp3Bitrate(br)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        mp3Bitrate === br
                          ? "bg-white/15 text-white border-white/30"
                          : "bg-zinc-900 text-zinc-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {br} kbps
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Strip Metadata Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="stripMeta"
                checked={stripMetadata}
                onChange={(e) => setStripMetadata(e.target.checked)}
                className="w-4 h-4 accent-white cursor-pointer"
              />
              <label htmlFor="stripMeta" className="text-xs text-zinc-300 cursor-pointer select-none">
                Hapus seluruh tag ID3 &amp; Scramble Hash Metadata (Anti-Banned)
              </label>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleExecuteBypass}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-200 transition-all shadow-xl active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 font-['Manrope']"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isProcessing
                  ? `Merender Audio Pipeline (${processProgress}%)...`
                  : `Bypass & Unduh Format ${targetFormat}`}
              </span>
            </button>
          </div>

          {/* HASIL EKSPOR TERBARU (PLAYABLE PREVIEW) */}
          {lastExportedUrl && (
            <div className="p-6 rounded-2xl bg-zinc-900 border border-white/20 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Audio Hasil Bypass Siap!</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {formatDuration(exportedCurrentTime)} / {formatDuration(exportedDuration)}
                </span>
              </div>

              {/* Scrubber Hasil Ekspor */}
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
                  onClick={() => togglePlayExported()}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 shadow active:scale-95 transition-all cursor-pointer"
                >
                  {isExportedPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isExportedPlaying ? "Pause Preview" : "Dengarkan Preview"}</span>
                </button>

                <a
                  href={lastExportedUrl}
                  download={audioFileName ? `bypassed_${audioFileName}` : `joverse_bypass_${Date.now()}.${targetFormat.toLowerCase()}`}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center border border-white/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          )}

          {/* LUAU SCRIPT GENERATOR FOR ROBLOX STUDIO */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-300" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Script Luau Roblox Studio
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Speed Matcher: {robloxSpeed}
              </span>
            </div>

            {/* Penjelasan Akurat PlaybackSpeed */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300 space-y-2">
              <p className="leading-relaxed">
                <strong className="text-white">🎯 Penyesuaian PlaybackSpeed Otomatis:</strong> Karena audio di-bypass dengan kecepatan <strong className="text-white">{speedMultiplier}x</strong>, Anda wajib menyetel nilai <strong className="text-white">PlaybackSpeed = {robloxSpeed}</strong> di Roblox Studio agar saat dimainkan di dalam game, tempo dan nada lagu otomatis melambat kembali dan terdengar <strong className="text-white">100% normal seperti lagu aslinya</strong> tanpa terdeteksi moderasi hak cipta acrCloud!
              </p>
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10">Rumus: 1 &divide; {speedMultiplier} = {robloxSpeed}</span>
                <span>&bull; Nada &amp; pitch kembali normal</span>
              </div>
            </div>

            {/* Code Box */}
            <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-xs text-zinc-300 space-y-1.5 relative group">
              <div className="text-emerald-400">-- Pasang di ServerScriptService / Sound Object</div>
              <div>local sound = Instance.new("Sound")</div>
              <div>sound.SoundId = "rbxassetid://YOUR_AUDIO_ID" <span className="text-zinc-600">-- Ganti dengan Asset ID hasil upload Roblox</span></div>
              <div className="text-white font-bold bg-white/10 px-2 py-0.5 rounded inline-block">
                sound.PlaybackSpeed = {robloxSpeed} <span className="text-emerald-400 font-normal">-- Menormalkan tempo ke 1.0x</span>
              </div>
              <div>sound.Volume = 1</div>
              <div>sound.Parent = workspace</div>
              <div>sound:Play()</div>

              <div className="pt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const code = `-- Pasang di ServerScriptService / Sound\nlocal sound = Instance.new("Sound")\nsound.SoundId = "rbxassetid://YOUR_AUDIO_ID"\nsound.PlaybackSpeed = ${robloxSpeed}\nsound.Volume = 1\nsound.Parent = workspace\nsound:Play()`;
                    navigator.clipboard.writeText(code);
                    onNotify("Script Luau lengkap berhasil disalin ke clipboard!", "success");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-[11px] hover:bg-zinc-200 transition-all cursor-pointer shadow active:scale-95"
                >
                  Salin Script Lengkap
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(robloxSpeed);
                    onNotify(`Nilai PlaybackSpeed (${robloxSpeed}) berhasil disalin!`, "info");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] border border-white/15 transition-all cursor-pointer"
                >
                  Salin Nilai ({robloxSpeed})
                </button>
              </div>
            </div>

            {/* 3 Langkah Pemasangan di Roblox Studio */}
            <div className="space-y-1 text-[11px] text-zinc-400 pt-1 border-t border-white/5">
              <div className="font-semibold text-zinc-300">Cara Pasang di Roblox Studio:</div>
              <div>1. Unggah file audio hasil bypass ke <span className="text-white">create.roblox.com</span> (Dashboard).</div>
              <div>2. Salin Asset ID audio yang berhasil diunggah.</div>
              <div>3. Di Roblox Studio, ubah properti <span className="text-white font-mono">PlaybackSpeed</span> objek Sound menjadi <span className="text-white font-mono">{robloxSpeed}</span>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from "react";
import { formatDuration } from "@/lib/formatters";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scissors,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Sparkles,
  Sliders,
  Download,
  Edit3,
  CheckSquare,
  Square,
  Activity,
} from "lucide-react";

interface WaveformCanvasProps {
  fileName?: string;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  trimEnabled: boolean;
  trimStart: number;
  trimEnd: number;
  onSeek: (time: number) => void;
  onTrimChange: (start: number, end: number) => void;
  // Integrated transport props
  isPlaying?: boolean;
  previewMode?: "original" | "processed";
  volume?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onPreviewModeChange?: (mode: "original" | "processed") => void;
  onVolumeChange?: (vol: number) => void;
  onExportClick?: () => void;
}

// Format duration to high-precision MM:SS.mmm (SoundForge Pro style)
const formatPreciseTime = (sec: number): string => {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

// Parse MM:SS.mmm or seconds back to numeric seconds
const parsePreciseTime = (str: string, fallback: number): number => {
  try {
    const parts = str.trim().split(":");
    if (parts.length === 2) {
      const m = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      if (!isNaN(m) && !isNaN(s)) return Math.max(0, m * 60 + s);
    } else if (parts.length === 1) {
      const s = parseFloat(parts[0]);
      if (!isNaN(s)) return Math.max(0, s);
    }
  } catch {
    // fallback
  }
  return fallback;
};

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  fileName = "Audio Track.wav",
  audioBuffer,
  currentTime,
  duration,
  trimEnabled,
  trimStart,
  trimEnd,
  onSeek,
  onTrimChange,
  isPlaying = false,
  previewMode = "processed",
  volume = 1.0,
  onPlay,
  onPause,
  onReset,
  onPreviewModeChange,
  onVolumeChange,
  onExportClick,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState<"seek" | "trimStart" | "trimEnd" | "trimBox" | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Stepper input text states
  const [startInputText, setStartInputText] = useState(formatPreciseTime(trimStart));
  const [endInputText, setEndInputText] = useState(formatPreciseTime(trimEnd));

  useEffect(() => {
    setStartInputText(formatPreciseTime(trimStart));
  }, [trimStart]);

  useEffect(() => {
    setEndInputText(formatPreciseTime(trimEnd));
  }, [trimEnd]);

  // Cache peaks for rendering
  const [peaks, setPeaks] = useState<{ min: number[]; max: number[] } | null>(null);

  // Compute peaks from AudioBuffer
  useEffect(() => {
    if (!audioBuffer) {
      setPeaks(null);
      return;
    }

    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;
    const numBars = 800; // Ultra high-resolution waveform
    const step = Math.floor(totalSamples / numBars);

    const min: number[] = new Array(numBars).fill(0);
    const max: number[] = new Array(numBars).fill(0);

    for (let i = 0; i < numBars; i++) {
      let minSample = 1.0;
      let maxSample = -1.0;
      const start = i * step;
      const end = Math.min(start + step, totalSamples);

      for (let j = start; j < end; j += 4) {
        const val = channelData[j];
        if (val < minSample) minSample = val;
        if (val > maxSample) maxSample = val;
      }

      min[i] = minSample;
      max[i] = maxSample;
    }

    setPeaks({ min, max });
  }, [audioBuffer]);

  // Draw Top Overview Mini Waveform Strip (SoundForge Pro Mini-Map)
  const drawMiniOverview = useCallback(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = "#070a0e";
    ctx.fillRect(0, 0, width, height);

    if (peaks && duration > 0) {
      const numBars = peaks.min.length;
      const barW = width / numBars;

      // Draw subtle overview waveform in cyan-slate
      ctx.fillStyle = "rgba(0, 212, 255, 0.4)";
      for (let i = 0; i < numBars; i++) {
        const x = i * barW;
        const minVal = peaks.min[i];
        const maxVal = peaks.max[i];
        const top = ((1 - maxVal) / 2) * height;
        const bottom = ((1 - minVal) / 2) * height;
        ctx.fillRect(x, top, Math.max(1, barW - 0.5), Math.max(1, bottom - top));
      }

      // If trim is enabled, highlight the selected trim zone
      if (trimEnabled) {
        const startX = (trimStart / duration) * width;
        const endX = (trimEnd / duration) * width;

        ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
        ctx.fillRect(startX, 0, Math.max(2, endX - startX), height);

        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, 0, Math.max(2, endX - startX), height);
      }

      // Draw current playback head marker in mini-map
      const playX = (currentTime / duration) * width;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();
    }

    ctx.restore();
  }, [peaks, duration, currentTime, trimEnabled, trimStart, trimEnd]);

  // Draw Main SoundForge Pro Canvas
  const drawMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // SoundForge Pro Studio Background
    ctx.fillStyle = "#070a0f";
    ctx.fillRect(0, 0, width, height);

    // Left gutter reserved for Amplitude scale (+1.0 to -1.0)
    const gutterLeft = 40;
    const waveAreaWidth = width - gutterLeft;

    // 1. Grid & Amplitude Marks
    const ampTicks = [
      { val: 1.0, yRatio: 0.1, label: "+1.0" },
      { val: 0.5, yRatio: 0.3, label: "+0.5" },
      { val: 0.0, yRatio: 0.5, label: " 0.0" },
      { val: -0.5, yRatio: 0.7, label: "-0.5" },
      { val: -1.0, yRatio: 0.9, label: "-1.0" },
    ];

    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";

    ampTicks.forEach((tick) => {
      const y = tick.yRatio * height;

      // Horizontal grid line
      ctx.strokeStyle = tick.val === 0 ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = tick.val === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(gutterLeft, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Amplitude text in gutter
      ctx.fillStyle = tick.val === 0 ? "#8892b0" : "#5a647d";
      ctx.fillText(tick.label, gutterLeft - 8, y + 3.5);
    });

    if (!peaks || duration === 0) {
      ctx.fillStyle = "#71717a";
      ctx.font = "500 13px 'Manrope', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Muat file audio untuk mengaktifkan workstation audio studio", width / 2, height / 2 + 5);
      ctx.restore();
      return;
    }

    // 2. Vertical Time Interval Grid Marks
    const timeSteps = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0];
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    timeSteps.forEach((frac) => {
      const x = gutterLeft + frac * waveAreaWidth;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // 3. Draw SoundForge Pro Dual-Tone Waveform (Purple to Cyan Gradient)
    const numBars = peaks.min.length;
    const barWidth = waveAreaWidth / numBars;
    const progressX = gutterLeft + (currentTime / duration) * waveAreaWidth;

    // SoundForge Pro Waveform Gradient: rich purple -> cyan -> emerald
    const waveGradient = ctx.createLinearGradient(gutterLeft, 0, width, 0);
    waveGradient.addColorStop(0, "#7b61ff");    // Deep studio purple
    waveGradient.addColorStop(0.5, "#00d4ff");  // Radiant electric cyan
    waveGradient.addColorStop(1, "#4ade80");    // Fresh neon emerald

    for (let i = 0; i < numBars; i++) {
      const x = gutterLeft + i * barWidth;
      const minVal = peaks.min[i];
      const maxVal = peaks.max[i];

      const top = ((1 - maxVal) / 2) * (height - 36) + 16;
      const bottom = ((1 - minVal) / 2) * (height - 36) + 16;
      const barHeight = Math.max(2, bottom - top);

      if (x < progressX) {
        ctx.fillStyle = waveGradient;
      } else {
        // Unplayed portion with sleek frosted slate tint
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      }

      ctx.fillRect(x, top, Math.max(1, barWidth - 0.5), barHeight);
    }

    // 4. Draw SoundForge Pro Trim Selection Overlay & Pins
    if (trimEnabled) {
      const startX = gutterLeft + (trimStart / duration) * waveAreaWidth;
      const endX = gutterLeft + (trimEnd / duration) * waveAreaWidth;

      // Darken outside regions (SoundForge mask)
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(gutterLeft, 0, startX - gutterLeft, height);
      ctx.fillRect(endX, 0, width - endX, height);

      // Highlight active selection box with ambient cyan-purple glow
      const selGradient = ctx.createLinearGradient(startX, 0, endX, 0);
      selGradient.addColorStop(0, "rgba(123, 97, 255, 0.12)");
      selGradient.addColorStop(1, "rgba(0, 212, 255, 0.14)");
      ctx.fillStyle = selGradient;
      ctx.fillRect(startX, 0, endX - startX, height);

      // Boundary vertical lines with glowing stroke
      ctx.strokeStyle = "#00d4ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();

      // SoundForge Pro Left Handle Pin (Purple Pill Marker)
      ctx.fillStyle = "#7b61ff";
      ctx.shadowColor = "#7b61ff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(startX - 8, 2, 16, 22, [4, 4, 8, 8]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pin indicator icon inside left handle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(startX, 18);
      ctx.lineTo(startX - 3, 11);
      ctx.lineTo(startX + 3, 11);
      ctx.fill();

      // SoundForge Pro Right Handle Pin (Cyan Pill Marker)
      ctx.fillStyle = "#00d4ff";
      ctx.shadowColor = "#00d4ff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(endX - 8, 2, 16, 22, [4, 4, 8, 8]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pin indicator icon inside right handle
      ctx.fillStyle = "#06090e";
      ctx.beginPath();
      ctx.moveTo(endX, 18);
      ctx.lineTo(endX - 3, 11);
      ctx.lineTo(endX + 3, 11);
      ctx.fill();
    }

    // 5. Draw Playhead Cursor Scrubber
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing Cursor Pin Top Marker
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(progressX, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Draw Hover Guideline
    if (hoverTime !== null && hoverTime !== currentTime) {
      const hoverX = gutterLeft + (hoverTime / duration) * waveAreaWidth;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Time scale ruler at bottom
    ctx.fillStyle = "#5a647d";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    const intervals = 6;
    for (let i = 0; i <= intervals; i++) {
      const t = (i / intervals) * duration;
      const x = gutterLeft + (i / intervals) * waveAreaWidth;
      ctx.fillText(formatDuration(t), Math.min(x, width - 42), height - 4);
    }

    ctx.restore();
  }, [peaks, duration, currentTime, trimEnabled, trimStart, trimEnd, hoverTime]);

  useEffect(() => {
    drawMiniOverview();
    drawMain();
  }, [drawMiniOverview, drawMain]);

  useEffect(() => {
    const handleResize = () => {
      drawMiniOverview();
      drawMain();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMiniOverview, drawMain]);

  // Convert Mouse Event X to Duration Time
  const getTimeFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): number => {
    const canvas = mainCanvasRef.current;
    if (!canvas || duration === 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const gutterLeft = 40;
    const waveAreaWidth = rect.width - gutterLeft;
    const clickX = e.clientX - rect.left;
    const relativeX = Math.max(0, Math.min(clickX - gutterLeft, waveAreaWidth));
    const rawTime = (relativeX / waveAreaWidth) * duration;

    // Snap to Grid (approx 0.05s increments) if enabled
    if (snapToGrid) {
      return Math.round(rawTime * 20) / 20;
    }
    return rawTime;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || duration === 0) return;
    const time = getTimeFromEvent(e);

    if (trimEnabled) {
      const thresholdSec = (duration / 600) * 18;
      if (Math.abs(time - trimStart) < thresholdSec) {
        setIsDragging("trimStart");
        return;
      }
      if (Math.abs(time - trimEnd) < thresholdSec) {
        setIsDragging("trimEnd");
        return;
      }
      if (time > trimStart && time < trimEnd) {
        setIsDragging("trimBox");
        setDragOffset(time - trimStart);
        return;
      }
    }

    setIsDragging("seek");
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || duration === 0) return;
    const time = getTimeFromEvent(e);
    setHoverTime(time);

    if (!isDragging) return;

    if (isDragging === "seek") {
      onSeek(time);
    } else if (isDragging === "trimStart") {
      const newStart = Math.max(0, Math.min(time, trimEnd - 0.1));
      onTrimChange(newStart, trimEnd);
    } else if (isDragging === "trimEnd") {
      const newEnd = Math.max(trimStart + 0.1, Math.min(time, duration));
      onTrimChange(trimStart, newEnd);
    } else if (isDragging === "trimBox") {
      const boxLength = trimEnd - trimStart;
      let newStart = time - dragOffset;
      if (newStart < 0) newStart = 0;
      let newEnd = newStart + boxLength;
      if (newEnd > duration) {
        newEnd = duration;
        newStart = Math.max(0, newEnd - boxLength);
      }
      onTrimChange(newStart, newEnd);
    }
  };

  const handleMouseUp = () => setIsDragging(null);
  const handleMouseLeave = () => {
    setIsDragging(null);
    setHoverTime(null);
  };

  // Stepper input change handlers
  const handleStartCommit = () => {
    const val = parsePreciseTime(startInputText, trimStart);
    const clamped = Math.max(0, Math.min(val, trimEnd - 0.05));
    onTrimChange(clamped, trimEnd);
    setStartInputText(formatPreciseTime(clamped));
  };

  const handleEndCommit = () => {
    const val = parsePreciseTime(endInputText, trimEnd);
    const clamped = Math.max(trimStart + 0.05, Math.min(val, duration));
    onTrimChange(trimStart, clamped);
    setEndInputText(formatPreciseTime(clamped));
  };

  const stepTime = (type: "start" | "end", delta: number) => {
    if (type === "start") {
      const next = Math.max(0, Math.min(trimStart + delta, trimEnd - 0.05));
      onTrimChange(next, trimEnd);
    } else {
      const next = Math.max(trimStart + 0.05, Math.min(trimEnd + delta, duration));
      onTrimChange(trimStart, next);
    }
  };

  const handleSkipBack = () => onSeek(Math.max(0, currentTime - 5));
  const handleSkipForward = () => onSeek(Math.min(duration, currentTime + 5));

  return (
    <div
      ref={containerRef}
      className="soundforge-frame relative select-none"
    >
      {/* 1. TOP TITLE BAR (SoundForge Pro Style) */}
      <div className="soundforge-topbar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7b61ff]/20 to-[#00d4ff]/20 border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#00d4ff]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                {fileName}
              </span>
              <Edit3 className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-60 hover:opacity-100 cursor-pointer" />
            </div>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">
              {audioBuffer ? `${audioBuffer.sampleRate} HZ · ${audioBuffer.numberOfChannels === 1 ? "MONO" : "STEREO"} · 64-BIT DSP` : "MENUNGGU FILE"}
            </p>
          </div>
        </div>

        {/* Trim Active Pill */}
        <div className="flex items-center gap-2">
          {trimEnabled && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 shadow-[0_0_16px_rgba(0,212,255,0.2)]">
              <Scissors className="w-3.5 h-3.5" />
              <span>WILAYAH CROP: {formatPreciseTime(trimEnd - trimStart)}</span>
            </span>
          )}

          <div className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] font-mono text-xs">
            <span className="text-[#00d4ff] font-bold">{formatPreciseTime(currentTime)}</span>
            <span className="text-[var(--color-text-muted)]"> / {formatPreciseTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW MINI-MAP STRIP (SoundForge Pro) */}
      <div className="relative h-6 w-full border-b border-[rgba(255,255,255,0.06)] bg-[#070a0e]">
        <canvas
          ref={miniCanvasRef}
          className="w-full h-full block cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const t = (clickX / rect.width) * duration;
            onSeek(Math.max(0, Math.min(t, duration)));
          }}
        />
      </div>

      {/* 3. MAIN SOUNDFORGE PRO WAVEFORM CANVAS */}
      <div className="relative h-56 sm:h-64 w-full cursor-crosshair bg-[#070a0f]">
        <canvas
          ref={mainCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Floating SoundForge Style Badges when Trim is Enabled */}
        {trimEnabled && duration > 0 && (
          <div className="pointer-events-none absolute top-8 left-12 right-6 flex items-center justify-between font-mono text-[11px]">
            {/* Start Handle Pin */}
            <div className="px-2.5 py-0.5 rounded-md bg-[#7b61ff] text-white font-bold shadow-[0_0_16px_rgba(123,97,255,0.6)] flex items-center gap-1">
              <span>{formatPreciseTime(trimStart)}</span>
            </div>

            {/* Center Floating Selected Duration Badge */}
            <div className="px-3 py-1 rounded-full bg-[#0a0e17]/90 border border-[#00d4ff]/40 text-[#00d4ff] font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)] backdrop-blur-md">
              <span>{formatPreciseTime(trimEnd - trimStart)} Terpilih</span>
            </div>

            {/* End Handle Pin */}
            <div className="px-2.5 py-0.5 rounded-md bg-[#00d4ff] text-zinc-950 font-bold shadow-[0_0_16px_rgba(0,212,255,0.6)] flex items-center gap-1">
              <span>{formatPreciseTime(trimEnd)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. INTEGRATED SOUNDFORGE TRANSPORT DOCK (Below Waveform) */}
      <div className="soundforge-transport">
        {/* Left: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
            title="Perbesar Tampilan Gelombang (Zoom In)"
            className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.1)] flex items-center justify-center transition-all cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
            title="Perkecil Tampilan Gelombang (Zoom Out)"
            className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.1)] flex items-center justify-center transition-all cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom (Fit to Screen)"
            className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.1)] flex items-center justify-center transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={duration === 0}
            title="Ulangi dari Awal (0:00)"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleSkipBack}
            disabled={duration === 0}
            title="Mundur 5 Detik"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all cursor-pointer"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          {/* Large Glowing Circular Play/Pause Button */}
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            disabled={duration === 0}
            title={isPlaying ? "Jeda Audio" : "Putar Audio"}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isPlaying
                ? "bg-gradient-to-br from-[#00d4ff] via-[#4ade80] to-[#00bb7f] text-zinc-950 shadow-[0_0_32px_rgba(0,212,255,0.7)] scale-105"
                : "bg-gradient-to-br from-[#00d4ff] to-[#4ade80] text-zinc-950 shadow-[0_0_24px_rgba(0,212,255,0.45)] hover:shadow-[0_0_36px_rgba(0,212,255,0.7)] hover:scale-105"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
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
            disabled={duration === 0}
            title="Maju 5 Detik"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(14,20,33,0.8)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 text-[var(--color-text-muted)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[#00d4ff]/40 transition-all cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Master Volume + Preview + Export CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Master Volume Slider */}
          {onVolumeChange && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <div className="w-20 sm:w-24">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  disabled={duration === 0}
                  title={`Volume Master: ${Math.round(volume * 100)}%`}
                />
              </div>
              <span className="font-mono text-xs text-[#00d4ff] font-bold min-w-[32px]">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}

          {/* Mode Switcher */}
          {onPreviewModeChange && (
            <div className="flex items-center p-0.5 rounded-full bg-[rgba(10,14,23,0.9)] border border-[rgba(255,255,255,0.12)]">
              <button
                type="button"
                onClick={() => onPreviewModeChange("original")}
                disabled={duration === 0}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  previewMode === "original"
                    ? "bg-[rgba(255,255,255,0.15)] text-white shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-white"
                }`}
              >
                Master
              </button>
              <button
                type="button"
                onClick={() => onPreviewModeChange("processed")}
                disabled={duration === 0}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  previewMode === "processed"
                    ? "bg-gradient-to-r from-[#00d4ff]/25 to-[#4ade80]/25 text-[#00d4ff] border border-[#00d4ff]/40"
                    : "text-[var(--color-text-muted)] hover:text-white"
                }`}
              >
                DSP
              </button>
            </div>
          )}

          {/* Quick Export CTA */}
          {onExportClick && (
            <button
              type="button"
              onClick={onExportClick}
              disabled={duration === 0}
              className="btn-primary !py-2 !px-4 !text-xs shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. BOTTOM PRECISION DOCK (SoundForge Pro Numeric Steppers) */}
      <div className="soundforge-dock">
        {/* LED Timecode */}
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-text-muted)] text-[11px] font-sans">Posisi:</span>
          <span className="text-[#00d4ff] font-bold text-sm tracking-wider">
            {formatPreciseTime(currentTime)}
          </span>
          <span className="text-[var(--color-text-muted)]">/</span>
          <span className="text-[var(--color-text-muted)]">{formatPreciseTime(duration)}</span>
        </div>

        {/* Stepper Inputs for Start, End, and Selected Duration */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Start Stepper */}
          <div className="stepper-box">
            <span className="text-[var(--color-text-muted)]">Mulai:</span>
            <input
              type="text"
              value={startInputText}
              onChange={(e) => setStartInputText(e.target.value)}
              onBlur={handleStartCommit}
              onKeyDown={(e) => e.key === "Enter" && handleStartCommit()}
              disabled={!trimEnabled || duration === 0}
            />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => stepTime("start", 0.05)}
                disabled={!trimEnabled || duration === 0}
                className="text-[9px] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => stepTime("start", -0.05)}
                disabled={!trimEnabled || duration === 0}
                className="text-[9px] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>

          {/* End Stepper */}
          <div className="stepper-box">
            <span className="text-[var(--color-text-muted)]">Selesai:</span>
            <input
              type="text"
              value={endInputText}
              onChange={(e) => setEndInputText(e.target.value)}
              onBlur={handleEndCommit}
              onKeyDown={(e) => e.key === "Enter" && handleEndCommit()}
              disabled={!trimEnabled || duration === 0}
            />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => stepTime("end", 0.05)}
                disabled={!trimEnabled || duration === 0}
                className="text-[9px] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => stepTime("end", -0.05)}
                disabled={!trimEnabled || duration === 0}
                className="text-[9px] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Duration Display */}
          <div className="stepper-box">
            <span className="text-[var(--color-text-muted)]">Durasi:</span>
            <span className="text-[#4ade80] font-bold px-2">
              {formatPreciseTime(trimEnd - trimStart)}
            </span>
          </div>

          {/* Snap to Grid Checkbox */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-white cursor-pointer ml-1"
          >
            {snapToGrid ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#00d4ff]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            )}
            <span>Snap to Grid</span>
          </button>
        </div>
      </div>
    </div>
  );
};

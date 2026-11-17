import React, { useRef, useEffect, useState, useCallback } from "react";
import { Compass, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { SkyboxTuningOptions } from "@/services/skyboxService";

interface Skybox3DViewerProps {
  imageSource: HTMLImageElement | null;
  tuning: SkyboxTuningOptions;
  onTuningChange?: (tuning: SkyboxTuningOptions) => void;
}

export const Skybox3DViewer: React.FC<Skybox3DViewerProps> = ({
  imageSource,
  tuning,
  onTuningChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Camera angles in degrees
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [fov, setFov] = useState(75); // Field of View (Zoom)

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => (prev - dx * 0.4) % 360);
    setPitch((prev) => Math.max(-85, Math.min(85, prev - dy * 0.4)));
  }, []);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Render loop: Raycasting equirectangular panorama onto perspective canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (!imageSource || !imageSource.complete || imageSource.naturalWidth === 0) {
      // Placeholder Grid
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Unggah Panorama 360° untuk Mengaktifkan 3D Preview", width / 2, height / 2);
      return;
    }

    // Helper offscreen canvas to sample image pixels
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 1024;
    sampleCanvas.height = 512;
    const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sCtx) return;

    sCtx.drawImage(imageSource, 0, 0, 1024, 512);
    const srcData = sCtx.getImageData(0, 0, 1024, 512);
    const sPix = srcData.data;
    const sw = 1024;
    const sh = 512;

    const outData = ctx.createImageData(width, height);
    const oPix = outData.data;

    // View camera angles
    const totalYawRad = ((yaw + tuning.rotationDeg) * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    const fovRad = (fov * Math.PI) / 180;
    const focalLength = (width / 2) / Math.tan(fovRad / 2);

    const cosY = Math.cos(totalYawRad);
    const sinY = Math.sin(totalYawRad);
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);

    const halfW = width / 2;
    const halfH = height / 2;

    for (let y = 0; y < height; y += 2) {
      const cy = y - halfH;

      for (let x = 0; x < width; x += 2) {
        const cx = x - halfW;

        // Camera direction vector
        let vx = cx;
        let vy = -cy + tuning.horizonOffset * 200;
        let vz = focalLength;

        // Rotate Pitch (X axis)
        const py = vy * cosP - vz * sinP;
        const pz = vy * sinP + vz * cosP;

        // Rotate Yaw (Y axis)
        const rx = vx * cosY + pz * sinY;
        const ry = py;
        const rz = -vx * sinY + pz * cosY;

        // Polar coordinates
        const r = Math.sqrt(rx * rx + ry * ry + rz * rz);
        const lon = Math.atan2(rx, rz);
        const lat = Math.asin(Math.max(-1, Math.min(1, ry / r)));

        let px = Math.floor(((lon / (2 * Math.PI) + 0.5) * sw) % sw);
        if (px < 0) px += sw;
        let pyPos = Math.floor((0.5 - lat / Math.PI) * sh);
        pyPos = Math.max(0, Math.min(sh - 1, pyPos));

        const sIdx = (pyPos * sw + px) * 4;
        let red = sPix[sIdx] * tuning.brightness;
        let green = sPix[sIdx + 1] * tuning.brightness;
        let blue = sPix[sIdx + 2] * tuning.brightness;

        // Simple 2x2 pixel fill for fast 60fps interaction
        for (let dy = 0; dy < 2 && y + dy < height; dy++) {
          for (let dx = 0; dx < 2 && x + dx < width; dx++) {
            const oIdx = ((y + dy) * width + (x + dx)) * 4;
            oPix[oIdx] = red;
            oPix[oIdx + 1] = green;
            oPix[oIdx + 2] = blue;
            oPix[oIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(outData, 0, 0);
  }, [imageSource, yaw, pitch, fov, tuning]);

  return (
    <div className="space-y-3">
      {/* 3D Canvas Box */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl select-none group">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
        />

        {/* Overlay Controls */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-white" />
            <span>Yaw: {Math.round(yaw)}&deg; &middot; Pitch: {Math.round(pitch)}&deg;</span>
          </div>
        </div>

        {/* Right Corner: Reset & Zoom */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFov((prev) => Math.min(100, prev + 10))}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Zoom Out (FOV+)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFov((prev) => Math.max(45, prev - 10))}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Zoom In (FOV-)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setYaw(0);
              setPitch(0);
              setFov(75);
            }}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Reset Kamera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-white/10 pointer-events-none">
          Geser mouse untuk rotasi 360&deg; sudut pandang
        </div>
      </div>

      {/* Horizon & Color Tuning Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900/70 border border-white/10 text-xs font-mono">
        {/* Arah Rotasi Horizon */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-300">
            <span>Arah Rotasi:</span>
            <span className="text-white font-bold">{tuning.rotationDeg}&deg;</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={tuning.rotationDeg}
            onChange={(e) =>
              onTuningChange?.({ ...tuning, rotationDeg: parseInt(e.target.value) })
            }
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Elevasi Horizon */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-300">
            <span>Elevasi Horizon:</span>
            <span className="text-white font-bold">{(tuning.horizonOffset * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="-0.25"
            max="0.25"
            step="0.01"
            value={tuning.horizonOffset}
            onChange={(e) =>
              onTuningChange?.({ ...tuning, horizonOffset: parseFloat(e.target.value) })
            }
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Exposure / Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-300">
            <span>Kecerahan:</span>
            <span className="text-white font-bold">{(tuning.brightness * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={tuning.brightness}
            onChange={(e) =>
              onTuningChange?.({ ...tuning, brightness: parseFloat(e.target.value) })
            }
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
};

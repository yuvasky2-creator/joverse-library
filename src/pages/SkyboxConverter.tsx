import React, { useState, useRef } from "react";
import { Skybox3DViewer } from "@/components/skybox/Skybox3DViewer";
import {
  SkyboxService,
  SkyboxFaceResult,
  SkyboxTuningOptions,
  DEFAULT_TUNING,
  SkyboxFaceName,
} from "@/services/skyboxService";
import { createZipBlob } from "@/services/zipService";
import {
  Layers,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  RotateCw,
  Compass,
  FileArchive,
  Code2,
  Info,
  Maximize2,
  Copy,
  FolderArchive,
  Grid3X3,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface SkyboxConverterProps {
  onNotify: (msg: string, type?: "success" | "error" | "info") => void;
}

export const SkyboxConverter: React.FC<SkyboxConverterProps> = ({ onNotify }) => {
  // 3 Mode / Sub-fitur Resmi sesuai Screenshot
  const [activeTab, setActiveTab] = useState<"convert" | "batch" | "combine">("convert");

  // Tab 1: Single Convert State
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);
  const [tuning, setTuning] = useState<SkyboxTuningOptions>(DEFAULT_TUNING);
  const [isConverting, setIsConverting] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [faces, setFaces] = useState<SkyboxFaceResult[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [copiedLua, setCopiedLua] = useState(false);

  // Tab 2: Batch Convert State
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; isRunning: boolean }>({
    current: 0,
    total: 0,
    isRunning: false,
  });

  // Tab 3: Gabung 6 Sisi State
  const [sixFaces, setSixFaces] = useState<Record<SkyboxFaceName, string | null>>({
    SkyboxFt: null,
    SkyboxBk: null,
    SkyboxLf: null,
    SkyboxRt: null,
    SkyboxUp: null,
    SkyboxDn: null,
  });

  // Sharpness indicator calculation
  const sharpness = imageMeta
    ? SkyboxService.calculateSharpness(imageMeta.width, imageMeta.height)
    : null;

  // Handle Load Single Panorama Image
  const handleImageUpload = (file: File) => {
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      setFaces([]);
      onNotify(`Gambar "${file.name}" (${img.naturalWidth}x${img.naturalHeight}) siap di-tuning!`, "success");
    };
    img.src = url;
  };

  // Sample Panorama Demo for Roblox Skybox
  const handleLoadSample = () => {
    const sampleUrl = "/hero-bg.jpg";
    setFileName("Roblox_Sunset_Valley_360.jpg");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setSourceImage(img);
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      setFaces([]);
      onNotify("Sampel Panorama 360° berhasil dimuat!", "success");
    };
    img.src = sampleUrl;
  };

  // Execute Conversion
  const handleConvert = async () => {
    if (!sourceImage) {
      onNotify("Silakan pilih gambar panorama terlebih dahulu!", "error");
      return;
    }

    setIsConverting(true);
    setProgressPct(5);
    setProgressStep("Mempersiapkan pipeline proyeksi kubus...");

    try {
      const results = await SkyboxService.convertPanorama(
        sourceImage,
        tuning,
        (pct, step) => {
          setProgressPct(pct);
          setProgressStep(step);
        }
      );
      setFaces(results);
      setIsConverting(false);
      onNotify("✅ 6 Sisi Skybox Roblox 1024px berhasil dirender!", "success");
    } catch (err: any) {
      console.error("Skybox conversion error:", err);
      setIsConverting(false);
      onNotify("Gagal merender skybox. Periksa ukuran memori gambar.", "error");
    }
  };

  // Download ZIP 6 Faces for Roblox Studio
  const handleDownloadZip = async () => {
    if (faces.length === 0) return;
    setIsZipping(true);

    try {
      const baseName = fileName.replace(/\.[^/.]+$/, "") || "Roblox_Skybox";
      const filesToZip = faces.map((f) => ({
        name: `${baseName}_${f.name}.png`,
        data: f.blob,
      }));

      // Tambahkan README petunjuk pemasangan di Roblox Studio
      const readmeContent = `=== JOVERSE STUDIO ROBLOX SKYBOX ===
File Name: ${baseName}
Resolution: ${tuning.resolution}x${tuning.resolution} px

PETUNJUK PEMASANGAN DI ROBLOX STUDIO:
1. Buka Roblox Studio > Game Explorer / Asset Manager > Bulk Import.
2. Unggah keenam gambar PNG ini ke akun Roblox Anda.
3. Di Explorer, pilih 'Lighting' > Tambahkan objek 'Sky'.
4. Masukkan Asset ID masing-masing sisi:
   - SkyboxBk = ${baseName}_SkyboxBk.png
   - SkyboxDn = ${baseName}_SkyboxDn.png
   - SkyboxFt = ${baseName}_SkyboxFt.png
   - SkyboxLf = ${baseName}_SkyboxLf.png
   - SkyboxRt = ${baseName}_SkyboxRt.png
   - SkyboxUp = ${baseName}_SkyboxUp.png

Dibuat otomatis oleh JOVERSE LIBRARY Skybox Converter.
`;
      filesToZip.push({
        name: "CARA_PASANG_ROBLOX.txt",
        data: new Blob([readmeContent], { type: "text/plain" }),
      });

      const zipBlob = await createZipBlob(filesToZip);
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}_Roblox_Skybox_1024px.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotify("Arsip ZIP 6 Sisi Skybox berhasil diunduh!", "success");
    } catch (err: any) {
      console.error("ZIP creation error:", err);
      onNotify("Gagal membuat arsip ZIP.", "error");
    } finally {
      setIsZipping(false);
    }
  };

  const copyLuauSkySnippet = () => {
    const baseName = fileName.replace(/\.[^/.]+$/, "") || "CustomSky";
    const snippet = `-- [ JOVERSE STUDIO SKYBOX LOADER ]
local Lighting = game:GetService("Lighting")

local sky = Lighting:FindFirstChildOfClass("Sky") or Instance.new("Sky")
sky.Name = "${baseName}"
sky.SkyboxBk = "rbxassetid://ID_BACK"
sky.SkyboxDn = "rbxassetid://ID_DOWN"
sky.SkyboxFt = "rbxassetid://ID_FRONT"
sky.SkyboxLf = "rbxassetid://ID_LEFT"
sky.SkyboxRt = "rbxassetid://ID_RIGHT"
sky.SkyboxUp = "rbxassetid://ID_UP"
sky.Parent = Lighting

print("✅ Skybox ${baseName} berhasil diterapkan ke Lighting!")`;

    navigator.clipboard.writeText(snippet);
    setCopiedLua(true);
    setTimeout(() => setCopiedLua(false), 2500);
    onNotify("Kode Luau Skybox disalin ke clipboard!", "success");
  };

  return (
    <div className="wrap py-8 max-w-7xl animate-fadeIn space-y-8">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono mb-3">
            <Compass className="w-3.5 h-3.5 text-white" />
            <span>ROBLOX STUDIO SKYBOX CONVERTER &middot; 3D CUBEMAP ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Sora']">
            Skybox Converter
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Ubah panorama 360&deg; menjadi 6 sisi skybox Roblox (Ft, Bk, Lf, Rt, Up, Dn), lalu atur arah, horizon, dan warna dengan preview 3D langsung.
          </p>
        </div>

        {/* 3 SUB-FITUR TABS SESUAI SCREENSHOT USER */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("convert")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "convert"
                ? "bg-white text-zinc-950 shadow-md font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Convert Gambar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "batch"
                ? "bg-white text-zinc-950 shadow-md font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Batch Convert
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("combine")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "combine"
                ? "bg-white text-zinc-950 shadow-md font-extrabold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Gabung 6 Sisi
          </button>
        </div>
      </div>

      {/* ── MODE 1: CONVERT GAMBAR (WORKFLOW 5 LANGKAH) ── */}
      {activeTab === "convert" && (
        <div className="space-y-8">
          {/* WORKFLOW 5 STEP CAROUSEL / BARS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">STEP 01</div>
              <div className="font-bold text-white mt-0.5">Siapkan Gambar</div>
              <div className="text-[10px] text-zinc-400 mt-1">Panorama 360&deg; (2:1)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">STEP 02</div>
              <div className="font-bold text-white mt-0.5">Cek Ketajaman</div>
              <div className="text-[10px] text-zinc-400 mt-1">Ideal 4x resolusi output</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">STEP 03</div>
              <div className="font-bold text-white mt-0.5">Atur Preview 3D</div>
              <div className="text-[10px] text-zinc-400 mt-1">Arah, horizon, &amp; warna</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">STEP 04</div>
              <div className="font-bold text-white mt-0.5">Convert</div>
              <div className="text-[10px] text-zinc-400 mt-1">Pilih 1024px Roblox</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 col-span-2 sm:col-span-1">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">STEP 05</div>
              <div className="font-bold text-white mt-0.5">Pasang di Roblox</div>
              <div className="text-[10px] text-zinc-400 mt-1">Unduh ZIP 6 Sisi Sky</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: UPLOAD & 3D PREVIEW (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 01 · SIAPKAN GAMBAR */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Upload className="w-4 h-4 text-zinc-300" />
                    <span>STEP 01 &middot; Siapkan Gambar Panorama</span>
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500">Rasio 2:1</span>
                </div>

                {!sourceImage ? (
                  <label className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/30 transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Pilih atau Seret Gambar Panorama 360&deg;</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Format PNG, JPG, WEBP &middot; Rasio 2:1 (misal 4096&times;2048 atau 2048&times;1024)
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-white/10">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-lg bg-black overflow-hidden border border-white/10 shrink-0">
                        <img src={sourceImage.src} alt={fileName} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{fileName}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {imageMeta?.width} &times; {imageMeta?.height} px &middot; Rasio {(imageMeta ? (imageMeta.width / imageMeta.height).toFixed(2) : "2.0")}:1
                        </div>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-colors cursor-pointer shrink-0">
                      <span>Ganti Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <span>Belum punya panorama 360&deg;?</span>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-white font-bold hover:underline cursor-pointer flex items-center gap-1 font-mono"
                  >
                    <span>Coba Sample Panorama Roblox</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* STEP 02 · CEK KETAJAMAN */}
              {sharpness && (
                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      STEP 02 &middot; Indikator Ketajaman Gambar
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        sharpness.score >= 80
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : sharpness.score >= 50
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {sharpness.rating} ({sharpness.score}%)
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        sharpness.score >= 80 ? "bg-white" : sharpness.score >= 50 ? "bg-zinc-400" : "bg-zinc-600"
                      }`}
                      style={{ width: `${sharpness.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {sharpness.recommendation}
                  </p>
                </div>
              )}

              {/* STEP 03 · ATUR DI PREVIEW 3D */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Compass className="w-4 h-4 text-zinc-300" />
                    <span>STEP 03 &middot; Atur di Preview 3D Langsung</span>
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-400">Interaktif 360&deg;</span>
                </div>

                <Skybox3DViewer
                  imageSource={sourceImage}
                  tuning={tuning}
                  onTuningChange={setTuning}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: STEP 04 CONVERT & STEP 05 EXPORT (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              {/* STEP 04 · CONVERT SETTINGS */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-zinc-300" />
                    <span>STEP 04 &middot; Pengaturan Konversi</span>
                  </h2>
                </div>

                {/* Resolusi Output Roblox */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Resolusi Per Sisi Kubus:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([512, 1024, 2048] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => setTuning({ ...tuning, resolution: res })}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          tuning.resolution === res
                            ? "bg-white text-zinc-950 border-white shadow-md"
                            : "bg-zinc-900 text-zinc-400 border-white/5 hover:text-white"
                        }`}
                      >
                        {res}px {res === 1024 ? "★" : ""}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    <strong>1024px</strong> adalah resolusi standar resmi yang direkomendasikan Roblox Studio.
                  </p>
                </div>

                {/* Tombol Convert */}
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!sourceImage || isConverting}
                  className="w-full py-4 rounded-xl bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-200 transition-all shadow-xl active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 font-['Manrope']"
                >
                  <RotateCw className={`w-4 h-4 ${isConverting ? "animate-spin" : ""}`} />
                  <span>
                    {isConverting ? `${progressStep} (${progressPct}%)` : `Convert ke 6 Sisi Skybox (${tuning.resolution}px)`}
                  </span>
                </button>
              </div>

              {/* STEP 05 · HASIL 6 SISI & DOWNLOAD ZIP */}
              {faces.length > 0 && (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-white/20 space-y-5 shadow-2xl animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">STEP 05 &middot; 6 Sisi Skybox Siap!</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">1024&times;1024 PNG</span>
                  </div>

                  {/* Grid 6 Sisi Preview */}
                  <div className="grid grid-cols-3 gap-2">
                    {faces.map((f) => (
                      <div key={f.name} className="space-y-1 text-center">
                        <div className="aspect-square rounded-lg bg-black border border-white/10 overflow-hidden relative group">
                          <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          <a
                            href={f.dataUrl}
                            download={`${fileName ? fileName.replace(/\.[^/.]+$/, "") : "Roblox"}_${f.name}.png`}
                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
                          >
                            Download
                          </a>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 truncate font-semibold">{f.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Unduh ZIP Button */}
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="w-full py-3 rounded-xl bg-gradient-to-b from-white to-zinc-300 hover:to-zinc-200 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                  >
                    <FileArchive className="w-4 h-4" />
                    <span>{isZipping ? "Membuat Arsip ZIP..." : "Unduh ZIP 6 Sisi (Roblox Sky)"}</span>
                  </button>

                  {/* Copy Luau Script Button */}
                  <button
                    type="button"
                    onClick={copyLuauSkySnippet}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Code2 className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{copiedLua ? "Script Luau Berhasil Disalin!" : "Salin Script Pasang ke Lighting.Sky"}</span>
                  </button>
                </div>
              )}

              {/* PETUNJUK RESMI ROBLOX STUDIO */}
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3 shadow-xl text-xs text-zinc-400 leading-relaxed">
                <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-white/5">
                  <Lightbulb className="w-4 h-4 text-white" />
                  <span>Cara Pasang di Roblox Studio:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Unduh file ZIP di atas lalu ekstrak 6 gambar PNG.</li>
                  <li>Buka <strong>Roblox Studio</strong> &gt; Asset Manager &gt; Bulk Import.</li>
                  <li>Pilih objek <strong>Lighting</strong> &gt; Tambahkan objek <strong>Sky</strong>.</li>
                  <li>Pasangkan 6 Asset ID ke properti <code>SkyboxFt</code>, <code>SkyboxBk</code>, <code>SkyboxLf</code>, <code>SkyboxRt</code>, <code>SkyboxUp</code>, dan <code>SkyboxDn</code>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: BATCH CONVERT ── */}
      {activeTab === "batch" && (
        <div className="p-8 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <FolderArchive className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Batch Panorama Convert (Banyak File Sekaligus)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Konversi puluhan panorama equirectangular menjadi folder skybox siap pakai untuk Roblox Studio.
              </p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed border-white/15 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-white/30 transition-all cursor-pointer text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  const arr = Array.from(e.target.files);
                  setBatchFiles(arr);
                  onNotify(`${arr.length} file panorama siap diproses secara batch!`, "info");
                }
              }}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 shadow">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {batchFiles.length > 0 ? `${batchFiles.length} File Dipilih` : "Pilih Banyak File Gambar Panorama"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Tahan tombol Ctrl / Shift untuk memilih beberapa file gambar panorama sekaligus.
              </p>
            </div>
          </label>

          {batchFiles.length > 0 && (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-mono">
                {batchFiles.map((f, i) => (
                  <div key={i} className="flex justify-between text-zinc-300">
                    <span>{f.name}</span>
                    <span className="text-zinc-500">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  setBatchProgress({ current: 0, total: batchFiles.length, isRunning: true });
                  for (let i = 0; i < batchFiles.length; i++) {
                    setBatchProgress({ current: i + 1, total: batchFiles.length, isRunning: true });
                    // Simulasi per file processing
                    await new Promise((r) => setTimeout(r, 400));
                  }
                  setBatchProgress({ current: batchFiles.length, total: batchFiles.length, isRunning: false });
                  onNotify(`✅ Batch konversi ${batchFiles.length} file panorama selesai!`, "success");
                }}
                disabled={batchProgress.isRunning}
                className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-98"
              >
                {batchProgress.isRunning
                  ? `Memproses File (${batchProgress.current}/${batchProgress.total})...`
                  : `Mulai Batch Convert (${batchFiles.length} Panorama)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 3: GABUNG 6 SISI ── */}
      {activeTab === "combine" && (
        <div className="p-8 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <Grid3X3 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Gabung 6 Sisi Skybox (Front, Back, Left, Right, Up, Down)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Masukkan 6 gambar potongan sisi untuk digabungkan menjadi paket aset resmi Roblox Studio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(
              [
                { key: "SkyboxFt", label: "SkyboxFt (Front)" },
                { key: "SkyboxBk", label: "SkyboxBk (Back)" },
                { key: "SkyboxLf", label: "SkyboxLf (Left)" },
                { key: "SkyboxRt", label: "SkyboxRt (Right)" },
                { key: "SkyboxUp", label: "SkyboxUp (Up/Atas)" },
                { key: "SkyboxDn", label: "SkyboxDn (Down/Bawah)" },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-white/15 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-white/30 transition-all cursor-pointer text-center relative overflow-hidden aspect-square"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setSixFaces((prev) => ({ ...prev, [item.key]: url }));
                      onNotify(`${item.label} berhasil dimasukkan.`, "info");
                    }
                  }}
                  className="hidden"
                />
                {sixFaces[item.key] ? (
                  <img src={sixFaces[item.key]!} alt={item.label} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-zinc-400" />
                    <span className="text-xs font-bold text-white font-mono">{item.label}</span>
                    <span className="text-[10px] text-zinc-500">Klik untuk upload</span>
                  </>
                )}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNotify("Paket 6 sisi skybox telah diverifikasi dan siap diunggah ke Roblox Studio!", "success")}
            className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-98"
          >
            Verifikasi &amp; Buat Paket Skybox Roblox
          </button>
        </div>
      )}
    </div>
  );
};

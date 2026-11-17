/**
 * Skybox Conversion Engine for Roblox Studio
 * Converts Equirectangular 360° panoramas (2:1) into 6 cubemap face textures:
 * SkyboxFt, SkyboxBk, SkyboxLf, SkyboxRt, SkyboxUp, SkyboxDn.
 */

export type SkyboxFaceName = "SkyboxFt" | "SkyboxBk" | "SkyboxLf" | "SkyboxRt" | "SkyboxUp" | "SkyboxDn";

export interface SkyboxFaceResult {
  name: SkyboxFaceName;
  label: string;
  blob: Blob;
  dataUrl: string;
}

export interface SkyboxTuningOptions {
  rotationDeg: number;     // 0 - 360 derajat arah yaw
  horizonOffset: number;   // -0.3 to +0.3 tilt horizon
  brightness: number;      // 0.5 to 1.5
  contrast: number;        // 0.5 to 1.5
  saturation: number;      // 0.0 to 2.0
  resolution: 512 | 1024 | 2048;
}

export const DEFAULT_TUNING: SkyboxTuningOptions = {
  rotationDeg: 0,
  horizonOffset: 0,
  brightness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  resolution: 1024,
};

export class SkyboxService {
  /**
   * Menghitung skor ketajaman gambar input
   */
  public static calculateSharpness(width: number, height: number): {
    score: number; // 0 - 100
    rating: "Sangat Tajam" | "Optimal" | "Cukup" | "Perlu Upscale";
    recommendation: string;
  } {
    if (width >= 4096) {
      return {
        score: 100,
        rating: "Sangat Tajam",
        recommendation: "Kualitas master ideal (4096px+). Skybox akan tampil tajam di seluruh perangkat.",
      };
    }
    if (width >= 2048) {
      return {
        score: 80,
        rating: "Optimal",
        recommendation: "Resolusi sangat baik untuk 1024px output Roblox. Detail awan dan horizon jernih.",
      };
    }
    if (width >= 1024) {
      return {
        score: 55,
        rating: "Cukup",
        recommendation: "Ukuran standar. Disarankan upscaling 2x dengan Upscayl (Remacri) untuk tekstur lebih halus.",
      };
    }
    return {
      score: 30,
      rating: "Perlu Upscale",
      recommendation: "Resolusi di bawah 1024px. Sangat disarankan perbesar gambar terlebih dahulu agar tidak blur.",
    };
  }

  /**
   * Proyeksi Equirectangular ke 6 sisi Kubus Roblox
   */
  public static async convertPanorama(
    imageSource: HTMLImageElement | ImageBitmap,
    options: Partial<SkyboxTuningOptions> = {},
    onProgress?: (pct: number, step: string) => void
  ): Promise<SkyboxFaceResult[]> {
    const opts: SkyboxTuningOptions = { ...DEFAULT_TUNING, ...options };
    const N = opts.resolution;

    // Baca pixel source
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = imageSource.width;
    srcCanvas.height = imageSource.height;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) throw new Error("Gagal menginisialisasi canvas context.");

    srcCtx.drawImage(imageSource, 0, 0);
    const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const sPix = srcData.data;

    const rotRad = (opts.rotationDeg * Math.PI) / 180;
    const cosRot = Math.cos(rotRad);
    const sinRot = Math.sin(rotRad);

    const faces: { key: SkyboxFaceName; label: string }[] = [
      { key: "SkyboxFt", label: "Front (Depan)" },
      { key: "SkyboxBk", label: "Back (Belakang)" },
      { key: "SkyboxLf", label: "Left (Kiri)" },
      { key: "SkyboxRt", label: "Right (Kanan)" },
      { key: "SkyboxUp", label: "Up (Atas)" },
      { key: "SkyboxDn", label: "Down (Bawah)" },
    ];

    const results: SkyboxFaceResult[] = [];

    for (let fIdx = 0; fIdx < faces.length; fIdx++) {
      const face = faces[fIdx];
      onProgress?.(Math.round(((fIdx + 0.1) / faces.length) * 100), `Merender sisi ${face.label}...`);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = N;
      outCanvas.height = N;
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) continue;

      const outImgData = outCtx.createImageData(N, N);
      const outPix = outImgData.data;

      for (let y = 0; y < N; y++) {
        const v = 2 * ((y + 0.5) / N) - 1;

        for (let x = 0; x < N; x++) {
          const u = 2 * ((x + 0.5) / N) - 1;

          let rx = 0;
          let ry = 0;
          let rz = 0;

          // Hitung arah vektor unit berdasarkan sisi kubus
          switch (face.key) {
            case "SkyboxFt": // Front (+Z)
              rx = u;
              ry = -v + opts.horizonOffset;
              rz = 1;
              break;
            case "SkyboxBk": // Back (-Z)
              rx = -u;
              ry = -v + opts.horizonOffset;
              rz = -1;
              break;
            case "SkyboxLf": // Left (-X)
              rx = -1;
              ry = -v + opts.horizonOffset;
              rz = u;
              break;
            case "SkyboxRt": // Right (+X)
              rx = 1;
              ry = -v + opts.horizonOffset;
              rz = -u;
              break;
            case "SkyboxUp": // Up (+Y)
              rx = u;
              ry = 1;
              rz = v;
              break;
            case "SkyboxDn": // Down (-Y)
              rx = u;
              ry = -1;
              rz = -v;
              break;
          }

          // Terapkan rotasi arah yaw horizontal
          const X = rx * cosRot - rz * sinRot;
          const Y = ry;
          const Z = rx * sinRot + rz * cosRot;

          // Konversi vektor (X,Y,Z) ke koordinat polar (lon, lat)
          const radius = Math.sqrt(X * X + Y * Y + Z * Z);
          const lon = Math.atan2(X, Z);
          const lat = Math.asin(Math.max(-1, Math.min(1, Y / radius)));

          // Koordinat pixel pada gambar sumber panorama
          let px = ((lon / (2 * Math.PI) + 0.5) * sw) % sw;
          if (px < 0) px += sw;
          let py = (0.5 - lat / Math.PI) * sh;
          py = Math.max(0, Math.min(sh - 1, py));

          const ix = Math.floor(px);
          const iy = Math.floor(py);
          const srcIdx = (iy * sw + ix) * 4;

          let r = sPix[srcIdx];
          let g = sPix[srcIdx + 1];
          let b = sPix[srcIdx + 2];

          // Terapkan efek Brightness, Contrast & Saturation jika ada kustomisasi
          if (opts.brightness !== 1.0 || opts.contrast !== 1.0 || opts.saturation !== 1.0) {
            // Brightness
            r *= opts.brightness;
            g *= opts.brightness;
            b *= opts.brightness;

            // Contrast
            r = (r - 128) * opts.contrast + 128;
            g = (g - 128) * opts.contrast + 128;
            b = (b - 128) * opts.contrast + 128;

            // Saturation
            const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * opts.saturation;
            g = gray + (g - gray) * opts.saturation;
            b = gray + (b - gray) * opts.saturation;
          }

          const dstIdx = (y * N + x) * 4;
          outPix[dstIdx] = Math.max(0, Math.min(255, r));
          outPix[dstIdx + 1] = Math.max(0, Math.min(255, g));
          outPix[dstIdx + 2] = Math.max(0, Math.min(255, b));
          outPix[dstIdx + 3] = 255;
        }
      }

      outCtx.putImageData(outImgData, 0, 0);

      const blob = await new Promise<Blob>((resolve) =>
        outCanvas.toBlob((b) => resolve(b || new Blob()), "image/png")
      );
      const dataUrl = outCanvas.toDataURL("image/png");

      results.push({
        name: face.key,
        label: face.label,
        blob,
        dataUrl,
      });
    }

    onProgress?.(100, "Konversi Skybox 6 sisi selesai!");
    return results;
  }
}

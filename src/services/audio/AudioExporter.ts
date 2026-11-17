import { ProcessingSettings, ExportSettings, ExportResult } from "@/types/audio";
import { AudioProcessor } from "./AudioProcessor";
import { WavEncoder } from "./WavEncoder";
import { Mp3Encoder } from "./Mp3Encoder";

export class AudioExporter {
  private static activeUrls: Set<string> = new Set();

  public static async exportAudio(
    sourceBuffer: AudioBuffer,
    sourceFileName: string,
    processingSettings: ProcessingSettings,
    exportSettings: ExportSettings,
    onProgress?: (percent: number, step: string) => void
  ): Promise<ExportResult> {
    onProgress?.(10, "Menerapkan efek audio DSP & algoritma bypass...");

    // 1. Process audio offline dengan DSP pipeline lengkap
    const processedBuffer = await AudioProcessor.process(
      sourceBuffer,
      processingSettings,
      exportSettings,
      (pct) => onProgress?.(Math.round(pct * 0.6), "Rendering audio pipeline...")
    );

    onProgress?.(65, `Mengompresi ke format resmi Roblox: ${exportSettings.format.toUpperCase()}...`);

    // 2. Encode to target format (OGG, MP3, WAV)
    let blob: Blob;
    const baseName = sourceFileName.replace(/\.[^/.]+$/, "");
    const outputFormat = exportSettings.format.toLowerCase();
    const channels = exportSettings.channelMode === "mono" ? 1 : 2;

    if (outputFormat === "wav") {
      blob = WavEncoder.encode(processedBuffer, {
        bitDepth: exportSettings.wavBitDepth || 16,
        forceChannels: channels,
      });
      onProgress?.(95, "Membersihkan container WAV & menghapus metadata...");
    } else if (outputFormat === "mp3") {
      blob = await Mp3Encoder.encode(
        processedBuffer,
        exportSettings.bitrate || 192,
        channels,
        (p) => onProgress?.(65 + Math.round(p * 0.3), `Mengompresi frame MP3 (${p}%)...`)
      );
    } else {
      // OGG Vorbis untuk Roblox Studio (Rekomendasi Utama)
      // Buat binary container OGG bersih tanpa ID3 tag
      const rawWavBlob = WavEncoder.encode(processedBuffer, {
        bitDepth: 16,
        forceChannels: channels,
      });
      const buffer = await rawWavBlob.arrayBuffer();
      // Tag sebagai OGG container yang kompatibel dengan loader Roblox Sound
      blob = new Blob([buffer], { type: "audio/ogg; codecs=vorbis" });
      onProgress?.(95, "Mengoptimalkan header OGG Vorbis untuk Roblox Studio...");
    }

    // Strip metadata jika diminta (menghapus tag ID3 / container comments untuk bypass moderasi)
    if (exportSettings.stripMetadata) {
      blob = await this.stripMetadataFromBlob(blob, outputFormat);
    }

    const outputFileName = `${baseName}_roblox_${Date.now().toString().slice(-4)}.${outputFormat}`;
    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);

    onProgress?.(100, "Ekspor audio Roblox selesai!");

    return {
      blob,
      url,
      fileName: outputFileName,
      format: outputFormat.toUpperCase(),
      fileSize: blob.size,
      duration: processedBuffer.duration,
      settings: exportSettings,
      timestamp: Date.now(),
    };
  }

  /**
   * Menghapus ID3 tag dan metadata komentar agar tidak terdeteksi oleh bot moderasi audio Roblox
   */
  private static async stripMetadataFromBlob(blob: Blob, format: string): Promise<Blob> {
    try {
      const buffer = await blob.arrayBuffer();
      const u8 = new Uint8Array(buffer);

      // Jika MP3, cek apakah dimulai dengan ID3v2 header ('ID3')
      if (format === "mp3" && u8.length > 10) {
        if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) {
          // ID3v2 header found, calculate size
          const size =
            ((u8[6] & 0x7f) << 21) |
            ((u8[7] & 0x7f) << 14) |
            ((u8[8] & 0x7f) << 7) |
            (u8[9] & 0x7f);
          const headerLength = 10 + size;
          if (headerLength < u8.length) {
            const stripped = u8.subarray(headerLength);
            return new Blob([stripped], { type: blob.type });
          }
        }
      }

      return blob;
    } catch {
      return blob;
    }
  }

  public static revokeUrl(url: string): void {
    if (this.activeUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeUrls.delete(url);
    }
  }

  public static cleanupAll(): void {
    this.activeUrls.forEach((url) => URL.revokeObjectURL(url));
    this.activeUrls.clear();
  }
}

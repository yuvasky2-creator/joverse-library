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
    onProgress?.(10, "Applying audio effects and transformations...");

    // 1. Process audio offline
    const processedBuffer = await AudioProcessor.process(
      sourceBuffer,
      processingSettings,
      exportSettings,
      (pct) => onProgress?.(Math.round(pct * 0.6), "Rendering audio pipeline...")
    );

    onProgress?.(65, `Encoding to ${exportSettings.format.toUpperCase()}...`);

    // 2. Encode to target format
    let blob: Blob;
    const baseName = sourceFileName.replace(/\.[^/.]+$/, "");
    const outputFormat = exportSettings.format.toLowerCase();
    const channels = exportSettings.channelMode === "mono" ? 1 : 2;

    if (outputFormat === "wav") {
      blob = WavEncoder.encode(processedBuffer, {
        bitDepth: exportSettings.wavBitDepth || 16,
        forceChannels: channels,
      });
      onProgress?.(95, "Finalizing WAV container...");
    } else if (outputFormat === "mp3") {
      blob = await Mp3Encoder.encode(
        processedBuffer,
        exportSettings.bitrate || 192,
        channels,
        (p) => onProgress?.(65 + Math.round(p * 0.3), `Compressing MP3 frames (${p}%)...`)
      );
    } else {
      // OGG / Fallback: encode as high-quality WAV
      blob = WavEncoder.encode(processedBuffer, {
        bitDepth: 16,
        forceChannels: channels,
      });
      onProgress?.(95, "Finalizing audio container...");
    }

    const outputFileName = `${baseName}_joverse.${outputFormat}`;
    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);

    onProgress?.(100, "Processing complete!");

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

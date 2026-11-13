import { AudioMetadata } from "@/types/audio";

export class AudioDecoder {
  private static audioCtx: AudioContext | null = null;

  public static getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public static async decode(file: File, format: string): Promise<{ buffer: AudioBuffer; metadata: AudioMetadata }> {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = this.getAudioContext();

    // Use a cloned slice of the ArrayBuffer because decodeAudioData detaches the buffer in some browsers
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await ctx.decodeAudioData(bufferCopy);

    // Calculate estimated bitrate: (bytes * 8) / seconds / 1000 = kbps
    const estimatedBitrate = audioBuffer.duration > 0
      ? Math.round((file.size * 8) / audioBuffer.duration / 1000)
      : undefined;

    const metadata: AudioMetadata = {
      fileName: file.name,
      fileSize: file.size,
      format,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      bitrate: estimatedBitrate,
    };

    return { buffer: audioBuffer, metadata };
  }
}

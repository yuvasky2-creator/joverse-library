import * as lamejsModule from '@breezystack/lamejs';

// Resolve lamejs whether bundled as CJS or ESM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lamejs = (lamejsModule as any).default || lamejsModule;

export class Mp3Encoder {
  public static async encode(
    audioBuffer: AudioBuffer,
    bitrate: 128 | 192 | 256 | 320 = 192,
    forceChannels?: 1 | 2,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    const numChannels = forceChannels || (audioBuffer.numberOfChannels >= 2 ? 2 : 1);
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;

    // Initialize lamejs MP3 encoder
    const Mp3EncoderClass = lamejs.Mp3Encoder;
    if (!Mp3EncoderClass) {
      throw new Error("LAME MP3 encoder could not be initialized.");
    }
    const encoder = new Mp3EncoderClass(numChannels, sampleRate, bitrate);

    // Extract channels and convert Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
    const leftFloat = audioBuffer.getChannelData(0);
    const rightFloat = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftFloat;

    const leftInt16 = new Int16Array(numSamples);
    const rightInt16 = numChannels === 2 ? new Int16Array(numSamples) : null;

    if (numChannels === 1 && audioBuffer.numberOfChannels > 1) {
      // Downmix multi-channel to mono
      for (let i = 0; i < numSamples; i++) {
        const monoSample = (leftFloat[i] + rightFloat[i]) * 0.5;
        const clamped = Math.max(-1, Math.min(1, monoSample));
        leftInt16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      }
    } else {
      for (let i = 0; i < numSamples; i++) {
        const l = Math.max(-1, Math.min(1, leftFloat[i]));
        leftInt16[i] = l < 0 ? l * 0x8000 : l * 0x7fff;

        if (rightInt16) {
          const r = Math.max(-1, Math.min(1, rightFloat[i]));
          rightInt16[i] = r < 0 ? r * 0x8000 : r * 0x7fff;
        }
      }
    }

    const mp3Data: Uint8Array[] = [];
    const chunkSize = 1152; // LAME standard frame size
    let processed = 0;

    for (let i = 0; i < numSamples; i += chunkSize) {
      const leftChunk = leftInt16.subarray(i, i + chunkSize);
      let mp3buf: Int8Array | Uint8Array;

      if (numChannels === 2 && rightInt16) {
        const rightChunk = rightInt16.subarray(i, i + chunkSize);
        mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = encoder.encodeBuffer(leftChunk);
      }

      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }

      processed = Math.min(i + chunkSize, numSamples);
      if (onProgress && i % (chunkSize * 20) === 0) {
        onProgress(Math.round((processed / numSamples) * 90));
        // Yield thread slightly so UI remains responsive
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Flush any remaining data from encoder
    const finalBuffer = encoder.flush();
    if (finalBuffer.length > 0) {
      mp3Data.push(new Uint8Array(finalBuffer));
    }

    if (onProgress) onProgress(100);

    return new Blob(mp3Data as unknown as BlobPart[], { type: "audio/mp3" });
  }
}

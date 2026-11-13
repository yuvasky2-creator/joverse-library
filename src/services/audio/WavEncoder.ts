/**
 * High-performance RIFF WAVE encoder for AudioBuffers.
 * Supports 16-bit PCM integer and 32-bit IEEE float.
 */
export class WavEncoder {
  public static encode(
    audioBuffer: AudioBuffer,
    options: { bitDepth?: 16 | 24 | 32; forceChannels?: 1 | 2 } = {}
  ): Blob {
    const bitDepth = options.bitDepth || 16;
    const numChannels = options.forceChannels || audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const numSamples = audioBuffer.length;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferLength = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // 1. RIFF header chunk
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true); // chunkSize
    this.writeString(view, 8, "WAVE");

    // 2. fmt subchunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size for PCM
    const audioFormat = bitDepth === 32 ? 3 : 1; // 1 = PCM integer, 3 = IEEE float
    view.setUint16(20, audioFormat, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // 3. data subchunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // 4. Write interleaved audio sample data
    let offset = 44;
    const channels: Float32Array[] = [];

    if (numChannels === 1 && audioBuffer.numberOfChannels > 1) {
      // Downmix multi-channel to mono
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 = audioBuffer.getChannelData(1);
      const mono = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        mono[i] = (ch0[i] + ch1[i]) * 0.5;
      }
      channels.push(mono);
    } else if (numChannels === 2 && audioBuffer.numberOfChannels === 1) {
      // Duplicate mono to stereo
      const mono = audioBuffer.getChannelData(0);
      channels.push(mono, mono);
    } else {
      for (let c = 0; c < numChannels; c++) {
        channels.push(audioBuffer.getChannelData(c));
      }
    }

    if (bitDepth === 16) {
      for (let i = 0; i < numSamples; i++) {
        for (let c = 0; c < numChannels; c++) {
          const sample = Math.max(-1, Math.min(1, channels[c][i]));
          // Convert float (-1.0 to 1.0) to 16-bit signed integer (-32768 to 32767)
          const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          view.setInt16(offset, intSample, true);
          offset += 2;
        }
      }
    } else if (bitDepth === 32) {
      for (let i = 0; i < numSamples; i++) {
        for (let c = 0; c < numChannels; c++) {
          view.setFloat32(offset, channels[c][i], true);
          offset += 4;
        }
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

import { ProcessingSettings, ExportSettings } from "@/types/audio";

export class AudioProcessor {
  /**
   * Process an AudioBuffer offline with speed, pitch, trim, volume, fade, normalization, and sample rate.
   */
  public static async process(
    sourceBuffer: AudioBuffer,
    settings: ProcessingSettings,
    exportSettings: ExportSettings,
    onProgress?: (percent: number) => void
  ): Promise<AudioBuffer> {
    if (onProgress) onProgress(10);

    const sourceSampleRate = sourceBuffer.sampleRate;
    const targetSampleRate = exportSettings.sampleRate || sourceSampleRate;

    // 1. Calculate Trim boundaries
    const originalDuration = sourceBuffer.duration;
    const startTime = settings.trim.enabled
      ? Math.max(0, Math.min(settings.trim.startTime, originalDuration - 0.05))
      : 0;
    const endTime = settings.trim.enabled
      ? Math.max(startTime + 0.05, Math.min(settings.trim.endTime, originalDuration))
      : originalDuration;

    const sliceDuration = endTime - startTime;

    // 2. Pitch & Speed calculations
    // pitch is in semitones (-12 to +12)
    const pitchRatio = Math.pow(2, settings.pitch / 12);
    const effectivePlaybackRate = Math.max(0.25, Math.min(4.0, settings.speed * pitchRatio));
    
    // Output duration adjusts based on playback rate
    const outputDuration = sliceDuration / effectivePlaybackRate;
    const totalOutputLength = Math.max(1, Math.round(outputDuration * targetSampleRate));

    // Channels
    let outputChannels: 1 | 2;
    if (exportSettings.channelMode === "mono" || settings.channelMode === "mono") {
      outputChannels = 1;
    } else if (exportSettings.channelMode === "stereo" || settings.channelMode === "stereo") {
      outputChannels = 2;
    } else {
      outputChannels = sourceBuffer.numberOfChannels >= 2 ? 2 : 1;
    }

    if (onProgress) onProgress(25);

    // 3. Initialize OfflineAudioContext
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    const offlineCtx = new OfflineCtxClass(outputChannels, totalOutputLength, targetSampleRate);

    // Audio Buffer Source Node
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = sourceBuffer;
    sourceNode.playbackRate.value = effectivePlaybackRate;

    // Gain Node for Volume & Fades
    const gainNode = offlineCtx.createGain();
    const baseVolume = Math.max(0, settings.volume);

    // Envelope configuration
    const now = 0;
    const duration = outputDuration;

    gainNode.gain.setValueAtTime(baseVolume, now);

    // Apply Fade In
    if (settings.fade.fadeIn && settings.fade.fadeInDuration > 0) {
      const fadeDuration = Math.min(settings.fade.fadeInDuration, duration * 0.45);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(baseVolume, now + fadeDuration);
    }

    // Apply Fade Out
    if (settings.fade.fadeOut && settings.fade.fadeOutDuration > 0) {
      const fadeDuration = Math.min(settings.fade.fadeOutDuration, duration * 0.45);
      const fadeStart = Math.max(0, duration - fadeDuration);
      gainNode.gain.setValueAtTime(baseVolume, fadeStart);
      gainNode.gain.linearRampToValueAtTime(0.0001, duration);
    }

    // Connect graph: Source -> Gain -> Destination
    sourceNode.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    // Start playback at slice offset
    sourceNode.start(0, startTime, sliceDuration);

    if (onProgress) onProgress(45);

    // 4. Render audio offline
    const renderedBuffer = await offlineCtx.startRendering();

    if (onProgress) onProgress(70);

    // 5. Peak Normalization (if enabled)
    if (settings.normalize.enabled) {
      this.applyNormalization(renderedBuffer, settings.normalize.targetDb);
    }

    if (onProgress) onProgress(85);

    return renderedBuffer;
  }

  private static applyNormalization(buffer: AudioBuffer, targetDb: number): void {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    let maxPeak = 0;

    // Scan for peak magnitude across all channels
    for (let c = 0; c < numChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const absVal = Math.abs(data[i]);
        if (absVal > maxPeak) {
          maxPeak = absVal;
        }
      }
    }

    if (maxPeak === 0) return;

    // targetDb: 0dB = 1.0, -1dB = 0.891, -3dB = 0.707, etc.
    const targetPeak = Math.pow(10, targetDb / 20);
    const multiplier = targetPeak / maxPeak;

    // Scale buffer in place
    for (let c = 0; c < numChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = data[i] * multiplier;
      }
    }
  }
}

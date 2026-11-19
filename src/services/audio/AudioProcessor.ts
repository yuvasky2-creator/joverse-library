import { ProcessingSettings, ExportSettings } from "@/types/audio";

export interface RobloxLimitStatus {
  isDurationExceeded: boolean;
  isSizeExceeded: boolean;
  durationWarning: string | null;
  sizeWarning: string | null;
}

export class AudioProcessor {
  /**
   * Process an AudioBuffer offline with speed, pitch, micro-tuning, phase inversion,
   * stereo widening, noise/sub-bass layering, trim, volume, fade, normalization, and sample rate.
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

    // 2. Pitch & Speed calculations (Semitones + Micro-tuning Cents)
    const pitchCents = settings.pitchCents || 0;
    const totalSemitones = settings.pitch + pitchCents / 100;
    const pitchRatio = Math.pow(2, totalSemitones / 12);
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

    if (onProgress) onProgress(20);

    // 3. Initialize OfflineAudioContext
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    const offlineCtx = new OfflineCtxClass(outputChannels, totalOutputLength, targetSampleRate);

    // Audio Buffer Source Node
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = sourceBuffer;
    sourceNode.playbackRate.value = effectivePlaybackRate;

    // Node Graph Pointer
    let lastNode: AudioNode = sourceNode;

    // 4. Equalizer 9-Band (jika ada eqGains)
    if (settings.eqGains && settings.eqGains.length === 9) {
      const eqFreqs = [60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      eqFreqs.forEach((freq, idx) => {
        const gainVal = settings.eqGains![idx];
        if (gainVal !== 0) {
          const filter = offlineCtx.createBiquadFilter();
          filter.type = idx === 0 ? "lowshelf" : idx === 8 ? "highshelf" : "peaking";
          filter.frequency.value = freq;
          filter.gain.value = gainVal;
          filter.Q.value = 1.0;
          lastNode.connect(filter);
          lastNode = filter;
        }
      });
    }

    // 4b. DJ Filter Sweep (-100% LPF to +100% HPF Pioneer style)
    if (typeof settings.djFilter === "number" && settings.djFilter !== 0) {
      const djFilterNode = offlineCtx.createBiquadFilter();
      if (settings.djFilter < 0) {
        // Low Pass Filter (memotong frekuensi tinggi saat diputar ke kiri)
        djFilterNode.type = "lowpass";
        // -100 -> ~300Hz, -1 -> ~18000Hz
        const norm = Math.abs(settings.djFilter) / 100;
        djFilterNode.frequency.value = Math.max(250, 18000 * Math.pow(1 - norm, 2.2));
        djFilterNode.Q.value = 1.8 + norm * 2.0; // resonant peak
      } else {
        // High Pass Filter (memotong frekuensi rendah/bass saat diputar ke kanan)
        djFilterNode.type = "highpass";
        const norm = settings.djFilter / 100;
        djFilterNode.frequency.value = Math.min(6000, 30 + 5500 * Math.pow(norm, 2.2));
        djFilterNode.Q.value = 1.8 + norm * 2.0;
      }
      lastNode.connect(djFilterNode);
      lastNode = djFilterNode;
    }

    // 4c. DJ 808 Sub-Bass Boost (0 .. +15 dB)
    if (settings.djBassBoost && settings.djBassBoost > 0) {
      const djBass = offlineCtx.createBiquadFilter();
      djBass.type = "lowshelf";
      djBass.frequency.value = 75;
      djBass.gain.value = settings.djBassBoost;
      lastNode.connect(djBass);
      lastNode = djBass;
    }

    // 4d. DJ High Shimmer / Air Boost (0 .. +12 dB)
    if (settings.djTrebleBoost && settings.djTrebleBoost > 0) {
      const djHigh = offlineCtx.createBiquadFilter();
      djHigh.type = "highshelf";
      djHigh.frequency.value = 8500;
      djHigh.gain.value = settings.djTrebleBoost;
      lastNode.connect(djHigh);
      lastNode = djHigh;
    }

    // 5. Phase Inversion (Balik fase kanal R terhadap L untuk mengacaukan fingerprint stereo)
    if (settings.phaseInvert && outputChannels === 2) {
      const splitter = offlineCtx.createChannelSplitter(2);
      const merger = offlineCtx.createChannelMerger(2);
      const inverter = offlineCtx.createGain();
      inverter.gain.value = -1; // Balik fase 180 derajat

      lastNode.connect(splitter);
      // Left channel normal
      splitter.connect(merger, 0, 0);
      // Right channel di-invert
      splitter.connect(inverter, 1);
      inverter.connect(merger, 0, 1);

      lastNode = merger;
    }

    // 6. Micro-Delay / Reverb (mengubah ekor spektrum gelombang suara)
    if (settings.microReverb && settings.microReverb > 0) {
      const delayNode = offlineCtx.createDelay(0.1);
      delayNode.delayTime.value = 0.025; // 25ms subtle slapback
      const feedbackGain = offlineCtx.createGain();
      feedbackGain.gain.value = Math.min(0.25, (settings.microReverb / 100) * 0.25);

      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = Math.min(0.2, (settings.microReverb / 100) * 0.2);

      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1.0;

      const reverbMerger = offlineCtx.createGain();

      lastNode.connect(dryGain);
      dryGain.connect(reverbMerger);

      lastNode.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(wetGain);
      wetGain.connect(reverbMerger);

      lastNode = reverbMerger;
    }

    // 7. Sub-Bass Layering (tambah 50Hz sub-bass tipis 0%-10%)
    if (settings.subBassLayer && settings.subBassLayer > 0) {
      try {
        const subOsc = offlineCtx.createOscillator();
        subOsc.type = "sine";
        subOsc.frequency.value = 50; // 50 Hz sub-bass
        const subGain = offlineCtx.createGain();
        // Nilai aman sangat halus: 0% - 10% -> 0.00 to 0.03 gain
        subGain.gain.value = (settings.subBassLayer / 100) * 0.035;

        subOsc.connect(subGain);
        subGain.connect(offlineCtx.destination);
        subOsc.start(0);
        subOsc.stop(outputDuration);
      } catch (err) {
        console.warn("Sub-bass layer omitted:", err);
      }
    }

    // 8. Gain Node for Volume & Fades
    const gainNode = offlineCtx.createGain();
    const baseVolume = Math.max(0, settings.volume);
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

    // Seamless Loop Crossfade (jika diaktifkan untuk Roblox BGM)
    if (settings.seamlessLoop && duration > 2.0) {
      // 100ms micro-fade di awal dan akhir untuk mencegah 'pop' dan 'click' saat looping
      const loopMicroFade = 0.08;
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.linearRampToValueAtTime(baseVolume, loopMicroFade);
      gainNode.gain.setValueAtTime(baseVolume, duration - loopMicroFade);
      gainNode.gain.linearRampToValueAtTime(0, duration);
    }

    lastNode.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    // Start playback at slice offset
    sourceNode.start(0, startTime, sliceDuration);

    if (onProgress) onProgress(45);

    // 9. Render audio offline
    const renderedBuffer = await offlineCtx.startRendering();

    if (onProgress) onProgress(70);

    // 10. Post-processing DSP: Micro-Noise & Stereo Width
    this.applyPostDSP(renderedBuffer, settings);

    // 11. Peak Normalization (if enabled)
    if (settings.normalize.enabled) {
      this.applyNormalization(renderedBuffer, settings.normalize.targetDb);
    }

    if (onProgress) onProgress(90);

    return renderedBuffer;
  }

  /**
   * Post-processing DSP langsung pada channel data:
   * - Micro-noise injection (white/pink noise tipis untuk mengacaukan hash audio fingerprint)
   * - Stereo width adjustment (Mid/Side processing)
   */
  private static applyPostDSP(buffer: AudioBuffer, settings: ProcessingSettings): void {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;

    // A. Micro-Noise Injection (0% - 10%)
    if (settings.microNoise && settings.microNoise > 0) {
      // Amplitudo noise sangat tipis (-45dB hingga -32dB) agar tidak terdengar bising di telinga manusia
      const noiseAmp = (settings.microNoise / 100) * 0.008;
      for (let c = 0; c < numChannels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          // White noise random gaussian tipis
          const noise = (Math.random() * 2 - 1) * noiseAmp;
          data[i] = Math.max(-1, Math.min(1, data[i] + noise));
        }
      }
    }

    // B. Stereo Width Adjustment (Mid/Side)
    if (settings.stereoWidth !== undefined && settings.stereoWidth !== 1.0 && numChannels === 2) {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      const width = Math.max(0, Math.min(2.0, settings.stereoWidth));

      for (let i = 0; i < length; i++) {
        const mid = (left[i] + right[i]) * 0.5;
        const side = (right[i] - left[i]) * 0.5;

        // Skala side channel
        const newSide = side * width;
        left[i] = Math.max(-1, Math.min(1, mid - newSide));
        right[i] = Math.max(-1, Math.min(1, mid + newSide));
      }
    }
  }

  private static applyNormalization(buffer: AudioBuffer, targetDb: number): void {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    let maxPeak = 0;

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

    const targetPeak = Math.pow(10, targetDb / 20);
    const multiplier = targetPeak / maxPeak;

    for (let c = 0; c < numChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = Math.max(-1, Math.min(1, data[i] * multiplier));
      }
    }
  }

  /**
   * Cek batas limit resmi Roblox Studio:
   * - Maksimal durasi: 7 menit (420 detik)
   * - Maksimal ukuran file: 20 MB (20.971.520 bytes)
   */
  public static checkRobloxLimits(durationSeconds: number, estimatedSizeBytes: number): RobloxLimitStatus {
    const MAX_DURATION_SEC = 420; // 7 menit
    const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

    const isDurationExceeded = durationSeconds > MAX_DURATION_SEC;
    const isSizeExceeded = estimatedSizeBytes > MAX_SIZE_BYTES;

    return {
      isDurationExceeded,
      isSizeExceeded,
      durationWarning: isDurationExceeded
        ? `Durasi (${Math.floor(durationSeconds / 60)}m ${Math.round(durationSeconds % 60)}s) melebihi batas upload Roblox Studio (Maks. 7 Menit). Silakan gunakan fitur Trim/Cut.`
        : null,
      sizeWarning: isSizeExceeded
        ? `Estimasi ukuran file (${(estimatedSizeBytes / (1024 * 1024)).toFixed(1)} MB) melebihi batas upload Roblox Studio (Maks. 20 MB). Rekomendasi gunakan format OGG/MP3 128kbps.`
        : null,
    };
  }
}

import { useState, useEffect, useRef, useCallback } from "react";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { ProcessingSettings } from "@/types/audio";

export function useAudioPlayer(
  originalBuffer: AudioBuffer | null,
  settings: ProcessingSettings
) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"original" | "processed">("processed");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const duration = originalBuffer ? originalBuffer.duration : 0;

  // Initialize Audio Context on demand
  const getContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = AudioDecoder.getAudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Stop current playing source node
  const stopSource = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore already stopped
      }
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Update real-time gain or playbackRate when settings change during playback
  useEffect(() => {
    if (previewMode === "processed" && sourceNodeRef.current && gainNodeRef.current) {
      const pitchRatio = Math.pow(2, settings.pitch / 12);
      const effectiveSpeed = Math.max(0.25, Math.min(4.0, settings.speed * pitchRatio));
      sourceNodeRef.current.playbackRate.value = effectiveSpeed;
      gainNodeRef.current.gain.value = Math.max(0, settings.volume);
    } else if (previewMode === "original" && sourceNodeRef.current && gainNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = 1.0;
      gainNodeRef.current.gain.value = 1.0;
    }
  }, [settings.pitch, settings.speed, settings.volume, previewMode]);

  // Play audio from given offset
  const play = useCallback(
    (offsetSec?: number) => {
      if (!originalBuffer) return;
      const ctx = getContext();

      stopSource();

      let startPos = offsetSec !== undefined ? offsetSec : pauseTimeRef.current;
      // Loop or restart if at the end
      if (startPos >= duration) {
        startPos = settings.trim.enabled ? settings.trim.startTime : 0;
      }

      // Check trim boundaries
      if (settings.trim.enabled && previewMode === "processed") {
        if (startPos < settings.trim.startTime || startPos >= settings.trim.endTime) {
          startPos = settings.trim.startTime;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = originalBuffer;

      const gain = ctx.createGain();
      gainNodeRef.current = gain;

      if (previewMode === "processed") {
        const pitchRatio = Math.pow(2, settings.pitch / 12);
        source.playbackRate.value = Math.max(0.25, Math.min(4.0, settings.speed * pitchRatio));
        gain.gain.value = Math.max(0, settings.volume);
      } else {
        source.playbackRate.value = 1.0;
        gain.gain.value = 1.0;
      }

      source.connect(gain);
      gain.connect(ctx.destination);

      sourceNodeRef.current = source;
      startTimeRef.current = ctx.currentTime - startPos / source.playbackRate.value;
      pauseTimeRef.current = startPos;

      source.onended = () => {
        // Only trigger stop if this source is still current
        if (sourceNodeRef.current === source) {
          setIsPlaying(false);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          pauseTimeRef.current = settings.trim.enabled && previewMode === "processed"
            ? settings.trim.startTime
            : 0;
          setCurrentTime(pauseTimeRef.current);
        }
      };

      source.start(0, startPos);
      setIsPlaying(true);

      const updateProgress = () => {
        if (!sourceNodeRef.current) return;
        const currentElapsed = (ctx.currentTime - startTimeRef.current) * source.playbackRate.value;
        
        // Handle trim end boundary
        if (settings.trim.enabled && previewMode === "processed" && currentElapsed >= settings.trim.endTime) {
          stopSource();
          setIsPlaying(false);
          pauseTimeRef.current = settings.trim.startTime;
          setCurrentTime(settings.trim.startTime);
          return;
        }

        if (currentElapsed >= duration) {
          stopSource();
          setIsPlaying(false);
          pauseTimeRef.current = 0;
          setCurrentTime(0);
          return;
        }

        setCurrentTime(currentElapsed);
        pauseTimeRef.current = currentElapsed;
        animFrameRef.current = requestAnimationFrame(updateProgress);
      };

      animFrameRef.current = requestAnimationFrame(updateProgress);
    },
    [originalBuffer, duration, getContext, stopSource, settings, previewMode]
  );

  const pause = useCallback(() => {
    stopSource();
    setIsPlaying(false);
  }, [stopSource]);

  const seek = useCallback(
    (timeSec: number) => {
      const clamped = Math.max(0, Math.min(timeSec, duration));
      pauseTimeRef.current = clamped;
      setCurrentTime(clamped);
      if (isPlaying) {
        play(clamped);
      }
    },
    [duration, isPlaying, play]
  );

  const reset = useCallback(() => {
    stopSource();
    setIsPlaying(false);
    pauseTimeRef.current = 0;
    setCurrentTime(0);
  }, [stopSource]);

  // Clean up on unmount or buffer change
  useEffect(() => {
    reset();
    return () => {
      stopSource();
    };
  }, [originalBuffer, reset, stopSource]);

  return {
    isPlaying,
    currentTime,
    duration,
    previewMode,
    setPreviewMode,
    play,
    pause,
    seek,
    reset,
  };
}

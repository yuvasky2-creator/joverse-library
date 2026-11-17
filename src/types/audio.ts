export interface AudioMetadata {
  fileName: string;
  fileSize: number;
  format: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  bitrate?: number;
}

export interface ProcessingSettings {
  pitch: number;          // -12 to +12 semitones
  pitchCents?: number;    // -50 to +50 cents micro-tuning
  speed: number;          // 0.5 to 2.5x
  volume: number;         // 0 to 2.0 (0% - 200%)
  trim: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
  fade: {
    fadeIn: boolean;
    fadeInDuration: number;   // seconds (e.g., 0.5 to 5.0)
    fadeOut: boolean;
    fadeOutDuration: number;  // seconds
  };
  normalize: {
    enabled: boolean;
    targetDb: number;         // 0, -1, -3, -6 dB
  };
  channelMode: 'original' | 'mono' | 'stereo';
  // Fitur Bypass Lanjutan untuk Roblox Studio
  phaseInvert?: boolean;      // Balik fase kanal L/R
  stereoWidth?: number;      // 0.0 (mono) to 2.0 (super-wide)
  microNoise?: number;       // 0 to 10 (%) noise layering pengacak fingerprint
  subBassLayer?: number;     // 0 to 10 (%) 50Hz sub-bass layer
  microReverb?: number;      // 0 to 20 (%) micro-reverb ekor spektrum
  seamlessLoop?: boolean;    // Optimasi loop mulus tanpa klik untuk Roblox BGM
  eqGains?: number[];        // 9-band EQ gains [-12dB .. +12dB]
}

export interface ExportSettings {
  format: 'ogg' | 'mp3' | 'wav';
  bitrate: 128 | 192 | 256 | 320; // kbps for MP3
  sampleRate: 22050 | 44100 | 48000;
  channelMode: 'mono' | 'stereo';
  wavBitDepth: 16 | 24 | 32;
  stripMetadata?: boolean;   // Hapus seluruh ID3 metadata & hash scrambler
}

export interface ExportResult {
  blob: Blob;
  url: string;
  fileName: string;
  format: string;
  fileSize: number;
  duration: number;
  settings: ExportSettings;
  timestamp: number;
}

export type ProcessingState = 'idle' | 'decoding' | 'processing' | 'encoding' | 'completed' | 'error';

export interface RobloxPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ProcessingSettings>;
  exportSettings: Partial<ExportSettings>;
  tag: 'SFX' | 'BGM' | 'Voice' | 'Ambience';
}

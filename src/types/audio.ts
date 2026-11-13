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
  speed: number;          // 0.5 to 2.0x
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
}

export interface ExportSettings {
  format: 'wav' | 'mp3' | 'ogg';
  bitrate: 128 | 192 | 256 | 320; // kbps for MP3
  sampleRate: 22050 | 44100 | 48000;
  channelMode: 'mono' | 'stereo';
  wavBitDepth: 16 | 24 | 32;
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

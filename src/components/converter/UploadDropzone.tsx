import React, { useState, useRef } from "react";
import { UploadCloud, FileAudio, Loader2 } from "lucide-react";
import { AudioValidator } from "@/services/audio/AudioValidator";
import { AudioDecoder } from "@/services/audio/AudioDecoder";
import { AudioMetadata } from "@/types/audio";

interface UploadDropzoneProps {
  onFileLoaded: (file: File, buffer: AudioBuffer, metadata: AudioMetadata) => void;
  onError: (errorMsg: string) => void;
  isLoading?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileLoaded,
  onError,
  isLoading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setIsDecoding(true);
    try {
      const validation = await AudioValidator.validateFile(file);
      if (!validation.isValid) {
        onError(validation.error || "File audio tidak didukung atau mengalami kerusakan header.");
        setIsDecoding(false);
        return;
      }

      const format = validation.format || "AUDIO";
      const { buffer, metadata } = await AudioDecoder.decode(file, format);

      onFileLoaded(file, buffer, metadata);
    } catch (err) {
      onError(`Gagal melakukan decode audio: ${(err as Error).message || "Browser tidak dapat membaca stream audio."}`);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`group relative flex flex-col items-center justify-center p-8 sm:p-14 rounded-[22px] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
        isDragOver
          ? "border-[#4ade80] bg-[#4ade80]/5 shadow-[0_0_30px_rgba(74,222,128,0.2)] scale-[1.01]"
          : "border-[rgba(255,255,255,0.12)] hover:border-[#4ade80]/60 bg-gradient-to-b from-[#18181c]/80 to-[#0f0f12]/90 hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        onChange={handleFileChange}
        className="hidden"
      />

      {isDecoding || isLoading ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <Loader2 className="w-12 h-12 text-[#4ade80] animate-spin" />
          <div className="text-[15px] font-display font-bold text-[#f4f4f5]">
            Mendekode Audio Stream...
          </div>
          <p className="text-xs text-[#a1a1aa] font-mono">
            Menganalisis waveform buffer &amp; sample rate
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#4ade80] group-hover:scale-105 group-hover:border-[#4ade80] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-display font-bold text-[#f4f4f5]">
              Tarik file audio ke sini, atau <span className="text-[#4ade80] underline underline-offset-4">Pilih File</span>
            </h3>
            <p className="text-[13px] text-[#a1a1aa] max-w-md mx-auto">
              Mendukung MP3, WAV, OGG, FLAC, M4A hingga 100 MB. Diproses 100% lokal dan rahasia di browser Anda.
            </p>
          </div>

          {/* Formats Pill List */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {["MP3", "WAV", "OGG", "FLAC", "M4A"].map((fmt) => (
              <span
                key={fmt}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#a1a1aa]"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Demo Sound Button */}
          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsDecoding(true);
                  const resp = await fetch("/samples/test-tone-440hz.wav");
                  const blob = await resp.blob();
                  const file = new File([blob], "demo-sine-a4-440hz.wav", { type: "audio/wav" });
                  await processFile(file);
                } catch {
                  onError("Gagal memuat file demo suara.");
                  setIsDecoding(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-[#4ade80] bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border border-[#4ade80]/30 transition-all cursor-pointer"
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Coba dengan audio demo (440Hz Stereo Tone)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

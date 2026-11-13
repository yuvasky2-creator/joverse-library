import React from "react";
import { FileAudio, Trash2, Radio, HardDrive, Clock, Activity, Cpu } from "lucide-react";
import { AudioMetadata } from "@/types/audio";
import { formatDuration, formatFileSize, formatSampleRate } from "@/lib/formatters";

interface AudioInfoCardProps {
  metadata: AudioMetadata;
  onRemove: () => void;
}

export const AudioInfoCard: React.FC<AudioInfoCardProps> = ({ metadata, onRemove }) => {
  return (
    <div className="card-joverse !p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#4ade80] flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            <FileAudio className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-bold text-[#f4f4f5] truncate" title={metadata.fileName}>
              {metadata.fileName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">
                {metadata.format}
              </span>
              <span className="text-xs text-[#71717a] font-mono">
                {formatFileSize(metadata.fileSize)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#f87171] hover:bg-[#f87171]/10 border border-[#f87171]/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Ganti File</span>
        </button>
      </div>

      {/* Audio Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 text-xs">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Clock className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">Durasi</div>
            <div className="font-mono text-[#f4f4f5] font-bold text-[13px]">{formatDuration(metadata.duration)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Activity className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">Sample Rate</div>
            <div className="font-mono text-[#f4f4f5] font-bold text-[13px]">{formatSampleRate(metadata.sampleRate)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Radio className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">Saluran</div>
            <div className="font-mono text-[#f4f4f5] font-bold text-[13px]">
              {metadata.numberOfChannels === 1 ? "Mono (1 Ch)" : `Stereo (${metadata.numberOfChannels} Ch)`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
          <Cpu className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
          <div>
            <div className="text-[10px] text-[#71717a] uppercase tracking-wider font-semibold">Bitrate Est.</div>
            <div className="font-mono text-[#f4f4f5] font-bold text-[13px]">
              {metadata.bitrate ? `${metadata.bitrate} kbps` : "Lossless / VBR"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

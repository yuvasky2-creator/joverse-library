import React from "react";
import {
  Music,
  Gauge,
  Volume2,
  Scissors,
  ArrowDownToLine,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ProcessingSettings } from "@/types/audio";
import { formatDuration } from "@/lib/formatters";

interface ProcessingPanelProps {
  settings: ProcessingSettings;
  duration: number;
  onChange: (newSettings: ProcessingSettings) => void;
  onReset: () => void;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  settings,
  duration,
  onChange,
  onReset,
}) => {
  const update = (partial: Partial<ProcessingSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const speedPresets = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="space-y-6">
      {/* Header dengan Judul & Tombol Reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--color-border)]">
        <div>
          <div className="badge !py-1 !px-3 !text-[10px] mb-2 text-[#00d4ff]">
            <span className="dot" />
            <span>MESIN AUDIO DSP · REALTIME CLIENT-SIDE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display g-text">
            Panel Pengolahan Audio Lengkap
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Semua Slider</span>
        </button>
      </div>

      {/* Grid 6 Kontrol Fitur Lengkap (Image 3: 3D Dark Cards dengan Neon Underglow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Pengubah Nada (Pitch Shift) */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">01</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>Pengubah Nada (Pitch)</span>
              </label>
            </div>
            <span className="font-mono text-xs font-bold text-[#00d4ff] px-2 py-0.5 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]">
              {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch} st
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Mengubah tinggi nada frekuensi tanpa memengaruhi durasi atau tempo (-12 s/d +12 semitone).
          </p>

          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={settings.pitch}
            onChange={(e) => update({ pitch: parseInt(e.target.value) })}
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {[-12, -5, 0, 5, 12].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => update({ pitch: st })}
                className={`flex-1 py-1 rounded-lg text-[10px] font-mono active:scale-95 transition-all cursor-pointer ${
                  settings.pitch === st
                    ? "bg-gradient-to-r from-[#00d4ff] to-[#4ade80] text-zinc-950 font-bold shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                    : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                }`}
              >
                {st === 0 ? "Normal" : st > 0 ? `+${st}` : st}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Pengatur Kecepatan & Tempo */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">02</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Kecepatan (Tempo)</span>
              </label>
            </div>
            <span className="font-mono text-xs font-bold text-[#4ade80] px-2 py-0.5 rounded bg-[#4ade80]/10 border border-[#4ade80]/30 shadow-[0_0_12px_rgba(74,222,128,0.2)]">
              {settings.speed.toFixed(2)}x
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Memperlambat atau mempercepat pemutaran audio (0.5x setengah lambat hingga 2.0x cepat).
          </p>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={settings.speed}
            onChange={(e) => update({ speed: parseFloat(e.target.value) })}
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {speedPresets.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => update({ speed: sp })}
                className={`flex-1 py-1 rounded-lg text-[10px] font-mono active:scale-95 transition-all cursor-pointer ${
                  settings.speed === sp
                    ? "bg-gradient-to-r from-[#00d4ff] to-[#4ade80] text-zinc-950 font-bold shadow-[0_0_12px_rgba(74,222,128,0.4)]"
                    : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* 3. Penguat Volume & Gain */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">03</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>Penguat Volume (Gain)</span>
              </label>
            </div>
            <span className="font-mono text-xs font-bold text-[#00d4ff] px-2 py-0.5 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Meningkatkan desibel suara audio yang terlalu lirih hingga batas plafon 200%.
          </p>

          <input
            type="range"
            min="0"
            max="2.0"
            step="0.05"
            value={settings.volume}
            onChange={(e) => update({ volume: parseFloat(e.target.value) })}
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {[0.5, 1.0, 1.25, 1.5, 2.0].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ volume: v })}
                className={`flex-1 py-1 rounded-lg text-[10px] font-mono active:scale-95 transition-all cursor-pointer ${
                  settings.volume === v
                    ? "bg-gradient-to-r from-[#00d4ff] to-[#4ade80] text-zinc-950 font-bold shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                    : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                }`}
              >
                {Math.round(v * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* 4. Pemotong Audio (Crop & Trimming) */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">04</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#7b61ff]" />
                <span>Pemotong Audio (Crop)</span>
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.trim.enabled}
                onChange={(e) =>
                  update({
                    trim: {
                      ...settings.trim,
                      enabled: e.target.checked,
                      endTime: settings.trim.endTime || duration,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-[rgba(255,255,255,0.12)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-zinc-950 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#00d4ff]"></div>
            </label>
          </div>

          {settings.trim.enabled ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  Mulai (detik)
                </span>
                <input
                  type="number"
                  min="0"
                  max={settings.trim.endTime - 0.1}
                  step="0.1"
                  value={parseFloat(settings.trim.startTime.toFixed(2))}
                  onChange={(e) =>
                    update({
                      trim: { ...settings.trim, startTime: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#070a0e] border border-[rgba(255,255,255,0.15)] text-xs font-mono text-white focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                  Selesai (detik)
                </span>
                <input
                  type="number"
                  min={settings.trim.startTime + 0.1}
                  max={duration}
                  step="0.1"
                  value={parseFloat(settings.trim.endTime.toFixed(2))}
                  onChange={(e) =>
                    update({
                      trim: {
                        ...settings.trim,
                        endTime: Math.min(duration, parseFloat(e.target.value) || duration),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#070a0e] border border-[rgba(255,255,255,0.15)] text-xs font-mono text-white focus:border-[#00d4ff] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Pemotong nonaktif. Seluruh durasi ({formatDuration(duration)}) akan dirender utuh.
            </p>
          )}
        </div>

        {/* 5. Efek Transisi Fade In & Out */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">05</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>Efek Transisi (Fade)</span>
              </label>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* Fade In */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fade.fadeIn}
                  onChange={(e) =>
                    update({
                      fade: { ...settings.fade, fadeIn: e.target.checked },
                    })
                  }
                  className="rounded border-[rgba(255,255,255,0.2)] accent-[#00d4ff] cursor-pointer"
                />
                <span>Fade In (Awal)</span>
              </label>
              {settings.fade.fadeIn && (
                <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={settings.fade.fadeInDuration}
                    onChange={(e) =>
                      update({
                        fade: { ...settings.fade, fadeInDuration: parseFloat(e.target.value) },
                      })
                    }
                  />
                  <span className="font-mono text-xs text-[#00d4ff] font-bold min-w-[28px]">
                    {settings.fade.fadeInDuration}s
                  </span>
                </div>
              )}
            </div>

            {/* Fade Out */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fade.fadeOut}
                  onChange={(e) =>
                    update({
                      fade: { ...settings.fade, fadeOut: e.target.checked },
                    })
                  }
                  className="rounded border-[rgba(255,255,255,0.2)] accent-[#00d4ff] cursor-pointer"
                />
                <span>Fade Out (Akhir)</span>
              </label>
              {settings.fade.fadeOut && (
                <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={settings.fade.fadeOutDuration}
                    onChange={(e) =>
                      update({
                        fade: { ...settings.fade, fadeOutDuration: parseFloat(e.target.value) },
                      })
                    }
                  />
                  <span className="font-mono text-xs text-[#00d4ff] font-bold min-w-[28px]">
                    {settings.fade.fadeOutDuration}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Normalisasi Puncak & Saluran */}
        <div className="card-underglow p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="idx">06</span>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Normalisasi Puncak</span>
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.normalize.enabled}
                onChange={(e) =>
                  update({
                    normalize: { ...settings.normalize, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-[rgba(255,255,255,0.12)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-zinc-950 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#4ade80]"></div>
            </label>
          </div>

          {settings.normalize.enabled ? (
            <div className="flex items-center gap-1.5 pt-1">
              {[0, -1, -3, -6].map((db) => (
                <button
                  key={db}
                  type="button"
                  onClick={() =>
                    update({ normalize: { ...settings.normalize, targetDb: db } })
                  }
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono active:scale-95 transition-all cursor-pointer ${
                    settings.normalize.targetDb === db
                      ? "bg-gradient-to-r from-[#00d4ff] to-[#4ade80] text-zinc-950 font-bold shadow-[0_0_12px_rgba(74,222,128,0.4)]"
                      : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                  }`}
                >
                  {db} dB
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Menyetel volume ke batas dynamic headroom maksimal tanpa distorsi clipping pecah.
            </p>
          )}

          {/* Pemilih Saluran */}
          <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] text-[11px]">Saluran:</span>
            <div className="flex items-center gap-1">
              {(["original", "mono", "stereo"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update({ channelMode: m })}
                  className={`px-3 py-0.5 rounded-full text-[10px] capitalize active:scale-95 transition-all cursor-pointer ${
                    settings.channelMode === m
                      ? "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 font-bold shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                      : "bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                  }`}
                >
                  {m === "original" ? "Asli" : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

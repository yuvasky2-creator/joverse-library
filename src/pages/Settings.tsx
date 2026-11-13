import React, { useState } from "react";
import { Settings as SettingsIcon, Save, RotateCcw } from "lucide-react";

export interface UserPreferences {
  defaultFormat: "wav" | "mp3" | "ogg";
  defaultBitrate: 128 | 192 | 256 | 320;
  defaultSampleRate: 22050 | 44100 | 48000;
  defaultChannelMode: "stereo" | "mono";
  autoPlayOnUpload: boolean;
  highDpiWaveform: boolean;
}

const STORAGE_KEY = "joverse_audio_user_preferences";

const DEFAULT_PREFS: UserPreferences = {
  defaultFormat: "wav",
  defaultBitrate: 256,
  defaultSampleRate: 44100,
  defaultChannelMode: "stereo",
  autoPlayOnUpload: false,
  highDpiWaveform: true,
};

interface SettingsPageProps {
  onSuccess: (msg: string) => void;
}

export const Settings: React.FC<SettingsPageProps> = ({ onSuccess }) => {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      onSuccess("Preferensi ruang kerja berhasil disimpan!");
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFS);
    localStorage.removeItem(STORAGE_KEY);
    onSuccess("Preferensi telah direset ke pengaturan bawaan pabrik.");
  };

  return (
    <div className="wrap py-12 max-w-4xl mx-auto space-y-10 animate-fadeIn">
      {/* Header Halaman Pengaturan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="pill !py-1 !px-3 !text-[10px] mb-2">
            <span className="dot" />
            <span>PREFERENSI RUANG KERJA</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold font-display g-text flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-400" />
            <span>Pengaturan Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mid)] mt-1.5">
            Atur profil ekspor bawaan, perilaku pemutaran otomatis, dan kualitas rendering waveform studio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn ghost sm flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Awal</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn green sm flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Kartu 1: Format Ekspor Bawaan */}
        <div className="card-joverse space-y-4">
          <div>
            <span className="idx">01 / PROFIL ENCODER</span>
            <h3 className="font-display font-bold text-base text-[var(--text)] mt-1">
              Format Ekspor Bawaan
            </h3>
            <p className="text-xs text-[var(--mid)]">
              Format file audio yang otomatis terpilih ketika membuka jendela ekspor.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {(["wav", "mp3", "ogg"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setPrefs({ ...prefs, defaultFormat: fmt })}
                className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase active:scale-95 transition-all cursor-pointer ${
                  prefs.defaultFormat === fmt
                    ? "bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(74,222,128,0.4)]"
                    : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Kartu 2: Pengaturan Akustik DSP */}
        <div className="card-joverse space-y-4">
          <div>
            <span className="idx">02 / STANDAR AKUSTIK</span>
            <h3 className="font-display font-bold text-base text-[var(--text)] mt-1">
              Sample Rate &amp; Bitrate Bawaan
            </h3>
            <p className="text-xs text-[var(--mid)]">
              Frekuensi dan tingkat bit depth yang diprioritaskan saat merender audio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                Sample Rate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([22050, 44100, 48000] as const).map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => setPrefs({ ...prefs, defaultSampleRate: sr })}
                    className={`py-2 px-2 rounded-xl text-xs font-mono active:scale-95 transition-all cursor-pointer ${
                      prefs.defaultSampleRate === sr
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                        : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                    }`}
                  >
                    {sr / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--low)] uppercase tracking-wider block mb-2">
                Bitrate MP3
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([128, 192, 256, 320] as const).map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => setPrefs({ ...prefs, defaultBitrate: br })}
                    className={`py-2 px-1 rounded-xl text-xs font-mono active:scale-95 transition-all cursor-pointer ${
                      prefs.defaultBitrate === br
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                        : "bg-[rgba(255,255,255,0.03)] text-[var(--mid)] hover:text-white border border-[var(--line)]"
                    }`}
                  >
                    {br}k
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kartu 3: Perilaku Alur Kerja */}
        <div className="card-joverse space-y-4">
          <div>
            <span className="idx">03 / PERILAKU SISTEM</span>
            <h3 className="font-display font-bold text-base text-[var(--text)] mt-1">
              Otomasi Pemutaran &amp; Tampilan Waveform
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)]">
              <div>
                <span className="text-xs font-bold text-[var(--text)] block">Putar Otomatis Saat File Dimuat</span>
                <span className="text-[11px] text-[var(--mid)]">Langsung membunyikan audio begitu file selesai dianalisis oleh browser.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.autoPlayOnUpload}
                  onChange={(e) => setPrefs({ ...prefs, autoPlayOnUpload: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-[rgba(255,255,255,0.12)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-zinc-950 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-400"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)]">
              <div>
                <span className="text-xs font-bold text-[var(--text)] block">Retina High-DPI Waveform</span>
                <span className="text-[11px] text-[var(--mid)]">Merender canvas gelombang suara menggunakan rasio piksel layar tertinggi.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.highDpiWaveform}
                  onChange={(e) => setPrefs({ ...prefs, highDpiWaveform: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-[rgba(255,255,255,0.12)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-zinc-950 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-400"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

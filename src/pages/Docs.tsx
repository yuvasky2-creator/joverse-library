import React, { useState } from "react";
import { BookOpen, Check, Shield, ChevronRight, Gamepad2 } from "lucide-react";

export const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: "Memulai Penggunaan" },
    { id: "supported-formats", title: "Format yang Didukung" },
    { id: "how-to-convert", title: "Cara Mengonversi Audio" },
    { id: "adjust-pitch", title: "Cara Mengatur Nada (Pitch)" },
    { id: "adjust-speed", title: "Cara Mengatur Tempo (Speed)" },
    { id: "export-settings", title: "Panduan Pengaturan Ekspor" },
    { id: "roblox-guide", title: "Panduan Audio Roblox Studio" },
    { id: "faq", title: "Pertanyaan yang Sering Diajukan" },
  ];

  return (
    <div className="wrap py-12 space-y-10 animate-fadeIn">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="pill">
          <span className="dot" />
          <span>DOKUMENTASI TEKNIS RESMI</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display g-text">
          Panduan &amp; Dokumentasi
        </h1>
        <p className="text-sm text-[var(--mid)] max-w-2xl">
          Segala hal teknis seputar JOVERSE AUDIO: arsitektur Web Audio DSP, format kontainer audio, serta optimasi SoundService game Roblox.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
          <div className="card-joverse !p-3">
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--line)] text-[10px] font-bold text-[var(--low)] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daftar Isi</span>
            </div>
            <nav className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                    activeSection === sec.id
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-[var(--mid)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  <span>{sec.title}</span>
                  {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 space-y-8 min-w-0">
          {/* Section: Memulai Penggunaan */}
          {activeSection === "getting-started" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">01 / PENGENALAN</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Memulai Menggunakan JOVERSE AUDIO
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
                  JOVERSE AUDIO adalah platform konversi dan manipulasi audio yang beroperasi 100% di dalam browser web. Dirancang khusus bagi pengembang game Roblox Studio, kreator konten, dan sound designer, platform ini memproses data sinyal digital (DSP) langsung pada RAM dan prosesor lokal komputer Anda tanpa memerlukan upload ke server awan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Check className="w-4 h-4" />
                    <span>Nol Latensi Jaringan</span>
                  </div>
                  <p className="text-xs text-[var(--mid)]">
                    File audio Anda tidak dikirim ke internet, melainkan didekode langsung oleh mesin browser sehingga hasil render instan dan bebas kuota.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Privasi Asset 100% Aman</span>
                  </div>
                  <p className="text-xs text-[var(--mid)]">
                    Asset audio game dan rekaman suara eksklusif Anda tetap berada di komputer lokal Anda sepanjang waktu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Format yang Didukung */}
          {activeSection === "supported-formats" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">02 / CODEC &amp; FORMAT</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Format Audio yang Didukung
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mid)]">
                  JOVERSE AUDIO menerima format populer digital dan mengekspornya ke standar industri terbaik.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--low)] uppercase tracking-wider">
                  Format Masukan (Impor Audio)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["WAV (PCM)", "MP3 (MPEG)", "OGG (Vorbis)", "FLAC (Lossless)", "M4A / AAC", "WebM (Opus)"].map((f) => (
                    <div key={f} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] font-mono text-xs text-center text-[var(--text)] font-semibold">
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[var(--low)] uppercase tracking-wider">
                  Format Keluaran (Ekspor Audio)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-1">
                    <div className="font-mono text-sm font-bold text-emerald-400">WAV (16-bit PCM)</div>
                    <div className="text-xs text-[var(--mid)]">Format master kualitas murni tanpa kompresi pada 44.1 atau 48.0 kHz.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-1">
                    <div className="font-mono text-sm font-bold text-emerald-400">MP3 (LAME Encoder)</div>
                    <div className="text-xs text-[var(--mid)]">Standar kompresi universal dengan pilihan bitrate 128, 192, 256, atau 320 kbps.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-1">
                    <div className="font-mono text-sm font-bold text-emerald-400">OGG (Vorbis)</div>
                    <div className="text-xs text-[var(--mid)]">Kontainer open-source ideal untuk game engine dengan ukuran file sangat hemat.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Cara Mengonversi Audio */}
          {activeSection === "how-to-convert" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">03 / PANDUAN LANGKAH</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Langkah-Langkah Mengonversi Audio
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { step: "01", title: "Unggah File Audio", desc: "Tarik dan letakkan file audio Anda ke area upload dropzone, atau klik tombol untuk memilih file dari komputer." },
                  { step: "02", title: "Atur Efek & Parameter DSP", desc: "Gunakan panel slider untuk mengatur nada (pitch), tempo kecepatan, memotong bagian audio, atau menambahkan fade in/out." },
                  { step: "03", title: "Dengarkan Pratinjau Suara", desc: "Tekan tombol putar dan pilih opsi 'Hasil DSP' untuk mendengarkan perubahan audio secara real-time sebelum mengekspor." },
                  { step: "04", title: "Render & Unduh File", desc: "Buka dialog Ekspor Audio, tentukan format tujuan (WAV/MP3/OGG) dan frekuensi sample rate, lalu simpan file hasil olahan." },
                ].map((item) => (
                  <div key={item.step} className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] flex items-start gap-4">
                    <span className="idx !text-sm text-emerald-400">{item.step}</span>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)]">{item.title}</h4>
                      <p className="text-xs text-[var(--mid)] mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Cara Mengatur Nada */}
          {activeSection === "adjust-pitch" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">04 / PENGUBAH NADA</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Cara Mengatur Nada (Pitch Shifting)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
                  Pitch shifting memungkinkan Anda mengubah tinggi-rendah frekuensi suara tanpa mengubah durasi file atau mempercepat pemutaran.
                </p>
              </div>

              <div className="space-y-3 text-xs text-[var(--mid)] leading-relaxed">
                <p>
                  &bull; <b>Nilai Positif (+1 hingga +12 semitone):</b> Menghasilkan suara lebih tinggi, sering digunakan untuk efek nightcore, suara karakter kecil/kartun, atau menyesuaikan kunci nada lagu.
                </p>
                <p>
                  &bull; <b>Nilai Negatif (-1 hingga -12 semitone):</b> Menghasilkan suara lebih berat dan dalam, sangat cocok untuk efek vokal monster, robot, atau efek slow-motion dramatis.
                </p>
              </div>
            </div>
          )}

          {/* Section: Cara Mengatur Tempo */}
          {activeSection === "adjust-speed" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">05 / PENGATUR TEMPO</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Cara Mengatur Kecepatan (Tempo Stretcher)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
                  Sesuaikan durasi pemutaran audio secara fleksibel mulai dari setengah lambat (0.5x) hingga dua kali lebih cepat (2.0x).
                </p>
              </div>

              <div className="space-y-3 text-xs text-[var(--mid)] leading-relaxed">
                <p>
                  Gunakan tombol preset cepat (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x) atau geser slider untuk akurasi persis sesuai kebutuhan animasi game Anda.
                </p>
              </div>
            </div>
          )}

          {/* Section: Panduan Ekspor */}
          {activeSection === "export-settings" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">06 / EKSPOR MASTER</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Panduan Pengaturan Ekspor
                </h2>
              </div>

              <div className="space-y-4 text-xs text-[var(--mid)] leading-relaxed">
                <p>
                  &bull; <b>MP3 Bitrate (128 s/d 320 kbps):</b> 128 kbps untuk ukuran file paling hemat, 192 kbps standar jernih, dan 320 kbps untuk kualitas audio streaming terbaik.
                </p>
                <p>
                  &bull; <b>Sample Rate (22.05 s/d 48 kHz):</b> 44.1 kHz adalah standar musik studio (CD quality), sedangkan 48.0 kHz adalah standar audio video dan game engine modern.
                </p>
              </div>
            </div>
          )}

          {/* Section: Panduan Roblox Studio */}
          {activeSection === "roblox-guide" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  <span className="idx">07 / ROBLOX STUDIO</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Panduan Optimasi Audio Roblox Studio
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mid)] leading-relaxed">
                  Roblox SoundService memiliki karakteristik unik mengenai penggunaan memori klien dan pemutaran audio 3D.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-2">
                  <h4 className="font-bold text-sm text-emerald-400">1. Konversi ke Mono untuk Audio Posisi 3D</h4>
                  <p className="text-xs text-[var(--mid)]">
                    File stereo yang dipasang pada Part di Roblox tidak dapat mensimulasikan peredaman jarak spasial 3D dengan tepat karena channel kiri dan kanan berbenturan. Gunakan selalu opsi &quot;Mono (1 Saluran)&quot; untuk efek tembakan, langkah kaki, dan suara lingkungan.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--line)] space-y-2">
                  <h4 className="font-bold text-sm text-emerald-400">2. Mencegah Letupan pada Musik BGM Loop</h4>
                  <p className="text-xs text-[var(--mid)]">
                    Gunakan preset &quot;Musik Latar BGM&quot; untuk menerapkan amplop fade halus 1.0 detik sehingga saat properti Sound.Looped aktif, tidak terdengar bunyi klik/pop saat lagu mengulang dari awal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section: FAQ */}
          {activeSection === "faq" && (
            <div className="card-joverse space-y-6">
              <div className="space-y-2">
                <span className="idx">08 / TANYA JAWAB</span>
                <h2 className="text-2xl font-bold font-display text-[var(--text)]">
                  Pertanyaan yang Sering Diajukan
                </h2>
              </div>

              <div className="space-y-3">
                <details open>
                  <summary>Apakah file audio saya disimpan di server?</summary>
                  <div className="p-4 pt-1 text-xs sm:text-sm text-[var(--mid)] leading-relaxed border-t border-[rgba(255,255,255,0.06)]">
                    Tidak sama sekali. JOVERSE AUDIO memproses 100% data di browser Anda. Tidak ada data suara yang diunggah ke server manapun.
                  </div>
                </details>

                <details>
                  <summary>Berapa batas ukuran file yang dapat diproses?</summary>
                  <div className="p-4 pt-1 text-xs sm:text-sm text-[var(--mid)] leading-relaxed border-t border-[rgba(255,255,255,0.06)]">
                    File hingga 100MB dapat diproses dengan lancar dan stabil karena alokasi memori RAM browser modern sangat cepat.
                  </div>
                </details>

                <details>
                  <summary>Apakah konversi ini gratis untuk komersial?</summary>
                  <div className="p-4 pt-1 text-xs sm:text-sm text-[var(--mid)] leading-relaxed border-t border-[rgba(255,255,255,0.06)]">
                    Ya, seluruh file audio hasil olahan Anda dapat digunakan bebas untuk game komersial Roblox, YouTube, film, dan proyek pribadi.
                  </div>
                </details>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

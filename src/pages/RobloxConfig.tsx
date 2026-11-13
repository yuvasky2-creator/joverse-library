import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ExternalLink,
  Shield,
  Key,
  Users,
  User,
  CheckCircle2,
  Trash2,
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface RobloxAccount {
  id: string;
  type: "Personal" | "Group";
  creatorId: string;
  label: string;
  dateAdded: string;
}

export const RobloxConfig: React.FC = () => {
  const [accountType, setAccountType] = useState<"Personal" | "Group">("Personal");
  const [creatorId, setCreatorId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"api" | "permissions">("api");

  const DISCORD_INVITE = "https://discord.gg/BrRNSzxTEW";

  const [connectedAccounts, setConnectedAccounts] = useState<RobloxAccount[]>(() => {
    try {
      const saved = localStorage.getItem("joverse_roblox_accounts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorId || !apiKey) return;

    const newAcc: RobloxAccount = {
      id: Date.now().toString(),
      type: accountType,
      creatorId: creatorId.trim(),
      label: accountType === "Personal" ? `Personal (ID: ${creatorId})` : `Group (ID: ${creatorId})`,
      dateAdded: new Date().toLocaleDateString("id-ID"),
    };

    const updated = [...connectedAccounts, newAcc];
    setConnectedAccounts(updated);
    localStorage.setItem("joverse_roblox_accounts", JSON.stringify(updated));

    setCreatorId("");
    setApiKey("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = (id: string) => {
    const updated = connectedAccounts.filter((a) => a.id !== id);
    setConnectedAccounts(updated);
    localStorage.setItem("joverse_roblox_accounts", JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-left">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-zinc-900/70 to-cyan-950/40 border border-blue-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72v1.36a7 7 0 0 1 6.93 6.01A3 3 0 0 1 21 16a3 3 0 0 1-2.93 2.99A7.002 7.002 0 0 1 12 23a7.002 7.002 0 0 1-6.07-4.01A3 3 0 0 1 3 16a3 3 0 0 1 1.07-2.91A7 7 0 0 1 11 7.08V5.72A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Roblox Open Cloud &amp; Server Integrations
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official API v2
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Hubungkan akun Roblox Studio Anda untuk upload audio otomatis via Open Cloud API dan join komunitas Discord kami.
            </p>
          </div>
        </div>

        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#5865f2]/25 active:scale-95 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <span>Join Server Discord Joverse</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Dual Workstation: Config Form & Step-by-Step Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Kredensial API (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Kredensial Roblox Open Cloud API
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">Tersimpan Aman di Browser</span>
          </div>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                Tipe Akun Pemilik (Creator Type):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("Personal")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    accountType === "Personal"
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Personal (User)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("Group")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    accountType === "Group"
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Group Roblox</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                {accountType === "Personal" ? "Roblox User ID:" : "Roblox Group ID:"}
              </label>
              <input
                type="text"
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value)}
                placeholder={accountType === "Personal" ? "Contoh: 123456789" : "Contoh: 9876543"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                Open Cloud API Key:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rbx_api_..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none font-mono"
                required
              />
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Kredensial Roblox berhasil disimpan ke browser!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/30 active:scale-98 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simpan Kredensial Roblox</span>
            </button>
          </form>

          {/* Connected Accounts */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Daftar Kredensial Tersimpan ({connectedAccounts.length})
            </span>
            {connectedAccounts.length === 0 ? (
              <p className="text-xs text-zinc-600 italic py-2">Belum ada akun Roblox yang tersimpan.</p>
            ) : (
              connectedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{acc.label}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Ditambahkan: {acc.dateAdded}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Panduan & Tata Cara Lengkap (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Tata Cara &amp; Panduan Konfigurasi
            </h2>
            <a
              href="https://create.roblox.com/dashboard/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Creator Hub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">
                  1
                </span>
                Buka Halaman Roblox Creator Hub Credentials:
              </span>
              <p className="text-zinc-400 pl-6 text-[11px]">
                Kunjungi <a href="https://create.roblox.com/dashboard/credentials" target="_blank" rel="noreferrer" className="text-cyan-400 underline">create.roblox.com/dashboard/credentials</a> dan pastikan Anda sudah login ke akun Roblox Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">
                  2
                </span>
                Buat Kunci API Baru (Create API Key):
              </span>
              <p className="text-zinc-400 pl-6 text-[11px]">
                Klik tombol biru <strong>"Create API Key"</strong> di pojok kanan atas Creator Hub.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">
                  3
                </span>
                Wajib Pilih Izin (Access Permissions):
              </span>
              <ul className="text-zinc-400 pl-6 text-[11px] space-y-1 list-disc">
                <li>
                  Cari kategori API: <strong>Assets API</strong> (Asset Permissions).
                </li>
                <li>
                  Centang izin: <strong className="text-emerald-400">Read</strong> dan <strong className="text-emerald-400">Write</strong> (Create Asset).
                </li>
                <li>
                  Pada bagian IP Restrictions: Masukkan <code>0.0.0.0/0</code> atau kosongkan agar dapat diakses dari browser mana pun.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px]">
                  4
                </span>
                Salin Kunci &amp; Tempel di Sini:
              </span>
              <p className="text-zinc-400 pl-6 text-[11px]">
                Salin string kunci API rahasia yang muncul (format: <code>rbx_api_...</code>) lalu tempel ke form di sebelah kiri bersama User ID / Group ID Anda, lalu klik <strong>Simpan Kredensial</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

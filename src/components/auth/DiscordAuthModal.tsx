import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  UserPlus,
  LogIn,
  Lock,
  User,
  Key,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";
import { getSiteConfig } from "@/config/siteConfig";

export const DiscordAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    loginUser,
    registerUser,
    loginStaff,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const config = getSiteConfig();

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (authModalTab === "register") {
      const res = registerUser(username, password);
      if (!res.success) {
        setErrorMsg(res.message || "Gagal mendaftar akun!");
      } else {
        setSuccessMsg("Akun berhasil dibuat! Selamat datang di JOVERSE LIBRARY.");
      }
    } else if (authModalTab === "login") {
      const res = loginUser(username, password);
      if (!res.success) {
        setErrorMsg(res.message || "Username atau Password salah!");
      }
    } else if (authModalTab === "staff") {
      const res = loginStaff(username, password);
      if (!res.success) {
        setErrorMsg(res.message || "Kredensial staf salah!");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0e0e11] border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.8)] overflow-hidden text-left">
        {/* Modal Top Banner */}
        <div className="p-5 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/50 p-1 border border-white/20 flex items-center justify-center shrink-0">
              <img
                src={config.branding.logoUrl || "/joverse-library-logo.png"}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide font-['Sora']">
                JOVERSE <span className="text-zinc-400 font-light">LIBRARY</span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {authModalTab === "register"
                  ? "Pendaftaran Akun Baru (Free 5x/Hari)"
                  : authModalTab === "staff"
                  ? "Portal Khusus Owner & Admin"
                  : "Masuk ke Akun Anda"}
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="text-zinc-400 hover:text-white text-base font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Monokrom */}
        <div className="flex items-center p-2 bg-black/40 border-b border-white/5 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              openAuthModal("register");
              setErrorMsg("");
            }}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authModalTab === "register"
                ? "bg-white text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openAuthModal("login");
              setErrorMsg("");
            }}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authModalTab === "login"
                ? "bg-white text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openAuthModal("staff");
              setErrorMsg("");
            }}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authModalTab === "staff"
                ? "bg-white text-zinc-950 shadow-md"
                : "text-zinc-500 hover:text-white"
            }`}
            title="Login Staf (Owner & Admin)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {authModalTab === "register" && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-zinc-300 flex items-start gap-2">
              <Zap className="w-4 h-4 shrink-0 mt-0.5 text-zinc-300" />
              <span>
                Pendaftaran <strong>100% Gratis</strong>! Cukup tentukan username &amp; password pilihan Anda untuk menikmati kuota <strong>5x Bypass Audio &amp; 5x Manual Editor setiap hari</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Username:</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan Username Anda"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-400" />
                <span>Password:</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-white w-full py-3 rounded-xl text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {authModalTab === "register" ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun Sekarang</span>
                </>
              ) : authModalTab === "staff" ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Masuk Portal Staf</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Join Discord Banner */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400">
              Komunitas resmi Roblox:
            </div>
            <a
              href={config.branding.discordInvite}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <span>Join Server Discord</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

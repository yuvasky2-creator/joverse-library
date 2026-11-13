import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Crown,
  Shield,
  LogOut,
  Sliders,
  Zap,
  TrendingUp,
  Tag,
  Lock,
  ExternalLink,
  UserPlus,
  LayoutGrid,
} from "lucide-react";
import { getSiteConfig } from "@/config/siteConfig";

interface NavbarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  isProcessing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
}) => {
  const { user, quota, openAuthModal, openStaffLogin, logout } = useAuth();
  const config = getSiteConfig();

  // Susunan 5 Tab Utama Resmi:
  // 1. Bypass, 2. Editor, 3. Stats, 4. Pricing, 5. Portofolio
  const navTabs = [
    {
      id: "bypass",
      label: "Bypass",
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      id: "editor",
      label: "Editor",
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
    {
      id: "analytics",
      label: "Stats",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: <Tag className="w-3.5 h-3.5" />,
    },
    {
      id: "portfolio",
      label: "Portofolio",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 pb-2.5 backdrop-blur-xl bg-[#09090b]/92 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Bar: Logo 512x512 Proporsional & Nama Resmi */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onRouteChange("home")}
            className="flex items-center gap-3 group cursor-pointer select-none text-left"
          >
            {/* Logo Frame: 512x512 px proporsional */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/60 p-0.5 border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)] group-hover:border-white/40 transition-all shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={config.branding.logoUrl || "/joverse-library-logo.png"}
                alt="JOVERSE LIBRARY"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors flex items-center gap-1.5 font-['Sora']">
                JOVERSE <span className="text-zinc-400 font-light">LIBRARY</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-0.5">
                {config.branding.siteTagline}
              </span>
            </div>
          </button>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <a
              href={config.branding.discordInvite}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 bg-white/5 border border-white/10 flex items-center gap-1"
            >
              <span>Discord</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-950 bg-white active:scale-95 transition-all"
              >
                Masuk
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={openStaffLogin}
              title="Portal Staf"
              className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white border border-white/10"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Tabs: Monokrom Premium, Responsif */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 px-0.5">
          {navTabs.map((tab) => {
            const isActive = currentRoute === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onRouteChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-white/10 text-white border border-white/20 font-bold shadow-[0_2px_10px_rgba(255,255,255,0.06)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className={isActive ? "text-white" : "text-zinc-400"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Right User Controls: Monokrom Silver & White */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <a
            href={config.branding.discordInvite}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-zinc-400" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Discord</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          {user ? (
            <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-zinc-900 border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-black/40 p-0.5 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={user.avatar || "/joverse-library-logo.png"}
                  alt={user.username}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none text-left">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  {user.role === "owner" ? (
                    <span className="text-white font-mono flex items-center gap-1">
                      <Crown className="w-3 h-3 text-zinc-300" /> OWNER
                    </span>
                  ) : user.role === "admin" ? (
                    <span className="text-zinc-300 font-mono flex items-center gap-1">
                      <Shield className="w-3 h-3 text-zinc-400" /> ADMIN
                    </span>
                  ) : (
                    user.username
                  )}
                </span>
                <span className="text-[10px] font-mono mt-0.5 text-zinc-400">
                  {user.role === "owner" || user.role === "admin" ? (
                    "UNLIMITED"
                  ) : (
                    `Bypass: ${quota.bypassUsed}/${quota.bypassLimit} • Edit: ${quota.editorUsed}/${quota.editorLimit}`
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Keluar"
                className="p-1 rounded text-zinc-400 hover:text-white ml-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-b from-white to-zinc-300 hover:to-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer font-['Manrope']"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Akun</span>
              </button>

              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 active:scale-95 transition-all cursor-pointer font-['Manrope']"
              >
                Masuk
              </button>
            </div>
          )}

          {/* Portal Staf (Owner / Admin) */}
          <button
            type="button"
            onClick={() => {
              if (user?.role === "owner" || user?.role === "admin") {
                onRouteChange("admin");
              } else {
                openStaffLogin();
              }
            }}
            title="Portal Owner & Admin"
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

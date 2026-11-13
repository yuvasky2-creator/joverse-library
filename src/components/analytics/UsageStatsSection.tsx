import React, { useState, useEffect } from "react";
import { UsageTracker, GlobalUsageData } from "@/services/analytics/UsageTracker";
import {
  TrendingUp,
  Users,
  Activity,
  Zap,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const UsageStatsSection: React.FC = () => {
  const [data, setData] = useState<GlobalUsageData>(() => UsageTracker.getData());

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const fresh = UsageTracker.getData();
        setData(fresh);
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Defensive fallback against undefined/null
  const dailyStats = Array.isArray(data?.dailyStats) ? data.dailyStats : [
    { day: "Sen", conversions: 0 },
    { day: "Sel", conversions: 0 },
    { day: "Rab", conversions: 0 },
    { day: "Kam", conversions: 0 },
    { day: "Jum", conversions: 0 },
    { day: "Sab", conversions: 0 },
    { day: "Min", conversions: 0 },
  ];

  const recentActivities = Array.isArray(data?.recentActivities) ? data.recentActivities : [];
  const totalConversions = typeof data?.totalConversions === "number" ? data.totalConversions : 0;
  const conversionsToday = typeof data?.conversionsToday === "number" ? data.conversionsToday : 0;
  const totalUsers = typeof data?.totalUsersRegistered === "number" ? data.totalUsersRegistered : 1;

  const maxDaily = Math.max(1, ...dailyStats.map((d) => (typeof d.conversions === "number" ? d.conversions : 0)));

  const handleReset = () => {
    const fresh = UsageTracker.resetStats();
    setData(fresh);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-pink-950/40 via-zinc-900/70 to-purple-950/40 border border-pink-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Statistik Penggunaan Real-Time
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Data riil terhitung otomatis setiap kali Anda melakukan konversi audio atau obfuskasi script.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Counter</span>
        </button>
      </div>

      {/* 4 Realtime Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Konversi",
            value: totalConversions,
            sub: "File diproses riil",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
            icon: <Activity className="w-4 h-4 text-cyan-400" />,
          },
          {
            label: "Konversi Hari Ini",
            value: conversionsToday,
            sub: "Aktivitas hari ini",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            icon: <Zap className="w-4 h-4 text-emerald-400" />,
          },
          {
            label: "User Terdaftar",
            value: totalUsers,
            sub: "Akun browser aktif",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            icon: <Users className="w-4 h-4 text-purple-400" />,
          },
          {
            label: "Status Engine",
            value: "100%",
            sub: "WebAudio & WASM Ready",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl bg-zinc-950/80 border ${card.border} space-y-2 shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <div className={`text-3xl font-black ${card.color} font-mono tracking-tight`}>
              {card.value}
            </div>
            <div className="text-[11px] text-zinc-500">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart & Live Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Chart (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Grafik Penggunaan Mingguan (Real-Time)
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">Auto-Update</span>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 px-2">
            {dailyStats.map((d, idx) => {
              const heightPct = Math.max(8, ((d.conversions || 0) / maxDaily) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.conversions || 0}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600/40 to-cyan-400 border-t border-cyan-300 transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs font-mono font-semibold text-zinc-400">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-500 text-center pt-2 border-t border-white/5">
            Bar chart di atas mencerminkan data aktual penggunaan Anda per hari.
          </p>
        </div>

        {/* Live Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Log Riwayat Aktivitas Real-Time
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Live Feed</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-1">
              <Clock className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs font-semibold">Belum ada aktivitas konversi.</p>
              <p className="text-[11px] text-zinc-600">
                Lakukan bypass audio atau obfuskasi script untuk melihat data realtime di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate max-w-[200px]">
                      {act.action}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Waktu: {act.time} &middot; Speed: {act.speed}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {act.format}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

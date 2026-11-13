export interface DailyStat {
  day: string; // "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
  conversions: number;
}

export interface ActivityLog {
  id: string;
  time: string;
  user: string;
  action: string;
  format: "OGG" | "MP3" | "WAV" | "LUA";
  speed: string;
}

export interface GlobalUsageData {
  totalConversions: number;
  totalUsersRegistered: number;
  conversionsToday: number;
  dailyStats: DailyStat[];
  recentActivities: ActivityLog[];
}

const STORAGE_KEY = "joverse_realtime_usage_v2";

const getTodayDayName = () => {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return days[new Date().getDay()];
};

const getInitialDays = (): DailyStat[] => {
  return [
    { day: "Sen", conversions: 0 },
    { day: "Sel", conversions: 0 },
    { day: "Rab", conversions: 0 },
    { day: "Kam", conversions: 0 },
    { day: "Jum", conversions: 0 },
    { day: "Sab", conversions: 0 },
    { day: "Min", conversions: 0 },
  ];
};

export const UsageTracker = {
  getData(): GlobalUsageData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed.dailyStats) &&
          Array.isArray(parsed.recentActivities)
        ) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    // Default mulai dari 0 riil (Real-time)
    return {
      totalConversions: 0,
      totalUsersRegistered: 1,
      conversionsToday: 0,
      dailyStats: getInitialDays(),
      recentActivities: [],
    };
  },

  recordConversion(fileName: string, format: "OGG" | "MP3" | "WAV" | "LUA", speed = "1.0x"): GlobalUsageData {
    const current = this.getData();
    const todayName = getTodayDayName();

    const updatedDaily = current.dailyStats.map((d) => {
      if (d.day === todayName) {
        return { ...d, conversions: d.conversions + 1 };
      }
      return d;
    });

    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      user: "Creator",
      action: fileName || "Audio Track",
      format,
      speed,
    };

    const updated: GlobalUsageData = {
      ...current,
      totalConversions: current.totalConversions + 1,
      conversionsToday: current.conversionsToday + 1,
      dailyStats: updatedDaily,
      recentActivities: [newActivity, ...current.recentActivities.slice(0, 9)],
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return updated;
  },

  resetStats() {
    localStorage.removeItem(STORAGE_KEY);
    return this.getData();
  },
};

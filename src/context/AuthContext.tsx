import React, { createContext, useContext, useState, useEffect } from "react";
import { fastHash } from "@/utils/crypto";

export type UserRole = "owner" | "admin" | "member";

export interface User {
  id: string;
  username: string;
  avatar: string;
  role: UserRole;
  plan: "free" | "3day" | "7day" | "30day" | "lifetime";
  createdAt: string;
}

export interface QuotaState {
  bypassUsed: number;
  bypassLimit: number; // 5 for free, Infinity for owner/admin/paid
  editorUsed: number;
  editorLimit: number; // 5 for free, Infinity for owner/admin/paid
  lastResetDate: string;
}

interface StoredAccount {
  username: string;
  passwordHash: string;
  role: "member" | "admin" | "owner";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  quota: QuotaState;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register" | "staff";
  openAuthModal: (tab?: "login" | "register" | "staff") => void;
  closeAuthModal: () => void;
  openDiscordLogin: () => void;
  openStaffLogin: () => void;
  loginUser: (username: string, pass: string) => { success: boolean; message?: string };
  registerUser: (username: string, pass: string) => { success: boolean; message?: string };
  loginStaff: (username: string, pass: string) => { success: boolean; role?: "owner" | "admin"; message?: string };
  logout: () => void;
  consumeQuota: (type: "bypass" | "editor") => { allowed: boolean; remaining: number; message?: string };
  resetDailyQuotaIfNewDay: () => void;
  upgradePlan: (plan: "3day" | "7day" | "30day" | "lifetime") => void;
  updateStaffCredentials: (newOwnerPass?: string, newAdminPass?: string) => boolean;
}

const DEFAULT_FREE_LIMIT = 5;
const getTodayString = () => new Date().toISOString().split("T")[0];

// Default Staff Accounts
export const DEFAULT_STAFF_CONFIG = {
  owner: {
    username: "Joverse Studio",
    password: "Joverse110707",
  },
  admin: {
    username: "Admin Joverse",
    password: "Admin110707",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("joverse_user_session_v3");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [quota, setQuota] = useState<QuotaState>(() => {
    try {
      const saved = localStorage.getItem("joverse_quota_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastResetDate !== getTodayString()) {
          return {
            bypassUsed: 0,
            bypassLimit: DEFAULT_FREE_LIMIT,
            editorUsed: 0,
            editorLimit: DEFAULT_FREE_LIMIT,
            lastResetDate: getTodayString(),
          };
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return {
      bypassUsed: 0,
      bypassLimit: DEFAULT_FREE_LIMIT,
      editorUsed: 0,
      editorLimit: DEFAULT_FREE_LIMIT,
      lastResetDate: getTodayString(),
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register" | "staff">("login");

  useEffect(() => {
    if (user) {
      localStorage.setItem("joverse_user_session_v3", JSON.stringify(user));
    } else {
      localStorage.removeItem("joverse_user_session_v3");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("joverse_quota_v3", JSON.stringify(quota));
  }, [quota]);

  const resetDailyQuotaIfNewDay = () => {
    const today = getTodayString();
    if (quota.lastResetDate !== today) {
      setQuota((prev) => ({
        ...prev,
        bypassUsed: 0,
        editorUsed: 0,
        bypassLimit: user?.role === "owner" || user?.role === "admin" || user?.plan !== "free" ? Infinity : DEFAULT_FREE_LIMIT,
        editorLimit: user?.role === "owner" || user?.role === "admin" || user?.plan !== "free" ? Infinity : DEFAULT_FREE_LIMIT,
        lastResetDate: today,
      }));
    }
  };

  useEffect(() => {
    resetDailyQuotaIfNewDay();
  }, []);

  const openAuthModal = (tab: "login" | "register" | "staff" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openDiscordLogin = () => openAuthModal("register");
  const openStaffLogin = () => openAuthModal("staff");

  // Helper untuk membaca akun terdaftar dari storage
  const getRegisteredAccounts = (): StoredAccount[] => {
    try {
      const raw = localStorage.getItem("joverse_registered_users_v3");
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  };

  const saveRegisteredAccounts = (accounts: StoredAccount[]) => {
    try {
      localStorage.setItem("joverse_registered_users_v3", JSON.stringify(accounts));
    } catch (err) {
      console.error("Save accounts error:", err);
    }
  };

  // Helper untuk membaca kredensial staf tersimpan (jika diubah oleh Owner)
  const getStaffConfig = () => {
    try {
      const raw = localStorage.getItem("joverse_staff_config_v3");
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return DEFAULT_STAFF_CONFIG;
  };

  // REGISTER USER BARU DENGAN PASSWORD HASH
  const registerUser = (username: string, pass: string) => {
    const u = username.trim();
    const p = pass.trim();

    if (!u || !p) {
      return { success: false, message: "Username dan Password tidak boleh kosong!" };
    }
    if (u.length < 3) {
      return { success: false, message: "Username minimal 3 karakter!" };
    }
    if (p.length < 4) {
      return { success: false, message: "Password minimal 4 karakter!" };
    }

    const accounts = getRegisteredAccounts();
    const existing = accounts.find((a) => a.username.toLowerCase() === u.toLowerCase());
    if (existing) {
      return { success: false, message: "Username sudah terdaftar! Silakan login." };
    }

    // Hash kata sandi dengan salt username
    const pHash = fastHash(`${u.toLowerCase()}:${p}:joverse_salt_2026`);

    const newAcc: StoredAccount = {
      username: u,
      passwordHash: pHash,
      role: "member",
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAcc);
    saveRegisteredAccounts(accounts);

    // Otomatis login akun baru
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: u,
      avatar: "/joverse-library-logo.png",
      role: "member",
      plan: "free",
      createdAt: newAcc.createdAt,
    };

    setUser(newUser);
    setQuota({
      bypassUsed: 0,
      bypassLimit: DEFAULT_FREE_LIMIT,
      editorUsed: 0,
      editorLimit: DEFAULT_FREE_LIMIT,
      lastResetDate: getTodayString(),
    });

    setIsAuthModalOpen(false);
    return { success: true };
  };

  // LOGIN USER MEMBER ATAU STAF
  const loginUser = (username: string, pass: string) => {
    const u = username.trim();
    const p = pass.trim();

    // Check staff first
    const staff = getStaffConfig();
    if (u === staff.owner.username && p === staff.owner.password) {
      return loginStaff(u, p);
    }
    if (u === staff.admin.username && p === staff.admin.password) {
      return loginStaff(u, p);
    }

    const accounts = getRegisteredAccounts();
    const pHash = fastHash(`${u.toLowerCase()}:${p}:joverse_salt_2026`);

    const matched = accounts.find(
      (a) => a.username.toLowerCase() === u.toLowerCase() && a.passwordHash === pHash
    );

    if (!matched) {
      return {
        success: false,
        message: "Username atau Password salah! Belum punya akun? Klik Daftar Akun.",
      };
    }

    const memberUser: User = {
      id: `usr_${matched.username}`,
      username: matched.username,
      avatar: "/joverse-library-logo.png",
      role: matched.role || "member",
      plan: "free",
      createdAt: matched.createdAt,
    };

    setUser(memberUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // LOGIN STAF RESMI
  const loginStaff = (username: string, pass: string) => {
    const u = username.trim();
    const p = pass.trim();
    const staff = getStaffConfig();

    if (u === staff.owner.username && p === staff.owner.password) {
      const ownerUser: User = {
        id: "owner_joverse_001",
        username: staff.owner.username,
        avatar: "/joverse-library-logo.png",
        role: "owner",
        plan: "lifetime",
        createdAt: new Date().toISOString(),
      };
      setUser(ownerUser);
      setQuota({
        bypassUsed: 0,
        bypassLimit: Infinity,
        editorUsed: 0,
        editorLimit: Infinity,
        lastResetDate: getTodayString(),
      });
      setIsAuthModalOpen(false);
      return { success: true, role: "owner" as const };
    }

    if (u === staff.admin.username && p === staff.admin.password) {
      const adminUser: User = {
        id: "admin_joverse_002",
        username: staff.admin.username,
        avatar: "/joverse-library-logo.png",
        role: "admin",
        plan: "lifetime",
        createdAt: new Date().toISOString(),
      };
      setUser(adminUser);
      setQuota({
        bypassUsed: 0,
        bypassLimit: Infinity,
        editorUsed: 0,
        editorLimit: Infinity,
        lastResetDate: getTodayString(),
      });
      setIsAuthModalOpen(false);
      return { success: true, role: "admin" as const };
    }

    return {
      success: false,
      message: "Kredensial staf salah! Akses khusus staf resmi Joverse Studio.",
    };
  };

  const logout = () => {
    setUser(null);
    setQuota({
      bypassUsed: 0,
      bypassLimit: DEFAULT_FREE_LIMIT,
      editorUsed: 0,
      editorLimit: DEFAULT_FREE_LIMIT,
      lastResetDate: getTodayString(),
    });
  };

  const upgradePlan = (plan: "3day" | "7day" | "30day" | "lifetime") => {
    if (user) {
      setUser({ ...user, plan });
      setQuota((prev) => ({
        ...prev,
        bypassLimit: Infinity,
        editorLimit: Infinity,
      }));
    }
  };

  const updateStaffCredentials = (newOwnerPass?: string, newAdminPass?: string): boolean => {
    try {
      const staff = getStaffConfig();
      if (newOwnerPass && newOwnerPass.length >= 6) {
        staff.owner.password = newOwnerPass;
      }
      if (newAdminPass && newAdminPass.length >= 6) {
        staff.admin.password = newAdminPass;
      }
      localStorage.setItem("joverse_staff_config_v3", JSON.stringify(staff));
      return true;
    } catch {
      return false;
    }
  };

  // GATE PENGECEKAN KUOTA & LOGIN UNTUK TOOLS
  const consumeQuota = (
    type: "bypass" | "editor"
  ): { allowed: boolean; remaining: number; message?: string } => {
    if (!user) {
      openAuthModal("login");
      return {
        allowed: false,
        remaining: 0,
        message: "Silakan Masuk (Login) atau Daftar Akun terlebih dahulu untuk menggunakan tools!",
      };
    }

    // Owner, Admin, dan pengguna berbayar tidak dibatasi
    if (user.role === "owner" || user.role === "admin" || user.plan !== "free") {
      return { allowed: true, remaining: 999999 };
    }

    resetDailyQuotaIfNewDay();

    if (type === "bypass") {
      if (quota.bypassUsed >= quota.bypassLimit) {
        return {
          allowed: false,
          remaining: 0,
          message: `Batas kuota harian Bypass (${DEFAULT_FREE_LIMIT}x / hari) telah habis. Upgrade paket atau tunggu reset besok!`,
        };
      }
      const newUsed = quota.bypassUsed + 1;
      setQuota((prev) => ({ ...prev, bypassUsed: newUsed }));
      return { allowed: true, remaining: quota.bypassLimit - newUsed };
    } else {
      if (quota.editorUsed >= quota.editorLimit) {
        return {
          allowed: false,
          remaining: 0,
          message: `Batas kuota harian Manual Editor (${DEFAULT_FREE_LIMIT}x / hari) telah habis. Upgrade paket atau tunggu reset besok!`,
        };
      }
      const newUsed = quota.editorUsed + 1;
      setQuota((prev) => ({ ...prev, editorUsed: newUsed }));
      return { allowed: true, remaining: quota.editorLimit - newUsed };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        quota,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        openDiscordLogin,
        openStaffLogin,
        loginUser,
        registerUser,
        loginStaff,
        logout,
        consumeQuota,
        resetDailyQuotaIfNewDay,
        upgradePlan,
        updateStaffCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

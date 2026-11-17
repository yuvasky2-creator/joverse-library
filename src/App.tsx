import React, { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { DiscordAuthModal } from "@/components/auth/DiscordAuthModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Home } from "@/pages/Home";
import { Bypass } from "@/pages/Bypass";
import { ManualEditor } from "@/pages/ManualEditor";
import { SkyboxConverter } from "@/pages/SkyboxConverter";
import { Pricing } from "@/pages/Pricing";
import { Portfolio } from "@/pages/Portfolio";
import { OwnerPortal } from "@/pages/OwnerPortal";
import { UsageStatsSection } from "@/components/analytics/UsageStatsSection";
import { Converter } from "@/pages/Converter";
import { Tools } from "@/pages/Tools";
import { Docs } from "@/pages/Docs";
import { About } from "@/pages/About";
import { Settings } from "@/pages/Settings";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { AudioMetadata } from "@/types/audio";

export const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>("home");

  // Hash listener untuk membuka portal admin via URL /#admin
  React.useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#admin" || window.location.hash === "#staff") {
        setCurrentRoute("admin");
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Global Audio State (shared across pages)
  const [loadedFile, setLoadedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Toast System - Dibatasi maksimal 3 agar tidak spam
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    setToasts((prev) => {
      // Cegah notifikasi duplikat beruntun
      if (prev.length > 0 && prev[prev.length - 1].message === message) {
        return prev;
      }
      const id = Math.random().toString(36).substring(2, 9);
      // Batasi maksimal 3 notifikasi
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...trimmed, { id, type, message }];
    });

    setTimeout(() => {
      setToasts((prev) => (prev.length > 0 ? prev.slice(1) : []));
    }, 2800);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFileLoaded = (file: File, buffer: AudioBuffer, meta: AudioMetadata) => {
    setLoadedFile(file);
    setAudioBuffer(buffer);
    setMetadata(meta);
    addToast("success", `File berhasil dimuat: ${file.name} (${buffer.duration.toFixed(1)}s)`);
  };

  const handleClearFile = () => {
    setLoadedFile(null);
    setAudioBuffer(null);
    setMetadata(null);
    addToast("info", "File audio telah ditutup.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-white selection:bg-white/20 selection:text-white relative">
      {/* Background ambient radial glow */}
      <div className="bgfx" aria-hidden="true" />

      {/* Main Navigation (6 Tools) */}
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
        isProcessing={false}
      />

      {/* Active Page View */}
      <main className="flex-1 w-full">
        {currentRoute === "home" && (
          <div className="space-y-16">
            <Home
              onRouteChange={setCurrentRoute}
              onFileLoaded={handleFileLoaded}
              onError={(msg) => addToast("error", msg)}
            />
            {/* Global Usage Stats Section on Home Page */}
            <div className="wrap max-w-6xl pb-16">
              <UsageStatsSection />
            </div>
          </div>
        )}

        {/* 1. Bypass Audio Transcoder */}
        {currentRoute === "bypass" && (
          <Bypass onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* 2. Manual Audio Editor (9-Band EQ) */}
        {currentRoute === "editor" && (
          <ManualEditor onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* 3. Skybox Converter (Roblox 6-Side Cubemap) */}
        {currentRoute === "skybox" && (
          <SkyboxConverter onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* 4. Stats & Grafik Penggunaan Global */}
        {currentRoute === "analytics" && (
          <div className="wrap py-10 max-w-6xl animate-fadeIn">
            <UsageStatsSection />
          </div>
        )}

        {/* 4. Pricing & Layanan Pembuatan Map */}
        {currentRoute === "pricing" && (
          <Pricing onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* 5. Portofolio Roblox Map Showcase (Real-time Live API) */}
        {currentRoute === "portfolio" && (
          <Portfolio onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* 6. Portal Owner & Admin */}
        {currentRoute === "admin" && (
          <OwnerPortal onNotify={(msg, type) => addToast(type || "info", msg)} />
        )}

        {/* Secondary Pages */}
        {currentRoute === "tools" && <Tools onRouteChange={setCurrentRoute} />}
        {currentRoute === "docs" && <Docs />}
        {currentRoute === "about" && <About />}
        {currentRoute === "settings" && <Settings onSuccess={(msg) => addToast("success", msg)} />}
      </main>

      {/* Footer */}
      <Footer onRouteChange={setCurrentRoute} />

      {/* Discord & Staff Auth Modal */}
      <DiscordAuthModal />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("UI Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleClearAndReload = () => {
    try {
      localStorage.removeItem("joverse_realtime_usage_v2");
      localStorage.removeItem("joverse_global_usage");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 p-2">
            <img src="/joverse-library-logo.png" alt="JOVERSE" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold">Sinkronisasi Tampilan Diperbarui</h2>
          <p className="text-xs text-zinc-400 max-w-md">
            Pembaruan fitur terbaru memerlukan penyegaran sesi lokal browser Anda. Silakan klik tombol di bawah:
          </p>
          <button
            onClick={this.handleClearAndReload}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            Muat Ulang Tampilan
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

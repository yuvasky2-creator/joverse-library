import React, { useState, useEffect } from "react";
import { AlertCircle, Play, Video, ExternalLink, X, Music, Download } from "lucide-react";

interface VideoUrlPreviewProps {
  url: string;
  onClear?: () => void;
  onNotify?: (msg: string, type?: "success" | "error" | "info") => void;
  onMetaLoaded?: (meta: { title: string; author?: string; thumbnail?: string }) => void;
}

export type PlatformType = "youtube" | "tiktok" | "direct" | "unknown";

export function detectPlatform(url: string): {
  platform: PlatformType;
  videoId?: string;
  embedUrl?: string;
  isValid: boolean;
} {
  const cleanUrl = (url || "").trim();
  if (!cleanUrl) {
    return { platform: "unknown", isValid: false };
  }

  // 1. YouTube Detection (Regular, Shorts, Embed, youtu.be)
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      platform: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
      isValid: true,
    };
  }

  // 2. TikTok Detection
  const ttMatch = cleanUrl.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/i);
  if (ttMatch && ttMatch[1]) {
    const videoId = ttMatch[1];
    return {
      platform: "tiktok",
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      isValid: true,
    };
  }

  if (/tiktok\.com/i.test(cleanUrl)) {
    return {
      platform: "tiktok",
      isValid: true,
      embedUrl: cleanUrl,
    };
  }

  // 3. Direct Audio File URL (.mp3, .wav, .ogg, etc.)
  if (/\.(mp3|wav|ogg|flac|m4a)(\?.*)?$/i.test(cleanUrl)) {
    return {
      platform: "direct",
      embedUrl: cleanUrl,
      isValid: true,
    };
  }

  return {
    platform: "unknown",
    isValid: false,
  };
}

export const VideoUrlPreview: React.FC<VideoUrlPreviewProps> = ({
  url,
  onClear,
  onMetaLoaded,
}) => {
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const detected = detectPlatform(url);

  // Ambil metadata judul asli via noembed / youtube oEmbed JSON
  useEffect(() => {
    let isCancelled = false;

    async function fetchMetadata() {
      if (detected.platform === "youtube" && detected.videoId) {
        // Coba YouTube oEmbed resmi terlebih dahulu
        try {
          const ytRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${detected.videoId}&format=json`
          );
          if (ytRes.ok) {
            const data = await ytRes.json();
            if (!isCancelled && data.title) {
              setVideoTitle(data.title);
              setAuthorName(data.author_name || "");
              onMetaLoaded?.({
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
              });
              return;
            }
          }
        } catch {
          // lanjut ke noembed
        }

        // Fallback ke noembed
        try {
          const res = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${detected.videoId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled && data.title) {
              setVideoTitle(data.title);
              setAuthorName(data.author_name || "");
              onMetaLoaded?.({
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
              });
              return;
            }
          }
        } catch {
          // fallback
        }
      } else if (detected.platform === "tiktok") {
        try {
          const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled && data.title) {
              setVideoTitle(data.title);
              setAuthorName(data.author_name || "");
              onMetaLoaded?.({
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
              });
              return;
            }
          }
        } catch {
          // fallback
        }
      } else if (detected.platform === "direct") {
        const guess = url.split("/").pop()?.split("?")[0] || "Audio_Direct_Source.mp3";
        setVideoTitle(guess);
        onMetaLoaded?.({ title: guess });
      }
    }

    fetchMetadata();
    return () => {
      isCancelled = true;
    };
  }, [url, detected.platform, detected.videoId, onMetaLoaded]);

  if (!url) return null;

  if (!detected.isValid || detected.platform === "unknown") {
    return (
      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/60 text-xs text-zinc-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-white">URL Tidak Dikenali / Format Tidak Didukung</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Mendukung URL <strong>YouTube</strong> (standar/shorts) dan <strong>TikTok</strong> (video ID/link publik). Pastikan link tidak private.
          </p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-white/10 overflow-hidden shadow-2xl transition-all">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono truncate">
            <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {videoTitle ? `${videoTitle}` : `Preview Video: ${detected.platform === "youtube" ? "YouTube" : "TikTok"}`}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Buka Sumber</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Embed Container */}
      <div className="p-3">
        {detected.platform === "youtube" && detected.videoId && (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5">
            <iframe
              src={detected.embedUrl}
              title={videoTitle || "YouTube video player"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {detected.platform === "tiktok" && (
          <div className="flex justify-center bg-black/60 rounded-xl p-2 border border-white/5">
            {detected.videoId ? (
              <iframe
                src={`https://www.tiktok.com/embed/v2/${detected.videoId}`}
                title="TikTok video player"
                className="w-full max-w-sm h-[480px] border-0 rounded-lg"
                allow="autoplay; encrypted-media; fullscreen"
              />
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
                <p>Link TikTok terdeteksi. Silakan buka langsung di aplikasi:</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Buka Video di TikTok</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Download MP3 Action Button untuk YouTube */}
        {detected.platform === "youtube" && (
          <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <div className="flex items-center gap-2 truncate mr-2">
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300 text-[11px] truncate">
                Unduh file MP3 asli video ini untuk diproses 100% presisi:
              </span>
            </div>
            <a
              href={`https://cobalt.tools/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition-all flex items-center gap-1 shadow shrink-0 cursor-pointer"
            >
              <span>Unduh MP3</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="mt-3 px-1 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 border-t border-white/5">
          <span className="truncate">
            {authorName ? `Kreator: ${authorName}` : "Video dapat diputar langsung di atas."}
          </span>
          <span className="font-mono text-zinc-300 shrink-0">Resmi &amp; Terverifikasi</span>
        </div>
      </div>
    </div>
  );
};

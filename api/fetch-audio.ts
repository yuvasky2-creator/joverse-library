import type { VercelRequest, VercelResponse } from "@vercel/node";

// Resolvers audio YouTube multi-instance (Cobalt, Piped, Invidious) untuk mengekstrak stream audio asli
async function resolveYouTubeAudioStream(videoId: string): Promise<string | null> {
  const ytWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Coba Cobalt API (Resolusi stream audio YouTube tercepat & bebas Cloudflare)
  const cobaltEndpoints = [
    "https://api.cobalt.tools/",
    "https://cobalt-backend.canine.tools/",
    "https://co.wuk.sh/api/json",
  ];

  for (const endpoint of cobaltEndpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        body: JSON.stringify({
          url: ytWatchUrl,
          downloadMode: "audio",
          audioFormat: "mp3",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.url) return data.url;
      }
    } catch {
      // lanjut ke endpoint alternatif
    }
  }

  // 2. Coba Piped API instances
  const pipedInstances = [
    `https://pipedapi.leptons.xyz/streams/${videoId}`,
    `https://pa.il.ax/streams/${videoId}`,
    `https://piped-api.lunar.icu/streams/${videoId}`,
    `https://pipedapi.tokhmi.xyz/streams/${videoId}`,
    `https://api.piped.private.coffee/streams/${videoId}`,
  ];

  for (const endpoint of pipedInstances) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.audioStreams && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
          return data.audioStreams[0].url;
        }
      }
    } catch {
      // lanjut ke endpoint alternatif
    }
  }

  // 3. Coba Invidious instances
  const invidiousInstances = [
    `https://inv.nadeko.net/api/v1/videos/${videoId}`,
    `https://invidious.nerdvpn.de/api/v1/videos/${videoId}`,
    `https://yt.drgnz.club/api/v1/videos/${videoId}`,
    `https://invidious.jing.rocks/api/v1/videos/${videoId}`,
  ];

  for (const endpoint of invidiousInstances) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.adaptiveFormats && Array.isArray(data.adaptiveFormats)) {
          const audioFormats = data.adaptiveFormats
            .filter((f: any) => (f.type || "").startsWith("audio/"))
            .sort((a: any, b: any) => parseInt(b.bitrate || "0", 10) - parseInt(a.bitrate || "0", 10));
          if (audioFormats.length > 0 && audioFormats[0].url) {
            return audioFormats[0].url;
          }
        }
      }
    } catch {
      // lanjut ke endpoint alternatif
    }
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers lengkap untuk akses Web Audio API / AudioBuffer di browser
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawUrl = (req.query.url as string)?.trim();
  if (!rawUrl) {
    return res.status(400).json({ error: "Parameter URL diperlukan." });
  }

  try {
    const targetUrl = decodeURIComponent(rawUrl);

    // 1. Deteksi apakah ini URL YouTube
    const ytMatch = targetUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i
    );

    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const audioStreamUrl = await resolveYouTubeAudioStream(videoId);
      if (audioStreamUrl) {
        // Redirect 302 langsung ke direct audio stream asli dari YouTube
        return res.redirect(302, audioStreamUrl);
      }

      // Berikan respon status jelas jika YouTube membatasi IP serverless
      return res.status(422).json({
        error: "YOUTUBE_STREAM_RESTRICTED",
        message: "YouTube membatasi streaming audio langsung dari cloud serverless. Silakan unduh file MP3 atau upload langsung.",
        videoId,
        downloadUrl: `https://cobalt.tools/?url=${encodeURIComponent(targetUrl)}`,
      });
    }

    // 2. Validasi URL protokol untuk direct audio URL (.mp3, .wav, .ogg, dll)
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Protokol URL tidak valid (harus http atau https)." });
    }

    const rangeHeader = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "audio/*, video/*, */*",
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const upstream = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({
        error: `Gagal memuat audio dari sumber eksternal (HTTP ${upstream.status}).`,
      });
    }

    const upstreamType = upstream.headers.get("content-type") || "";
    if (upstreamType.includes("text/html") && !targetUrl.match(/\.(mp3|wav|ogg|flac|m4a|aac)/i)) {
      return res.status(415).json({
        error: "URL mengarah ke halaman HTML, bukan file stream audio langsung.",
      });
    }

    const contentType =
      upstreamType && upstreamType.includes("audio")
        ? upstreamType
        : targetUrl.endsWith(".ogg")
        ? "audio/ogg"
        : targetUrl.endsWith(".wav")
        ? "audio/wav"
        : targetUrl.endsWith(".flac")
        ? "audio/flac"
        : "audio/mpeg";

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", acceptRanges);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);

    res.status(upstream.status);

    const arrayBuffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Fetch audio error:", err);
    return res.status(500).json({
      error: "Gagal memproses stream audio dari URL eksternal.",
      details: err.message,
    });
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    // Validasi URL protokol
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

    const upstreamType = upstream.headers.get("content-type");
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

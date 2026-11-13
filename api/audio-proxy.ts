import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).json({ error: "Parameter url diperlukan." });
  }

  try {
    const targetUrl = decodeURIComponent(rawUrl);

    // Validasi URL
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Protokol URL tidak valid." });
    }

    const rangeHeader = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const upstream = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({
        error: `Gagal memuat audio dari sumber eksternal (status ${upstream.status}).`,
      });
    }

    const contentType = upstream.headers.get("content-type") || "audio/mpeg";
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", acceptRanges);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);

    res.status(upstream.status);

    if (upstream.body) {
      // Stream langsung data binary ke client
      const arrayBuffer = await upstream.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } else {
      return res.end();
    }
  } catch (err: any) {
    console.error("Audio proxy error:", err);
    return res.status(500).json({ error: "Gagal mem-proxy audio", details: err.message });
  }
}

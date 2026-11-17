import type { VercelRequest, VercelResponse } from "@vercel/node";

interface FeedbackItem {
  id: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
  isModerated?: boolean;
}

// Global serverless in-memory store
let globalLikes: string[] = [
  "usr_alex_dev",
  "usr_dimas_scripter",
  "usr_rian_rblx",
  "usr_community_fan",
  "usr_builder_joverse",
];

let globalFeedbacks: FeedbackItem[] = [
  {
    id: "fb-1",
    userId: "usr_alex_dev",
    username: "Alex_RobloxDev",
    rating: 5,
    comment: "Bypass audionya bekerja sangat baik di Roblox Studio! Fitur preview speed 2.3x sangat membantu.",
    date: "10 Nov 2026",
    isModerated: true,
  },
  {
    id: "fb-2",
    userId: "usr_dimas_scripter",
    username: "DimasStudio",
    rating: 5,
    comment: "Pricelist pembuatan map sangat transparan. Hasil map ekspedisinya rapi dan performanya bagus di mobile.",
    date: "11 Nov 2026",
    isModerated: true,
  },
  {
    id: "fb-3",
    userId: "usr_rian_rblx",
    username: "Rian_Creative",
    rating: 4,
    comment: "UI monokrom barunya sangat bersih dan tidak bikin sakit mata. Obfuscator kodenya juga aman di Luau.",
    date: "12 Nov 2026",
    isModerated: true,
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Ambil status feedback dan likes real-time
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      likesCount: globalLikes.length,
      likes: globalLikes,
      feedbacks: globalFeedbacks,
    });
  }

  // POST: Tambah like atau feedback baru
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { action } = body;

      // 1. Aksi Toggle Like
      if (action === "toggle_like") {
        const userId = (body.userId || "").trim();
        if (!userId) {
          return res.status(400).json({ error: "User ID diperlukan untuk menyukai website." });
        }

        if (globalLikes.includes(userId)) {
          globalLikes = globalLikes.filter((id) => id !== userId);
        } else {
          globalLikes.push(userId);
        }

        return res.status(200).json({
          success: true,
          action: "toggle_like",
          likesCount: globalLikes.length,
          likes: globalLikes,
        });
      }

      // 2. Aksi Kirim Feedback
      if (action === "add_feedback") {
        const { feedback } = body;
        if (!feedback || !feedback.comment || !feedback.username) {
          return res.status(400).json({ error: "Data feedback tidak lengkap." });
        }

        const newFeedback: FeedbackItem = {
          id: feedback.id || `fb_${Date.now()}`,
          userId: feedback.userId || "anonymous",
          username: feedback.username,
          rating: Number(feedback.rating) || 5,
          comment: String(feedback.comment).trim(),
          date:
            feedback.date ||
            new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          isModerated: true,
        };

        // Update list: jika user yang sama sudah pernah komen, ganti ulasannya
        globalFeedbacks = [newFeedback, ...globalFeedbacks.filter((f) => f.userId !== newFeedback.userId)];

        return res.status(200).json({
          success: true,
          action: "add_feedback",
          feedback: newFeedback,
          feedbacks: globalFeedbacks,
          likesCount: globalLikes.length,
        });
      }

      return res.status(400).json({ error: "Action tidak dikenali." });
    } catch (err: any) {
      console.error("Community handler error:", err);
      return res.status(500).json({ error: "Gagal memproses data komunitas.", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}

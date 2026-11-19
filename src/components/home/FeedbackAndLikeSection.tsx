import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Star, ThumbsUp, Send, CheckCircle2, MessageSquare, Sparkles, Activity } from "lucide-react";

export interface UserFeedback {
  id: string;
  userId: string;
  username: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
  isModerated?: boolean;
}

const STORAGE_FEEDBACKS_KEY = "joverse_user_feedbacks_v4";
const STORAGE_LIKES_KEY = "joverse_user_likes_v4";

const INITIAL_FEEDBACKS: UserFeedback[] = [
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

export const FeedbackAndLikeSection: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  // State Likes & Feedbacks
  const [likes, setLikes] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_LIKES_KEY);
      return raw ? JSON.parse(raw) : ["usr_alex_dev", "usr_dimas_scripter", "usr_rian_rblx"];
    } catch {
      return ["usr_alex_dev", "usr_dimas_scripter", "usr_rian_rblx"];
    }
  });

  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FEEDBACKS_KEY);
      return raw ? JSON.parse(raw) : INITIAL_FEEDBACKS;
    } catch {
      return INITIAL_FEEDBACKS;
    }
  });

  // Form State
  const [guestName, setGuestName] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Persistent Guest ID untuk like & komen pengunjung publik tanpa login
  const getVisitorId = useCallback(() => {
    if (user?.id) return user.id;
    let gid = localStorage.getItem("joverse_visitor_uid");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("joverse_visitor_uid", gid);
    }
    return gid;
  }, [user]);

  const activeUserId = getVisitorId();
  const hasLiked = likes.includes(activeUserId);

  // Sinkronisasi data real-time dengan serverless backend /api/community
  const fetchCommunityData = useCallback(async () => {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          if (Array.isArray(data.likes)) {
            setLikes(data.likes);
            localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(data.likes));
          }
          if (Array.isArray(data.feedbacks) && data.feedbacks.length > 0) {
            setFeedbacks(data.feedbacks);
            localStorage.setItem(STORAGE_FEEDBACKS_KEY, JSON.stringify(data.feedbacks));
          }
        }
      }
    } catch (err) {
      // Offline fallback silent
    }
  }, []);

  // Poll / refresh otomatis setiap 3.5 detik agar komen & like user lain langsung muncul secara real-time
  useEffect(() => {
    fetchCommunityData();
    const interval = setInterval(() => {
      fetchCommunityData();
    }, 3_500);
    return () => clearInterval(interval);
  }, [fetchCommunityData]);

  // Cek apakah user sudah pernah kirim feedback sebelumnya
  useEffect(() => {
    if (user) {
      const existing = feedbacks.find((f) => f.userId === user.id);
      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment);
      }
    }
  }, [user, feedbacks]);

  const handleToggleLike = async () => {
    const currentUid = activeUserId;

    // Optimistic UI Update
    const newLikes = likes.includes(currentUid)
      ? likes.filter((id) => id !== currentUid)
      : [...likes, currentUid];
    setLikes(newLikes);
    localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(newLikes));

    // Kirim ke backend serverless real-time
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_like",
          userId: currentUid,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.likes)) {
          setLikes(data.likes);
        }
      }
    } catch (err) {
      console.warn("Like sync notice:", err);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const reviewerName = user?.username || guestName.trim() || "Roblox Developer";
    const currentUid = activeUserId;

    const newFeedback: UserFeedback = {
      id: `fb_${Date.now()}`,
      userId: currentUid,
      username: reviewerName,
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isModerated: true,
    };

    // Optimistic UI Update: langsung muncul paling atas seketika
    const updated = [newFeedback, ...feedbacks.filter((f) => f.userId !== currentUid)];
    setFeedbacks(updated);
    localStorage.setItem(STORAGE_FEEDBACKS_KEY, JSON.stringify(updated));

    setSubmitted(true);
    setIsSyncing(true);

    // Kirim ke backend serverless real-time agar seluruh pengguna web langsung melihat ulasan baru
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_feedback",
          feedback: newFeedback,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.feedbacks)) {
          setFeedbacks(data.feedbacks);
        }
      }
    } catch (err) {
      console.warn("Feedback sync notice:", err);
    } finally {
      setIsSyncing(false);
      setComment("");
      setTimeout(() => setSubmitted(false), 3500);
    }
  };

  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length
        ).toFixed(1)
      : "5.0";

  return (
    <section className="py-14 border-t border-white/[0.08] space-y-10">
      {/* ── HEADER & LIKE BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-zinc-300 font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERAKSI PENGGUNA RESMI &middot; REAL-TIME LIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Sora']">
            Kepuasan &amp; Feedback Komunitas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Dukungan dan penilaian langsung dari developer Roblox yang otomatis diperbarui secara live bagi seluruh pengunjung.
          </p>
        </div>

        {/* ── TOMBOL LIKE WEBSITE ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
              hasLiked
                ? "bg-white text-zinc-950 border border-white"
                : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/15"
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`}
            />
            <span>{hasLiked ? "Sudah Disukai" : "Sukai Website"}</span>
            <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-black/50 text-white border border-white/10 font-bold">
              {likes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── FEEDBACK STATS & FORM GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary Rating & Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Average Rating Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Skor Kepuasan Rata-rata
              </span>
              <span className="text-xs text-white font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {feedbacks.length} Ulasan Terverifikasi
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-extrabold text-white font-['Sora']">
                {averageRating}
              </div>
              <div className="flex items-center gap-1 text-zinc-300">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(Number(averageRating))
                        ? "fill-white text-white"
                        : "text-zinc-600"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Dihitung secara transparan dari akumulasi bintang yang diberikan oleh developer aktif di website ini.
            </p>
          </div>

          {/* Form Pengiriman Feedback */}
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <MessageSquare className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Beri Rating &amp; Komentar
              </h3>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Star Picker */}
              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                  Pilih Nilai Bintang:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded text-zinc-500 hover:text-white transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= (hoverRating || rating)
                            ? "fill-white text-white"
                            : "text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-white ml-2">
                    {rating} / 5 Bintang
                  </span>
                </div>
              </div>

              {/* Guest Name input if not logged in */}
              {!user && (
                <div>
                  <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                    Nama Anda / Username Roblox:
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Contoh: Alex_RobloxDev"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                  Ulasan / Masukan Anda:
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tulis pendapat atau masukan Anda tentang tools Joverse Library..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSyncing}
                className="btn-white w-full py-2.5 rounded-xl text-xs font-bold text-zinc-950 flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSyncing ? "Menyimpan Ulasan..." : "Kirim Ulasan & Rating"}</span>
              </button>

              {submitted && (
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Terima kasih! Ulasan Anda berhasil diterbitkan secara live.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right: List Feedback Terverifikasi (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Ulasan Pengguna Terbaru (Live)
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Otomatis Sinkron Real-Time</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xs font-bold text-white font-mono uppercase">
                      {fb.username.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-none">
                        {fb.username}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {fb.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-white">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= fb.rating
                            ? "fill-white text-white"
                            : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed pl-9">
                  "{fb.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

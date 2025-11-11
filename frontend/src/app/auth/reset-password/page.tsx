"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic guard: if missing params, navigate to login
    if (!uid || !token) {
      router.replace("/auth/login");
    }
  }, [uid, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(null);

    if (!password || password.length < 8) {
      setErrors(["Password must be at least 8 characters."]);
      return;
    }
    if (password !== confirm) {
      setErrors(["Passwords do not match."]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: string[] = [];
        if (data?.detail) {
          if (Array.isArray(data.detail)) msgs.push(...data.detail);
          else msgs.push(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
        } else {
          msgs.push("Could not reset password.");
        }
        setErrors(msgs);
        return;
      }
      setSuccess("Password reset successfully. You can now sign in.");
      setTimeout(() => router.replace("/auth/login"), 1200);
    } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
      // FIX: Added instanceof check for type safety
      if (e instanceof Error) {
        setErrors([e.message || "Could not reset password."]);
      } else {
        setErrors(["Could not reset password."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      <motion.video
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.2 }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/preview.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/arora.webm" type="video/webm" />
        <source src="/arora.mp4" type="video/mp4" />
      </motion.video>

      <div className="relative z-10 w-full max-w-sm p-8 rounded-3xl bg-white/1 backdrop-blur-lg shadow-xl border border-white/10">
        <h1 className="text-2xl font-bold text-center mb-6">Set a new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-4 pr-4 py-3 rounded-md bg-slate-800/70 text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 rounded-md bg-slate-800/70 text-white placeholder-gray-400 focus:outline-none"
          />

          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-md p-2 text-sm"
              >
                {errors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {success && (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md p-2 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";
import { X, Lock, KeyRound, AlertCircle, CheckCircle } from "lucide-react";

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (passcode: string) => void;
}

export function TeacherAuthModal({ isOpen, onClose, onSuccess }: TeacherAuthModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        sounds.playFanfare();
        const validPass = (data.passcode || passcode.trim()).trim();
        try {
          localStorage.setItem("wonderhub_teacher_passcode", validPass);
          sessionStorage.setItem("wonderhub_teacher_passcode", validPass);
          document.cookie = `teacher_passcode=${encodeURIComponent(validPass)}; path=/; max-age=2592000; SameSite=Lax`;
        } catch {}
        onSuccess(validPass);
        onClose();
      } else {
        setError(data.error || "Incorrect teacher passcode.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-indigo-400 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 border-2 border-indigo-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Teacher Sign-In</h3>
          <p className="text-sm text-slate-500 mt-1">
            Enter your teacher passcode to add games, Canva stories, worksheets, or edit activities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Teacher Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Enter passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-800 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <span>💡 Default teacher passcode is:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">
                teacher123
              </code>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-400/30 transition transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Unlock Teacher Mode</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

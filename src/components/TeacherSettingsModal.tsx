"use client";

import { useState, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { X, Settings, Sparkles, KeyRound, LogOut, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

interface TeacherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    teacherName: string;
    classTitle: string;
    welcomeMessage: string;
    avatarEmoji: string;
    theme: string;
    announcement: string;
  };
  teacherPasscode: string;
  onUpdate: (updated: any, newPasscode?: string) => void;
  onSignOut: () => void;
}

const TEACHER_AVATARS = ["👩‍🏫", "👨‍🏫", "🦉", "🌟", "🎨", "🚀", "👑", "🦁"];
const THEMES = [
  { id: "playful", name: "Playful Sunshine ☀️", bg: "from-amber-400 to-orange-400" },
  { id: "cosmic", name: "Cosmic Galaxy 🚀", bg: "from-indigo-500 to-purple-600" },
  { id: "safari", name: "Jungle Safari 🌴", bg: "from-emerald-500 to-teal-600" },
  { id: "ocean", name: "Ocean Splash 🐬", bg: "from-cyan-400 to-blue-500" },
];

export function TeacherSettingsModal({
  isOpen,
  onClose,
  settings,
  teacherPasscode,
  onUpdate,
  onSignOut,
}: TeacherSettingsModalProps) {
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [classTitle, setClassTitle] = useState(settings.classTitle);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcomeMessage);
  const [avatarEmoji, setAvatarEmoji] = useState(settings.avatarEmoji);
  const [theme, setTheme] = useState(settings.theme);
  const [announcement, setAnnouncement] = useState(settings.announcement || "");

  // Passcode verification state
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTeacherName(settings.teacherName);
      setClassTitle(settings.classTitle);
      setWelcomeMessage(settings.welcomeMessage);
      setAvatarEmoji(settings.avatarEmoji);
      setTheme(settings.theme);
      setAnnouncement(settings.announcement || "");

      // Retrieve saved passcode
      let saved = teacherPasscode;
      if (!saved && typeof window !== "undefined") {
        saved =
          localStorage.getItem("wonderhub_teacher_passcode") ||
          sessionStorage.getItem("wonderhub_teacher_passcode") ||
          "";
      }
      setCurrentPasscode(saved || "teacher123");
      setNewPasscode("");
      setConfirmPasscode("");
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, settings, teacherPasscode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const passcodeToSend = currentPasscode.trim() || teacherPasscode.trim() || "teacher123";

    if (newPasscode.trim()) {
      if (newPasscode.trim().length < 4) {
        setError("New passcode must be at least 4 characters long.");
        return;
      }
      if (newPasscode.trim() !== confirmPasscode.trim()) {
        setError("New passcodes do not match. Please re-enter.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Record<string, any> = {
        teacherName: teacherName.trim(),
        classTitle: classTitle.trim(),
        welcomeMessage: welcomeMessage.trim(),
        avatarEmoji,
        theme,
        announcement: announcement.trim(),
        passcode: passcodeToSend,
        teacherPasscode: passcodeToSend,
      };

      if (newPasscode.trim()) {
        payload.newPasscode = newPasscode.trim();
      }

      const res = await fetch(`/api/settings?passcode=${encodeURIComponent(passcodeToSend)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-passcode": passcodeToSend,
          Authorization: `Bearer ${passcodeToSend}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playStarChime();
        setSuccessMsg("Settings updated successfully!");

        const effectiveNewPasscode = newPasscode.trim() || passcodeToSend;
        if (typeof window !== "undefined") {
          localStorage.setItem("wonderhub_teacher_passcode", effectiveNewPasscode);
          sessionStorage.setItem("wonderhub_teacher_passcode", effectiveNewPasscode);
        }

        onUpdate(data.settings, effectiveNewPasscode);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Failed to update settings. Please check your passcode.");
      }
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-indigo-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1 bg-white/20 rounded-xl">⚙️</span>
            <div>
              <h3 className="font-black text-lg">Classroom Settings</h3>
              <p className="text-xs text-white/90">Customize class title, announcement, theme & passcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Teacher Passcode Verification Box */}
          <div className="p-3.5 bg-indigo-50/80 rounded-2xl border-2 border-indigo-200 space-y-1.5">
            <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Teacher Passcode (to authorize changes)</span>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? "text" : "password"}
                required
                value={currentPasscode}
                onChange={(e) => {
                  setCurrentPasscode(e.target.value);
                  setError(null);
                }}
                placeholder="Enter teacher passcode (default: teacher123)"
                className="w-full px-3 py-2 pr-10 rounded-xl border border-indigo-300 font-bold text-sm text-indigo-950 bg-white focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-2.5 text-indigo-400 hover:text-indigo-600"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-indigo-700 font-medium">
              💡 Default teacher passcode is: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200">teacher123</code>
            </p>
          </div>

          {/* Teacher Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Teacher Name
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ms. Sarah"
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Class Title
              </label>
              <input
                type="text"
                required
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                placeholder="Grade 1 & 3 English Wonderland"
                className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Teacher Avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Teacher Avatar
            </label>
            <div className="flex gap-2">
              {TEACHER_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition ${
                    avatarEmoji === emoji
                      ? "bg-indigo-100 border-2 border-indigo-500 scale-110 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Welcome Message for Students
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Classroom Announcement */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Daily Class Announcement (Banner)
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g. 🌟 English phonics quiz on Thursday! Practice the Phonics Pop game!"
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Theme Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Classroom Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id)}
                  className={`p-2.5 rounded-xl border-2 text-left transition flex items-center gap-2 ${
                    theme === th.id
                      ? "border-indigo-600 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${th.bg}`} />
                  <span className="font-extrabold text-xs text-slate-800">{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Change Teacher Passcode */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Change to a New Passcode (Optional)</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="password"
                  placeholder="New passcode (min 4 chars)..."
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm new passcode..."
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Leave these two fields blank if you want to keep your current passcode.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-400/30 transition transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? <span>Saving Settings...</span> : <span>Save Classroom Settings</span>}
          </button>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-slate-200 flex justify-center">
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 p-2 rounded-xl hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Teacher Mode (Return to Student View)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

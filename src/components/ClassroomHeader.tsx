"use client";

import { useState } from "react";
import { sounds } from "@/lib/sounds";
import {
  Sparkles,
  Lock,
  Unlock,
  PlusCircle,
  Settings,
  Share2,
  Volume2,
  VolumeX,
  Star,
  Trophy,
} from "lucide-react";

interface ClassroomHeaderProps {
  teacherName: string;
  classTitle: string;
  welcomeMessage: string;
  avatarEmoji: string;
  announcement?: string;
  publicUrl?: string;
  isTeacher: boolean;
  studentName: string;
  studentAvatar: string;
  studentStars: number;
  onOpenTeacherAuth: () => void;
  onOpenTeacherAdd: () => void;
  onOpenTeacherSettings: () => void;
  onOpenShare: () => void;
  onOpenStudentBoard: () => void;
  onLockTeacherMode: () => void;
  onDownloadOffline?: () => void;
}

export function ClassroomHeader({
  teacherName,
  classTitle,
  welcomeMessage,
  avatarEmoji,
  announcement,
  publicUrl,
  isTeacher,
  studentName,
  studentAvatar,
  studentStars,
  onOpenTeacherAuth,
  onOpenTeacherAdd,
  onOpenTeacherSettings,
  onOpenShare,
  onOpenStudentBoard,
  onLockTeacherMode,
  onDownloadOffline,
}: ClassroomHeaderProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeLink = publicUrl || "https://coconut-light-takol.ship.place/";

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playPop();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeLink);
    sounds.playStarChime();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSpeakWelcome = () => {
    sounds.speakText(`${classTitle}. ${welcomeMessage}`);
  };

  return (
    <header className="relative w-full">
      {/* Teacher Top Bar (visible when teacher mode is on) */}
      {isTeacher ? (
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white px-4 py-2.5 text-xs font-bold shadow-md">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-white/20 rounded-lg text-sm">👩‍🏫</span>
              <span>
                <strong>Teacher Mode Active:</strong> Welcome {teacherName}!
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onOpenTeacherAdd}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm font-black"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Activity</span>
              </button>

              <button
                onClick={onOpenTeacherSettings}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={onOpenShare}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Hub</span>
              </button>

              {onDownloadOffline && (
                <button
                  onClick={onDownloadOffline}
                  title="Download offline student classroom file"
                  className="px-3 py-1.5 bg-emerald-500/80 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-1.5 transition active:scale-95 font-bold"
                >
                  <span>📥 Student File (.html)</span>
                </button>
              )}

              <a
                href="/english-classroom-hub-source.zip"
                download
                title="Download the project ZIP, then drag it onto vercel.com/drop — no GitHub needed"
                className="px-3 py-1.5 bg-sky-500/85 hover:bg-sky-600 text-white rounded-xl flex items-center gap-1.5 transition active:scale-95 font-bold no-underline"
              >
                <span>🌍 Put Site Online (ZIP, no GitHub)</span>
              </a>

              <button
                onClick={onLockTeacherMode}
                title="Lock into clean student view"
                className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-xl flex items-center gap-1.5 transition active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Lock / Student View</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Subtle Teacher Login Button on top bar for the teacher to log in */
        <div className="bg-slate-800/90 text-white text-[11px] font-semibold px-4 py-1.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span>📚 Primary English Learning Hub</span>
              <span>•</span>
              <span>Made with love for Grade 1 & 3 English super students!</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenShare}
                className="text-amber-300 hover:text-amber-200 flex items-center gap-1 transition font-bold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
              <button
                onClick={onOpenTeacherAuth}
                className="text-slate-300 hover:text-white flex items-center gap-1 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Teacher Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Playful Classroom Hero Header */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
        {/* Floating background cute elements */}
        <div className="absolute top-2 left-6 text-6xl opacity-15 pointer-events-none select-none">
          🎈
        </div>
        <div className="absolute bottom-2 right-10 text-7xl opacity-20 pointer-events-none select-none">
          🚀
        </div>
        <div className="absolute top-8 right-24 text-5xl opacity-15 pointer-events-none select-none">
          ⭐
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Class Info */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white font-extrabold text-xs mb-3 shadow-sm">
                <span className="text-base">{avatarEmoji}</span>
                <span>{teacherName}</span>
                <span className="opacity-60">•</span>
                <span>Grades 1 & 3 English Playground</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                {classTitle}
              </h1>

              <div className="flex items-start gap-2 mt-3">
                <p className="text-sm sm:text-base text-white/95 font-medium leading-relaxed drop-shadow-sm">
                  {welcomeMessage}
                </p>
                <button
                  onClick={handleSpeakWelcome}
                  title="Read welcome aloud"
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white shrink-0 mt-0.5 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Student Profile Card & Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Kid Profile Badge */}
              <button
                onClick={() => {
                  sounds.playPop();
                  onOpenStudentBoard();
                }}
                className="w-full sm:w-auto px-4 py-3 bg-white/90 hover:bg-white rounded-2xl shadow-lg border-2 border-amber-200 text-slate-800 flex items-center justify-between sm:justify-start gap-3 transition transform active:scale-95 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner border border-amber-300">
                  {studentAvatar}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Student Profile
                  </div>
                  <div className="font-black text-sm text-slate-800 flex items-center gap-1">
                    <span>{studentName}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-xs font-black text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{studentStars} Stars</span>
                  </div>
                </div>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition active:scale-95 self-end sm:self-auto"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Daily Announcement Banner */}
          {announcement && (
            <div className="mt-6 p-3.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3 text-xs sm:text-sm font-bold text-white shadow-sm">
              <span className="text-xl shrink-0">📢</span>
              <span className="flex-1">{announcement}</span>
              <button
                onClick={() => sounds.speakText(announcement)}
                title="Read announcement"
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Shareable Link Banner for Students & Parents */}
          <div className="mt-4 p-3.5 sm:p-4 bg-white/95 rounded-2xl border-3 border-emerald-400 text-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">🌐</span>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">Shareable Student Link:</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Live for Students</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-700 truncate select-all">{activeLink}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <span>{copiedLink ? "✓ Copied!" : "📋 Copy Link"}</span>
              </button>

              <button
                onClick={onOpenShare}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <span>📱 QR Code & Messages</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

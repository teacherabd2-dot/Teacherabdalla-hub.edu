"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sounds";
import { X, Award, Sparkles, Trophy, Star } from "lucide-react";

interface StudentBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stars: number;
  studentName: string;
  avatar: string;
  onUpdateProfile: (name: string, avatar: string) => void;
}

const AVATARS = [
  { emoji: "🦁", name: "Leo Lion" },
  { emoji: "🐰", name: "Bella Bunny" },
  { emoji: "🦊", name: "Felix Fox" },
  { emoji: "🦕", name: "Dino Dan" },
  { emoji: "🦄", name: "Sparkle Unicorn" },
  { emoji: "🚀", name: "Astro Kid" },
  { emoji: "🐼", name: "Pip Panda" },
  { emoji: "🌟", name: "Star Wonder" },
];

const BADGES = [
  { id: "first_star", name: "First Step ⭐", req: 1, icon: "⭐", desc: "Earned your very first English star!" },
  { id: "phonics_master", name: "Phonics Star 🔤", req: 3, icon: "🔤", desc: "Played 3 phonics & rhyme challenges!" },
  { id: "safari_reader", name: "Word Detective 🦁", req: 6, icon: "🔍", desc: "Solved 6 spelling & reading quests!" },
  { id: "super_scholar", name: "English Super Star 🌟", req: 10, icon: "🏆", desc: "Collected 10 shiny stars in English!" },
  { id: "grand_master", name: "Story & Word Master 👑", req: 15, icon: "👑", desc: "True champion of English reading and writing!" },
];

export function StudentBadgeModal({
  isOpen,
  onClose,
  stars,
  studentName,
  avatar,
  onUpdateProfile,
}: StudentBadgeModalProps) {
  const [name, setName] = useState(studentName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatar);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile(name || "Super Kid", selectedAvatar);
    sounds.playStarChime();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  const getRank = (count: number) => {
    if (count >= 15) return { title: "Wonder Genius 👑", color: "from-purple-500 to-pink-500", progress: 100 };
    if (count >= 10) return { title: "Super Champion 🏆", color: "from-amber-400 to-orange-500", progress: (count / 15) * 100 };
    if (count >= 6) return { title: "Curious Detective 🔍", color: "from-blue-400 to-indigo-500", progress: (count / 10) * 100 };
    if (count >= 1) return { title: "Star Explorer ⭐", color: "from-emerald-400 to-teal-500", progress: (count / 6) * 100 };
    return { title: "Beginner Cub 🌱", color: "from-slate-400 to-slate-500", progress: 10 };
  };

  const rank = getRank(stars);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-4 border-amber-300 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full border-4 border-amber-400 flex items-center justify-center text-4xl shadow-inner mb-2 animate-bounce">
            {selectedAvatar}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-wide">
            My Sticker & Star Board
          </h2>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black text-sm shadow-sm mt-1">
            <Star className="w-4 h-4 fill-amber-950 text-amber-950" />
            <span>{stars} Stars Collected!</span>
          </div>
        </div>

        {/* Level Rank Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Level</span>
            <span className="font-extrabold text-sm text-amber-800">{rank.title}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden border border-amber-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${rank.color} transition-all duration-500`}
              style={{ width: `${Math.min(100, rank.progress)}%` }}
            />
          </div>
        </div>

        {/* Change Name & Avatar */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Student Name or Nickname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name (e.g. Maya Grade 1)"
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-800 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pick Your Learning Buddy
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av.name}
                type="button"
                onClick={() => {
                  setSelectedAvatar(av.emoji);
                  sounds.playPop();
                }}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition transform active:scale-95 ${
                  selectedAvatar === av.emoji
                    ? "bg-amber-100 border-amber-500 scale-105 shadow-md"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="text-3xl">{av.emoji}</span>
                <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                  {av.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sticker Badges */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Badges to Unlock</span>
          </h3>
          <div className="space-y-2">
            {BADGES.map((b) => {
              const unlocked = stars >= b.req;
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border-2 flex items-center gap-3 transition ${
                    unlocked
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${
                      unlocked ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {unlocked ? b.icon : "🔒"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800">{b.name}</h4>
                      {unlocked && (
                        <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Unlocked! 🎉
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{b.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">
                      {unlocked ? `${stars}/${b.req} ⭐` : `Need ${b.req} ⭐`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-300/50 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>Save My Profile & Play!</span>
        </button>
      </div>
    </div>
  );
}

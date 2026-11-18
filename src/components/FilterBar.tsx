"use client";

import { sounds } from "@/lib/sounds";
import { Search, X, Sparkles, Filter } from "lucide-react";

interface FilterBarProps {
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalItems: number;
}

const GRADES = [
  { id: "all", label: "🌟 All English Activities", desc: "Grades 1 & 3" },
  { id: "grade1", label: "🎒 Grade 1 English", desc: "Phonics & Letters (Ages 6-7)" },
  { id: "grade3", label: "🚀 Grade 3 English", desc: "Reading & Grammar (Ages 8-9)" },
  { id: "primary", label: "📚 Primary English Club", desc: "All Primary Learners" },
];

const CATEGORIES = [
  { id: "all", label: "📚 All English" },
  { id: "phonics", label: "🔤 Phonics & Letters" },
  { id: "reading", label: "📖 Reading & Stories" },
  { id: "spelling", label: "✍️ Spelling & Words" },
  { id: "grammar", label: "📝 Grammar & Writing" },
];

const TYPES = [
  { id: "all", label: "All Types" },
  { id: "html_game", label: "🎮 Gemini Games" },
  { id: "canva_embed", label: "🎨 Canva Stories" },
  { id: "file", label: "📄 PDF, Word & PPTX" },
  { id: "link", label: "🔗 Links" },
];

export function FilterBar({
  selectedGrade,
  onSelectGrade,
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
  searchQuery,
  onSearchChange,
  totalItems,
}: FilterBarProps) {
  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-slate-100 mb-8 space-y-4">
      {/* 1. Grade Selectors (Big Kid-Friendly Buttons) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Select Grade Level
          </span>
          <span className="text-xs font-bold text-amber-600">
            {totalItems} {totalItems === 1 ? "English activity" : "English activities"} available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GRADES.map((g) => {
            const active = selectedGrade === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onSelectGrade(g.id);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition transform active:scale-95 flex flex-col justify-between cursor-pointer ${
                  active
                    ? "bg-amber-400 border-amber-500 text-amber-950 shadow-md scale-102"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="font-black text-sm">{g.label}</span>
                <span
                  className={`text-[11px] font-bold ${active ? "text-amber-900" : "text-slate-400"}`}
                >
                  {g.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. English Category Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pt-3 border-t border-slate-100">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onSelectCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Types dropdown & Search */}
        <div className="flex items-center gap-2">
          {/* Type Select */}
          <select
            value={selectedType}
            onChange={(e) => {
              sounds.playPop();
              onSelectType(e.target.value);
            }}
            className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search English games, stories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

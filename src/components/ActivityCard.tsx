"use client";

import { useState } from "react";
import { Item } from "@/db/schema";
import { sounds } from "@/lib/sounds";
import {
  Volume2,
  Heart,
  Play,
  FileText,
  Palette,
  Code,
  Link2,
  Edit2,
  Trash2,
  Pin,
  ExternalLink,
} from "lucide-react";

interface ActivityCardProps {
  item: Item;
  isTeacher: boolean;
  onOpen: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export function ActivityCard({
  item,
  isTeacher,
  onOpen,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const [likes, setLikes] = useState(item.likesCount ?? 0);
  const [hasLiked, setHasLiked] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPop();
    const textToRead = item.description
      ? `${item.title}. ${item.description}`
      : item.title;
    sounds.speakText(textToRead);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) return;
    sounds.playStarChime();
    setHasLiked(true);
    setLikes((prev) => prev + 1);
    fetch(`/api/items/${item.id}/like`, { method: "POST" }).catch(() => {});
  };

  const getGradeBadge = (grade: string) => {
    if (grade === "grade1") {
      return {
        label: "Grade 1 🎒",
        bg: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }
    if (grade === "grade3") {
      return {
        label: "Grade 3 🚀",
        bg: "bg-purple-100 text-purple-800 border-purple-200",
      };
    }
    return {
      label: "All Primary ⭐",
      bg: "bg-amber-100 text-amber-900 border-amber-200",
    };
  };

  const getTypeTheme = (type: string, fileType?: string | null) => {
    if (type === "html_game") {
      return {
        border: "hover:border-amber-400",
        badgeBg: "bg-amber-100 text-amber-800",
        btnGradient: "from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500",
        btnLabel: "Play Game 🎮",
        icon: Code,
      };
    }
    if (type === "canva_embed") {
      return {
        border: "hover:border-cyan-400",
        badgeBg: "bg-cyan-100 text-cyan-800",
        btnGradient: "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600",
        btnLabel: "Play on Canva 🎨 ↗",
        icon: Palette,
      };
    }
    if (type === "file") {
      return {
        border: "hover:border-emerald-400",
        badgeBg: "bg-emerald-100 text-emerald-800",
        btnGradient: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
        btnLabel: fileType === "pptx" ? "View Slides 📊" : "Open Worksheet 📝",
        icon: FileText,
      };
    }
    return {
      border: "hover:border-indigo-400",
      badgeBg: "bg-indigo-100 text-indigo-800",
      btnGradient: "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600",
      btnLabel: "Play Online 🔗 ↗",
      icon: Link2,
    };
  };

  const gradeBadge = getGradeBadge(item.grade);
  const theme = getTypeTheme(item.itemType, item.fileType);

  // Directly clickable for Canva websites and external links
  const isDirectLink =
    (item.itemType === "canva_embed" || item.itemType === "link") &&
    item.content &&
    !item.content.trim().startsWith("<iframe");

  const handleCardClick = () => {
    if (isDirectLink) {
      sounds.playPop();
      window.open(item.content, "_blank", "noopener,noreferrer");
    } else {
      onOpen(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-3xl p-5 shadow-md hover:shadow-xl border-3 border-slate-100 ${theme.border} transition-all duration-200 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1`}
    >
      {/* Top Tag Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${gradeBadge.bg}`}
            >
              {gradeBadge.label}
            </span>

            {item.badge && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${theme.badgeBg}`}
              >
                {item.badge}
              </span>
            )}

            {item.isPinned && (
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Pin className="w-2.5 h-2.5 fill-amber-950" />
                <span>Pinned</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Audio read button */}
            <button
              onClick={handleSpeak}
              title="Read to me"
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Like button */}
            <button
              onClick={handleLike}
              title="Love this!"
              className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                hasLiked
                  ? "text-red-500 bg-red-50"
                  : "text-slate-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${hasLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              {likes > 0 && <span>{likes}</span>}
            </button>
          </div>
        </div>

        {/* Title & Icon */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-3xl shrink-0 transition shadow-inner">
            {item.icon || "🎮"}
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base leading-snug group-hover:text-amber-800 transition">
              {item.title}
            </h3>
            {item.fileName && (
              <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                {item.fileName} {item.fileSize ? `(${item.fileSize})` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed font-medium">
          {item.description || (isDirectLink ? "Tap to launch and play directly in full screen!" : "Click to play and learn!")}
        </p>
      </div>

      {/* Bottom Action Area */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {isDirectLink ? (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playPop();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r ${theme.btnGradient} text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 no-underline cursor-pointer`}
          >
            {item.itemType === "canva_embed" && <Palette className="w-3.5 h-3.5" />}
            {item.itemType === "link" && <ExternalLink className="w-3.5 h-3.5" />}
            <span>{theme.btnLabel}</span>
          </a>
        ) : (
          <button
            type="button"
            className={`flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r ${theme.btnGradient} text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer`}
          >
            {item.itemType === "html_game" && <Play className="w-3.5 h-3.5 fill-white" />}
            {item.itemType === "file" && <FileText className="w-3.5 h-3.5" />}
            <span>{theme.btnLabel}</span>
          </button>
        )}

        {/* Teacher Edit & Delete Controls */}
        {isTeacher && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              title="Edit Activity"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title="Delete Activity"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

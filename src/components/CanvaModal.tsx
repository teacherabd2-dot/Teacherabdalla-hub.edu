"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sounds";
import { Item } from "@/db/schema";
import { X, ExternalLink, Star, Sparkles, Volume2, Play, RefreshCw } from "lucide-react";

interface CanvaModalProps {
  item: Item | null;
  onClose: () => void;
  onEarnStar: () => void;
}

export function CanvaModal({ item, onClose, onEarnStar }: CanvaModalProps) {
  const [hasClaimedStar, setHasClaimedStar] = useState(false);

  if (!item) return null;

  // Check if content is raw <iframe> code
  const isIframeCode = item.content.trim().startsWith("<iframe");

  // Canva websites (*.canva.site) send X-Frame-Options: SAMEORIGIN
  // Browsers strictly block iframes trying to load them.
  const isCanvaWebsite =
    !isIframeCode &&
    (item.content.includes("canva.site") ||
      item.content.includes("my.canva.site") ||
      !item.content.includes("/view?embed"));

  const handleSpeak = () => {
    sounds.speakText(item.description ? `${item.title}. ${item.description}` : item.title);
  };

  const handleLaunchExternal = () => {
    sounds.playPop();
    if (item.content) {
      window.open(item.content, "_blank", "noopener,noreferrer");
    }
  };

  const handleFinishStar = () => {
    if (hasClaimedStar) return;
    setHasClaimedStar(true);
    sounds.playFanfare();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
    onEarnStar();
    fetch(`/api/items/${item.id}/play`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white flex flex-col shadow-2xl border-4 border-cyan-400 overflow-hidden w-full max-w-4xl h-[90vh] max-h-[820px] rounded-3xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 p-3 sm:p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-3xl shrink-0 p-1 bg-white/20 rounded-xl">
              {item.icon || "🎨"}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl truncate text-white">{item.title}</h3>
                <span className="bg-white/25 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase">
                  Canva Interactive
                </span>
              </div>
              <p className="text-xs text-white/90 truncate">{item.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSpeak}
              title="Read to me"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {item.content && (
              <button
                onClick={handleLaunchExternal}
                title="Play in full screen on Canva"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95 flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Launch Fullscreen</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.stopSpeaking();
                onClose();
              }}
              className="p-2 bg-white/20 hover:bg-red-500 rounded-xl text-white transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        {item.description && (
          <div className="bg-cyan-50 px-4 py-2 border-b border-cyan-100 flex items-center justify-between text-xs sm:text-sm text-cyan-900 font-medium">
            <span className="truncate pr-2">💡 <strong>Teacher Notes:</strong> {item.description}</span>
            <button
              onClick={handleSpeak}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-cyan-800 hover:text-cyan-950 bg-cyan-200/80 px-2 py-1 rounded-lg cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
        )}

        {/* Canva Player / Embed View */}
        <div className="flex-1 w-full bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4">
          {isIframeCode ? (
            <div
              className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            /* Canva Website Launcher Card (avoiding blocked iframe error) */
            <div className="p-6 sm:p-10 text-center max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-cyan-200 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-tr from-cyan-100 to-teal-100 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl mb-4 border-2 border-cyan-300 shadow-inner animate-bounce">
                {item.icon || "🎨"}
              </div>

              <span className="text-xs font-black uppercase tracking-wider text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full mb-2">
                Canva Web Activity
              </span>

              <h4 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
                {item.title}
              </h4>

              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                {item.description ||
                  "Tap the button below to play this interactive Canva game with full animations, sounds, and touch controls!"}
              </p>

              <button
                onClick={handleLaunchExternal}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-base rounded-2xl shadow-lg shadow-cyan-300/40 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Play on Canva 🚀</span>
              </button>

              <p className="text-[11px] text-slate-400 mt-3">
                Opens directly in a new tab so you have full screen space!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-white p-3 sm:p-4 border-t-2 border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Created with Canva</span>
          </div>

          <button
            onClick={handleFinishStar}
            disabled={hasClaimedStar}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition transform active:scale-95 ${
              hasClaimedStar
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white cursor-pointer"
            }`}
          >
            {hasClaimedStar ? (
              <>
                <Star className="w-4 h-4 fill-white" />
                <span>Great Work! Star Earned! ⭐</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>I Finished This! Collect Star ⭐</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

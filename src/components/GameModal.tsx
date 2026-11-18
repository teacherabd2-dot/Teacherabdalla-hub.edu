"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sounds";
import { sanitizeGameHtml } from "@/lib/gameSanitize";
import { Item } from "@/db/schema";
import {
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  Star,
  Sparkles,
  ExternalLink,
  Smartphone,
} from "lucide-react";

interface GameModalProps {
  item: Item | null;
  onClose: () => void;
  onEarnStar: () => void;
}

export function GameModal({ item, onClose, onEarnStar }: GameModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasClaimedStar, setHasClaimedStar] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Hardened game HTML (English voice + Latin glyphs + audio unlock)
  const gameHtml = useMemo(() => sanitizeGameHtml(item?.content ?? ""), [item?.content]);

  // Speech & sound bridge for games running inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "WONDERHUB_SPEAK" && event.data.text) {
        sounds.speakText(event.data.text);
      } else if (event.data.type === "WONDERHUB_SOUND" && event.data.sound) {
        if (event.data.sound === "success" || event.data.sound === "flip") {
          sounds.playPop();
        } else if (event.data.sound === "fanfare") {
          sounds.playFanfare();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Keep fullscreen state in sync when the user presses Esc
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);
    };
  }, []);

  if (!item) return null;

  /** Opens the raw game HTML in its own tab — true 100% screen, no scrolling parent. */
  const openGameInNewTab = () => {
    try {
      sounds.playPop();
      // gameHtml is already a complete hardened document
      const html = gameHtml;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (e) {
      console.error("Open in new tab failed:", e);
    }
  };

  /** Real fullscreen; falls back to a new tab on devices (iPhone) that block it. */
  const toggleFullscreen = () => {
    const el = shellRef.current;
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
        return;
      }

      sounds.playPop();
      const request =
        el?.requestFullscreen ||
        (el as any)?.webkitRequestFullscreen ||
        (el as any)?.msRequestFullscreen;

      if (el && request) {
        const result = request.call(el);
        if (result && typeof result.then === "function") {
          result.then(() => setIsFullscreen(true)).catch(() => openGameInNewTab());
        } else {
          setIsFullscreen(true);
        }
      } else {
        // iPhone / older iPad: browsers block element fullscreen → use a new tab
        openGameInNewTab();
      }
    } catch {
      openGameInNewTab();
    }
  };

  const handleRestart = () => {
    sounds.playPop();
    setIframeKey((prev) => prev + 1);
    setHasClaimedStar(false);
  };

  const handleSpeak = () => {
    const textToSpeak = item.description
      ? `${item.title}. Instructions: ${item.description}`
      : item.title;
    sounds.speakText(textToSpeak);
  };

  const handleFinishStar = () => {
    if (hasClaimedStar) return;
    setHasClaimedStar(true);
    sounds.playFanfare();
    confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    onEarnStar();
    fetch(`/api/items/${item.id}/play`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-3 animate-fadeIn">
      <div
        ref={shellRef}
        className={`bg-white flex flex-col overflow-hidden shadow-2xl border-amber-300 w-full h-full ${
          isFullscreen ? "rounded-none border-0" : "sm:rounded-3xl sm:border-4"
        }`}
      >
        {/* Compact header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 px-2.5 py-2 sm:px-4 sm:py-3 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xl sm:text-2xl shrink-0 p-1 bg-white/20 rounded-lg">
              {item.icon || "🎮"}
            </span>
            <div className="truncate">
              <h3 className="font-black text-sm sm:text-lg truncate text-white leading-tight">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-white/85 truncate hidden sm:block">
                {item.description || "Interactive English Activity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* New tab = true fullscreen game */}
            <button
              onClick={openGameInNewTab}
              title="Open the game full screen"
              className="px-2.5 py-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition active:scale-95 cursor-pointer flex items-center gap-1 text-[11px] font-black"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>

            {/* Element fullscreen */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit full screen" : "Expand game window"}
              className="p-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition active:scale-95 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSpeak}
              title="Read instructions"
              className="hidden sm:block p-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sounds.stopSpeaking();
                onClose();
              }}
              title="Close"
              className="p-2 bg-white/25 hover:bg-red-500 rounded-xl text-white transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game canvas — fills all remaining space */}
        <div className="flex-1 min-h-0 w-full bg-slate-900 relative">
          <iframe
            key={iframeKey}
            srcDoc={gameHtml}
            allow="autoplay; fullscreen; microphone; speaker-selection"
            className="absolute inset-0 w-full h-full border-none bg-white"
            title={item.title}
          />

          {/* Floating expand pill for kids */}
          <button
            onClick={openGameInNewTab}
            className="absolute bottom-3 right-3 z-10 px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-black rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Bigger Screen</span>
          </button>
        </div>

        {/* Compact footer actions */}
        <div className="bg-white px-2.5 py-2 sm:px-4 sm:py-3 border-t-2 border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleRestart}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] sm:text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer sm:hidden shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Expand</span>
          </button>

          <button
            onClick={handleFinishStar}
            disabled={hasClaimedStar}
            className={`flex-1 px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition transform active:scale-95 cursor-pointer ${
              hasClaimedStar
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white"
            }`}
          >
            {hasClaimedStar ? (
              <>
                <Star className="w-4 h-4 fill-white" />
                <span>Star Earned! 🎉</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>I Finished! Collect Star ⭐</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

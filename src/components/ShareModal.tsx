"use client";

import { useState, useEffect } from "react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { sounds } from "@/lib/sounds";
import confetti from "canvas-confetti";
import {
  X,
  Copy,
  Check,
  QrCode,
  Download,
  Printer,
  Sparkles,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  Globe,
  Zap,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  classTitle: string;
  publicUrl?: string;
  teacherPasscode?: string;
  onSavePublicUrl?: (url: string) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  teacherName,
  classTitle,
  publicUrl: initialPublicUrl = "",
  teacherPasscode = "teacher123",
  onSavePublicUrl,
}: ShareModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "grade1" | "grade3">("all");
  const [customPublicUrl, setCustomPublicUrl] = useState(initialPublicUrl);
  const [viewSection, setViewSection] = useState<"links" | "offline" | "deploy">("links");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      if (initialPublicUrl && initialPublicUrl.trim()) {
        setCustomPublicUrl(initialPublicUrl.trim());
      } else {
        const saved =
          localStorage.getItem("wonderhub_public_url") ||
          sessionStorage.getItem("wonderhub_public_url");
        if (saved && saved.trim()) {
          setCustomPublicUrl(saved.trim());
        }
      }
    }
  }, [initialPublicUrl]);

  if (!isOpen) return null;

  const isArenaPreview =
    origin.includes("e2b.app") || origin.includes("arena.ai") || origin.includes("3000-");

  // Determine effective base URL: If customPublicUrl exists and doesn't point to private e2b, use it!
  const hasRealPublicUrl =
    Boolean(customPublicUrl) &&
    !customPublicUrl.includes("e2b.app") &&
    !customPublicUrl.includes("3000-");

  const effectiveBaseUrl = hasRealPublicUrl ? customPublicUrl.trim() : origin;

  const mainLink = effectiveBaseUrl || "https://my-classroom-hub.app";
  const grade1Link = `${mainLink}${mainLink.includes("?") ? "&" : "?"}grade=grade1`;
  const grade3Link = `${mainLink}${mainLink.includes("?") ? "&" : "?"}grade=grade3`;

  const getTargetUrl = () => {
    if (activeTab === "grade1") return grade1Link;
    if (activeTab === "grade3") return grade3Link;
    return mainLink;
  };

  const currentUrl = getTargetUrl();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    sounds.playStarChime();
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleSaveUrl = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wonderhub_public_url", customPublicUrl.trim());
      sessionStorage.setItem("wonderhub_public_url", customPublicUrl.trim());
    }
    if (onSavePublicUrl) {
      onSavePublicUrl(customPublicUrl.trim());
    }
    sounds.playStarChime();
    setCopiedKey("save_url");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1-Click Cloudflare Edge Deploy
  const handlePublishOnline = async () => {
    setIsPublishing(true);
    setPublishStatus(null);
    sounds.playPop();

    let p = teacherPasscode;
    if (!p && typeof window !== "undefined") {
      p =
        localStorage.getItem("wonderhub_teacher_passcode") ||
        sessionStorage.getItem("wonderhub_teacher_passcode") ||
        "teacher123";
    }

    try {
      const res = await fetch(`/api/publish/public?passcode=${encodeURIComponent(p)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-passcode": p,
        },
        body: JSON.stringify({ passcode: p }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.publicUrl) {
        setCustomPublicUrl(data.publicUrl);
        if (typeof window !== "undefined") {
          localStorage.setItem("wonderhub_public_url", data.publicUrl);
          sessionStorage.setItem("wonderhub_public_url", data.publicUrl);
        }
        if (onSavePublicUrl) {
          onSavePublicUrl(data.publicUrl);
        }
        sounds.playFanfare();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
        });
        setPublishStatus("🎉 Published successfully to public Cloudflare edge!");
      } else {
        setPublishStatus(data.error || "Failed to publish. Please check teacher passcode.");
      }
    } catch (e: any) {
      setPublishStatus("Network error while publishing. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadOfflineHtml = async () => {
    setIsDownloading(true);
    sounds.playPop();
    try {
      const res = await fetch("/api/export/offline");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `English_Classroom_${teacherName.replace(/\s+/g, "_")}_Students.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sounds.playFanfare();
      }
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const parentMessage = `🌟 Welcome to ${classTitle}! 🌟
Dear Students and Parents,
Here is our special English classroom website with Gemini phonics games, Canva stories, and fun printable worksheets:
👉 ${currentUrl}

${activeTab === "grade1" ? "🎒 This link opens Grade 1 English activities directly!" : activeTab === "grade3" ? "🚀 This link opens Grade 3 English activities directly!" : "🌟 Explore all English activities for our class!"}

Have fun playing and collecting English stars!
Warmly,
${teacherName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1 bg-white/20 rounded-xl">🔗</span>
            <div>
              <h3 className="font-black text-lg">Share with Students & Parents</h3>
              <p className="text-xs text-white/90">QR codes, live public web links, and offline student classroom files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1.5 shrink-0">
          <button
            onClick={() => {
              setViewSection("links");
              sounds.playPop();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewSection === "links"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Public Link & QR Code</span>
          </button>

          <button
            onClick={() => {
              setViewSection("offline");
              sounds.playPop();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewSection === "offline"
                ? "bg-white text-emerald-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="truncate">Download Student File (.html)</span>
          </button>

          <button
            onClick={() => {
              setViewSection("deploy");
              sounds.playPop();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewSection === "deploy"
                ? "bg-white text-purple-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="truncate">Vercel Guide</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Public Status Banner */}
          {hasRealPublicUrl ? (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                    <span>Public Student Web Link is Active!</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Worldwide Access
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    This link is hosted on Cloudflare edge. Any student on any phone, iPad, or computer can open it directly without needing an Arena login!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handlePublishOnline}
                  disabled={isPublishing}
                  title="Update public page with latest changes"
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? "animate-spin" : ""}`} />
                  <span>Update</span>
                </button>
              </div>
            </div>
          ) : (
            /* Warning if currently using private arena preview */
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <h4 className="font-extrabold text-sm text-amber-950">
                    Your shareable link needs a 1-click public deployment:
                  </h4>
                  <p className="leading-relaxed">
                    The raw <strong>.e2b.app</strong> URL is restricted by Arena for creator editing only. Click the button below to generate a worldwide public link with 1 tap:
                  </p>
                </div>
              </div>

              <button
                onClick={handlePublishOnline}
                disabled={isPublishing}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{isPublishing ? "Publishing to Cloudflare Edge..." : "⚡ Generate Live Public Web Link for Students"}</span>
              </button>
            </div>
          )}

          {publishStatus && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{publishStatus}</span>
            </div>
          )}

          {/* VIEW SECTION 1: LINKS & QR CODE */}
          {viewSection === "links" && (
            <div className="space-y-5">
              {/* Target link selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Choose Link Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("all");
                      sounds.playPop();
                    }}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs transition cursor-pointer ${
                      activeTab === "all"
                        ? "bg-amber-100 border-amber-500 text-amber-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    🌟 All Grades
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("grade1");
                      sounds.playPop();
                    }}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs transition cursor-pointer ${
                      activeTab === "grade1"
                        ? "bg-blue-100 border-blue-500 text-blue-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    🎒 Grade 1 Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("grade3");
                      sounds.playPop();
                    }}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs transition cursor-pointer ${
                      activeTab === "grade3"
                        ? "bg-purple-100 border-purple-500 text-purple-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    🚀 Grade 3 Link
                  </button>
                </div>
              </div>

              {/* Direct Link Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Shareable Web Link
                  </span>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 select-all"
                  />
                  <button
                    onClick={() => handleCopy(currentUrl, "link")}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition active:scale-95 shadow-sm cursor-pointer"
                  >
                    {copiedKey === "link" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
                <div className="shrink-0">
                  <QRCodeDisplay url={currentUrl} size={160} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-900 font-black text-sm mb-1">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Instant QR Code for Tablets</span>
                  </div>
                  <p className="text-xs text-amber-800 mb-3">
                    Students can point their camera on an iPad or phone at this QR code to jump directly into their English activities!
                  </p>
                  <button
                    onClick={handlePrintQR}
                    className="px-3.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-700" />
                    <span>Print QR Classroom Card</span>
                  </button>
                </div>
              </div>

              {/* Ready-to-Send Message */}
              <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    <span>Message for WhatsApp / ClassDojo</span>
                  </span>
                  <button
                    onClick={() => handleCopy(parentMessage, "message")}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedKey === "message" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs text-purple-950 font-sans whitespace-pre-wrap bg-white/80 p-3 rounded-xl border border-purple-200 leading-relaxed">
                  {parentMessage}
                </pre>
              </div>

              {/* Optional Custom Public URL Override */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Custom Web Domain / Vercel URL (Optional)
                  </label>
                  {copiedKey === "save_url" && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://your-custom-site.com"
                    value={customPublicUrl}
                    onChange={(e) => setCustomPublicUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW SECTION 2: OFFLINE CLASSROOM FILE DOWNLOAD */}
          {viewSection === "offline" && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-200 text-emerald-800 flex items-center justify-center text-2xl font-black">
                    📁
                  </div>
                  <div>
                    <h4 className="font-black text-base text-emerald-950">
                      Download Student Offline Classroom File (.html)
                    </h4>
                    <p className="text-xs text-emerald-800">
                      100% Free • Works on any phone, iPad, tablet, or PC without any login or server!
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-900 leading-relaxed">
                  This downloads a single standalone file containing all your English activities, Gemini HTML games, audio pronunciations, and worksheets.
                </p>

                <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside bg-white/60 p-3 rounded-xl border border-emerald-200">
                  <li><strong>Send via WhatsApp or ClassDojo:</strong> Attach this file directly to parents.</li>
                  <li><strong>Upload to Google Drive / OneDrive:</strong> Share the file link with your students.</li>
                  <li><strong>Zero Login or Passcode:</strong> Kids just tap or double-click to play!</li>
                </ul>

                <button
                  onClick={handleDownloadOfflineHtml}
                  disabled={isDownloading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-400/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? "Generating Classroom File..." : "Download Student File (English_Classroom.html)"}</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW SECTION 3: FREE ONLINE DEPLOYMENT GUIDE (teacher-editable site) */}
          {viewSection === "deploy" && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-purple-950 font-black text-sm">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Get your own permanent website (with teacher editing)</span>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  The instant Cloudflare link on the Links tab is a <strong>read-only copy</strong>.
                  To open your classroom <strong>outside Arena</strong> with a real login, database, and the ability to
                  add / edit / delete activities from anywhere, deploy this project to Vercel + Neon (both free):
                </p>

                <a
                  href="/english-classroom-hub-source.zip"
                  download
                  onClick={() => sounds.playPop()}
                  className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 no-underline cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Project ZIP (english-classroom-hub-source.zip)</span>
                </a>

                <div className="p-2.5 bg-emerald-100 rounded-xl text-[11px] font-black text-emerald-900 text-center">
                  ✅ No GitHub and no commands needed — only your web browser
                </div>

                <div className="p-2.5 bg-sky-100 rounded-xl text-[11px] font-bold text-sky-950 leading-relaxed">
                  ℹ️ <strong>No index.html inside the ZIP?</strong> That is correct — this is a Next.js project.
                  Its home page is <code className="bg-white px-1 rounded font-mono">src/app/page.tsx</code>, and Vercel
                  generates the real page for you. Drag the ZIP exactly as downloaded (do not unzip it).
                  The ZIP also contains <strong>START-HERE.txt</strong> explaining this in plain language.
                </div>

                <ol className="text-xs text-purple-900 space-y-2.5 list-decimal list-inside bg-white/80 p-3.5 rounded-xl border border-purple-200 leading-relaxed">
                  <li>
                    <strong>Free database:</strong> open <strong>neon.com</strong> → Sign up with Google → New Project
                    → copy the long <code className="bg-purple-50 px-1 rounded font-mono">postgresql://…?sslmode=require</code> string.
                  </li>
                  <li>
                    <strong>Free website:</strong> open <strong>vercel.com/drop</strong> → sign up →{" "}
                    <strong>drag the ZIP you just downloaded onto the page</strong> → name it → Deploy.
                  </li>
                  <li>
                    <strong>Connect them:</strong> in Vercel open your project → Settings → Environment Variables →
                    add <code className="bg-purple-50 px-1 rounded font-mono font-bold">DATABASE_URL</code> with that Neon string → Save →
                    Deployments → ⋯ → <strong>Redeploy</strong>.
                  </li>
                  <li>
                    <strong>Create the tables (one click):</strong> open{" "}
                    <code className="bg-purple-50 px-1 rounded font-mono">https://your-site.vercel.app/api/setup</code>
                  </li>
                  <li>
                    <strong>Sign in as teacher</strong> with <code className="bg-purple-50 px-1 rounded font-mono font-bold">teacher123</code>, then change your passcode in Settings.
                  </li>
                  <li>
                    <strong>Come back here</strong> and paste your new Vercel address into <em>Custom Web Domain</em> on the Links tab so QR codes point to it.
                  </li>
                </ol>

                <div className="p-3 bg-amber-100 rounded-xl text-[11px] font-bold text-amber-900 leading-relaxed">
                  📄 The ZIP contains <strong>DEPLOY-NO-GITHUB.md</strong> — the same steps with every button named,
                  plus a troubleshooting table. <strong>README-DEPLOY.md</strong> has the advanced options.
                </div>

                <div className="p-3 bg-purple-100/70 rounded-xl flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>Prefer a read-only link you can send right now?</span>
                  <button
                    onClick={() => setViewSection("links")}
                    className="text-purple-700 hover:text-purple-950 underline font-black cursor-pointer"
                  >
                    Go to Links Tab ➡️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

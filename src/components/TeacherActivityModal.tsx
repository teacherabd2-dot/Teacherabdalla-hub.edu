"use client";

import { useState, useEffect } from "react";
import { Item } from "@/db/schema";
import { sounds } from "@/lib/sounds";
import {
  X,
  Code,
  Palette,
  FileText,
  Link2,
  Video,
  Upload,
  Sparkles,
  Eye,
  Check,
  AlertCircle,
} from "lucide-react";

interface TeacherActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: Item | null;
  teacherPasscode: string;
}

const ICONS = ["🎮", "🫧", "🦁", "🦖", "🎨", "🎡", "📝", "📘", "📊", "🚀", "🐬", "🌟", "🧩", "🧮", "🐾", "⭐", "🏆"];

const BADGES = [
  "Gemini Game",
  "Canva Story",
  "Canva Game",
  "PDF Worksheet",
  "Word Doc",
  "PowerPoint",
  "Phonics Star",
  "Spelling Quest",
  "Reading Story",
  "Grammar Fun",
];

export function TeacherActivityModal({
  isOpen,
  onClose,
  onSaved,
  editItem,
  teacherPasscode,
}: TeacherActivityModalProps) {
  const [itemType, setItemType] = useState<string>("html_game");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("grade1");
  const [category, setCategory] = useState("phonics");
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileData, setFileData] = useState("");
  const [icon, setIcon] = useState("🎮");
  const [badge, setBadge] = useState("Gemini Game");
  const [isPinned, setIsPinned] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setItemType(editItem.itemType);
      setTitle(editItem.title);
      setDescription(editItem.description || "");
      setGrade(editItem.grade);
      setCategory(editItem.category);
      setContent(editItem.content || "");
      setFileType(editItem.fileType || "pdf");
      setFileName(editItem.fileName || "");
      setFileSize(editItem.fileSize || "");
      setFileData(editItem.fileData || "");
      setIcon(editItem.icon || "🎮");
      setBadge(editItem.badge || "");
      setIsPinned(Boolean(editItem.isPinned));
    } else {
      // Reset form
      setItemType("html_game");
      setTitle("");
      setDescription("");
      setGrade("grade1");
      setCategory("phonics");
      setContent("");
      setFileType("pdf");
      setFileName("");
      setFileSize("");
      setFileData("");
      setIcon("🎮");
      setBadge("Gemini Game");
      setIsPinned(false);
    }
    setError(null);
    setPreviewTab(false);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const getEffectivePasscode = () => {
    let p = teacherPasscode;
    if (!p && typeof window !== "undefined") {
      p =
        localStorage.getItem("wonderhub_teacher_passcode") ||
        sessionStorage.getItem("wonderhub_teacher_passcode") ||
        "";
    }
    return p.trim() || "teacher123";
  };

  // Handle uploading PDF, DOCX, PPTX
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const effectivePasscode = getEffectivePasscode();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("passcode", effectivePasscode);
    formData.append("teacherPasscode", effectivePasscode);

    try {
      const res = await fetch(`/api/upload?passcode=${encodeURIComponent(effectivePasscode)}`, {
        method: "POST",
        headers: {
          "x-teacher-passcode": effectivePasscode,
          Authorization: `Bearer ${effectivePasscode}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFileName(data.fileName);
        setFileType(data.fileType);
        setFileSize(data.fileSize);
        setFileData(data.fileData);
        if (!title) {
          setTitle(data.fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        }
        sounds.playPop();
      } else {
        setError(data.error || "File upload failed.");
      }
    } catch {
      setError("Failed to upload file. Please check size.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide an activity title!");
      return;
    }

    setSaving(true);
    setError(null);

    const effectivePasscode = getEffectivePasscode();
    const payload = {
      title: title.trim(),
      description: description.trim(),
      itemType,
      category,
      grade,
      content,
      fileType: itemType === "file" ? fileType : null,
      fileName: itemType === "file" ? fileName : null,
      fileSize: itemType === "file" ? fileSize : null,
      fileData: itemType === "file" ? fileData : null,
      icon,
      badge,
      isPinned,
      passcode: effectivePasscode,
      teacherPasscode: effectivePasscode,
    };

    try {
      const url = editItem ? `/api/items/${editItem.id}` : "/api/items";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(`${url}?passcode=${encodeURIComponent(effectivePasscode)}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-teacher-passcode": effectivePasscode,
          Authorization: `Bearer ${effectivePasscode}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        sounds.playFanfare();
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to save activity.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1 bg-white/20 rounded-xl">👩‍🏫</span>
            <div>
              <h3 className="font-black text-lg">
                {editItem ? "Edit Activity" : "Add New Learning Activity"}
              </h3>
              <p className="text-xs text-white/90">
                Share Gemini games, Canva designs, worksheets, or links with your students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Type Picker Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select What You Are Adding
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "html_game", label: "Gemini Game", icon: Code, desc: "Paste HTML/JS" },
                { id: "canva_embed", label: "Canva Project", icon: Palette, desc: "Embed / Link" },
                { id: "file", label: "Worksheet / Doc", icon: FileText, desc: "PDF, Word, PPTX" },
                { id: "link", label: "Web Link", icon: Link2, desc: "Safe Website" },
              ].map((t) => {
                const IconComponent = t.icon;
                const active = itemType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setItemType(t.id);
                      if (t.id === "html_game") {
                        setBadge("Gemini Game");
                        setIcon("🎮");
                      } else if (t.id === "canva_embed") {
                        setBadge("Canva Story");
                        setIcon("🎨");
                      } else if (t.id === "file") {
                        setBadge("Worksheet");
                        setIcon("📄");
                      } else {
                        setBadge("Web Link");
                        setIcon("🔗");
                      }
                      sounds.playPop();
                    }}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition ${
                      active
                        ? "bg-amber-100 border-amber-500 shadow-md scale-102"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 mb-1 ${active ? "text-amber-700" : "text-slate-500"}`}
                    />
                    <span className="font-extrabold text-xs text-slate-800">{t.label}</span>
                    <span className="text-[10px] text-slate-400">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Grade & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Activity Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Magic Math Bubble Pop or Grade 3 Safari Spelling"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Grade 🎒
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 bg-white focus:border-amber-400 focus:outline-none"
              >
                <option value="grade1">Grade 1 (Ages 6-7)</option>
                <option value="grade3">Grade 3 (Ages 8-9)</option>
                <option value="primary">All Primary Grades</option>
                <option value="all">Every Student</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                English Category 📚
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 bg-white focus:border-amber-400 focus:outline-none"
              >
                <option value="phonics">🔤 Phonics & Letters</option>
                <option value="reading">📖 Reading & Stories</option>
                <option value="spelling">✍️ Spelling & Vocabulary</option>
                <option value="grammar">📝 Grammar & Writing</option>
              </select>
            </div>
          </div>

          {/* Description / Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Kid-Friendly Instructions / Clues (Can be read out loud to kids!)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Pop the bubbles that add up to 5! Click two numbers to match."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-800 focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          {/* TYPE-SPECIFIC INPUTS */}

          {/* 1. Gemini HTML Game Code */}
          {itemType === "html_game" && (
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-amber-600" />
                  <span>Gemini HTML Mini Game Code</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab(false)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      !previewTab ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Code Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition ${
                      previewTab ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {!previewTab ? (
                <div>
                  <textarea
                    rows={8}
                    required
                    placeholder="Paste your Gemini generated HTML game code here (including <!DOCTYPE html>, <html>, <script>, <style>)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full font-mono text-xs p-3 bg-slate-900 text-green-400 rounded-xl border border-slate-700 focus:outline-none resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 Tip: Ask Gemini &quot;Create a single-file kid HTML game for Grade 1 math&quot; and paste the complete HTML right here!
                  </p>
                </div>
              ) : (
                <div className="w-full h-64 bg-white rounded-xl border-2 border-slate-300 overflow-hidden">
                  <iframe
                    srcDoc={content || "<h3 style='padding:20px;text-align:center;'>Paste HTML code to preview here!</h3>"}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full h-full border-none"
                    title="Preview"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. Canva Embed / Link */}
          {itemType === "canva_embed" && (
            <div className="p-4 bg-cyan-50 rounded-2xl border-2 border-cyan-200 space-y-3">
              <label className="block text-xs font-bold text-cyan-900 uppercase tracking-wider">
                Canva Share Link or Embed Code 🎨
              </label>
              <input
                type="text"
                required
                placeholder="https://www.canva.com/design/... or <iframe...>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-cyan-300 font-semibold text-slate-800 bg-white focus:outline-none"
              />
              <p className="text-[11px] text-cyan-800">
                💡 In Canva, click <strong>Share ➡️ More ➡️ Embed</strong> (or copy the view-only link) and paste here!
              </p>
            </div>
          )}

          {/* 3. Document / File (PDF, DOCX, PPTX) */}
          {itemType === "file" && (
            <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Document Type & Upload
                </label>
                <div className="flex gap-1.5">
                  {(["pdf", "docx", "pptx"] as const).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => {
                        setFileType(ft);
                        setBadge(ft === "pdf" ? "PDF Worksheet" : ft === "docx" ? "Word Doc" : "PowerPoint");
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase transition ${
                        fileType === ft
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-emerald-300 bg-white rounded-2xl p-4 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-emerald-900">
                      {uploading ? "Uploading file..." : "Click to select a file from your computer"}
                    </span>
                    <p className="text-xs text-slate-500">
                      Supports PDF worksheets, Word docs (.docx), PowerPoint slides (.pptx)
                    </p>
                  </div>
                </label>
              </div>

              {fileName && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="truncate pr-2">📁 Selected: {fileName} ({fileSize})</span>
                  <span className="text-emerald-600 shrink-0 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Ready
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                  Or Paste Cloud Link (Google Drive / OneDrive / Dropbox):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-medium text-slate-800 bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. Web Link */}
          {itemType === "link" && (
            <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200 space-y-3">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Website or Online Game URL 🔗
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-indigo-300 font-semibold text-slate-800 bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Icon & Badge Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Pick Card Icon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition ${
                      icon === ic ? "bg-amber-300 scale-110 shadow-sm" : "hover:bg-slate-200"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Badge Label
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Gemini Game, Canva Story"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-800 focus:border-amber-400 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBadge(b)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pin to top */}
          <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
            />
            <span className="font-extrabold text-sm text-amber-900">
              📌 Pin this activity to the top of the classroom page
            </span>
          </label>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-300/40 transition transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Saving Activity...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{editItem ? "Update Activity" : "Add Activity to Hub"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

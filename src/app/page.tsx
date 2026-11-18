"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Item } from "@/db/schema";
import { ClassroomHeader } from "@/components/ClassroomHeader";
import { FilterBar } from "@/components/FilterBar";
import { ActivityCard } from "@/components/ActivityCard";
import { GameModal } from "@/components/GameModal";
import { CanvaModal } from "@/components/CanvaModal";
import { DocumentModal } from "@/components/DocumentModal";
import { TeacherAuthModal } from "@/components/TeacherAuthModal";
import { TeacherActivityModal } from "@/components/TeacherActivityModal";
import { TeacherSettingsModal } from "@/components/TeacherSettingsModal";
import { ShareModal } from "@/components/ShareModal";
import { StudentBadgeModal } from "@/components/StudentBadgeModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { sounds } from "@/lib/sounds";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Plus,
  BookOpen,
  Gamepad2,
  FileCheck,
  Star,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

function ClassroomContent() {
  const searchParams = useSearchParams();

  // Classroom & Items state
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [settings, setSettings] = useState({
    id: 1,
    teacherName: "Ms. Sarah's Class",
    classTitle: "Grade 1 & Grade 3 English Wonderland",
    welcomeMessage:
      "Welcome English super learners! Pick your grade, play phonics & reading games, explore stories, and collect shiny stars! 🌟",
    avatarEmoji: "👩‍🏫",
    theme: "playful",
    announcement: "✨ Welcome to our English Hub! Try the Phonics Pop games, Canva stories, and reading quests!",
    publicUrl: "",
  });

  // Download standalone offline classroom file
  const handleDownloadOfflineHtml = async () => {
    sounds.playPop();
    try {
      const res = await fetch("/api/export/offline");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `English_Classroom_${settings.teacherName.replace(/[^a-zA-Z0-9]/g, "_")}_Students.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sounds.playFanfare();
      }
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const handleSavePublicUrl = async (url: string) => {
    setSettings((prev) => ({ ...prev, publicUrl: url }));
    try {
      const passcode = getStoredPasscode();
      await fetch(`/api/settings?passcode=${encodeURIComponent(passcode)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-passcode": passcode,
        },
        body: JSON.stringify({ publicUrl: url, passcode }),
      });
    } catch {}
  };

  // Filter state
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Teacher Authentication state
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherPasscode, setTeacherPasscode] = useState("");

  // Student Profile state (persisted locally)
  const [studentName, setStudentName] = useState("Little Explorer");
  const [studentAvatar, setStudentAvatar] = useState("🦁");
  const [studentStars, setStudentStars] = useState(0);

  // Active Modals state
  const [activeGameItem, setActiveGameItem] = useState<Item | null>(null);
  const [activeCanvaItem, setActiveCanvaItem] = useState<Item | null>(null);
  const [activeDocItem, setActiveDocItem] = useState<Item | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStudentBoardOpen, setIsStudentBoardOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize from searchParams (e.g. ?grade=grade1 or ?grade=grade3)
  useEffect(() => {
    const gradeParam = searchParams.get("grade");
    if (gradeParam && ["grade1", "grade3", "primary", "all"].includes(gradeParam)) {
      setSelectedGrade(gradeParam);
    }
  }, [searchParams]);

  // Helper to get active teacher passcode
  const getStoredPasscode = useCallback(() => {
    if (teacherPasscode && teacherPasscode.trim()) {
      return teacherPasscode.trim();
    }
    if (typeof window !== "undefined") {
      try {
        const saved =
          localStorage.getItem("wonderhub_teacher_passcode") ||
          sessionStorage.getItem("wonderhub_teacher_passcode");
        if (saved && saved.trim()) return saved.trim();
      } catch {}
    }
    return "teacher123";
  }, [teacherPasscode]);

  // Load student profile & teacher passcode from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("wonderhub_student_name");
      const savedAvatar = localStorage.getItem("wonderhub_student_avatar");
      const savedStars = localStorage.getItem("wonderhub_student_stars");
      const savedPasscode =
        localStorage.getItem("wonderhub_teacher_passcode") ||
        sessionStorage.getItem("wonderhub_teacher_passcode");

      if (savedName) setStudentName(savedName);
      if (savedAvatar) setStudentAvatar(savedAvatar);
      if (savedStars) setStudentStars(parseInt(savedStars, 10) || 0);

      if (savedPasscode && savedPasscode.trim()) {
        setTeacherPasscode(savedPasscode.trim());
        setIsTeacher(true);
      }
    } catch {}
  }, []);

  // Fetch Items & Settings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const passcode = getStoredPasscode();
      const headers: Record<string, string> = {};
      if (passcode) {
        headers["x-teacher-passcode"] = passcode;
      }

      const [itemsRes, settingsRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/settings", { headers }),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items || []);
        setNeedsSetup(Boolean(data.needsSetup));
      } else {
        const data = await itemsRes.json().catch(() => ({}));
        if (data?.needsSetup) setNeedsSetup(true);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) setSettings(data.settings);
        if (data.isTeacher) setIsTeacher(true);
        if (data.needsSetup) setNeedsSetup(true);
      }
    } catch (e) {
      console.error("Failed to fetch classroom data:", e);
    } finally {
      setLoading(false);
    }
  }, [getStoredPasscode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle student earning a star
  const handleEarnStar = () => {
    const nextStars = studentStars + 1;
    setStudentStars(nextStars);
    try {
      localStorage.setItem("wonderhub_student_stars", nextStars.toString());
    } catch {}
  };

  // Update student profile
  const handleUpdateStudentProfile = (name: string, avatar: string) => {
    setStudentName(name);
    setStudentAvatar(avatar);
    try {
      localStorage.setItem("wonderhub_student_name", name);
      localStorage.setItem("wonderhub_student_avatar", avatar);
    } catch {}
  };

  // Teacher Login
  const handleTeacherLoginSuccess = (passcode: string) => {
    const cleaned = passcode.trim();
    setTeacherPasscode(cleaned);
    setIsTeacher(true);
    try {
      localStorage.setItem("wonderhub_teacher_passcode", cleaned);
      sessionStorage.setItem("wonderhub_teacher_passcode", cleaned);
    } catch {}
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
    });
  };

  // Teacher Sign Out / Lock
  const handleTeacherSignOut = async () => {
    try {
      await fetch("/api/auth/verify", { method: "DELETE" });
    } catch {}
    setTeacherPasscode("");
    setIsTeacher(false);
    try {
      localStorage.removeItem("wonderhub_teacher_passcode");
      sessionStorage.removeItem("wonderhub_teacher_passcode");
    } catch {}
    sounds.playPop();
  };

  // Handler for updated settings and passcode
  const handleTeacherSettingsUpdate = (newSettings: any, newPasscode?: string) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (newPasscode && newPasscode.trim()) {
      const cleaned = newPasscode.trim();
      setTeacherPasscode(cleaned);
      try {
        localStorage.setItem("wonderhub_teacher_passcode", cleaned);
        sessionStorage.setItem("wonderhub_teacher_passcode", cleaned);
      } catch {}
    }
  };

  // Open an activity based on type
  const handleOpenItem = (item: Item) => {
    sounds.playPop();
    if (item.itemType === "html_game") {
      setActiveGameItem(item);
    } else if (item.itemType === "canva_embed") {
      if (item.content && !item.content.trim().startsWith("<iframe")) {
        window.open(item.content, "_blank", "noopener,noreferrer");
      } else {
        setActiveCanvaItem(item);
      }
    } else if (item.itemType === "file") {
      setActiveDocItem(item);
    } else if (item.itemType === "link") {
      if (item.content) {
        window.open(item.content, "_blank", "noopener,noreferrer");
      }
    }
  };

  // Delete an activity
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const effectivePasscode = getStoredPasscode();
      const res = await fetch(`/api/items/${itemToDelete.id}?passcode=${encodeURIComponent(effectivePasscode)}`, {
        method: "DELETE",
        headers: {
          "x-teacher-passcode": effectivePasscode,
          Authorization: `Bearer ${effectivePasscode}`,
        },
      });

      if (res.ok) {
        sounds.playPop();
        setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
        setItemToDelete(null);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Apply filters
  const filteredItems = items.filter((item) => {
    if (selectedGrade !== "all") {
      if (
        item.grade !== selectedGrade &&
        item.grade !== "all" &&
        !(selectedGrade === "grade1" && item.grade === "primary") &&
        !(selectedGrade === "grade3" && item.grade === "primary")
      ) {
        return false;
      }
    }

    if (selectedCategory !== "all" && item.category !== selectedCategory) {
      return false;
    }

    if (selectedType !== "all" && item.itemType !== selectedType) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchBadge) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between">
      <div>
        {/* Header */}
        <ClassroomHeader
          teacherName={settings.teacherName}
          classTitle={settings.classTitle}
          welcomeMessage={settings.welcomeMessage}
          avatarEmoji={settings.avatarEmoji}
          announcement={settings.announcement}
          publicUrl={settings.publicUrl}
          isTeacher={isTeacher}
          studentName={studentName}
          studentAvatar={studentAvatar}
          studentStars={studentStars}
          onOpenTeacherAuth={() => setIsAuthModalOpen(true)}
          onOpenTeacherAdd={() => {
            setEditingItem(null);
            setIsActivityModalOpen(true);
          }}
          onOpenTeacherSettings={() => setIsSettingsModalOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenStudentBoard={() => setIsStudentBoardOpen(true)}
          onLockTeacherMode={handleTeacherSignOut}
          onDownloadOffline={handleDownloadOfflineHtml}
        />

        {/* Main Content Area */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Filter Bar */}
          <FilterBar
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalItems={filteredItems.length}
          />

          {/* Database not connected yet — first-run banner */}
          {needsSetup && (
            <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚙️</span>
                <div className="flex-1">
                  <h3 className="font-black text-amber-950 text-base">
                    One quick step: connect your classroom database
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
                    This deployment can&apos;t reach a database yet. Add the{" "}
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">DATABASE_URL</code>{" "}
                    environment variable in your hosting dashboard, redeploy, then open the setup page below once.
                  </p>
                  <a
                    href="/api/setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-sm transition"
                  >
                    Open setup page →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Quick Category Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div
              onClick={() => {
                setSelectedGrade("grade1");
                sounds.playPop();
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition transform hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎒</span>
                <div>
                  <h4 className="font-black text-sm text-blue-900">Grade 1 English Hub</h4>
                  <p className="text-xs text-blue-700">Phonics, sight words & handwriting</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedGrade("grade3");
                sounds.playPop();
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition transform hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚀</span>
                <div>
                  <h4 className="font-black text-sm text-purple-900">Grade 3 English Quests</h4>
                  <p className="text-xs text-purple-700">Spelling safari, reading & grammar</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedType("file");
                sounds.playPop();
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 cursor-pointer hover:border-emerald-400 transition transform hover:-translate-y-0.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📝</span>
                <div>
                  <h4 className="font-black text-sm text-emerald-900">Printables & Slides</h4>
                  <p className="text-xs text-emerald-700">PDF worksheets, Word stories & grammar decks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activities Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-3xl animate-bounce mb-3">
                ⭐
              </div>
              <h3 className="font-black text-lg text-slate-700">Loading Fun Activities...</h3>
              <p className="text-xs text-slate-400 mt-1">Getting your games and worksheets ready!</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-sm max-w-md mx-auto">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="font-black text-lg text-slate-800">No activities found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Try switching the grade or clearing your search filters to see more fun activities!
              </p>
              <button
                onClick={() => {
                  setSelectedGrade("all");
                  setSelectedCategory("all");
                  setSelectedType("all");
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl transition"
              >
                Reset Filters 🔄
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  isTeacher={isTeacher}
                  onOpen={handleOpenItem}
                  onEdit={(it) => {
                    setEditingItem(it);
                    setIsActivityModalOpen(true);
                  }}
                  onDelete={(it) => setItemToDelete(it)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Add Activity Button for Teacher */}
      {isTeacher && (
        <button
          onClick={() => {
            setEditingItem(null);
            setIsActivityModalOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm rounded-full shadow-2xl flex items-center gap-2 transition transform active:scale-95 cursor-pointer border-3 border-white animate-bounce"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Add New Activity</span>
        </button>
      )}

      {/* Classroom Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌟</span>
            <span className="font-bold text-slate-700">
              {settings.classTitle}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-amber-600 transition"
            >
              Share Class Link 🔗
            </button>
            <span>•</span>
            <button
              onClick={() => setIsStudentBoardOpen(true)}
              className="hover:text-amber-600 transition"
            >
              My Stickers ⭐
            </button>
            <span>•</span>
            {isTeacher ? (
              <button
                onClick={handleTeacherSignOut}
                className="text-red-500 hover:text-red-700 transition"
              >
                Exit Teacher Mode
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 transition"
              >
                Teacher Login 🔒
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Gemini HTML Game Runner */}
      <GameModal
        item={activeGameItem}
        onClose={() => setActiveGameItem(null)}
        onEarnStar={handleEarnStar}
      />

      {/* 2. Canva Embed / Link Modal */}
      <CanvaModal
        item={activeCanvaItem}
        onClose={() => setActiveCanvaItem(null)}
        onEarnStar={handleEarnStar}
      />

      {/* 3. Document Modal (PDF, Word, PPTX) */}
      <DocumentModal
        item={activeDocItem}
        onClose={() => setActiveDocItem(null)}
        onEarnStar={handleEarnStar}
      />

      {/* 4. Teacher Sign-in Modal */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
      />

      {/* 5. Teacher Add/Edit Activity Modal */}
      <TeacherActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSaved={fetchData}
        editItem={editingItem}
        teacherPasscode={getStoredPasscode()}
      />

      {/* 6. Teacher Settings Modal */}
      <TeacherSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        teacherPasscode={getStoredPasscode()}
        onUpdate={handleTeacherSettingsUpdate}
        onSignOut={handleTeacherSignOut}
      />

      {/* 7. Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        teacherName={settings.teacherName}
        classTitle={settings.classTitle}
        publicUrl={settings.publicUrl}
        teacherPasscode={getStoredPasscode()}
        onSavePublicUrl={handleSavePublicUrl}
      />

      {/* 8. Student Badge Modal */}
      <StudentBadgeModal
        isOpen={isStudentBoardOpen}
        onClose={() => setIsStudentBoardOpen(false)}
        stars={studentStars}
        studentName={studentName}
        avatar={studentAvatar}
        onUpdateProfile={handleUpdateStudentProfile}
      />

      {/* 9. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteItem}
        loading={isDeleting}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-amber-200 rounded-full flex items-center justify-center text-4xl animate-bounce mb-3">
              🎒
            </div>
            <h2 className="text-xl font-black text-slate-800">Entering Classroom...</h2>
          </div>
        </div>
      }
    >
      <ClassroomContent />
    </Suspense>
  );
}

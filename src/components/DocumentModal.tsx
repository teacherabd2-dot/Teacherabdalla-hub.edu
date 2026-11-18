"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { sounds } from "@/lib/sounds";
import { Item } from "@/db/schema";
import {
  X,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Volume2,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface DocumentModalProps {
  item: Item | null;
  onClose: () => void;
  onEarnStar: () => void;
}

export function DocumentModal({ item, onClose, onEarnStar }: DocumentModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasClaimedStar, setHasClaimedStar] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!item) return null;

  const fileType = item.fileType || "pdf";

  const handleSpeak = (text?: string) => {
    const toSpeak = text || `${item.title}. ${item.description || ""}`;
    sounds.speakText(toSpeak);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    sounds.playPop();
    if (item.fileData && item.fileData.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = item.fileData;
      a.download = item.fileName || `${item.title}.${fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([item.fileData || item.description || item.title], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.fileName || `${item.title}.${fileType === "docx" ? "txt" : fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFinishStar = () => {
    if (hasClaimedStar) return;
    setHasClaimedStar(true);
    sounds.playFanfare();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.5 },
    });
    onEarnStar();
    fetch(`/api/items/${item.id}/play`, { method: "POST" }).catch(() => {});
  };

  // English Grammar Slides for PPTX
  const pptxSlides = [
    {
      title: "English Grammar Safari: Parts of Speech! 📚",
      content: "Welcome word detectives! Every English word belongs to a special family that helps us build awesome sentences. Let's explore together!",
      emoji: "🦁 📖 ✍️ ✨",
      points: [
        "Words have special jobs in every sentence.",
        "Nouns name things, Verbs show action, and Adjectives describe!",
        "Let's master our English grammar powers!",
      ],
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "1. Super Nouns (Naming Words) 🎒",
      content: "A Noun is a person, place, thing, or animal! If you can touch it or visit it, it's a noun.",
      emoji: "👩‍🏫 🏫 🚀 🐱",
      points: [
        "Person: Teacher, astronaut, sister, friend.",
        "Place: Classroom, playground, library, moon.",
        "Thing: Book, pencil, computer, star.",
        "Animal: Lion, dolphin, puppy, eagle.",
      ],
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "2. Action Verbs (Doing Words) ⚡",
      content: "A Verb is an action word! It tells what someone or something can DO.",
      emoji: "🏃 🏊 📖 🚀",
      points: [
        "Physical actions: Jump, run, write, read, climb.",
        "Mind actions: Think, imagine, remember, love.",
        "Example: 'The brave astronaut BLASTS into space!' (blasts is the verb).",
      ],
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "3. Awesome Adjectives (Describing Words) 🎨",
      content: "An Adjective describes a noun! It tells us what kind, how many, or what color.",
      emoji: "⭐ 🦁 🍦 🏰",
      points: [
        "Color & Shape: Golden star, round planet, blue ocean.",
        "Size & Sound: Giant castle, quiet library, tiny ant.",
        "Feeling: Brave explorer, happy student, cheerful day.",
      ],
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "4. Punctuation Heroes! ✍️",
      content: "Punctuation marks give your sentences rhythm and clear meaning!",
      emoji: "🎯 ❓ ❗ ✨",
      points: [
        "Capital letter: Always begin every sentence with a big capital letter.",
        "Full stop (.): Tells the reader to take a breath at the end of a statement.",
        "Question mark (?): Asks something curious.",
        "Exclamation mark (!): Shows excitement or surprise!",
      ],
      color: "from-pink-500 to-rose-600",
    },
    {
      title: "Grammar Master Quiz Challenge! 🏆",
      content: "Fantastic job reviewing parts of speech! Can you spot:",
      emoji: "⭐ 🎯 👑",
      points: [
        "In 'The clever fox jumps high', which word is the Adjective? (clever!)",
        "Which word is the Verb? (jumps!)",
        "Tap 'Collect Star' below to claim your English star reward!",
      ],
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white flex flex-col shadow-2xl border-4 border-emerald-400 overflow-hidden w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-3 sm:p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-3xl shrink-0 p-1 bg-white/20 rounded-xl">
              {fileType === "pdf" ? "📄" : fileType === "docx" ? "📘" : "📊"}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl truncate text-white">{item.title}</h3>
                <span className="bg-white/25 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase">
                  {fileType.toUpperCase()} {fileType === "pptx" ? "Slides" : "Worksheet"}
                </span>
              </div>
              <p className="text-xs text-white/90 truncate">
                {item.fileName || item.description || "English Classroom Document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSpeak()}
              title="Read to me"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <button
              onClick={handlePrint}
              title="Print Document"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownload}
              title="Download File"
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition active:scale-95 flex items-center gap-1 text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={() => {
                sounds.stopSpeaking();
                onClose();
              }}
              className="p-2 bg-white/20 hover:bg-red-500 rounded-xl text-white transition active:scale-95 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        {item.description && (
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs sm:text-sm text-emerald-900 font-medium">
            <span className="truncate pr-2">💡 <strong>Teacher Notes:</strong> {item.description}</span>
            <button
              onClick={() => handleSpeak()}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-200/80 px-2 py-1 rounded-lg"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 w-full bg-slate-50 overflow-y-auto p-4 sm:p-6">
          {/* PPTX Interactive Presentation Deck */}
          {fileType === "pptx" ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <div
                className={`w-full min-h-[340px] rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br ${pptxSlides[currentSlide].color} shadow-xl flex flex-col justify-between transition-all duration-300 relative`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl">{pptxSlides[currentSlide].emoji}</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-extrabold uppercase">
                      Slide {currentSlide + 1} of {pptxSlides.length}
                    </span>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-black mb-3 drop-shadow-sm">
                    {pptxSlides[currentSlide].title}
                  </h4>
                  <p className="text-base sm:text-lg font-medium text-white/95 mb-4 leading-relaxed">
                    {pptxSlides[currentSlide].content}
                  </p>
                  <ul className="space-y-2 bg-white/15 p-4 rounded-2xl backdrop-blur-sm">
                    {pptxSlides[currentSlide].points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm sm:text-base font-semibold">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-yellow-300" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() =>
                      handleSpeak(
                        `${pptxSlides[currentSlide].title}. ${pptxSlides[currentSlide].content}. ${pptxSlides[currentSlide].points.join(". ")}`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Read this slide</span>
                  </button>
                </div>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between w-full mt-4 px-2">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlide((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentSlide === 0}
                  className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-40 hover:bg-slate-100 transition shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="flex gap-1.5">
                  {pptxSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-3.5 h-3.5 rounded-full transition ${
                        currentSlide === idx ? "bg-emerald-600 scale-125" : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    sounds.playPop();
                    setCurrentSlide((prev) => Math.min(pptxSlides.length - 1, prev + 1));
                  }}
                  disabled={currentSlide === pptxSlides.length - 1}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-40 hover:bg-emerald-700 transition shadow-sm"
                >
                  <span>Next Slide</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : fileType === "docx" ? (
            /* Word Document Worksheet Viewer */
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200">
              <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    English Reading Quest - Grade 3
                  </span>
                  <h4 className="text-2xl font-black text-slate-800 mt-2">
                    The Brave Little Astronaut 🚀
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Classroom Story & Comprehension • English Subject</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                  🚀
                </div>
              </div>

              {/* Story Text */}
              <div className="prose text-slate-700 leading-relaxed mb-6 font-medium text-base bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <p className="mb-3">
                  Once upon a time, a curious kid named Leo built a cardboard rocket in his backyard. With two
                  flashlight thrusters and a silver colander helmet, he stared at the glowing moon.
                </p>
                <p>
                  Suddenly, whoosh! The backyard sparkled with starlight, and a friendly robot named Beep appeared.
                  &quot;Greetings, Explorer Leo! We need someone with sharp English reading and spelling skills to help
                  repair our constellation beacon! Will you journey with us?&quot; Leo smiled bravely and cheered, &quot;Blast off!&quot;
                </p>
              </div>

              {/* Interactive Comprehension Questions */}
              <div className="space-y-4">
                <h5 className="font-extrabold text-sm uppercase text-slate-600 tracking-wider">
                  Reading Comprehension Questions:
                </h5>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm text-slate-800 mb-2">
                    1. What did Leo build in his backyard?
                  </p>
                  <div className="space-y-1.5 text-sm text-slate-700">
                    {["A wooden submarine", "A cardboard rocket with flashlight thrusters", "A treehouse fort"].map(
                      (opt, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="q1"
                            checked={answers["q1"] === opt}
                            onChange={() => {
                              sounds.playPop();
                              setAnswers({ ...answers, q1: opt });
                            }}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{opt}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-sm text-slate-800 mb-2">
                    2. What was the friendly robot&apos;s name?
                  </p>
                  <input
                    type="text"
                    placeholder="Type the robot's name here..."
                    value={answers["q2"] || ""}
                    onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* PDF Worksheet Viewer */
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-slate-200">
              {item.fileData && item.fileData.startsWith("data:application/pdf") ? (
                <iframe src={item.fileData} className="w-full h-[500px] rounded-2xl border" title={item.title} />
              ) : (
                <div>
                  <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-6 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Grade 1 English Phonics Worksheet
                      </span>
                      <h4 className="text-2xl font-black text-slate-800 mt-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Printable English PDF Sheet • Letter Tracing & Phonics Rhymes!
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                      📝
                    </div>
                  </div>

                  {/* Handwriting tracing practice simulation */}
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
                      <h5 className="font-extrabold text-sm text-amber-900 mb-2">
                        ✍️ Section 1: Letter Tracing (Alphabet Phonics)
                      </h5>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        {["A a", "B b", "C c", "D d"].map((val, idx) => (
                          <div
                            key={idx}
                            className="h-16 bg-white rounded-xl border-2 border-dashed border-amber-400 flex items-center justify-center text-2xl font-black text-amber-800 shadow-sm"
                          >
                            {val}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                      <h5 className="font-extrabold text-sm text-blue-900 mb-2">
                        🔤 Section 2: Rhyme Word Match
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        {["Cat - Hat", "Sun - Run", "Dog - Frog"].map((rhyme, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded-xl border border-blue-300 text-center font-black text-blue-800 text-lg shadow-sm"
                          >
                            {rhyme}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 text-center">
                      <h5 className="font-extrabold text-sm text-purple-900 mb-1">
                        🎨 Section 3: Color the Magic Castle
                      </h5>
                      <div className="text-5xl my-2">🏰 ✨ 🦄</div>
                      <p className="text-xs text-purple-700">
                        Print this sheet with the Print button to trace and color at your desk!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-white p-3 sm:p-4 border-t-2 border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Original</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Worksheet</span>
            </button>
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
                <span>Worksheet Done! ⭐</span>
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

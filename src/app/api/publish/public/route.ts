import { NextResponse } from "next/server";
import { db } from "@/db";
import { items, teacherSettings } from "@/db/schema";
import { desc, asc, eq } from "drizzle-orm";
import { verifyTeacherAuth } from "@/lib/auth";
import { sanitizeGameHtml } from "@/lib/gameSanitize";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { passcode, teacherPasscode } = body;

    const isTeacher = await verifyTeacherAuth(request, passcode || teacherPasscode);
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Unauthorized. Teacher passcode required to publish." },
        { status: 403 }
      );
    }

    const [settingsList, allItems] = await Promise.all([
      db.select().from(teacherSettings).limit(1),
      db
        .select()
        .from(items)
        .orderBy(desc(items.isPinned), asc(items.sortOrder), desc(items.createdAt)),
    ]);

    const s = settingsList[0] || {
      id: 1,
      teacherName: "Mr. Abdalla",
      classTitle: "Grade 1 & Grade 3 English Wonderland",
      welcomeMessage: "Welcome English super learners! Pick your grade, play phonics & reading games, explore stories, and collect stars! 🌟",
      avatarEmoji: "👨‍🏫",
      announcement: "✨ Welcome to our English Hub! Try the Phonics Pop games, Canva stories, and reading quests!",
      publicUrl: "",
    };

    // Encode all activities as Base64 to guarantee NO <script> or HTML tags break the page!
    // Harden every HTML game: forces English speech voice, Latin glyphs and audio unlock.
    const hardenedItems = allItems.map((it) =>
      it.itemType === "html_game" ? { ...it, content: sanitizeGameHtml(it.content) } : it
    );

    const jsonString = JSON.stringify(hardenedItems);
    const itemsBase64 = Buffer.from(jsonString, "utf8").toString("base64");

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeServerHtml(s.classTitle)} - Student Edition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse-subtle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
    .animate-pulse-subtle { animation: pulse-subtle 2s infinite ease-in-out; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-[#faf8f5] text-slate-900 min-h-screen flex flex-col justify-between font-sans">

  <!-- Header -->
  <header class="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
    <div class="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white font-extrabold text-xs mb-3 shadow-sm">
          <span class="text-base">${s.avatarEmoji}</span>
          <span>${escapeServerHtml(s.teacherName)}</span>
          <span class="opacity-60">•</span>
          <span>Grades 1 & 3 English Playground</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
          ${escapeServerHtml(s.classTitle)}
        </h1>
        <div class="flex items-start gap-2 mt-3">
          <p class="text-sm sm:text-base text-white/95 font-medium leading-relaxed drop-shadow-sm">
            ${escapeServerHtml(s.welcomeMessage)}
          </p>
          <button onclick="speakText('${escapeServerJs(s.classTitle + '. ' + s.welcomeMessage)}')" title="Read welcome aloud" class="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white shrink-0 mt-0.5 transition cursor-pointer">
            🔊
          </button>
        </div>
      </div>

      <!-- Student Star Card -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="px-5 py-3 bg-white/90 rounded-2xl shadow-lg border-2 border-amber-200 text-slate-800 flex items-center gap-3">
          <div id="studentAvatar" class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner border border-amber-300">
            🦁
          </div>
          <div>
            <div class="text-[11px] font-black uppercase tracking-wider text-slate-400">Student Stars</div>
            <div class="font-black text-sm text-slate-800" id="studentName">Super Learner</div>
            <div class="text-xs font-black text-amber-600 flex items-center gap-1">
              <span>⭐</span>
              <span id="starCounter">0 Stars</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${
      s.announcement
        ? `<div class="max-w-6xl mx-auto mt-6 p-3.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center gap-3 text-xs sm:text-sm font-bold text-white shadow-sm">
            <span class="text-xl shrink-0">📢</span>
            <span class="flex-1">${escapeServerHtml(s.announcement)}</span>
            <button onclick="speakText('${escapeServerJs(s.announcement)}')" class="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg shrink-0 cursor-pointer">🔊</button>
          </div>`
        : ""
    }
  </header>

  <!-- Main Container -->
  <main class="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
    <!-- Grade Filters -->
    <div class="bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-slate-100 mb-8 space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-black uppercase tracking-wider text-slate-400">Select Grade Level</span>
          <span class="text-xs font-bold text-amber-600" id="itemCountLabel"></span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button onclick="setGrade('all')" id="btn-grade-all" class="grade-btn p-3 rounded-2xl border-2 text-left transition bg-amber-400 border-amber-500 text-amber-950 shadow-md cursor-pointer">
            <span class="font-black text-sm block">🌟 All English</span>
            <span class="text-[11px] font-bold opacity-80 block">Grades 1 & 3</span>
          </button>
          <button onclick="setGrade('grade1')" id="btn-grade-grade1" class="grade-btn p-3 rounded-2xl border-2 text-left transition bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer">
            <span class="font-black text-sm block">🎒 Grade 1 English</span>
            <span class="text-[11px] font-bold text-slate-400 block">Phonics & Letters</span>
          </button>
          <button onclick="setGrade('grade3')" id="btn-grade-grade3" class="grade-btn p-3 rounded-2xl border-2 text-left transition bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer">
            <span class="font-black text-sm block">🚀 Grade 3 English</span>
            <span class="text-[11px] font-bold text-slate-400 block">Reading & Grammar</span>
          </button>
          <button onclick="setGrade('primary')" id="btn-grade-primary" class="grade-btn p-3 rounded-2xl border-2 text-left transition bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer">
            <span class="font-black text-sm block">📚 Primary Club</span>
            <span class="text-[11px] font-bold text-slate-400 block">All Learners</span>
          </button>
        </div>
      </div>

      <!-- Categories & Search -->
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-3 border-t border-slate-100">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button onclick="setCategory('all')" id="cat-all" class="cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-sm cursor-pointer">📚 All English</button>
          <button onclick="setCategory('phonics')" id="cat-phonics" class="cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">🔤 Phonics & Letters</button>
          <button onclick="setCategory('reading')" id="cat-reading" class="cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">📖 Reading & Stories</button>
          <button onclick="setCategory('spelling')" id="cat-spelling" class="cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">✍️ Spelling & Words</button>
          <button onclick="setCategory('grammar')" id="cat-grammar" class="cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">📝 Grammar & Writing</button>
        </div>
        <div class="relative w-full sm:w-64">
          <input type="text" id="searchInput" oninput="handleSearch(this.value)" placeholder="Search English activities..." class="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition" />
        </div>
      </div>
    </div>

    <!-- Activities Grid -->
    <div id="activitiesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"></div>
  </main>

  <!-- Activity Modal Runner (For Gemini HTML Games and Worksheets) -->
  <div id="modalOverlay" class="fixed inset-0 z-50 hidden bg-black/70 backdrop-blur-md p-0 sm:p-3">
    <div id="gameShell" class="bg-white w-full h-full flex flex-col shadow-2xl border-amber-300 overflow-hidden sm:rounded-3xl sm:border-4">
      <!-- Modal Header (compact so the game gets maximum height) -->
      <div id="modalHeader" class="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 px-2.5 py-2 sm:px-4 sm:py-3 text-white flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2 overflow-hidden">
          <span id="modalIcon" class="text-xl sm:text-2xl shrink-0 p-1 bg-white/20 rounded-lg">🎮</span>
          <div class="truncate">
            <h3 id="modalTitle" class="font-black text-sm sm:text-lg truncate text-white leading-tight"></h3>
            <p id="modalDesc" class="text-[10px] sm:text-xs text-white/85 truncate hidden sm:block"></p>
          </div>
        </div>
        <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button onclick="openGameInNewTab()" title="Open the game full screen" class="px-2.5 py-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition font-black text-[11px] flex items-center gap-1 cursor-pointer active:scale-95">
            <span>⛶</span><span class="hidden sm:inline">Full Screen</span>
          </button>
          <button onclick="toggleGameFullscreen()" title="Expand game window" class="p-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition font-bold text-xs cursor-pointer active:scale-95">⤢</button>
          <button onclick="speakModalTitle()" title="Listen" class="hidden sm:block p-2 bg-white/25 hover:bg-white/35 rounded-xl text-white transition font-bold text-xs cursor-pointer">🔊</button>
          <button onclick="closeModal()" class="p-2 bg-white/25 hover:bg-red-500 rounded-xl text-white transition text-base font-bold cursor-pointer active:scale-95">✕</button>
        </div>
      </div>

      <!-- Modal Body (Iframe fills every remaining pixel) -->
      <div id="modalBody" class="flex-1 min-h-0 w-full bg-slate-900 relative">
        <iframe id="gameIframe" class="absolute inset-0 w-full h-full border-none bg-white" allow="autoplay; fullscreen; microphone; speaker-selection"></iframe>

        <!-- Floating expand pill for kids -->
        <button onclick="openGameInNewTab()" class="absolute bottom-3 right-3 z-10 px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-black rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 cursor-pointer active:scale-95">
          <span>⤢</span><span>Bigger Screen</span>
        </button>
      </div>

      <!-- Modal Footer -->
      <div class="bg-white px-2.5 py-2 sm:px-4 sm:py-3 border-t-2 border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <button id="btnRestart" onclick="restartGame()" class="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs rounded-xl transition cursor-pointer shrink-0">🔄 <span class="hidden sm:inline">Restart</span></button>
        <button onclick="toggleGameFullscreen()" class="sm:hidden px-2.5 py-2 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-xl cursor-pointer shrink-0">⤢ Expand</button>
        <button id="btnCollectStar" onclick="claimStar()" class="flex-1 px-3 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 text-white shadow-md transition active:scale-95 cursor-pointer">⭐ I Finished! Collect Star</button>
      </div>
    </div>
  </div>

  <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
    <div class="max-w-4xl mx-auto flex items-center justify-center gap-2">
      <span>📚</span>
      <span class="font-bold text-slate-700">${escapeServerHtml(s.classTitle)}</span>
      <span>• Student Edition</span>
    </div>
  </footer>

  <!-- Safe Encoded Activities Storage (Cannot be broken by HTML or </script> tags) -->
  <script id="activities-data" type="text/plain">${itemsBase64}</script>

  <script>
    function decodeBase64Safe(base64Str) {
      try {
        const binString = atob(base64Str.trim());
        const bytes = Uint8Array.from(binString, (c) => c.charCodeAt(0));
        const jsonText = new TextDecoder().decode(bytes);
        return JSON.parse(jsonText);
      } catch (err) {
        console.error("Failed to decode activities:", err);
        return [];
      }
    }

    const rawData = document.getElementById('activities-data').textContent;
    const allActivities = decodeBase64Safe(rawData);

    let currentGrade = 'all';
    let currentCategory = 'all';
    let searchQ = '';
    let currentActiveItem = null;

    let stars = parseInt(localStorage.getItem('wonderhub_student_stars') || '0', 10);
    document.getElementById('starCounter').textContent = stars + ' Stars';

    // Check URL parameters for direct grade links (?grade=grade1)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const gParam = urlParams.get('grade');
      if (gParam && ['grade1', 'grade3', 'primary'].includes(gParam)) {
        currentGrade = gParam;
      }
    } catch(e) {}

    function escapeClientHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function setGrade(grade) {
      currentGrade = grade;
      document.querySelectorAll('.grade-btn').forEach(btn => {
        btn.className = 'grade-btn p-3 rounded-2xl border-2 text-left transition bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer';
      });
      const activeBtn = document.getElementById('btn-grade-' + grade);
      if (activeBtn) {
        activeBtn.className = 'grade-btn p-3 rounded-2xl border-2 text-left transition bg-amber-400 border-amber-500 text-amber-950 shadow-md cursor-pointer';
      }
      renderActivities();
    }

    function setCategory(cat) {
      currentCategory = cat;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = 'cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer';
      });
      const activeBtn = document.getElementById('cat-' + cat);
      if (activeBtn) {
        activeBtn.className = 'cat-btn px-3 py-1.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-sm cursor-pointer';
      }
      renderActivities();
    }

    function handleSearch(val) {
      searchQ = val.toLowerCase().trim();
      renderActivities();
    }

    function renderActivities() {
      const grid = document.getElementById('activitiesGrid');
      grid.innerHTML = '';

      const filtered = allActivities.filter(item => {
        if (currentGrade !== 'all') {
          if (item.grade !== currentGrade && item.grade !== 'all' &&
              !(currentGrade === 'grade1' && item.grade === 'primary') &&
              !(currentGrade === 'grade3' && item.grade === 'primary')) {
            return false;
          }
        }
        if (currentCategory !== 'all' && item.category !== currentCategory) {
          return false;
        }
        if (searchQ) {
          const matchTitle = item.title && item.title.toLowerCase().includes(searchQ);
          const matchDesc = item.description && item.description.toLowerCase().includes(searchQ);
          if (!matchTitle && !matchDesc) return false;
        }
        return true;
      });

      document.getElementById('itemCountLabel').textContent = filtered.length + ' activities available';

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-3 bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-200"><h4 class="font-black text-lg text-slate-800">No activities found</h4><p class="text-xs text-slate-500 mt-1">Try selecting All English or clearing your search.</p></div>';
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl p-5 shadow-md hover:shadow-xl border-2 border-slate-100 hover:border-amber-400 transition flex flex-col justify-between cursor-pointer transform hover:-translate-y-1';

        // Check if item is a direct web link or Canva project (which cannot be in an iframe)
        const isDirect = (item.itemType === 'link') || (item.itemType === 'canva_embed' && !item.content.trim().startsWith('<iframe'));

        if (isDirect) {
          card.onclick = () => {
            playTopSound('flip');
            window.open(item.content, '_blank', 'noopener,noreferrer');
          };
        } else {
          card.onclick = () => openItem(item);
        }

        const gradeLabel = item.grade === 'grade1' ? 'Grade 1 🎒' : item.grade === 'grade3' ? 'Grade 3 🚀' : 'All Primary ⭐';
        const gradeBg = item.grade === 'grade1' ? 'bg-blue-100 text-blue-800' : item.grade === 'grade3' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900';

        const safeTitle = escapeClientHtml(item.title);
        const safeDesc = escapeClientHtml(item.description || (isDirect ? 'Tap to launch and play directly in full screen!' : 'Tap to play and learn!'));
        const safeBadge = item.badge ? escapeClientHtml(item.badge) : '';
        const safeFile = item.fileName ? escapeClientHtml(item.fileName) : '';
        const safeIcon = item.icon || '🎮';
        const safeContent = escapeClientHtml(item.content);

        // Custom action button and links
        let actionBtnText = 'Play Game 🎮';
        let actionBtnBg = 'from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500';
        if (item.itemType === 'canva_embed') {
          actionBtnText = 'Play on Canva 🎨 ↗';
          actionBtnBg = 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700';
        } else if (item.itemType === 'link') {
          actionBtnText = 'Play Online 🔗 ↗';
          actionBtnBg = 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700';
        } else if (item.itemType === 'file') {
          actionBtnText = item.fileType === 'pptx' ? 'View Slides 📊' : 'Open Worksheet 📝';
          actionBtnBg = 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700';
        }

        let buttonAreaHtml = '';
        if (isDirect) {
          buttonAreaHtml = \`
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <a href="\${safeContent}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation(); playTopSound('flip');" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r \${actionBtnBg} text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer no-underline transition transform active:scale-95">
                <span>\${actionBtnText}</span>
              </a>
              <button type="button" onclick="event.stopPropagation(); claimStar();" title="I played this! Collect a Star" class="px-3 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0 shadow-sm">
                <span>⭐ Star</span>
              </button>
            </div>
          \`;
        } else {
          buttonAreaHtml = \`
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button type="button" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r \${actionBtnBg} text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition transform active:scale-95">
                <span>\${actionBtnText}</span>
              </button>
            </div>
          \`;
        }

        card.innerHTML = \`
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[11px] font-black px-2.5 py-0.5 rounded-full \${gradeBg}">\${gradeLabel}</span>
              \${safeBadge ? \`<span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">\${safeBadge}</span>\` : ''}
            </div>
            <div class="flex items-start gap-3 mb-2">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl shrink-0">\${safeIcon}</div>
              <div>
                <h3 class="font-black text-slate-800 text-base leading-snug">\${safeTitle}</h3>
                \${safeFile ? \`<p class="text-[11px] font-bold text-slate-400 mt-0.5">\${safeFile}</p>\` : ''}
              </div>
            </div>
            <p class="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed font-medium">\${safeDesc}</p>
          </div>
          \${buttonAreaHtml}
        \`;
        grid.appendChild(card);
      });
    }

    function openItem(item) {
      currentActiveItem = item;

      // Direct links (Canva sites or web links) open directly
      if (item.itemType === 'link' || (item.itemType === 'canva_embed' && !item.content.trim().startsWith('<iframe'))) {
        if (item.content) {
          playTopSound('flip');
          window.open(item.content, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      document.getElementById('modalTitle').textContent = item.title;
      document.getElementById('modalDesc').textContent = item.description || '';
      document.getElementById('modalIcon').textContent = item.icon || '🎮';

      const iframe = document.getElementById('gameIframe');

      if (item.itemType === 'html_game') {
        iframe.srcdoc = item.content;
      } else if (item.itemType === 'canva_embed') {
        iframe.srcdoc = item.content;
      } else if (item.itemType === 'file') {
        if (item.fileData && item.fileData.startsWith('data:')) {
          iframe.src = item.fileData;
        } else {
          iframe.srcdoc = '<div style="padding:40px;text-align:center;font-family:sans-serif;"><h3>' + escapeClientHtml(item.title) + '</h3><p>' + escapeClientHtml(item.description || '') + '</p></div>';
        }
      }

      document.getElementById('modalOverlay').classList.remove('hidden');
      document.getElementById('btnCollectStar').textContent = '⭐ I Finished! Collect Star';
      document.getElementById('btnCollectStar').disabled = false;
    }

    function closeModal() {
      document.getElementById('modalOverlay').classList.add('hidden');
      document.getElementById('gameIframe').srcdoc = '';
      document.getElementById('gameIframe').src = 'about:blank';
      currentActiveItem = null;
      try {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      } catch(e) {}
    }

    // Opens the raw game in its own tab => true 100% screen with no parent scrolling
    function openGameInNewTab() {
      if (!currentActiveItem || !currentActiveItem.content) return;
      try {
        playTopSound('flip');
        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><title>' + escapeClientHtml(currentActiveItem.title) + '</title><style>html,body{margin:0;padding:0;height:100%}</style></head><body>' + currentActiveItem.content + '</body></html>';
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          document.body.appendChild(a); a.click(); a.remove();
        }
        setTimeout(function() { URL.revokeObjectURL(url); }, 120000);
      } catch(e) { console.log('New tab error', e); }
    }

    // Real fullscreen; falls back to a new tab where element fullscreen is blocked (iPhone)
    function toggleGameFullscreen() {
      const shell = document.getElementById('gameShell');
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          return;
        }
        playTopSound('flip');
        const request = shell.requestFullscreen || shell.webkitRequestFullscreen || shell.msRequestFullscreen;
        if (request) {
          const result = request.call(shell);
          if (result && typeof result.then === 'function') {
            result.catch(function() { openGameInNewTab(); });
          }
        } else {
          openGameInNewTab();
        }
      } catch(e) {
        openGameInNewTab();
      }
    }

    function restartGame() {
      if (currentActiveItem && currentActiveItem.itemType === 'html_game') {
        document.getElementById('gameIframe').srcdoc = currentActiveItem.content;
      }
    }

    function claimStar() {
      stars++;
      localStorage.setItem('wonderhub_student_stars', stars.toString());
      document.getElementById('starCounter').textContent = stars + ' Stars';
      const btn = document.getElementById('btnCollectStar');
      if (btn) {
        btn.textContent = '🎉 Star Claimed! Great Job!';
        btn.disabled = true;
      }
      playTopSound('fanfare');
      speakText('Great job! You earned a shiny English star!');
    }

    // Top-Level Audio & Speech Synthesizer
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let topAudioCtx = null;

    function initTopAudio() {
      try {
        if (!topAudioCtx && AudioCtx) topAudioCtx = new AudioCtx();
        if (topAudioCtx && topAudioCtx.state === 'suspended') topAudioCtx.resume();
      } catch(e) {}
    }

    function unlockAudioOnInteraction() {
      initTopAudio();
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.resume(); } catch(e) {}
      }
    }
    document.addEventListener('touchstart', unlockAudioOnInteraction, { passive: true });
    document.addEventListener('click', unlockAudioOnInteraction, { passive: true });

    function playTopSound(type) {
      try {
        initTopAudio();
        if (!topAudioCtx) return;
        const now = topAudioCtx.currentTime;
        if (type === 'success' || type === 'flip') {
          const osc = topAudioCtx.createOscillator();
          const gain = topAudioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
          osc.connect(gain);
          gain.connect(topAudioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'fanfare') {
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = topAudioCtx.createOscillator();
            const gain = topAudioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(topAudioCtx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.45);
          });
        }
      } catch(e) {}
    }

    // Strictly choose an ENGLISH voice (devices in Arabic regions otherwise use an Arabic voice)
    function pickEnglishVoice() {
      try {
        const voices = window.speechSynthesis.getVoices() || [];
        const english = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').indexOf('en') === 0);
        if (!english.length) return null;
        const prefs = ['natural', 'google us english', 'samantha', 'zira', 'aria', 'jenny', 'google uk english', 'english'];
        for (let i = 0; i < prefs.length; i++) {
          const match = english.find(v => (v.name || '').toLowerCase().indexOf(prefs[i]) !== -1);
          if (match) return match;
        }
        return english.find(v => v.lang.toLowerCase().indexOf('en-us') === 0) || english[0];
      } catch (e) { return null; }
    }

    // Warm up the voice list so the first tap already has an English voice ready
    try {
      if ('speechSynthesis' in window) {
        pickEnglishVoice();
        window.speechSynthesis.onvoiceschanged = function() { pickEnglishVoice(); };
      }
    } catch (e) {}

    function speakText(txt) {
      if (!txt) return;
      initTopAudio();

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();

          const doSpeak = () => {
            try {
              const u = new SpeechSynthesisUtterance(String(txt).trim());
              u.rate = 0.85;
              u.pitch = 1.1;
              u.lang = 'en-US';

              const eng = pickEnglishVoice();
              if (eng) u.voice = eng;
              window.speechSynthesis.speak(u);
            } catch(e) {
              console.log("Speak error:", e);
            }
          };

          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setTimeout(doSpeak, 80);
          } else {
            doSpeak();
          }
        } catch(e) {}
      }
    }

    // Bridge for messages sent from games inside iframe
    window.addEventListener('message', function(event) {
      if (!event.data) return;
      if (event.data.type === 'WONDERHUB_SPEAK' && event.data.text) {
        speakText(event.data.text);
      }
      if (event.data.type === 'WONDERHUB_SOUND' && event.data.sound) {
        playTopSound(event.data.sound);
      }
    });

    function speakModalTitle() {
      if (currentActiveItem) {
        speakText(currentActiveItem.title + '. ' + (currentActiveItem.description || ''));
      }
    }

    // Initial render
    setGrade(currentGrade);
  </script>
</body>
</html>`;

    // Deploy to Cloudflare edge via ship.page
    const deployRes = await fetch("https://ship.page/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      body: htmlContent,
    });

    if (!deployRes.ok) {
      throw new Error(`Edge deploy returned status ${deployRes.status}`);
    }

    const deployData = await deployRes.json();
    const publicUrl = deployData.url;

    if (!publicUrl) {
      throw new Error("No public URL returned from deployment service");
    }

    // Persist to database
    if (settingsList.length > 0) {
      await db
        .update(teacherSettings)
        .set({ publicUrl, updatedAt: new Date() })
        .where(eq(teacherSettings.id, settingsList[0].id));
    }

    return NextResponse.json({
      success: true,
      publicUrl,
      claimUrl: deployData.claim_url,
      expiresAt: deployData.expires_at,
    });
  } catch (error: any) {
    console.error("Public publish error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function escapeServerHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeServerJs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, " ");
}

import { db } from "./index";
import { items, teacherSettings } from "./schema";

const sampleGeminiPhonicsBubbleGame = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Magic Phonics & Rhyme Pop!</title>
<style>
  * { box-sizing: border-box; user-select: none; font-family: 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif; }
  body {
    margin: 0; padding: 12px; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    overflow: hidden;
  }
  header { text-align: center; }
  h1 { margin: 4px 0; color: #ff3366; font-size: 26px; text-shadow: 2px 2px #fff; }
  .target-box {
    background: #ffeb3b; padding: 8px 24px; border-radius: 30px; border: 4px solid #f57f17;
    font-size: 22px; font-weight: bold; color: #333; box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    margin-bottom: 8px; animation: pulse 1.5s infinite; cursor: pointer;
  }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
  .stats { display: flex; gap: 16px; font-size: 18px; font-weight: bold; color: #1565c0; }
  .game-area {
    position: relative; width: 100%; max-width: 520px; height: 380px;
    background: rgba(255,255,255,0.7); border-radius: 24px; border: 4px dashed #42a5f5;
    overflow: hidden; margin: 10px 0;
  }
  .bubble {
    position: absolute; width: 88px; height: 88px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: bold; color: white; cursor: pointer;
    box-shadow: inset -4px -4px 10px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.1s; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    animation: floatUp 6s linear infinite; text-align: center; padding: 6px;
  }
  .bubble:active { transform: scale(0.92); }
  @keyframes floatUp {
    0% { transform: translateY(400px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-80px); opacity: 0; }
  }
  .feedback {
    min-height: 32px; font-size: 20px; font-weight: bold; text-align: center; color: #2e7d32;
  }
  .controls { display: flex; gap: 12px; }
  button {
    background: #4caf50; color: white; border: none; padding: 10px 20px; font-size: 16px;
    font-weight: bold; border-radius: 20px; cursor: pointer; box-shadow: 0 4px #2e7d32;
  }
  button:active { transform: translateY(2px); box-shadow: 0 2px #2e7d32; }
</style>
</head>
<body>
  <header>
    <h1>🫧 Phonics & Rhyme Pop! (English)</h1>
    <div class="target-box" id="targetBox" onclick="speakTarget()">Find words that rhyme with: CAT 🐱 (Tap to Listen 🔊)</div>
    <div class="stats">
      <div>⭐ Stars: <span id="score">0</span></div>
      <div>🎯 Streak: <span id="streak">0</span></div>
    </div>
  </header>

  <div class="game-area" id="gameArea"></div>
  <div class="feedback" id="feedback">Pop the bubbles that rhyme with the target word!</div>

  <div class="controls">
    <button onclick="newRound()">New Rhyme 🔄</button>
    <button onclick="speakTarget()" style="background:#2196f3;box-shadow:0 4px #1565c0;">Listen 🔊</button>
  </div>

<script>
  const rhymeFamilies = [
    { target: "CAT", sound: "-AT", emoji: "🐱", rhymes: ["BAT", "HAT", "MAT", "RAT", "FAT"], distractors: ["DOG", "SUN", "PIN", "FOX", "CUP"] },
    { target: "KING", sound: "-ING", emoji: "👑", rhymes: ["RING", "WING", "SING", "SPRING"], distractors: ["BALL", "TREE", "CAR", "BOOK", "PEN"] },
    { target: "STAR", sound: "-AR", emoji: "⭐", rhymes: ["CAR", "FAR", "JAR", "BAR"], distractors: ["PIG", "BED", "NUT", "FROG", "BUS"] },
    { target: "FROG", sound: "-OG", emoji: "🐸", rhymes: ["DOG", "LOG", "JOG", "FOG"], distractors: ["CAT", "HAT", "RED", "SIT", "RUN"] },
    { target: "SUN", sound: "-UN", emoji: "☀️", rhymes: ["RUN", "FUN", "BUN", "SPUN"], distractors: ["POT", "BAT", "TOP", "BIG", "NET"] },
    { target: "TREE", sound: "-EE", emoji: "🌳", rhymes: ["BEE", "SEE", "FREE", "THREE"], distractors: ["COW", "BOX", "HEN", "CUP", "ZIP"] }
  ];

  let currentFamily = rhymeFamilies[0];
  let score = 0;
  let streak = 0;
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#009688', '#ff9800'];
  const gameArea = document.getElementById('gameArea');
  const targetBox = document.getElementById('targetBox');
  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const feedbackEl = document.getElementById('feedback');

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    }
  }

  function speakTarget() {
    speakText("Rhyme with " + currentFamily.target);
  }

  function newRound() {
    currentFamily = rhymeFamilies[Math.floor(Math.random() * rhymeFamilies.length)];
    targetBox.textContent = "Find words that rhyme with: " + currentFamily.target + " " + currentFamily.emoji + " 🔊";
    feedbackEl.textContent = "Pop bubbles that end with " + currentFamily.sound + "!";
    feedbackEl.style.color = "#2e7d32";
    spawnBubbles();
    speakTarget();
  }

  function spawnBubbles() {
    gameArea.innerHTML = '';
    const pool = [];
    currentFamily.rhymes.forEach(w => pool.push({ word: w, isRhyme: true }));
    currentFamily.distractors.forEach(w => pool.push({ word: w, isRhyme: false }));
    pool.sort(() => Math.random() - 0.5);

    pool.forEach((item, idx) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = item.word;
      bubble.style.background = colors[idx % colors.length];
      bubble.style.left = (10 + (idx % 4) * 23) + '%';
      bubble.style.animationDelay = (idx * 0.7) + 's';

      bubble.onclick = function() {
        speakText(item.word);
        if (item.isRhyme) {
          score += 10;
          streak++;
          scoreEl.textContent = score;
          streakEl.textContent = streak;
          feedbackEl.textContent = "🎉 Super! " + item.word + " rhymes with " + currentFamily.target + "!";
          feedbackEl.style.color = "#ff3366";
          bubble.style.transition = 'all 0.3s';
          bubble.style.transform = 'scale(1.5)';
          bubble.style.opacity = '0';
          setTimeout(() => bubble.remove(), 300);

          // Check remaining rhymes
          const remaining = gameArea.querySelectorAll('.bubble');
          let hasMoreRhymes = false;
          remaining.forEach(b => {
            if (currentFamily.rhymes.includes(b.textContent)) hasMoreRhymes = true;
          });
          if (!hasMoreRhymes) {
            feedbackEl.textContent = "🏆 All rhyming words found! Great job!";
            setTimeout(newRound, 1500);
          }
        } else {
          streak = 0;
          streakEl.textContent = streak;
          feedbackEl.textContent = "Oops! " + item.word + " does not rhyme with " + currentFamily.target + ". Try again!";
          feedbackEl.style.color = "#d32f2f";
          bubble.style.transform = 'scale(0.85)';
          setTimeout(() => bubble.style.transform = 'scale(1)', 200);
        }
      };
      gameArea.appendChild(bubble);
    });
  }

  newRound();
</script>
</body>
</html>`;

const sampleGeminiSpellingSafari = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Grade 3 Word Safari Detective</title>
<style>
  * { box-sizing: border-box; font-family: 'Comic Sans MS', cursive, sans-serif; user-select: none; }
  body {
    margin: 0; padding: 16px; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff;
  }
  .card {
    background: white; color: #333; border-radius: 24px; padding: 24px;
    width: 100%; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    text-align: center;
  }
  h2 { margin: 0 0 8px 0; color: #2e7d32; font-size: 26px; }
  .clue-emoji { font-size: 54px; margin: 12px 0; animation: bounce 1s infinite alternate; }
  @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
  .clue-text { font-size: 18px; color: #555; font-weight: bold; margin-bottom: 16px; }
  .word-slots { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }
  .slot {
    width: 48px; height: 54px; border: 3px dashed #4caf50; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 28px;
    font-weight: bold; background: #f1f8e9; color: #1b5e20;
  }
  .slot.filled { border-style: solid; background: #c8e6c9; }
  .letters-pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 16px; }
  .letter-btn {
    width: 46px; height: 46px; border-radius: 12px; border: none;
    background: #ff9800; color: white; font-size: 22px; font-weight: bold;
    cursor: pointer; box-shadow: 0 4px #e65100;
  }
  .letter-btn:active { transform: translateY(2px); box-shadow: 0 2px #e65100; }
  .status { font-size: 18px; font-weight: bold; min-height: 28px; color: #1565c0; }
  .score-badge { font-size: 18px; font-weight: bold; color: #f57c00; margin-top: 12px; }
</style>
</head>
<body>
  <div class="card">
    <h2>🦁 Grade 3 English Word Safari</h2>
    <div class="clue-emoji" id="emoji">🪐</div>
    <div class="clue-text" id="clue">A huge spinning ball in space like Earth or Mars!</div>

    <div class="word-slots" id="slots"></div>
    <div class="letters-pool" id="pool"></div>

    <div class="status" id="status">Tap letters in the right order!</div>
    <div class="score-badge">🌟 English Stars: <span id="stars">0</span></div>
    <div style="margin-top: 14px;">
      <button onclick="speakWordClue()" style="background:#2196f3;border:none;padding:6px 16px;border-radius:12px;color:white;cursor:pointer;font-weight:bold;">Listen 🔊</button>
      <button onclick="skipWord()" style="background:#81c784;border:none;padding:6px 16px;border-radius:12px;color:white;cursor:pointer;font-weight:bold;margin-left:6px;">Skip ⏭️</button>
      <button onclick="resetWord()" style="background:#ffb74d;border:none;padding:6px 16px;border-radius:12px;color:white;cursor:pointer;font-weight:bold;margin-left:6px;">Clear ↩️</button>
    </div>
  </div>

<script>
  const words = [
    { word: "PLANET", clue: "A giant ball in space like Earth or Jupiter! (Noun)", emoji: "🪐" },
    { word: "SAFARI", clue: "An exciting journey to see wild animals! (Noun)", emoji: "🦁" },
    { word: "ROCKET", clue: "A powerful vehicle that blasts into outer space!", emoji: "🚀" },
    { word: "WONDER", clue: "A feeling of magic, curiosity, and surprise!", emoji: "✨" },
    { word: "JUNGLE", clue: "A warm tropical forest full of trees and vines!", emoji: "🌴" },
    { word: "CASTLE", clue: "A grand fortress where kings and queens live!", emoji: "🏰" },
    { word: "DOLPHIN", clue: "A smart, friendly ocean animal that loves jumping!", emoji: "🐬" }
  ];

  let currentIdx = 0;
  let userLetters = [];
  let stars = 0;

  const emojiEl = document.getElementById('emoji');
  const clueEl = document.getElementById('clue');
  const slotsEl = document.getElementById('slots');
  const poolEl = document.getElementById('pool');
  const statusEl = document.getElementById('status');
  const starsEl = document.getElementById('stars');

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }

  function speakWordClue() {
    const item = words[currentIdx % words.length];
    speakText("Clue: " + item.clue);
  }

  function loadWord() {
    userLetters = [];
    const item = words[currentIdx % words.length];
    emojiEl.textContent = item.emoji;
    clueEl.textContent = item.clue;
    statusEl.textContent = "Tap letters in the right order!";
    statusEl.style.color = "#1565c0";

    renderSlots(item.word.length);
    renderPool(item.word);
    speakWordClue();
  }

  function renderSlots(len) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < len; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot' + (userLetters[i] ? ' filled' : '');
      slot.textContent = userLetters[i] || '';
      slotsEl.appendChild(slot);
    }
  }

  function renderPool(word) {
    poolEl.innerHTML = '';
    let letters = word.split('');
    letters.sort(() => Math.random() - 0.5);

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.onclick = () => {
        speakText(letter);
        const item = words[currentIdx % words.length];
        if (userLetters.length < item.word.length) {
          userLetters.push(letter);
          btn.style.visibility = 'hidden';
          renderSlots(item.word.length);

          if (userLetters.length === item.word.length) {
            checkWord();
          }
        }
      };
      poolEl.appendChild(btn);
    });
  }

  function checkWord() {
    const item = words[currentIdx % words.length];
    const spelled = userLetters.join('');
    if (spelled === item.word) {
      stars++;
      starsEl.textContent = stars;
      statusEl.textContent = "🎉 FANTASTIC! You spelled " + item.word + "!";
      statusEl.style.color = "#2e7d32";
      speakText("Awesome! You spelled " + item.word);
      setTimeout(() => {
        currentIdx++;
        loadWord();
      }, 1500);
    } else {
      statusEl.textContent = "Almost! Tap Clear to try again! 💪";
      statusEl.style.color = "#d32f2f";
      speakText("Almost! Try again.");
    }
  }

  function resetWord() {
    userLetters = [];
    const item = words[currentIdx % words.length];
    renderSlots(item.word.length);
    renderPool(item.word);
    statusEl.textContent = "Ready! Tap the letters again!";
    statusEl.style.color = "#1565c0";
  }

  function skipWord() {
    currentIdx++;
    loadWord();
  }

  loadWord();
</script>
</body>
</html>`;

const sampleGeminiSightWordsMatch = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sight Words Magic Flip Match</title>
<style>
  * { box-sizing: border-box; font-family: 'Comic Sans MS', cursive, sans-serif; user-select: none; }
  body {
    margin: 0; padding: 12px; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  h1 { margin: 0 0 8px 0; color: #d84315; font-size: 26px; text-shadow: 1px 1px #fff; }
  .grid {
    display: grid; grid-template-columns: repeat(4, 82px); gap: 10px; margin: 12px 0;
  }
  .card {
    width: 82px; height: 86px; background: #fff; border-radius: 14px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    border: 3px solid #ff7043; transition: transform 0.2s; color: #1a237e; text-align: center;
    padding: 4px;
  }
  .card.hidden { background: #ff7043; color: transparent; border-color: #d84315; }
  .card.matched { background: #c8e6c9; border-color: #388e3c; color: #1b5e20; cursor: default; }
  .info { font-size: 18px; font-weight: bold; color: #4e342e; }
  button {
    margin-top: 10px; background: #2e7d32; color: white; border: none; padding: 8px 18px;
    font-size: 16px; border-radius: 16px; cursor: pointer; font-weight: bold;
  }
</style>
</head>
<body>
  <h1>🔤 Sight Words Magic Match!</h1>
  <div class="info">Matches: <span id="matches">0</span> / 6</div>
  <div class="grid" id="grid"></div>
  <div id="praise" style="font-size:20px; font-weight:bold; color:#2e7d32; min-height:28px;">Flip cards to find matching English sight words!</div>
  <button onclick="initGame()">Play Again 🔄</button>

<script>
  const words = ['PLAY', 'LIKE', 'STAR', 'COME', 'LOOK', 'HAVE'];
  let deck = [];
  let flipped = [];
  let matches = 0;

  function speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }

  function initGame() {
    deck = [...words, ...words].sort(() => Math.random() - 0.5);
    flipped = [];
    matches = 0;
    document.getElementById('matches').textContent = '0';
    document.getElementById('praise').textContent = 'Find matching English sight words!';
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    deck.forEach((word, index) => {
      const card = document.createElement('div');
      card.className = 'card hidden';
      card.dataset.index = index;
      card.dataset.word = word;
      card.textContent = word;

      card.onclick = () => {
        if (!card.classList.contains('hidden') || flipped.length === 2) return;
        card.classList.remove('hidden');
        speak(word);
        flipped.push(card);

        if (flipped.length === 2) {
          if (flipped[0].dataset.word === flipped[1].dataset.word) {
            flipped[0].classList.add('matched');
            flipped[1].classList.add('matched');
            matches++;
            document.getElementById('matches').textContent = matches;
            document.getElementById('praise').textContent = '⭐ Great! You matched: ' + word + '! ⭐';
            flipped = [];
            if (matches === 6) {
              document.getElementById('praise').textContent = '🏆 SUPER ENGLISH READER! All words matched! 🏆';
            }
          } else {
            document.getElementById('praise').textContent = 'Almost! Keep looking! 👀';
            setTimeout(() => {
              flipped[0].classList.add('hidden');
              flipped[1].classList.add('hidden');
              flipped = [];
            }, 800);
          }
        }
      };
      grid.appendChild(card);
    });
  }
  initGame();
</script>
</body>
</html>`;

/**
 * Non-destructive seeding: only inserts starter content into empty tables.
 * It never deletes or overwrites activities, settings or passcodes that the
 * teacher has already created — safe to run on every deployment.
 */
export async function seedDatabase() {
  // 1. Classroom settings — insert only if the table is completely empty.
  const existingSettings = await db.select().from(teacherSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(teacherSettings).values({
      teacherName: "My English Class",
      classTitle: "Grade 1 & Grade 3 English Wonderland",
      welcomeMessage: "Welcome English super learners! Pick Grade 1 or Grade 3, play phonics & reading games, explore stories, and collect stars! 🌟",
      passcode: "teacher123",
      avatarEmoji: "👩‍🏫",
      theme: "playful",
      announcement: "✨ Welcome to our English Hub! Try the Phonics Pop games, Canva stories, and reading quests!",
    });
  }

  // 2. Activities — insert starter activities only if there are none yet.
  const existingItems = await db.select().from(items).limit(1);
  if (existingItems.length > 0) {
    return;
  }

  await db.insert(items).values([
    {
      title: "Magic Phonics & Rhyme Pop! 🫧",
      description: "Pop bubbles with rhyming words (-AT, -ING, -AR, -OG)! Tap words to hear speech pronunciation. Great for Grade 1 & 3 English.",
      itemType: "html_game",
      category: "phonics",
      grade: "grade1",
      content: sampleGeminiPhonicsBubbleGame,
      icon: "🫧",
      badge: "Gemini Game",
      isPinned: true,
      sortOrder: 1,
    },
    {
      title: "Grade 3 English Word Safari Detective 🦁",
      description: "Listen to English clues and spell awesome adventure words letter by letter! Earn golden English stars.",
      itemType: "html_game",
      category: "spelling",
      grade: "grade3",
      content: sampleGeminiSpellingSafari,
      icon: "🦁",
      badge: "Gemini Game",
      isPinned: true,
      sortOrder: 2,
    },
    {
      title: "Sight Words Magic Flip Match 🔤",
      description: "Flip cards and find matching English sight words like PLAY, STAR, LIKE, COME! Speaks words aloud.",
      itemType: "html_game",
      category: "reading",
      grade: "grade1",
      content: sampleGeminiSightWordsMatch,
      icon: "🔤",
      badge: "Gemini Game",
      isPinned: false,
      sortOrder: 3,
    },
    {
      title: "Canva Sight Words & Phonics Journey 🎨",
      description: "Interactive Canva presentation with colorful flashcards, letter sounds, phonics rhymes, and story sentences.",
      itemType: "canva_embed",
      category: "phonics",
      grade: "grade1",
      content: "https://www.canva.com/design/DAFe91example/view?embed",
      icon: "🎨",
      badge: "Canva Story",
      isPinned: true,
      sortOrder: 4,
    },
    {
      title: "Grade 3 English Vocabulary & Synonyms Wheel 🎡",
      description: "Spin and solve vocabulary wheels made in Canva! Practice exciting adjectives, synonyms, and antonyms.",
      itemType: "canva_embed",
      category: "spelling",
      grade: "grade3",
      content: "https://www.canva.com/design/DAFe92wheel/view?embed",
      icon: "🎡",
      badge: "Canva Game",
      isPinned: false,
      sortOrder: 5,
    },
    {
      title: "Grade 1 Alphabet & Phonics Handwriting Worksheet 📝",
      description: "Printable and viewable PDF worksheet for letter tracing, beginning letter sounds, and CVC word practice.",
      itemType: "file",
      fileType: "pdf",
      fileName: "Grade1_English_Phonics_Tracing.pdf",
      fileSize: "1.2 MB",
      category: "grammar",
      grade: "grade1",
      content: "pdf_worksheet_grade1",
      fileData: "Sample English PDF printable worksheet with alphabet tracing lines, phonics pictures, and sight words.",
      icon: "📄",
      badge: "PDF Worksheet",
      isPinned: false,
      sortOrder: 6,
    },
    {
      title: "Grade 3 Reading Quest: The Brave Little Astronaut 🚀",
      description: "English reading comprehension passage with vocabulary detectives, 5 comprehension questions, and writing space!",
      itemType: "file",
      fileType: "docx",
      fileName: "Grade3_Reading_Comprehension_Astronaut.docx",
      fileSize: "840 KB",
      category: "reading",
      grade: "grade3",
      content: "docx_story_grade3",
      fileData: "The Brave Little Astronaut English story text, 5 comprehension questions, vocabulary matching activity.",
      icon: "📘",
      badge: "Word Doc",
      isPinned: false,
      sortOrder: 7,
    },
    {
      title: "Grade 3 English Grammar Safari: Nouns, Verbs & Adjectives 📊",
      description: "Interactive PowerPoint slide deck covering Person/Place/Thing Nouns, Action Verbs, and Describing Adjectives with quiz slides!",
      itemType: "file",
      fileType: "pptx",
      fileName: "Grade3_English_Grammar_Safari.pptx",
      fileSize: "2.8 MB",
      category: "grammar",
      grade: "grade3",
      content: "pptx_slides_grammar",
      fileData: "Interactive 6-slide presentation covering Nouns, Action Verbs, Describing Adjectives, and Punctuation.",
      icon: "📊",
      badge: "PowerPoint",
      isPinned: false,
      sortOrder: 8,
    },
    {
      title: "British Council LearnEnglish Kids: Animated Stories & Rhymes 📚",
      description: "Explore animated English fairy tales, phonics songs, and vocabulary games from the British Council.",
      itemType: "link",
      category: "reading",
      grade: "primary",
      content: "https://learnenglishkids.britishcouncil.org/",
      icon: "📚",
      badge: "Web Link",
      isPinned: false,
      sortOrder: 9,
    },
    {
      title: "Oxford Owl Free Phonics & Reading Corner 🦉",
      description: "Fun leveled English eBooks, phonics activities, and reading games specially designed for primary school children!",
      itemType: "link",
      category: "reading",
      grade: "primary",
      content: "https://home.oxfordowl.co.uk/reading/free-ebooks/",
      icon: "🦉",
      badge: "Web Link",
      isPinned: false,
      sortOrder: 10,
    }
  ]);
}

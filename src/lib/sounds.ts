// Web Audio API sound effects - works in all modern browsers without external audio files

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play a cheerful star collection chime
  playStarChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Pop sound for bubbles / buttons
  playPop() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // Celebration fanfare when finishing a game or worksheet
  playFanfare() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const chord = [
        { f: 523.25, t: 0, d: 0.18 }, // C5
        { f: 659.25, t: 0.18, d: 0.18 }, // E5
        { f: 783.99, t: 0.36, d: 0.18 }, // G5
        { f: 1046.5, t: 0.54, d: 0.45 }, // C6 (long)
      ];

      chord.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.22, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });
    } catch {}
  }

  /**
   * Picks a genuinely English voice. Devices in Arabic-speaking regions often
   * default to an Arabic voice, which mispronounces English words — so we never
   * leave the voice unset when an English voice exists.
   */
  private pickEnglishVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const english = voices.filter(
        (v) => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith("en")
      );
      if (english.length === 0) return null;

      const preferences = [
        "natural",
        "google us english",
        "samantha",
        "zira",
        "aria",
        "jenny",
        "google uk english",
        "english",
      ];
      for (const pref of preferences) {
        const match = english.find((v) => (v.name || "").toLowerCase().includes(pref));
        if (match) return match;
      }
      // Prefer en-US, otherwise any English voice.
      return english.find((v) => v.lang.toLowerCase().startsWith("en-us")) || english[0];
    } catch {
      return null;
    }
  }

  /** Reads text aloud in English (resilient on iPad, iPhone, Safari, Chrome, Android). */
  speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      this.getContext(); // Resume AudioContext for mobile browsers

      const doSpeak = () => {
        try {
          const clean = String(text || "").trim();
          if (!clean) return;

          const utterance = new SpeechSynthesisUtterance(clean);
          utterance.rate = 0.85; // Slightly slower, friendly pace for kids
          utterance.pitch = 1.1; // Cheerful tone
          utterance.lang = "en-US";

          const engVoice = this.pickEnglishVoice();
          if (engVoice) utterance.voice = engVoice;

          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("Speech error:", e);
        }
      };

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(doSpeak, 80);
      } else {
        doSpeak();
      }
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  }

  stopSpeaking() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export const sounds = new SoundManager();

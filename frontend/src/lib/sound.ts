// ─── CodeClash sound engine ───────────────────────────────────────────────────
// Tiny Web Audio synth — zero assets, zero deps. Every cue is a short envelope
// of oscillators, tuned to feel arcade-ish. Muted state persists in localStorage.

export type SoundName =
  | "click"
  | "tick"
  | "correct"
  | "wrong"
  | "xp"
  | "victory"
  | "defeat"
  | "match-start"
  | "countdown";

const MUTE_KEY = "cc-muted";

let ctx: AudioContext | null = null;
let lastPlay = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // private mode — ignore
  }
}

interface Note {
  f: number; // frequency (Hz)
  t: number; // start offset (s)
  d: number; // duration (s)
  type?: OscillatorType;
  gain?: number;
  slideTo?: number; // frequency glide target
}

const CUES: Record<SoundName, Note[]> = {
  click: [{ f: 760, t: 0, d: 0.045, type: "square", gain: 0.045 }],
  tick: [{ f: 1180, t: 0, d: 0.035, type: "sine", gain: 0.06 }],
  countdown: [{ f: 880, t: 0, d: 0.09, type: "sine", gain: 0.08 }],
  correct: [
    { f: 523, t: 0, d: 0.09, type: "sine", gain: 0.09 },
    { f: 784, t: 0.08, d: 0.14, type: "sine", gain: 0.09 },
  ],
  wrong: [
    { f: 311, t: 0, d: 0.1, type: "sawtooth", gain: 0.05, slideTo: 196 },
    { f: 196, t: 0.09, d: 0.16, type: "sawtooth", gain: 0.045 },
  ],
  xp: [
    { f: 659, t: 0, d: 0.07, type: "triangle", gain: 0.08 },
    { f: 880, t: 0.06, d: 0.09, type: "triangle", gain: 0.08 },
    { f: 1319, t: 0.12, d: 0.12, type: "triangle", gain: 0.07 },
  ],
  "match-start": [
    { f: 392, t: 0, d: 0.12, type: "square", gain: 0.05 },
    { f: 587, t: 0.1, d: 0.18, type: "square", gain: 0.055 },
    { f: 784, t: 0.22, d: 0.22, type: "square", gain: 0.06 },
  ],
  victory: [
    { f: 523, t: 0, d: 0.12, type: "triangle", gain: 0.09 },
    { f: 659, t: 0.11, d: 0.12, type: "triangle", gain: 0.09 },
    { f: 784, t: 0.22, d: 0.14, type: "triangle", gain: 0.09 },
    { f: 1047, t: 0.34, d: 0.3, type: "triangle", gain: 0.1 },
    { f: 784, t: 0.34, d: 0.3, type: "sine", gain: 0.05 },
  ],
  defeat: [
    { f: 392, t: 0, d: 0.16, type: "triangle", gain: 0.08, slideTo: 340 },
    { f: 330, t: 0.15, d: 0.18, type: "triangle", gain: 0.075, slideTo: 294 },
    { f: 262, t: 0.32, d: 0.34, type: "triangle", gain: 0.07, slideTo: 220 },
  ],
};

/** Play a named cue. Silently no-ops when muted or before user gesture. */
export function playSound(name: SoundName): void {
  if (isMuted()) return;
  const audio = getCtx();
  if (!audio) return;
  // rate-limit identical cues (React strict mode double-fires)
  const now = performance.now();
  if (now - lastPlay < 30) return;
  lastPlay = now;

  try {
    const master = audio.createGain();
    master.gain.value = 0.9;
    master.connect(audio.destination);
    for (const n of CUES[name]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = n.type ?? "sine";
      const start = audio.currentTime + n.t;
      const peak = n.gain ?? 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
      osc.frequency.setValueAtTime(n.f, start);
      if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, start + n.d);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + n.d + 0.02);
    }
  } catch {
    // audio unavailable — stay silent
  }
}

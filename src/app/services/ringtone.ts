/**
 * Synthesized phone ringtones (Web Audio API) — no audio files needed. Several
 * selectable styles; the choice persists in localStorage and is used both for
 * the incoming-call ring loop and the settings preview.
 */
export type RingtoneId = "classic" | "digital" | "chime" | "retro" | "marimba" | "reflection" | "crystal" | "signal" | "playtime";

export const RINGTONES: Array<{ id: RingtoneId; name: string; desc: string }> = [
  { id: "marimba", name: "Marimba", desc: "iPhone-style marimba melody" },
  { id: "reflection", name: "Reflection", desc: "Gentle modern synth" },
  { id: "crystal", name: "Crystals", desc: "Shimmering bell arpeggio" },
  { id: "signal", name: "Signal", desc: "Bright two-tone alert" },
  { id: "playtime", name: "Playtime", desc: "Bouncy xylophone riff" },
  { id: "classic", name: "Classic", desc: "Traditional dual-tone ring" },
  { id: "digital", name: "Digital", desc: "Modern double beep" },
  { id: "chime", name: "Chime", desc: "Soft ascending bells" },
  { id: "retro", name: "Retro bell", desc: "Old-school telephone trill" },
];

const KEY = "dg-ringtone";
export const getRingtone = (): RingtoneId => {
  try {
    const v = localStorage.getItem(KEY) as RingtoneId | null;
    return v && RINGTONES.some((r) => r.id === v) ? v : "classic";
  } catch { return "classic"; }
};
export const setRingtone = (id: RingtoneId): void => {
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
};

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/** One tone with a soft attack/decay envelope. */
function tone(c: AudioContext, freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.03);
  gain.gain.setValueAtTime(vol, at + dur * 0.75);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(at); osc.stop(at + dur + 0.05);
}

/* Each style: a burst renderer + how often the burst repeats. */
const STYLES: Record<RingtoneId, { burst: (c: AudioContext) => void; intervalMs: number }> = {
  // iPhone-style marimba: a bouncing wooden arpeggio that repeats.
  marimba: {
    intervalMs: 1650,
    burst: (c) => {
      const t = c.currentTime;
      const notes = [1046, 1568, 1318, 2093, 1568, 1318, 1046, 1568];
      notes.forEach((f, i) => tone(c, f, t + i * 0.135, 0.2, 0.13, "triangle"));
    },
  },
  // Gentle modern default — soft sine notes rising and settling.
  reflection: {
    intervalMs: 2600,
    burst: (c) => {
      const t = c.currentTime;
      [880, 1108, 1318, 1108].forEach((f, i) => tone(c, f, t + i * 0.22, 0.7, 0.12, "sine"));
    },
  },
  // Shimmering high bells.
  crystal: {
    intervalMs: 2200,
    burst: (c) => {
      const t = c.currentTime;
      [1568, 2093, 2637, 2093, 1760].forEach((f, i) => tone(c, f, t + i * 0.12, 0.5, 0.1, "sine"));
    },
  },
  // Bright alert — two quick ascending tone pairs.
  signal: {
    intervalMs: 2000,
    burst: (c) => {
      const t = c.currentTime;
      for (const dt of [0, 0.32]) { tone(c, 1046, t + dt, 0.14, 0.17, "square"); tone(c, 1568, t + dt + 0.12, 0.16, 0.15, "square"); }
    },
  },
  // Bouncy xylophone riff (à la iPhone "Playtime").
  playtime: {
    intervalMs: 1900,
    burst: (c) => {
      const t = c.currentTime;
      [1318, 1046, 1568, 1046, 1760, 1318].forEach((f, i) => tone(c, f, t + i * 0.15, 0.22, 0.13, "triangle"));
    },
  },
  classic: {
    intervalMs: 3000,
    burst: (c) => { const t = c.currentTime; for (const f of [440, 480]) tone(c, f, t, 1.55, 0.18); },
  },
  digital: {
    intervalMs: 2100,
    burst: (c) => {
      const t = c.currentTime;
      for (const dt of [0, 0.28]) { tone(c, 932, t + dt, 0.16, 0.2); tone(c, 1245, t + dt, 0.16, 0.12); }
    },
  },
  chime: {
    intervalMs: 2700,
    burst: (c) => {
      const t = c.currentTime;
      [659, 880, 1109].forEach((f, i) => tone(c, f, t + i * 0.17, 0.9, 0.16, "triangle"));
    },
  },
  retro: {
    intervalMs: 2800,
    burst: (c) => {
      // Rapid bell trill: amplitude-modulated tone pair, like a mechanical bell.
      const t = c.currentTime, dur = 1.3;
      for (const f of [620, 780]) {
        const osc = c.createOscillator(); const gain = c.createGain();
        const lfo = c.createOscillator(); const lfoGain = c.createGain();
        osc.type = "square"; osc.frequency.value = f;
        gain.gain.value = 0.0001;
        gain.gain.setValueAtTime(0.055, t + 0.02);
        gain.gain.setValueAtTime(0.055, t + dur - 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        lfo.frequency.value = 21; lfoGain.gain.value = 0.05;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(t); osc.stop(t + dur + 0.05);
        lfo.start(t); lfo.stop(t + dur + 0.05);
      }
    },
  },
};

function makeCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const c = new AC();
    c.resume?.().catch(() => {});
    return c;
  } catch { return null; }
}

/** Loop the SELECTED ringtone while an incoming call rings. */
export function startRingtone(): void {
  stopRingtone();
  const style = STYLES[getRingtone()];
  ctx = makeCtx();
  if (!ctx) return;
  style.burst(ctx);
  timer = setInterval(() => { if (ctx) style.burst(ctx); }, style.intervalMs);
}

export function stopRingtone(): void {
  if (timer) { clearInterval(timer); timer = null; }
  if (ctx) { try { ctx.close(); } catch { /* ignore */ } ctx = null; }
}

/** Play a single burst of a style (settings preview). */
export function previewRingtone(id: RingtoneId): void {
  stopRingtone();
  const c = makeCtx();
  if (!c) return;
  STYLES[id].burst(c);
  setTimeout(() => { try { c.close(); } catch { /* ignore */ } }, 2000);
}

const SMS_SOUND_KEY = "dg-sms-sound";
/** Whether the incoming-message chime is enabled (default on). */
export const getSmsSoundOn = (): boolean => {
  try { return localStorage.getItem(SMS_SOUND_KEY) !== "off"; } catch { return true; }
};
export const setSmsSoundOn = (on: boolean): void => {
  try { localStorage.setItem(SMS_SOUND_KEY, on ? "on" : "off"); } catch { /* ignore */ }
};

/* Selectable message tones (short, non-looping — distinct from call ringtones). */
export type MessageToneId = "tritone" | "note" | "bamboo" | "chime" | "ding" | "pop";
export const MESSAGE_TONES: Array<{ id: MessageToneId; name: string; desc: string }> = [
  { id: "tritone", name: "Tri-tone", desc: "Classic iPhone text tone" },
  { id: "note", name: "Note", desc: "Single soft bell" },
  { id: "bamboo", name: "Bamboo", desc: "Hollow wooden knock" },
  { id: "chime", name: "Chime", desc: "Soft rising two-note" },
  { id: "ding", name: "Ding", desc: "Bright single bell" },
  { id: "pop", name: "Pop", desc: "Quick percussive blip" },
];

const MSG_TONE_KEY = "dg-sms-tone";
export const getMessageTone = (): MessageToneId => {
  try {
    const v = localStorage.getItem(MSG_TONE_KEY) as MessageToneId | null;
    return v && MESSAGE_TONES.some((m) => m.id === v) ? v : "chime";
  } catch { return "chime"; }
};
export const setMessageTone = (id: MessageToneId): void => {
  try { localStorage.setItem(MSG_TONE_KEY, id); } catch { /* ignore */ }
};

const MSG_STYLES: Record<MessageToneId, (c: AudioContext) => void> = {
  tritone: (c) => { const t = c.currentTime; [1319, 1760, 1319].forEach((f, i) => tone(c, f, t + i * 0.12, 0.15, 0.13)); },
  note: (c) => { const t = c.currentTime; tone(c, 1760, t, 0.55, 0.14, "sine"); tone(c, 2637, t, 0.3, 0.04, "sine"); },
  bamboo: (c) => { const t = c.currentTime; for (const dt of [0, 0.16]) tone(c, 587, t + dt, 0.12, 0.16, "triangle"); },
  chime: (c) => { const t = c.currentTime; tone(c, 880, t, 0.16, 0.14); tone(c, 1318, t + 0.13, 0.28, 0.13); },
  ding: (c) => { const t = c.currentTime; tone(c, 1568, t, 0.5, 0.16); tone(c, 3136, t, 0.4, 0.045); },
  pop: (c) => { const t = c.currentTime; tone(c, 660, t, 0.09, 0.17, "triangle"); tone(c, 990, t + 0.06, 0.11, 0.13, "triangle"); },
};

/** Play the SELECTED message tone once (for a new inbound SMS). */
export function playMessageChime(): void {
  const c = makeCtx();
  if (!c) return;
  MSG_STYLES[getMessageTone()](c);
  setTimeout(() => { try { c.close(); } catch { /* ignore */ } }, 1000);
}

/** Play one message tone (settings preview). */
export function previewMessageTone(id: MessageToneId): void {
  const c = makeCtx();
  if (!c) return;
  MSG_STYLES[id](c);
  setTimeout(() => { try { c.close(); } catch { /* ignore */ } }, 1000);
}

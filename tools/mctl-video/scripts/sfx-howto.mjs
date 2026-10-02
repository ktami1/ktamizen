// Musica ed effetti sintetizzati in codice, sulla stessa timeline del video (src/tutorial/timeline.json).
// Uscita: public/howto-music.wav (48 kHz, 16 bit, stereo).
import {readFileSync, writeFileSync} from 'node:fs';

const T = JSON.parse(readFileSync(new URL('../src/tutorial/timeline.json', import.meta.url)));
const SR = 48000;
const DUR = T.duration / T.fps + 0.5;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 0.5; // 120 BPM
const fr = (f) => f / T.fps;

// Rumore con seed (mulberry32), mai Math.random
let seed = 1234567;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const add = (t0, len, fn, gain = 1, pan = 0) => {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  const gl = gain * Math.min(1, 1 - pan);
  const gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR);
    L[k] += v * gl;
    R[k] += v * gr;
  }
};

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------------------------------------------------------- voci

const kick = (t, g = 1) =>
  add(t, 0.45, (x) => {
    const f = 45 + 110 * Math.exp(-x * 28);
    const ph = 2 * Math.PI * (45 * x + (110 / 28) * (1 - Math.exp(-x * 28)));
    return Math.sin(ph) * Math.exp(-x * 7) * (f > 0 ? 1 : 0);
  }, 0.9 * g);

const hat = (t, g = 1) => {
  let prev = 0;
  add(t, 0.06, (x) => {
    const n = rnd() * 2 - 1;
    const hp = n - prev;
    prev = n;
    return hp * Math.exp(-x * 70);
  }, 0.09 * g, 0.25);
};

const clap = (t, g = 1) =>
  add(t, 0.22, (x) => {
    const n = rnd() * 2 - 1;
    const env = (x < 0.01 ? 1 : x < 0.02 ? 0.6 : 1) * Math.exp(-x * 22);
    return n * env;
  }, 0.16 * g, -0.1);

const pluck = (t, note, len = 0.3, g = 1, pan = 0) => {
  const f = midi(note);
  add(t, len, (x) => {
    const env = Math.min(1, x * 400) * Math.exp(-x * (5 / len));
    return (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(4 * Math.PI * f * x) + 0.12 * Math.sin(6 * Math.PI * f * x)) * env;
  }, 0.16 * g, pan);
};

const bass = (t, note, len = 0.45, g = 1) => {
  const f = midi(note);
  add(t, len, (x) => {
    const env = Math.min(1, x * 300) * Math.exp(-x * 4);
    const s = Math.sin(2 * Math.PI * f * x);
    return Math.tanh(s * 2.2) * env;
  }, 0.24 * g);
};

const pop = (t, f0, g = 1, pan = 0) =>
  add(t, 0.12, (x) => {
    const f = f0 * (1 + 0.8 * Math.min(1, x * 30));
    return Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 38);
  }, 0.32 * g, pan);

const click = (t, g = 1) =>
  add(t, 0.03, (x) => (rnd() * 2 - 1) * Math.exp(-x * 260) + Math.sin(2 * Math.PI * 2600 * x) * Math.exp(-x * 180), 0.22 * g, 0.2);

const chime = (t, notes, g = 1) =>
  notes.forEach((n, i) =>
    add(t + i * 0.07, 0.9, (x) => {
      const f = midi(n);
      return (Math.sin(2 * Math.PI * f * x) + 0.25 * Math.sin(2 * Math.PI * f * 2.01 * x)) * Math.exp(-x * 5);
    }, 0.17 * g, i % 2 ? 0.2 : -0.2),
  );

const whoosh = (t, len = 0.5, g = 1, up = true) => {
  let lp = 0;
  add(t, len, (x) => {
    const p = x / len;
    const cut = up ? 0.02 + 0.5 * p : 0.52 - 0.5 * p;
    lp += cut * ((rnd() * 2 - 1) - lp);
    return lp * Math.sin(Math.PI * p);
  }, 0.55 * g);
};

const riser = (t, len, g = 1) => {
  let lp = 0;
  add(t, len, (x) => {
    const p = x / len;
    lp += (0.01 + 0.4 * p * p) * ((rnd() * 2 - 1) - lp);
    return (lp * 1.4 + 0.12 * Math.sin(2 * Math.PI * (200 + 600 * p * p) * x)) * p * p;
  }, 0.5 * g);
};

// ---------------------------------------------------------------- sottofondo leggero (Re maggiore)

const sec = (f) => f / T.fps;
const off = T.start.steps;
const S = T.steps;
const at = (f) => sec(off + f);
const prog = [[62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69]];
const roots = [38, 35, 31, 33];
const endBeat = Math.floor(sec(T.start.end) / BEAT);
for (let b = 0; b < endBeat; b++) {
  const t = b * BEAT;
  const bar = Math.floor(b / 4);
  kick(t, 0.55);
  hat(t + BEAT / 2, 0.8);
  bass(t, roots[bar % 4], 0.35, 0.7);
  for (let s = 0; s < 2; s++) pluck(t + s * BEAT / 2, prog[bar % 4][(b * 2 + s) % 4] + 12, 0.3, 0.55, s ? 0.25 : -0.25);
}

// ---------------------------------------------------------------- azioni

whoosh(sec(T.start.steps) - 0.2, 0.5, 0.6);
S.active.forEach((f, i) => { if (i) pop(at(f), 600 + i * 90, 0.6); });
click(at(S.dblclick[0]), 1.2); click(at(S.dblclick[1]), 1.2);
whoosh(at(S.toLogin), 0.45, 0.5);
for (let i = 0; i < 9; i++) click(at(S.user[0]) + i * (sec(S.user[1] - S.user[0]) / 9), 0.7);
for (let i = 0; i < 8; i++) click(at(S.pass[0]) + i * (sec(S.pass[1] - S.pass[0]) / 8), 0.7);
click(at(S.login), 1.2);
whoosh(at(S.toApp), 0.45, 0.5);
S.typing.forEach(([f]) => click(at(f), 1));
click(at(S.reveal), 1.3);
chime(at(S.reveal) + 0.03, [74, 78, 81], 1.1);
for (let i = 0; i < 3; i++) pop(at(S.callouts + i * 10), 820 + i * 120, 0.6);
whoosh(sec(T.start.end) - 0.2, 0.55, 0.7);
const endT = sec(T.start.end + 4);
kick(endT, 1.1);
bass(endT, 38, 1.6, 1.1);
[62, 69, 74, 78, 81].forEach((n, i) =>
  add(endT + i * 0.05, 2.4, (x) => Math.sin(2 * Math.PI * midi(n) * x) * Math.exp(-x * 1.4) * Math.min(1, x * 50), 0.1, (i - 2) * 0.2),
);

// ---------------------------------------------------------------- master: soft clip, normalizzazione, WAV

let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
const fadeOut = Math.floor(0.4 * SR);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fo = i > N - fadeOut ? (N - i) / fadeOut : 1;
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm * fo)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm * fo)) * 32767), 46 + i * 4);
}
writeFileSync(new URL('../public/howto-music.wav', import.meta.url), buf);
console.log(`public/howto-music.wav  ${DUR.toFixed(1)}s`);

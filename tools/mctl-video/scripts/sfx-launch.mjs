// Musica ed effetti sintetizzati in codice, sulla stessa timeline del video (src/launch/timeline.json).
// Uscita: public/launch-music.wav (48 kHz, 16 bit, stereo).
import {readFileSync, writeFileSync} from 'node:fs';

const T = JSON.parse(readFileSync(new URL('../src/launch/timeline.json', import.meta.url)));
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

// ---------------------------------------------------------------- pianoforte "felt"

const piano = (t, note, len = 2.2, g = 1, pan = 0) => {
  const f = midi(note);
  add(t, len, (x) => {
    const env = Math.min(1, x * 180) * Math.exp(-x * 2.2);
    const s = Math.sin(2 * Math.PI * f * x) + 0.42 * Math.sin(4 * Math.PI * f * x) * Math.exp(-x * 3)
      + 0.18 * Math.sin(6 * Math.PI * f * x) * Math.exp(-x * 5) + 0.06 * Math.sin(2 * Math.PI * f * 4.02 * x) * Math.exp(-x * 8);
    return s * env;
  }, 0.11 * g, pan);
};
const chord = (t, notes, g = 1, len = 2.4) => notes.forEach((n, i) => piano(t + i * 0.012, n, len, g, (i - notes.length / 2) * 0.12));
const sub = (t, g = 1) => add(t, 0.5, (x) => Math.sin(2 * Math.PI * 48 * x) * Math.exp(-x * 6) * Math.min(1, x * 200), 0.5 * g);
const boom = (t, g = 1) => { kick(t, 1.3 * g); add(t, 1.6, (x) => Math.sin(2 * Math.PI * (38 + 20 * Math.exp(-x * 4)) * x) * Math.exp(-x * 2.2), 0.45 * g); };

const S = T.start;
const sec = (f) => f / T.fps;

// ---------------------------------------------------------------- 1. Il problema: pianoforte e battito (La minore)

const amb = [[57, 64, 69], [53, 60, 65, 69], [48, 55, 64], [55, 59, 62, 67]];
for (let b = 0; b * 1.0 < sec(S.intro) - 0.5; b++) {
  const t = b * 1.0;
  chord(t, amb[Math.floor(b / 2) % 4], b % 2 ? 0.6 : 0.9);
  sub(t, 0.7); sub(t + 0.25, 0.35);
}
boom(sec(S.hook + 54), 0.9);          // "10–15 richieste password."
whoosh(sec(S.tickets) - 0.2, 0.6, 0.7);
for (let i = 0; i < 9; i++) pop(sec(S.tickets + 30 + (8 - i) * 4), 520 + i * 35, 0.45, i % 2 ? 0.3 : -0.3);
pop(sec(S.tickets + 6), 700, 0.7);
for (let i = 0; i < 18; i++) click(sec(S.oldWay) + i * 0.15, 0.35);
chime(sec(S.oldWay + 50), [69], 0.6);

// ---------------------------------------------------------------- 2. Presentiamo: crescendo e colpo

riser(sec(S.intro) - 1.6, 1.7, 1.1);
boom(sec(S.intro + 20), 1.3);
chord(sec(S.intro + 20), [45, 57, 64, 69, 73, 76], 1.6, 3.5);  // La maggiore: la svolta
chime(sec(S.intro + 34), [81, 85, 88], 0.7);

// ---------------------------------------------------------------- 3. Prodotto e ticket chiuso: groove a 120 BPM (La maggiore)

const prog = [[69, 73, 76, 81], [66, 69, 73, 78], [62, 66, 69, 74], [64, 68, 71, 76]];
const roots = [33, 30, 26, 28];
const g0 = sec(S.product), g1 = sec(S.security);
for (let b = 0; g0 + b * BEAT < g1; b++) {
  const t = g0 + b * BEAT;
  const bar = Math.floor(b / 4);
  kick(t, 0.85);
  hat(t + BEAT / 2, 1);
  hat(t + BEAT / 4, 0.4); hat(t + 3 * BEAT / 4, 0.4);
  if (b % 2 === 1) clap(t, 0.8);
  bass(t, roots[bar % 4], 0.4);
  bass(t + BEAT * 0.75, roots[bar % 4] + 12, 0.18, 0.5);
  for (let s = 0; s < 4; s++) pluck(t + s * BEAT / 4, prog[bar % 4][(b * 4 + s) % 4], 0.2, 0.7, s % 2 ? 0.3 : -0.3);
}
const P = T.product;
P.typing.forEach(([f]) => click(sec(S.product + f), 1.1));
click(sec(S.product + P.reveal), 1.3);
chime(sec(S.product + P.reveal) + 0.03, [76, 81, 85], 1.1);
pop(sec(S.product + P.reveal + 10), 900, 0.6);
whoosh(sec(S.resolved) - 0.2, 0.6, 0.8);
// conto alla rovescia 15 → 0, poi la conferma
for (let i = 0; i < 15; i++) { const x = 1 - Math.sqrt(1 - (i + 1) / 15); click(sec(S.resolved + 10 + x * 42), 0.8); }
boom(sec(S.resolved + 52), 0.8);
chime(sec(S.resolved + 52), [81, 85, 88, 93], 1.1);

// ---------------------------------------------------------------- 4. Sicurezza: quattro colpi

riser(sec(S.security) - 1, 1.05, 0.8);
for (let i = 0; i < 4; i++) {
  const t = sec(S.security + i * T.security.step);
  boom(t, 0.9);
  chord(t, [[57, 64, 69, 76], [54, 61, 66, 73], [50, 57, 62, 69], [52, 59, 64, 71]][i], 1.1, 1.4);
}

// ---------------------------------------------------------------- 5. Chiusura

const endT = sec(S.outro + 4);
boom(endT, 1.2);
chord(endT, [33, 45, 57, 64, 69, 73, 76, 81], 1.4, 3.2);
chime(endT + 0.4, [88, 93], 0.6);

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
writeFileSync(new URL('../public/launch-music.wav', import.meta.url), buf);
console.log(`public/launch-music.wav  ${DUR.toFixed(1)}s`);

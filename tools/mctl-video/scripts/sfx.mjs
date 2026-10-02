// Musica ed effetti sintetizzati in codice, sulla stessa timeline del video (src/timeline.json).
// Uscita: public/music.wav (48 kHz, 16 bit, stereo).
import {readFileSync, writeFileSync} from 'node:fs';

const T = JSON.parse(readFileSync(new URL('../src/timeline.json', import.meta.url)));
const SR = 48000;
const DUR = T.duration / T.fps + 0.5;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 60 / T.bpm;
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

// ---------------------------------------------------------------- musica (La minore: Am - F - C - G)

const total = Math.floor((T.duration / T.fps) / BEAT);
const prog = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]];
const roots = [33, 29, 36, 31];
const endBeat = Math.round(fr(T.toF) / BEAT);

for (let b = 0; b < total; b++) {
  const t = b * BEAT;
  const bar = Math.floor(b / 4);
  const chord = prog[bar % 4];
  const inC = t >= fr(T.toC) && t < fr(T.morph);
  if (b < endBeat) {
    kick(t, inC ? 0.7 : 1);
    hat(t + BEAT / 2, 1.2);
    if (t >= fr(T.toB)) { hat(t + BEAT / 4, 0.5); hat(t + 3 * BEAT / 4, 0.5); }
    if (b % 2 === 1 && t >= fr(T.toB)) clap(t);
    bass(t, roots[bar % 4], 0.4);
    bass(t + BEAT * 0.75, roots[bar % 4] + 12, 0.18, 0.6);
    if (t >= fr(T.toB)) {
      for (let s = 0; s < 4; s++) pluck(t + s * BEAT / 4, chord[(b * 4 + s) % 4] + 12, 0.22, t >= fr(T.morph) ? 0.9 : 0.6, s % 2 ? 0.3 : -0.3);
    }
  }
}

// ---------------------------------------------------------------- effetti sulla timeline

T.requests.forEach((f, i) => pop(fr(f), 520 + i * 45, 1, i % 2 ? 0.25 : -0.25));
whoosh(fr(T.toB) - 0.15, 0.55);
T.steps.forEach((f) => pop(fr(f), 380, 0.8));
whoosh(fr(T.toC) - 0.1, 0.6);
for (let i = 0; i < 14; i++) click(fr(T.scan[0]) + i * (fr(T.scan[1] - T.scan[0]) / 13), 0.6);
chime(fr(T.scan[1]), [76], 0.7);
for (let k = 0; k < 9; k++) pop(fr(T.labels + k * 3), 700 + k * 40, 0.55);
whoosh(fr(T.morph) - 0.1, 0.5, 1, false);
T.clicks.forEach((f) => click(fr(f), 1.3));
T.typing.forEach(([f]) => click(fr(f), 1));
const chords = {open: [72, 76, 79], pause: [72, 74], closed: [72, 67]};
T.reveal.forEach(([f, s]) => chime(fr(f) + 0.03, chords[s], 1));
riser(fr(T.toE) - 1.2, 1.25, 0.9);
kick(fr(T.toE) + 0.25, 1.4);
whoosh(fr(T.toE), 0.7, 1.2);
for (let i = 0; i < 10; i++) pop(fr(T.checks + i * 2.5), 600 + i * 60, 0.8, (i / 9) * 0.8 - 0.4);
whoosh(fr(T.toF) - 0.1, 0.6);
// accordo finale
const endT = fr(T.toF) + 0.45;
kick(endT, 1.2);
bass(endT, 33, 1.6, 1.2);
[57, 64, 69, 71, 76].forEach((n, i) =>
  add(endT + i * 0.05, 2.5, (x) => Math.sin(2 * Math.PI * midi(n) * x) * Math.exp(-x * 1.4) * Math.min(1, x * 50), 0.1, (i - 2) * 0.2),
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
writeFileSync(new URL('../public/music.wav', import.meta.url), buf);
console.log(`public/music.wav  ${DUR.toFixed(1)}s`);

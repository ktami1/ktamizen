/**
 * Disegno del parco su canvas 2D. Tutto in unità mondo (altezza 540).
 */
import {
  AIR_BOTTOM, GameWorld, Obstacle, PLAYER_X, Pickup, Player, WORLD_H,
} from './parkEngine';

/* ------------------------------------------------------------------ */
/* Palette (una per livello)                                           */
/* ------------------------------------------------------------------ */

export interface Palette {
  skyTop: string; skyBot: string;
  sun: string; sunGlow: string;
  hillFar: string; hillNear: string;
  grass: string; grassDark: string;
  path: string; pathEdge: string;
  tree: string; leaf: string; leaf2: string;
  cloud: string;
  night: boolean;
  name: string;
}

export const PALETTES: Palette[] = [
  { name: 'Mattina',   skyTop: '#7fe3ff', skyBot: '#e8fbd0', sun: '#fff27a', sunGlow: 'rgba(255,242,122,.55)', hillFar: '#9be89b', hillNear: '#6fd97a', grass: '#5ed46a', grassDark: '#3fb552', path: '#f7dfa8', pathEdge: '#e6c684', tree: '#8b5e3c', leaf: '#43c463', leaf2: '#2ea44f', cloud: '#ffffff', night: false },
  { name: 'Sole',      skyTop: '#4ec3ff', skyBot: '#cdf5ff', sun: '#ffe066', sunGlow: 'rgba(255,224,102,.5)',  hillFar: '#8fe0a5', hillNear: '#5fd07d', grass: '#57cf6b', grassDark: '#37ac4f', path: '#ffe6b0', pathEdge: '#efcd8b', tree: '#8b5e3c', leaf: '#3dbd5d', leaf2: '#2a9c4b', cloud: '#ffffff', night: false },
  { name: 'Fiorito',   skyTop: '#6fd6ff', skyBot: '#ffeeb5', sun: '#ffd93d', sunGlow: 'rgba(255,217,61,.5)',   hillFar: '#a8e6a1', hillNear: '#67d17f', grass: '#61d96f', grassDark: '#3cb355', path: '#ffe1a0', pathEdge: '#eec87f', tree: '#9a6842', leaf: '#4ac96a', leaf2: '#2fa14e', cloud: '#ffffff', night: false },
  { name: 'Tramonto',  skyTop: '#ff9f5a', skyBot: '#ffe1a8', sun: '#ff7a45', sunGlow: 'rgba(255,122,69,.45)',  hillFar: '#d99a6c', hillNear: '#b8794f', grass: '#79c46a', grassDark: '#4f9a4c', path: '#ffd9a0', pathEdge: '#e6b878', tree: '#7a4b2e', leaf: '#59b05a', leaf2: '#3d8b45', cloud: '#ffd9c2', night: false },
  { name: 'Rosa',      skyTop: '#ff6fa5', skyBot: '#ffc98a', sun: '#fff0a0', sunGlow: 'rgba(255,240,160,.5)',  hillFar: '#c86f9a', hillNear: '#9c5480', grass: '#6ab86a', grassDark: '#458f4b', path: '#ffd0b0', pathEdge: '#e5ab8d', tree: '#6f4430', leaf: '#4faa5c', leaf2: '#3a8348', cloud: '#ffd5e6', night: false },
  { name: 'Viola',     skyTop: '#7b5cff', skyBot: '#ff96c8', sun: '#ffe9a8', sunGlow: 'rgba(255,233,168,.45)', hillFar: '#6a4fb5', hillNear: '#4d3a8c', grass: '#4faa5c', grassDark: '#357a4a', path: '#e9c9ef', pathEdge: '#c9a3d4', tree: '#5b3a2c', leaf: '#3f8f57', leaf2: '#2c6f43', cloud: '#e6d4ff', night: false },
  { name: 'Stellata',  skyTop: '#1b2a6b', skyBot: '#5a45a8', sun: '#fff8dc', sunGlow: 'rgba(255,248,220,.35)', hillFar: '#2c2a63', hillNear: '#1f1f4d', grass: '#2f7a54', grassDark: '#1f5c40', path: '#8b86c8', pathEdge: '#6d69a8', tree: '#3a2a25', leaf: '#2b7a4b', leaf2: '#1e5c39', cloud: '#8f9ad6', night: true },
  { name: 'Magica',    skyTop: '#101036', skyBot: '#33195e', sun: '#fdfbe8', sunGlow: 'rgba(253,251,232,.35)', hillFar: '#241a52', hillNear: '#1a1240', grass: '#2a6b4c', grassDark: '#1b4d38', path: '#7f6cc0', pathEdge: '#63539c', tree: '#31241f', leaf: '#26694a', leaf2: '#1a4d36', cloud: '#7d74c9', night: true },
];

export function paletteFor(level: number): Palette {
  return PALETTES[Math.max(0, Math.min(PALETTES.length - 1, level - 1))];
}

/* ------------------------------------------------------------------ */
/* Primitive                                                           */
/* ------------------------------------------------------------------ */

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

export function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r1: number, r2: number, n = 5, rot = 0): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = rot + (i * Math.PI) / n - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.5, x - s * 0.45, y - s, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.5, x, y + s * 0.35);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Sfondo                                                              */
/* ------------------------------------------------------------------ */

function drawSky(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette, t: number): void {
  const g = ctx.createLinearGradient(0, w.viewTop, 0, w.groundY + 40);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(1, p.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, w.viewTop - 4, w.width, WORLD_H - w.viewTop + 8);

  if (p.night) {
    const top = w.viewTop + 10;
    const band = w.groundY - 120 - top;
    for (let i = 0; i < 52; i++) {
      const sx = (i * 137.5) % w.width;
      const sy = top + ((i * 71.3) % band);
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + i);
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, 2.4, 2.4);
      if (i % 7 === 0) {
        ctx.globalAlpha = tw * 0.8;
        starPath(ctx, sx, sy, 7, 2.6, 4, t * 0.6);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawSun(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette, t: number): void {
  const x = w.width - 130;
  const y = w.viewTop + 96;
  const r = 44;
  ctx.save();

  // alone morbido
  const glow = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 2.2 + Math.sin(t * 1.6) * 4);
  glow.addColorStop(0, p.sunGlow);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  circle(ctx, x, y, r * 2.2 + 6);
  ctx.fill();

  if (p.night) {
    // luna: mezzaluna disegnata con due archi, niente ritagli sul canvas
    ctx.fillStyle = p.sun;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.42, Math.PI * 1.58, false);
    ctx.arc(x + 12, y, r * 1.06, Math.PI * 1.42, Math.PI * 0.58, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.07)';
    circle(ctx, x - 16, y - 12, 7); ctx.fill();
    circle(ctx, x - 10, y + 14, 5); ctx.fill();
  } else {
    // raggi che girano piano
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.28);
    ctx.fillStyle = p.sunGlow;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      rr(ctx, -4, -r - 34, 8, 26, 4);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = p.sun;
    circle(ctx, x, y, r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    circle(ctx, x - 12, y - 12, r * 0.42);
    ctx.fill();
  }
  ctx.restore();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  circle(ctx, x, y, 26 * s); ctx.fill();
  circle(ctx, x + 26 * s, y + 6 * s, 20 * s); ctx.fill();
  circle(ctx, x - 26 * s, y + 8 * s, 18 * s); ctx.fill();
  circle(ctx, x + 6 * s, y - 16 * s, 20 * s); ctx.fill();
  rr(ctx, x - 40 * s, y + 2 * s, 80 * s, 22 * s, 12 * s); ctx.fill();
}

function drawClouds(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette, t: number): void {
  const span = w.width + 320;
  // il cielo può essere molto alto (iPad in verticale): sparpaglia le nuvole
  const skyTop = w.viewTop + 40;
  const skyH = Math.max(80, w.groundY - 170 - skyTop);
  const n = Math.max(5, Math.min(12, Math.round(skyH / 95)));
  ctx.globalAlpha = p.night ? 0.35 : 0.92;
  for (let i = 0; i < n; i++) {
    const base = (i * 263 + 60) % span;
    const x = ((base - w.distance * 0.1) % span + span) % span - 160;
    const y = skyTop + ((i * 137) % skyH) + Math.sin(t * 0.8 + i) * 6;
    cloud(ctx, x, y, 0.62 + (i % 3) * 0.22, p.cloud);
  }
  ctx.globalAlpha = 1;
}

/** Mongolfiere lontane: riempiono il cielo e danno profondità. */
function drawSkyDecor(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette, t: number): void {
  const skyTop = w.viewTop + 60;
  const skyH = Math.max(60, w.groundY - 210 - skyTop);
  const span = w.width + 900;
  const cols = [['#ff5d8f', '#ffd166'], ['#4cc9ff', '#b06bff'], ['#3ddc97', '#ffd166']];
  for (let i = 0; i < 3; i++) {
    const base = (i * 470 + 120) % span;
    const x = ((base - w.distance * 0.06) % span + span) % span - 200;
    if (x < -140 || x > w.width + 140) continue;
    const y = skyTop + ((i * 211) % skyH) + Math.sin(t * 0.5 + i * 2) * 10;
    const s = 0.7 + (i % 2) * 0.25;
    ctx.save();
    ctx.globalAlpha = p.night ? 0.6 : 0.95;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, 34); ctx.lineTo(-5, 48);
    ctx.moveTo(9, 34); ctx.lineTo(5, 48);
    ctx.stroke();
    ctx.fillStyle = cols[i][0];
    ctx.beginPath();
    ctx.ellipse(0, 8, 26, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cols[i][1];
    ctx.beginPath();
    ctx.ellipse(0, 8, 9, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-19, 12, 6, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(19, 12, 6, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a9662f';
    rr(ctx, -9, 46, 18, 14, 4);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawHills(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette): void {
  const drawLayer = (par: number, amp: number, base: number, color: string) => {
    const off = (w.distance * par) % 400;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-100, w.groundY + 30);
    for (let x = -100; x <= w.width + 100; x += 20) {
      const y = base - Math.sin((x + off) * 0.008) * amp - Math.sin((x + off) * 0.021) * amp * 0.45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w.width + 100, w.groundY + 30);
    ctx.closePath();
    ctx.fill();
  };
  drawLayer(0.12, 34, w.groundY - 92, p.hillFar);
  drawLayer(0.22, 26, w.groundY - 52, p.hillNear);
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, p: Palette, t: number): void {
  const sway = Math.sin(t * 1.1 + x * 0.01) * 3 * s;
  ctx.fillStyle = p.tree;
  rr(ctx, x - 7 * s, y - 62 * s, 14 * s, 64 * s, 5 * s);
  ctx.fill();
  ctx.fillStyle = p.leaf2;
  circle(ctx, x + sway - 22 * s, y - 66 * s, 26 * s); ctx.fill();
  circle(ctx, x + sway + 22 * s, y - 70 * s, 24 * s); ctx.fill();
  ctx.fillStyle = p.leaf;
  circle(ctx, x + sway, y - 92 * s, 34 * s); ctx.fill();
  circle(ctx, x + sway - 16 * s, y - 74 * s, 22 * s); ctx.fill();
  circle(ctx, x + sway + 18 * s, y - 78 * s, 20 * s); ctx.fill();
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, t: number): void {
  ctx.fillStyle = p.night ? '#2b2b4a' : '#4b5563';
  rr(ctx, x - 4, y - 118, 8, 118, 4); ctx.fill();
  rr(ctx, x - 16, y - 4, 32, 8, 4); ctx.fill();
  ctx.fillStyle = p.night ? '#ffe9a8' : '#cbd5e1';
  circle(ctx, x, y - 126, 13); ctx.fill();
  if (p.night) {
    const g = ctx.createRadialGradient(x, y - 126, 4, x, y - 126, 60);
    g.addColorStop(0, 'rgba(255,233,168,.55)');
    g.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = g;
    circle(ctx, x, y - 126, 60 + Math.sin(t * 2) * 3); ctx.fill();
  }
}

function bgSwing(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, t: number): void {
  ctx.strokeStyle = p.night ? '#3b3b66' : '#6b7280';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 40, y); ctx.lineTo(x - 14, y - 88);
  ctx.moveTo(x + 40, y); ctx.lineTo(x + 14, y - 88);
  ctx.moveTo(x - 18, y - 88); ctx.lineTo(x + 18, y - 88);
  ctx.stroke();
  const a = Math.sin(t * 1.8) * 0.34;
  ctx.save();
  ctx.translate(x, y - 88);
  ctx.rotate(a);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-11, 0); ctx.lineTo(-11, 52);
  ctx.moveTo(11, 0); ctx.lineTo(11, 52);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  rr(ctx, -17, 52, 34, 9, 4); ctx.fill();
  ctx.restore();
}

function drawMidground(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette, t: number): void {
  const span = 620;
  const off = (w.distance * 0.42) % span;
  const y = w.groundY - 26;
  for (let i = -1; i * span - off < w.width + span; i++) {
    const bx = i * span - off;
    tree(ctx, bx + 60, y, 1.05, p, t);
    tree(ctx, bx + 190, y, 0.8, p, t);
    lamp(ctx, bx + 300, y, p, t);
    bgSwing(ctx, bx + 430, y, p, t);
    tree(ctx, bx + 545, y, 0.92, p, t);
  }
}

function drawGround(ctx: CanvasRenderingContext2D, w: GameWorld, p: Palette): void {
  const gy = w.groundY;
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, gy, w.width, WORLD_H - gy);

  // sentiero: il bambino ci corre sopra, quindi passa sotto i piedi
  ctx.fillStyle = p.path;
  ctx.fillRect(0, gy - 16, w.width, 62);
  ctx.fillStyle = p.pathEdge;
  ctx.fillRect(0, gy - 16, w.width, 5);
  ctx.fillRect(0, gy + 42, w.width, 4);

  // trattini del sentiero
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  const dash = 64;
  const off = w.distance % dash;
  for (let x = -off; x < w.width + dash; x += dash) {
    rr(ctx, x, gy + 24, 30, 6, 3);
    ctx.fill();
  }

  ctx.fillStyle = p.grassDark;
  ctx.fillRect(0, gy + 46, w.width, WORLD_H - gy - 46);

  // ciuffi d'erba in primo piano
  const span2 = 46;
  const off2 = (w.distance * 1.25) % span2;
  ctx.fillStyle = p.grass;
  for (let x = -off2; x < w.width + span2; x += span2) {
    ctx.beginPath();
    ctx.moveTo(x, WORLD_H);
    ctx.quadraticCurveTo(x + 6, gy + 62, x + 14, WORLD_H);
    ctx.fill();
  }
  const flowers = ['#ff5d8f', '#ffd93d', '#ffffff', '#a78bfa'];
  const span3 = 190;
  const off3 = (w.distance * 1.25) % span3;
  for (let i = 0, x = -off3; x < w.width + span3; x += span3, i++) {
    ctx.fillStyle = flowers[(i + Math.floor(w.distance / span3)) % flowers.length];
    circle(ctx, x + 20, WORLD_H - 26, 6); ctx.fill();
    ctx.fillStyle = '#ffe066';
    circle(ctx, x + 20, WORLD_H - 26, 2.4); ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* Ostacoli                                                            */
/* ------------------------------------------------------------------ */

export function drawObstacle(
  ctx: CanvasRenderingContext2D, o: Obstacle, p: Palette, t: number, top = 0,
): void {
  const x = o.x;
  const yb = o.y;           // bordo basso
  const yt = o.y - o.h;     // bordo alto
  const cx = x + o.w / 2;

  ctx.save();
  ctx.lineJoin = 'round';

  switch (o.kind) {
    case 'bush': {
      ctx.fillStyle = p.leaf2;
      circle(ctx, x + 20, yb - 16, 20); ctx.fill();
      circle(ctx, x + o.w - 20, yb - 16, 20); ctx.fill();
      ctx.fillStyle = p.leaf;
      circle(ctx, cx, yb - 26, 24); ctx.fill();
      circle(ctx, x + 26, yb - 12, 16); ctx.fill();
      circle(ctx, x + o.w - 26, yb - 12, 16); ctx.fill();
      ctx.fillStyle = '#ff5d8f';
      circle(ctx, cx - 14, yb - 30, 4); ctx.fill();
      circle(ctx, cx + 16, yb - 22, 4); ctx.fill();
      break;
    }
    case 'cone': {
      ctx.fillStyle = '#ff7a29';
      ctx.beginPath();
      ctx.moveTo(cx, yt);
      ctx.lineTo(x + o.w - 2, yb - 6);
      ctx.lineTo(x + 2, yb - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, yb - 26, o.w - 16, 8);
      ctx.fillStyle = '#e8590c';
      rr(ctx, x - 2, yb - 8, o.w + 4, 8, 3); ctx.fill();
      break;
    }
    case 'ball': {
      const r = o.w / 2;
      const spin = -t * 6;
      ctx.save();
      ctx.translate(cx, yb - r);
      ctx.rotate(spin);
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, 0, r); ctx.fill();
      ctx.fillStyle = '#ff3d8b';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, (i * Math.PI) / 2, (i * Math.PI) / 2 + Math.PI / 4);
        ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#4cc9ff'; ctx.lineWidth = 3;
      circle(ctx, 0, 0, r - 2); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'bin': {
      ctx.fillStyle = '#2f855a';
      rr(ctx, x + 4, yt + 10, o.w - 8, o.h - 10, 6); ctx.fill();
      ctx.fillStyle = '#276749';
      rr(ctx, x, yt, o.w, 12, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      rr(ctx, x + 10, yt + 18, 5, o.h - 26, 3); ctx.fill();
      rr(ctx, x + 22, yt + 18, 5, o.h - 26, 3); ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, x + o.w - 14, yt + 30, 7); ctx.fill();
      break;
    }
    case 'sandcastle': {
      ctx.fillStyle = '#f2c14e';
      rr(ctx, x + 6, yb - o.h + 14, o.w - 12, o.h - 14, 3); ctx.fill();
      ctx.fillStyle = '#e0a92e';
      rr(ctx, x, yb - 26, 16, 26, 3); ctx.fill();
      rr(ctx, x + o.w - 16, yb - 26, 16, 26, 3); ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(x + 6, yb - o.h + 14); ctx.lineTo(cx, yb - o.h - 4); ctx.lineTo(x + o.w - 6, yb - o.h + 14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, yb - o.h - 4); ctx.lineTo(cx, yb - o.h - 24); ctx.stroke();
      ctx.fillStyle = '#ff3d8b';
      ctx.beginPath();
      ctx.moveTo(cx, yb - o.h - 24); ctx.lineTo(cx + 20, yb - o.h - 18); ctx.lineTo(cx, yb - o.h - 12);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'bench': {
      ctx.fillStyle = '#6b7280';
      rr(ctx, x + 8, yb - 24, 8, 24, 3); ctx.fill();
      rr(ctx, x + o.w - 16, yb - 24, 8, 24, 3); ctx.fill();
      ctx.fillStyle = '#c07a3e';
      rr(ctx, x, yb - 32, o.w, 10, 4); ctx.fill();
      ctx.fillStyle = '#a9662f';
      rr(ctx, x + 4, yb - 48, o.w - 8, 8, 4); ctx.fill();
      rr(ctx, x + 4, yb - 60, o.w - 8, 8, 4); ctx.fill();
      ctx.fillStyle = '#6b7280';
      rr(ctx, x + 10, yb - 60, 6, 30, 3); ctx.fill();
      rr(ctx, x + o.w - 16, yb - 60, 6, 30, 3); ctx.fill();
      break;
    }
    case 'dog': {
      const wag = Math.sin(t * 12) * 0.5;
      ctx.fillStyle = '#b06a3b';
      rr(ctx, x + 10, yb - 34, o.w - 26, 24, 12); ctx.fill();
      ctx.fillStyle = '#96562f';
      rr(ctx, x + 14, yb - 14, 8, 14, 4); ctx.fill();
      rr(ctx, x + o.w - 36, yb - 14, 8, 14, 4); ctx.fill();
      ctx.save();
      ctx.translate(x + 12, yb - 30);
      ctx.rotate(wag);
      ctx.fillStyle = '#b06a3b';
      rr(ctx, -4, -20, 8, 22, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#c47b48';
      circle(ctx, x + o.w - 18, yb - 42, 15); ctx.fill();
      ctx.fillStyle = '#96562f';
      ctx.beginPath();
      ctx.moveTo(x + o.w - 30, yb - 50); ctx.lineTo(x + o.w - 34, yb - 30); ctx.lineTo(x + o.w - 20, yb - 44);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      circle(ctx, x + o.w - 12, yb - 46, 2.6); ctx.fill();
      circle(ctx, x + o.w - 4, yb - 40, 3.4); ctx.fill();
      ctx.fillStyle = '#ff6b9d';
      rr(ctx, x + o.w - 10, yb - 36, 8, 5, 2); ctx.fill();
      break;
    }
    case 'swing': {
      ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 6, yb); ctx.lineTo(cx - 6, yt + 6);
      ctx.moveTo(x + o.w - 6, yb); ctx.lineTo(cx + 6, yt + 6);
      ctx.moveTo(cx - 20, yt + 6); ctx.lineTo(cx + 20, yt + 6);
      ctx.stroke();
      const a = Math.sin(t * 3) * 0.3;
      ctx.save();
      ctx.translate(cx, yt + 8);
      ctx.rotate(a);
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-13, 0); ctx.lineTo(-13, 40);
      ctx.moveTo(13, 0); ctx.lineTo(13, 40);
      ctx.stroke();
      ctx.fillStyle = '#ff3d8b';
      rr(ctx, -20, 40, 40, 10, 5); ctx.fill();
      ctx.restore();
      break;
    }
    case 'slide': {
      ctx.fillStyle = '#4cc9ff';
      ctx.beginPath();
      ctx.moveTo(x + 6, yb);
      ctx.quadraticCurveTo(x + o.w * 0.45, yb - 6, x + o.w - 16, yt + 10);
      ctx.lineTo(x + o.w - 2, yt + 22);
      ctx.quadraticCurveTo(x + o.w * 0.5, yb + 10, x + 6, yb + 12);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + o.w - 10, yt + 6); ctx.lineTo(x + o.w - 10, yb);
      ctx.moveTo(x + o.w - 34, yt + 14); ctx.lineTo(x + o.w - 34, yb);
      ctx.stroke();
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        const yy = yt + 18 + i * ((o.h - 22) / 4);
        ctx.beginPath(); ctx.moveTo(x + o.w - 34, yy); ctx.lineTo(x + o.w - 10, yy - 4); ctx.stroke();
      }
      break;
    }
    case 'branch': {
      // ramo appeso dall'alto
      ctx.strokeStyle = p.tree; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + o.w + 30, top);
      ctx.quadraticCurveTo(x + o.w * 0.6, yt - 40, x + 4, yt + 10);
      ctx.stroke();
      ctx.fillStyle = p.leaf;
      for (let i = 0; i < 6; i++) {
        const tt = i / 5;
        const px = x + 10 + tt * (o.w - 20);
        const py = yt + 16 + Math.sin(tt * 3 + t * 2) * 8;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(t * 1.6 + i) * 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 11, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ff5d8f';
      circle(ctx, x + 30, yt + 34, 6); ctx.fill();
      circle(ctx, x + o.w - 40, yt + 30, 6); ctx.fill();
      break;
    }
    case 'bird': {
      const flap = Math.sin(t * 14);
      ctx.fillStyle = '#4cc9ff';
      ctx.beginPath();
      ctx.ellipse(cx, yb - o.h / 2, 22, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2fa8e0';
      ctx.beginPath();
      ctx.moveTo(cx - 4, yb - o.h / 2);
      ctx.quadraticCurveTo(cx - 20, yb - o.h / 2 - 26 * flap, cx + 14, yb - o.h / 2 - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, cx + 12, yb - o.h / 2 - 5, 5); ctx.fill();
      ctx.fillStyle = '#222';
      circle(ctx, cx + 13, yb - o.h / 2 - 5, 2.4); ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(cx + 20, yb - o.h / 2 - 3);
      ctx.lineTo(cx + 32, yb - o.h / 2 + 1);
      ctx.lineTo(cx + 20, yb - o.h / 2 + 5);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'kite': {
      const sway = Math.sin(t * 2.4) * 0.18;
      ctx.save();
      ctx.translate(cx, yb - o.h / 2);
      ctx.rotate(sway);
      ctx.fillStyle = '#ff3d8b';
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(24, 0); ctx.lineTo(0, 30); ctx.lineTo(-24, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(24, 0); ctx.lineTo(0, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4cc9ff';
      ctx.beginPath();
      ctx.moveTo(0, 30); ctx.lineTo(-24, 0); ctx.lineTo(0, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.quadraticCurveTo(10, 46, -6, 58);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'balloons': {
      const cols = ['#ff3d8b', '#ffd166', '#4cc9ff'];
      for (let i = 0; i < 3; i++) {
        const bx = x + 12 + i * 20;
        const by = yb - o.h + 22 + Math.sin(t * 2 + i) * 5;
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(bx, by + 18);
        ctx.quadraticCurveTo(bx + 6, yb - 8, x + 30, yb);
        ctx.stroke();
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        ctx.ellipse(bx, by, 14, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        circle(ctx, bx - 5, by - 6, 3.4); ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Raccolte                                                            */
/* ------------------------------------------------------------------ */

export function drawPickup(ctx: CanvasRenderingContext2D, c: Pickup, t: number): void {
  const bob = Math.sin(t * 4 + c.phase * 3) * 5;
  const x = c.x;
  const y = c.y + bob;
  ctx.save();
  if (c.kind === 'gelato') {
    ctx.fillStyle = '#e0a96d';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + 10, y + 2); ctx.lineTo(x, y + 22);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff85b3';
    circle(ctx, x, y - 6, 12); ctx.fill();
    ctx.fillStyle = '#fff1a8';
    circle(ctx, x - 6, y - 12, 8); ctx.fill();
    ctx.fillStyle = '#a5e8ff';
    circle(ctx, x + 7, y - 13, 7); ctx.fill();
    ctx.fillStyle = '#ff3d8b';
    circle(ctx, x + 1, y - 22, 3.2); ctx.fill();
  } else if (c.kind === 'star') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 2.2);
    const g = ctx.createLinearGradient(-20, -20, 20, 20);
    g.addColorStop(0, '#ffd166'); g.addColorStop(0.5, '#ff3d8b'); g.addColorStop(1, '#4cc9ff');
    ctx.fillStyle = g;
    starPath(ctx, 0, 0, 22, 9);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = '#ff3d5e';
    heartPath(ctx, x, y, 20 + Math.sin(t * 8) * 1.6);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    circle(ctx, x - 6, y - 8, 3.4); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Il bambino                                                          */
/* ------------------------------------------------------------------ */

const SHIRT = '#ffffff';
const COLLAR = '#1e3a8a';
const SHORTS = '#ef4444';
const SKIN = '#e8b088';
const SHOE = '#3b82f6';

export function drawKid(
  ctx: CanvasRenderingContext2D,
  w: GameWorld,
  face: HTMLImageElement | null,
  t: number,
): void {
  const p: Player = w.player;
  const duck = p.ducking;
  const air = !p.onGround;
  const star = w.time < w.starUntil;
  const hurt = w.time < w.hurtUntil;

  // lampeggia quando è ferito
  if (hurt && Math.floor(t * 12) % 2 === 0) return;

  // ombra a terra
  const hAbove = w.groundY - p.y;
  ctx.save();
  ctx.globalAlpha = Math.max(0.08, 0.28 - hAbove / 800);
  ctx.fillStyle = '#123';
  const shs = Math.max(0.45, 1 - hAbove / 460);
  ctx.beginPath();
  ctx.ellipse(PLAYER_X, w.groundY + 14, 42 * shs, 10 * shs, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(PLAYER_X, p.y);
  ctx.rotate(p.tilt * 0.5);

  /* misure del personaggio (piedi in 0, y negativa verso l'alto) */
  const ratio = face && face.naturalWidth > 0 ? face.naturalHeight / face.naturalWidth : 1.44;
  const bob = air ? 0 : Math.sin(p.runPhase * 2) * 2.5;
  const headW = duck ? 44 : 50;
  const headH = headW * ratio;
  // accucciato: testa bassa e in avanti, corpo raccolto dietro
  const headX = duck ? 24 : 0;
  const headY = duck ? -34 : -84 - headH * 0.42 + bob;
  const hipY = duck ? -18 : -44 + bob;
  const torsoTop = duck ? -46 : -84 + bob;
  const torsoW = duck ? 48 : 46;
  const torsoX = duck ? -34 : -23;
  const shoulderY = duck ? -40 : torsoTop + 14;

  if (star) {
    const g = ctx.createRadialGradient(0, -70, 10, 0, -70, 110);
    g.addColorStop(0, 'rgba(255,209,102,.5)');
    g.addColorStop(1, 'rgba(255,61,139,0)');
    ctx.fillStyle = g;
    circle(ctx, 0, -70, 110);
    ctx.fill();
  }

  /* mantellina che svolazza dietro */
  const sway = Math.sin(t * 9) * 7 + (air ? 18 : 0);
  ctx.fillStyle = star ? '#ffd166' : '#ff3d8b';
  ctx.beginPath();
  ctx.moveTo(torsoX + 4, torsoTop + 4);
  ctx.quadraticCurveTo(torsoX - 34 - sway, torsoTop + 20, torsoX - 20 - sway * 0.7, torsoTop + 56);
  ctx.quadraticCurveTo(torsoX - 4, torsoTop + 34, torsoX + 8, torsoTop + 26);
  ctx.closePath();
  ctx.fill();

  /* gambe */
  const ph = p.runPhase * 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const hipX = i === 0 ? -9 : 9;
    let footX: number;
    let footY: number;
    if (duck) {
      footX = -6 + i * 16;
      footY = -2;
    } else if (air) {
      footX = hipX + (i === 0 ? -14 : 16);
      footY = i === 0 ? -14 : -26;
    } else {
      const sw = Math.sin(ph + i * Math.PI);
      footX = hipX + sw * 17;
      footY = -Math.max(0, Math.sin(ph + i * Math.PI + 0.6)) * 16;
    }
    const kneeX = (hipX + footX) / 2 + 5;
    const kneeY = (hipY + footY) / 2 + 3;
    ctx.strokeStyle = SKIN;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
    ctx.fillStyle = SHOE;
    rr(ctx, footX - 11, footY - 7, 25, 13, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    rr(ctx, footX - 11, footY + 2, 25, 4, 2);
    ctx.fill();
  }

  /* pantaloncini */
  ctx.fillStyle = SHORTS;
  rr(ctx, torsoX + 2, hipY - 8, torsoW - 4, duck ? 24 : 20, 9);
  ctx.fill();

  /* maglietta */
  const torsoH = hipY - torsoTop + 8;
  ctx.fillStyle = SHIRT;
  rr(ctx, torsoX, torsoTop, torsoW, torsoH, 14);
  ctx.fill();
  ctx.fillStyle = COLLAR;
  rr(ctx, torsoX, torsoTop, torsoW, 10, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  starPath(ctx, torsoX + torsoW / 2, torsoTop + torsoH * 0.5, 9, 4, 5, t * 0.9);
  ctx.fill();

  /* braccia */
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 10;
  const arms: Array<[number, number]> = duck
    ? [[torsoX + 14, 1.15], [torsoX + 34, 1.4]]
    : [[-21, air ? -2.2 : Math.sin(ph + Math.PI) * 1.2], [21, air ? -1.7 : Math.sin(ph) * 1.2]];
  for (const [sx, a] of arms) {
    const ex = sx + Math.sin(a) * 20;
    const ey = shoulderY + Math.cos(a) * (duck ? 16 : 24);
    ctx.beginPath();
    ctx.moveTo(sx, shoulderY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = SKIN;
    circle(ctx, ex, ey, 6.5);
    ctx.fill();
  }

  /* collo */
  if (!duck) {
    ctx.fillStyle = SKIN;
    rr(ctx, headX - 7, torsoTop - 8, 14, 14, 6);
    ctx.fill();
  }

  /* testa: la faccia ritagliata dalla foto */
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(duck ? 0.3 : Math.sin(p.runPhase) * 0.06);
  if (face && face.complete && face.naturalWidth > 0) {
    ctx.drawImage(face, -headW / 2, -headH / 2, headW, headH);
  } else {
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, 0, headW / 2, headH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Particelle                                                          */
/* ------------------------------------------------------------------ */

function drawParticles(ctx: CanvasRenderingContext2D, w: GameWorld, t: number): void {
  for (const pt of w.particles) {
    const k = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = k;
    ctx.fillStyle = pt.color;
    if (pt.kind === 'star') {
      starPath(ctx, pt.x, pt.y, pt.size * k, pt.size * k * 0.42, 5, t * 3 + pt.x);
      ctx.fill();
    } else if (pt.kind === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 4 * k;
      circle(ctx, pt.x, pt.y, pt.size + (1 - k) * 46);
      ctx.stroke();
    } else {
      circle(ctx, pt.x, pt.y, pt.size * k);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Scena completa                                                      */
/* ------------------------------------------------------------------ */

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  w: GameWorld,
  face: HTMLImageElement | null,
  t: number,
): void {
  const p = paletteFor(w.level);

  ctx.save();
  if (w.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * w.shake, (Math.random() - 0.5) * w.shake);
  }

  drawSky(ctx, w, p, t);
  drawSun(ctx, w, p, t);
  drawClouds(ctx, w, p, t);
  drawSkyDecor(ctx, w, p, t);
  drawHills(ctx, w, p);
  drawMidground(ctx, w, p, t);
  drawGround(ctx, w, p);

  for (const c of w.pickups) drawPickup(ctx, c, t);
  for (const o of w.obstacles) drawObstacle(ctx, o, p, t, w.viewTop);
  drawKid(ctx, w, face, t);
  drawParticles(ctx, w, t);

  ctx.restore();

  if (w.flash > 0) {
    ctx.fillStyle = `rgba(255,80,80,${w.flash * 0.6})`;
    ctx.fillRect(0, w.viewTop, w.width, WORLD_H - w.viewTop);
  }
}

/**
 * KTAMIZEN PARK EDITION — motore di gioco (logica pura, senza DOM).
 * Endless runner: il bambino corre nel parco, salta gli ostacoli a terra
 * e si abbassa sotto quelli in aria.
 */

/* ------------------------------------------------------------------ */
/* Costanti del mondo                                                  */
/* ------------------------------------------------------------------ */

/** Altezza virtuale del mondo: tutto il gioco ragiona in queste unità. */
export const WORLD_H = 540;
/** Linea dei piedi. */
export const GROUND_Y = 432;
/** Posizione orizzontale fissa del bambino. */
export const PLAYER_X = 158;

export const GRAVITY = 2500;
export const JUMP_V = -900;
export const JUMP2_V = -780;
export const MAX_JUMPS = 2;
/** Durata minima dell'abbassata, così basta un tocco veloce. */
export const DUCK_MIN = 0.3;

export const PLAYER_W = 56;
export const PLAYER_H = 140;
export const DUCK_W = 84;
export const DUCK_H = 64;

/** Quanto sono "generosi" gli hitbox (0.2 = 20% di margine regalato). */
export const FORGIVE = 0.22;

/** Gli ostacoli aerei stanno tutti a questa altezza: in piedi si sbatte, abbassati no. */
export const AIR_BOTTOM = 76;

export const MAX_LIVES = 3;
export const STAR_TIME = 6;
export const HURT_TIME = 1.6;

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export type ObstacleKind =
  | 'bush' | 'cone' | 'ball' | 'bin' | 'sandcastle' | 'bench' | 'dog' | 'swing' | 'slide'
  | 'branch' | 'bird' | 'kite' | 'balloons';

export type Lane = 'ground' | 'air';

export interface ObstacleSpec {
  kind: ObstacleKind;
  lane: Lane;
  w: number;
  h: number;
  /** Livello minimo in cui può comparire. */
  from: number;
}

export const OBSTACLES: ObstacleSpec[] = [
  { kind: 'bush',       lane: 'ground', w: 76,  h: 46, from: 1 },
  { kind: 'cone',       lane: 'ground', w: 36,  h: 46, from: 1 },
  { kind: 'ball',       lane: 'ground', w: 46,  h: 46, from: 1 },
  { kind: 'bin',        lane: 'ground', w: 48,  h: 60, from: 2 },
  { kind: 'sandcastle', lane: 'ground', w: 68,  h: 52, from: 2 },
  { kind: 'branch',     lane: 'air',    w: 132, h: 48, from: 2 },
  { kind: 'bench',      lane: 'ground', w: 116, h: 58, from: 3 },
  { kind: 'dog',        lane: 'ground', w: 80,  h: 54, from: 3 },
  { kind: 'bird',       lane: 'air',    w: 62,  h: 42, from: 3 },
  { kind: 'swing',      lane: 'ground', w: 98,  h: 80, from: 4 },
  { kind: 'kite',       lane: 'air',    w: 58,  h: 64, from: 4 },
  { kind: 'balloons',   lane: 'air',    w: 62,  h: 72, from: 4 },
  { kind: 'slide',      lane: 'ground', w: 122, h: 86, from: 5 },
];

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  lane: Lane;
  x: number;
  /** Y del bordo BASSO dell'ostacolo (unità mondo, y cresce verso il basso). */
  y: number;
  w: number;
  h: number;
  phase: number;
  dead: boolean;
}

export type PickupKind = 'gelato' | 'star' | 'heart';

export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  taken: boolean;
  phase: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; kind: 'dot' | 'star' | 'ring';
}

export interface Player {
  y: number;      // y dei piedi
  vy: number;
  jumps: number;
  onGround: boolean;
  ducking: boolean;
  duckHeld: boolean;
  duckTimer: number;
  runPhase: number;
  tilt: number;
}

export type GameState = 'ready' | 'countdown' | 'running' | 'paused' | 'over';

export type GameEvent =
  | { type: 'jump'; double: boolean }
  | { type: 'land' }
  | { type: 'duck' }
  | { type: 'coin'; combo: number }
  | { type: 'star' }
  | { type: 'heart' }
  | { type: 'smash' }
  | { type: 'hit'; lives: number }
  | { type: 'levelup'; level: number }
  | { type: 'gameover'; score: number };

export interface GameWorld {
  width: number;
  /** Y (unità mondo) del bordo alto dello schermo: <= 0 sugli schermi alti. */
  viewTop: number;
  height: number;
  groundY: number;
  state: GameState;
  time: number;
  distance: number;
  speed: number;
  scoreF: number;
  score: number;
  best: number;
  level: number;
  lives: number;
  combo: number;
  comboTimer: number;
  gelati: number;
  starUntil: number;
  hurtUntil: number;
  countdown: number;
  shake: number;
  flash: number;
  banner: { text: string; until: number } | null;
  player: Player;
  obstacles: Obstacle[];
  pickups: Pickup[];
  particles: Particle[];
  events: GameEvent[];
  spawnTimer: number;
  pickupTimer: number;
  lastSpawnX: number;
  nextId: number;
  rng: () => number;
}

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export interface Box { x: number; y: number; w: number; h: number }

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Riquadro del bambino (y = bordo alto). Ridotto: perdonare è più divertente. */
export function playerBox(p: Player, groundY = GROUND_Y): Box {
  const w = p.ducking ? DUCK_W : PLAYER_W;
  const h = p.ducking ? DUCK_H : PLAYER_H;
  const mx = w * FORGIVE * 0.5;
  const my = h * FORGIVE * 0.35;
  return { x: PLAYER_X - w / 2 + mx, y: p.y - h + my, w: w - mx * 2, h: h - my * 1.2 };
}

export function obstacleBox(o: Obstacle): Box {
  const mx = o.w * FORGIVE * 0.5;
  const my = o.h * FORGIVE * 0.5;
  return { x: o.x + mx, y: o.y - o.h + my, w: o.w - mx * 2, h: o.h - my * 2 };
}

/** Velocità di scorrimento in base al livello. */
export function speedForLevel(level: number): number {
  return Math.min(560, 320 + (level - 1) * 34);
}

/** Il livello sale ogni 220 punti, massimo 8. */
export function levelForScore(score: number): number {
  return clamp(1 + Math.floor(score / 220), 1, 8);
}

/* ------------------------------------------------------------------ */
/* Creazione del mondo                                                 */
/* ------------------------------------------------------------------ */

export function createWorld(width: number, best = 0, seed = Date.now()): GameWorld {
  return {
    width,
    viewTop: 0,
    height: WORLD_H,
    groundY: GROUND_Y,
    state: 'ready',
    time: 0,
    distance: 0,
    speed: speedForLevel(1),
    scoreF: 0,
    score: 0,
    best,
    level: 1,
    lives: MAX_LIVES,
    combo: 0,
    comboTimer: 0,
    gelati: 0,
    starUntil: 0,
    hurtUntil: 0,
    countdown: 0,
    shake: 0,
    flash: 0,
    banner: null,
    player: {
      y: GROUND_Y, vy: 0, jumps: 0, onGround: true,
      ducking: false, duckHeld: false, duckTimer: 0, runPhase: 0, tilt: 0,
    },
    obstacles: [],
    pickups: [],
    particles: [],
    events: [],
    spawnTimer: 1.1,
    pickupTimer: 0.9,
    lastSpawnX: 0,
    nextId: 1,
    rng: makeRng(seed),
  };
}

export function startRun(w: GameWorld): void {
  const { best, width, viewTop } = w;
  const fresh = createWorld(width, best, Math.floor(Math.random() * 1e9));
  Object.assign(w, fresh);
  w.viewTop = viewTop;
  w.state = 'countdown';
  w.countdown = 3;
}

/* ------------------------------------------------------------------ */
/* Comandi                                                             */
/* ------------------------------------------------------------------ */

export function jump(w: GameWorld): void {
  if (w.state !== 'running') return;
  const p = w.player;
  if (p.jumps >= MAX_JUMPS) return;
  const double = p.jumps > 0;
  p.vy = double ? JUMP2_V : JUMP_V;
  p.jumps += 1;
  p.onGround = false;
  if (p.ducking) { p.ducking = false; p.duckTimer = 0; }
  if (double) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      w.particles.push({
        x: PLAYER_X, y: p.y - 20, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140 + 40,
        life: 0.45, maxLife: 0.45, size: 7, color: PARTY[i % PARTY.length], kind: 'star',
      });
    }
  } else {
    puff(w, PLAYER_X, p.y, 6);
  }
  w.events.push({ type: 'jump', double });
}

export function setDuck(w: GameWorld, held: boolean): void {
  if (w.state !== 'running') return;
  const p = w.player;
  p.duckHeld = held;
  if (held) {
    if (!p.ducking) {
      p.ducking = true;
      p.duckTimer = DUCK_MIN;
      w.events.push({ type: 'duck' });
    }
    // in aria: schiacciata veloce verso il basso, così è più reattivo
    if (!p.onGround && p.vy < 420) p.vy += 420;
  }
}

/* ------------------------------------------------------------------ */
/* Particelle                                                          */
/* ------------------------------------------------------------------ */

export const PARTY = ['#ff3d8b', '#ffd166', '#3ddc97', '#4cc9ff', '#b06bff', '#ff8f3d'];

export function puff(w: GameWorld, x: number, y: number, n = 8, color = '#ffffff'): void {
  for (let i = 0; i < n; i++) {
    w.particles.push({
      x: x + (w.rng() - 0.5) * 26,
      y: y - w.rng() * 10,
      vx: -w.speed * 0.25 - w.rng() * 90,
      vy: -w.rng() * 130,
      life: 0.5, maxLife: 0.5,
      size: 6 + w.rng() * 8,
      color, kind: 'dot',
    });
  }
}

export function burst(w: GameWorld, x: number, y: number, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a = w.rng() * Math.PI * 2;
    const s = 120 + w.rng() * 260;
    w.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90,
      life: 0.7, maxLife: 0.7,
      size: 5 + w.rng() * 7,
      color: PARTY[Math.floor(w.rng() * PARTY.length)],
      kind: w.rng() < 0.5 ? 'star' : 'dot',
    });
  }
  w.particles.push({ x, y, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, size: 10, color: '#fff', kind: 'ring' });
}

/* ------------------------------------------------------------------ */
/* Spawn                                                               */
/* ------------------------------------------------------------------ */

function pickSpec(w: GameWorld): ObstacleSpec {
  const pool = OBSTACLES.filter((o) => o.from <= w.level);
  // all'inizio niente ostacoli aerei: prima si impara a saltare
  const usable = w.level < 2 ? pool.filter((o) => o.lane === 'ground') : pool;
  return usable[Math.floor(w.rng() * usable.length)];
}

export function spawnObstacle(w: GameWorld): void {
  const spec = pickSpec(w);
  const x = w.width + 60;
  const o: Obstacle = {
    id: w.nextId++,
    kind: spec.kind,
    lane: spec.lane,
    x,
    y: spec.lane === 'ground' ? w.groundY : w.groundY - AIR_BOTTOM,
    w: spec.w,
    h: spec.h,
    phase: w.rng() * Math.PI * 2,
    dead: false,
  };
  w.obstacles.push(o);
  w.lastSpawnX = x + spec.w;

  // dal livello 4 ogni tanto una coppietta a terra (facile: si saltano insieme)
  if (spec.lane === 'ground' && w.level >= 4 && spec.w < 80 && w.rng() < 0.28) {
    w.obstacles.push({ ...o, id: w.nextId++, x: x + spec.w + 14, phase: w.rng() * 6.28 });
    w.lastSpawnX = x + spec.w * 2 + 14;
  }

  const min = clamp(1.15 - w.level * 0.055, 0.72, 1.15);
  w.spawnTimer = min + w.rng() * 0.85;
}

export function spawnPickups(w: GameWorld): void {
  const r = w.rng();
  if (r < 0.055 && w.lives < MAX_LIVES) {
    w.pickups.push({ id: w.nextId++, kind: 'heart', x: w.width + 40, y: w.groundY - 150, taken: false, phase: 0 });
  } else if (r < 0.12) {
    w.pickups.push({ id: w.nextId++, kind: 'star', x: w.width + 40, y: w.groundY - 130, taken: false, phase: 0 });
  } else {
    const n = 3 + Math.floor(w.rng() * 3);
    const arc = w.rng() < 0.5;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const y = arc
        ? w.groundY - 56 - Math.sin(t * Math.PI) * 96
        : w.groundY - 52 - w.rng() * 12;
      w.pickups.push({ id: w.nextId++, kind: 'gelato', x: w.width + 40 + i * 66, y, taken: false, phase: i * 0.4 });
    }
  }
  w.pickupTimer = 1.3 + w.rng() * 1.6;
}

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */

function hitPlayer(w: GameWorld, o: Obstacle): void {
  o.dead = true;
  w.lives -= 1;
  w.combo = 0;
  w.hurtUntil = w.time + HURT_TIME;
  w.shake = 16;
  w.flash = 0.35;
  burst(w, o.x + o.w / 2, o.y - o.h / 2, 12);
  w.events.push({ type: 'hit', lives: w.lives });
  if (w.lives <= 0) {
    w.state = 'over';
    if (w.score > w.best) w.best = w.score;
    w.events.push({ type: 'gameover', score: w.score });
  }
}

export function stepWorld(w: GameWorld, dt: number): void {
  // effetti che vivono anche a gioco fermo
  w.shake = Math.max(0, w.shake - dt * 60);
  w.flash = Math.max(0, w.flash - dt);

  // schermata iniziale: il parco scorre piano e il bambino corre sul posto
  if (w.state === 'ready') {
    w.time += dt;
    w.distance += 130 * dt;
    w.player.runPhase += dt * 9;
    stepParticles(w, dt);
    return;
  }

  if (w.state === 'countdown') {
    w.time += dt;
    w.countdown -= dt;
    w.player.runPhase += dt * 10;
    if (w.countdown <= 0) {
      w.countdown = 0;
      w.state = 'running';
      w.banner = { text: 'VIA!', until: w.time + 0.9 };
    }
    stepParticles(w, dt);
    return;
  }

  if (w.state !== 'running') { stepParticles(w, dt); return; }

  w.time += dt;

  const newLevel = levelForScore(w.score);
  if (newLevel !== w.level) {
    w.level = newLevel;
    w.banner = { text: `LIVELLO ${newLevel}!`, until: w.time + 1.8 };
    w.events.push({ type: 'levelup', level: newLevel });
  }
  w.speed = speedForLevel(w.level);
  w.distance += w.speed * dt;
  w.scoreF += w.speed * dt * 0.055;

  if (w.banner && w.time > w.banner.until) w.banner = null;

  /* --- bambino --- */
  const p = w.player;
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y >= w.groundY) {
    if (!p.onGround) {
      puff(w, PLAYER_X, w.groundY, 7, '#f6e2c0');
      w.events.push({ type: 'land' });
    }
    p.y = w.groundY;
    p.vy = 0;
    p.jumps = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }
  p.tilt = clamp(p.vy / 2600, -0.22, 0.22);
  p.runPhase += dt * (p.onGround ? 6 + w.speed * 0.026 : 4);

  if (p.ducking) {
    p.duckTimer -= dt;
    if (p.duckTimer <= 0 && !p.duckHeld) p.ducking = false;
  }

  /* --- spawn --- */
  w.spawnTimer -= dt;
  if (w.spawnTimer <= 0) spawnObstacle(w);
  w.pickupTimer -= dt;
  if (w.pickupTimer <= 0) spawnPickups(w);

  /* --- ostacoli --- */
  const pbox = playerBox(p, w.groundY);
  const starMode = w.time < w.starUntil;
  const safe = w.time < w.hurtUntil;

  for (const o of w.obstacles) {
    o.x -= w.speed * dt;
    o.phase += dt;
    if (o.kind === 'bird') o.y = w.groundY - AIR_BOTTOM + Math.sin(o.phase * 4) * 10;
    if (o.dead) continue;
    if (overlaps(pbox, obstacleBox(o))) {
      if (starMode) {
        o.dead = true;
        w.scoreF += 15;
        burst(w, o.x + o.w / 2, o.y - o.h / 2, 16);
        w.events.push({ type: 'smash' });
      } else if (!safe) {
        hitPlayer(w, o);
      }
    }
  }
  w.obstacles = w.obstacles.filter((o) => !o.dead && o.x + o.w > -80);

  /* --- raccolte --- */
  w.comboTimer -= dt;
  if (w.comboTimer <= 0 && w.combo > 0) w.combo = 0;

  for (const c of w.pickups) {
    c.x -= w.speed * dt;
    c.phase += dt;
    if (c.taken) continue;
    const box: Box = { x: c.x - 22, y: c.y - 22, w: 44, h: 44 };
    if (!overlaps(pbox, box)) continue;
    c.taken = true;
    if (c.kind === 'gelato') {
      w.gelati += 1;
      w.combo += 1;
      w.comboTimer = 1.8;
      if (w.combo >= 5) w.scoreF += 4;
      burst(w, c.x, c.y, 8);
      w.events.push({ type: 'coin', combo: w.combo });
    } else if (c.kind === 'star') {
      w.starUntil = w.time + STAR_TIME;
      w.banner = { text: 'SUPER STELLA!', until: w.time + 1.6 };
      burst(w, c.x, c.y, 22);
      w.events.push({ type: 'star' });
    } else {
      w.lives = Math.min(MAX_LIVES, w.lives + 1);
      w.banner = { text: 'CUORE EXTRA!', until: w.time + 1.6 };
      burst(w, c.x, c.y, 18);
      w.events.push({ type: 'heart' });
    }
  }
  w.pickups = w.pickups.filter((c) => !c.taken && c.x > -60);

  /* --- scia della stella --- */
  if (starMode && w.rng() < dt * 40) {
    w.particles.push({
      x: PLAYER_X - 10 + (w.rng() - 0.5) * 30,
      y: p.y - 50 + (w.rng() - 0.5) * 60,
      vx: -w.speed * 0.4, vy: -20,
      life: 0.5, maxLife: 0.5, size: 9,
      color: PARTY[Math.floor(w.rng() * PARTY.length)], kind: 'star',
    });
  }

  // il punteggio si chiude a fine giro: così gelati e stelle contano subito
  w.score = Math.floor(w.scoreF) + w.gelati * 5;

  stepParticles(w, dt);
}

export function stepParticles(w: GameWorld, dt: number): void {
  for (const pt of w.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 620 * dt;
    pt.life -= dt;
  }
  if (w.particles.length > 260) w.particles.splice(0, w.particles.length - 260);
  w.particles = w.particles.filter((pt) => pt.life > 0);
}

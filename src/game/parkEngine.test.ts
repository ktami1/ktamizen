import { describe, it, expect, beforeEach } from 'vitest';
import {
  AIR_BOTTOM, GROUND_Y, MAX_JUMPS, MAX_LIVES, OBSTACLES, PLAYER_X, STAR_TIME,
  GameWorld, Obstacle, createWorld, jump, levelForScore, obstacleBox, overlaps,
  playerBox, setDuck, speedForLevel, spawnObstacle, startRun, stepWorld,
} from './parkEngine';

/** Mondo pronto a girare, senza spawn automatici che sporchino il test. */
function runningWorld(): GameWorld {
  const w = createWorld(900, 0, 42);
  w.state = 'running';
  w.spawnTimer = 999;
  w.pickupTimer = 999;
  return w;
}

function addObstacle(w: GameWorld, kind: Obstacle['kind'], x = 130): Obstacle {
  const spec = OBSTACLES.find((o) => o.kind === kind)!;
  const o: Obstacle = {
    id: 1, kind, lane: spec.lane, x,
    y: spec.lane === 'ground' ? w.groundY : w.groundY - AIR_BOTTOM,
    w: spec.w, h: spec.h, phase: 0, dead: false,
  };
  w.obstacles.push(o);
  return o;
}

describe('geometria', () => {
  it('overlaps riconosce i riquadri sovrapposti e quelli separati', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 11, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('abbassandosi il riquadro diventa più basso e passa sotto gli ostacoli aerei', () => {
    const w = runningWorld();
    const branch = addObstacle(w, 'branch');
    const standing = playerBox(w.player);
    setDuck(w, true);
    const ducked = playerBox(w.player);
    expect(ducked.h).toBeLessThan(standing.h);
    expect(overlaps(standing, obstacleBox(branch))).toBe(true);
    expect(overlaps(ducked, obstacleBox(branch))).toBe(false);
  });
});

describe('salto', () => {
  let w: GameWorld;
  beforeEach(() => { w = runningWorld(); });

  it('stacca il bambino da terra e la gravità lo riporta giù', () => {
    jump(w);
    stepWorld(w, 1 / 60);
    expect(w.player.y).toBeLessThan(GROUND_Y);
    for (let i = 0; i < 200; i++) stepWorld(w, 1 / 60);
    expect(w.player.y).toBe(GROUND_Y);
    expect(w.player.onGround).toBe(true);
  });

  it('supera in altezza il più alto ostacolo da saltare', () => {
    const tallest = Math.max(...OBSTACLES.filter((o) => o.lane === 'ground').map((o) => o.h));
    jump(w);
    let peak = GROUND_Y;
    for (let i = 0; i < 120; i++) {
      stepWorld(w, 1 / 60);
      peak = Math.min(peak, w.player.y);
    }
    expect(GROUND_Y - peak).toBeGreaterThan(tallest + 20);
  });

  it('concede al massimo MAX_JUMPS salti prima di toccare terra', () => {
    for (let i = 0; i < MAX_JUMPS + 3; i++) jump(w);
    expect(w.player.jumps).toBe(MAX_JUMPS);
  });

  it('non fa nulla se la partita non è in corso', () => {
    w.state = 'over';
    jump(w);
    expect(w.player.vy).toBe(0);
  });
});

describe('collisioni', () => {
  it('toglie una vita e non colpisce due volte con lo stesso ostacolo', () => {
    const w = runningWorld();
    addObstacle(w, 'bush', PLAYER_X - 20);
    stepWorld(w, 1 / 60);
    expect(w.lives).toBe(MAX_LIVES - 1);
    const after = w.obstacles.length;
    stepWorld(w, 1 / 60);
    expect(after).toBe(0);
    expect(w.lives).toBe(MAX_LIVES - 1);
  });

  it('dopo un colpo c\'è un momento di invulnerabilità', () => {
    const w = runningWorld();
    addObstacle(w, 'bush', PLAYER_X - 20);
    stepWorld(w, 1 / 60);
    addObstacle(w, 'bush', PLAYER_X - 20);
    stepWorld(w, 1 / 60);
    expect(w.lives).toBe(MAX_LIVES - 1);
  });

  it('finisce la partita quando le vite arrivano a zero', () => {
    const w = runningWorld();
    for (let i = 0; i < MAX_LIVES; i++) {
      w.hurtUntil = 0;
      addObstacle(w, 'bush', PLAYER_X - 20);
      stepWorld(w, 1 / 60);
    }
    expect(w.lives).toBe(0);
    expect(w.state).toBe('over');
    expect(w.events.some((e) => e.type === 'gameover')).toBe(true);
  });

  it('con la stella distrugge gli ostacoli invece di farsi male', () => {
    const w = runningWorld();
    w.starUntil = w.time + STAR_TIME;
    addObstacle(w, 'bush', PLAYER_X - 20);
    stepWorld(w, 1 / 60);
    expect(w.lives).toBe(MAX_LIVES);
    expect(w.obstacles).toHaveLength(0);
    expect(w.events.some((e) => e.type === 'smash')).toBe(true);
  });

  it('saltando al momento giusto si supera l\'ostacolo a terra', () => {
    const w = runningWorld();
    const bush = addObstacle(w, 'bush', 900);
    for (let i = 0; i < 240; i++) {
      // salta quando l'ostacolo entra nella portata del salto
      if (w.player.onGround && bush.x - PLAYER_X < w.speed * 0.34) jump(w);
      stepWorld(w, 1 / 60);
    }
    expect(w.lives).toBe(MAX_LIVES);
    expect(bush.x).toBeLessThan(PLAYER_X);   // l'ostacolo è davvero passato
  });

  it('restando fermi si viene colpiti dallo stesso ostacolo', () => {
    const w = runningWorld();
    addObstacle(w, 'bush', 900);
    for (let i = 0; i < 240; i++) stepWorld(w, 1 / 60);
    expect(w.lives).toBe(MAX_LIVES - 1);
  });
});

describe('raccolte', () => {
  it('il gelato aumenta punteggio e combo', () => {
    const w = runningWorld();
    w.pickups.push({ id: 9, kind: 'gelato', x: PLAYER_X, y: GROUND_Y - 50, taken: false, phase: 0 });
    stepWorld(w, 1 / 60);
    expect(w.gelati).toBe(1);
    expect(w.combo).toBe(1);
    expect(w.score).toBeGreaterThanOrEqual(5);
    expect(w.pickups).toHaveLength(0);
  });

  it('il cuore ridà una vita ma non supera il massimo', () => {
    const w = runningWorld();
    w.lives = 1;
    w.pickups.push({ id: 9, kind: 'heart', x: PLAYER_X, y: GROUND_Y - 50, taken: false, phase: 0 });
    stepWorld(w, 1 / 60);
    expect(w.lives).toBe(2);
    w.lives = MAX_LIVES;
    w.pickups.push({ id: 10, kind: 'heart', x: PLAYER_X, y: GROUND_Y - 50, taken: false, phase: 0 });
    stepWorld(w, 1 / 60);
    expect(w.lives).toBe(MAX_LIVES);
  });
});

describe('difficoltà', () => {
  it('il livello sale con il punteggio e si ferma a 8', () => {
    expect(levelForScore(0)).toBe(1);
    expect(levelForScore(219)).toBe(1);
    expect(levelForScore(220)).toBe(2);
    expect(levelForScore(999999)).toBe(8);
  });

  it('la velocità cresce con il livello ed è limitata', () => {
    expect(speedForLevel(2)).toBeGreaterThan(speedForLevel(1));
    expect(speedForLevel(99)).toBeLessThanOrEqual(700);
  });

  it('al primo livello non compaiono ostacoli aerei', () => {
    const w = runningWorld();
    for (let i = 0; i < 60; i++) {
      w.obstacles.length = 0;
      spawnObstacle(w);
      expect(w.obstacles.every((o) => o.lane === 'ground')).toBe(true);
    }
  });

  it('gli ostacoli nascono fuori dallo schermo, davanti al bambino', () => {
    const w = runningWorld();
    spawnObstacle(w);
    expect(w.obstacles[0].x).toBeGreaterThan(w.width);
  });
});

describe('partita', () => {
  it('startRun azzera tutto ma conserva record e larghezza', () => {
    const w = runningWorld();
    w.score = 500; w.lives = 1; w.best = 1234; w.gelati = 7;
    w.viewTop = -60;
    startRun(w);
    expect(w.state).toBe('countdown');
    expect(w.lives).toBe(MAX_LIVES);
    expect(w.score).toBe(0);
    expect(w.gelati).toBe(0);
    expect(w.best).toBe(1234);
    expect(w.width).toBe(900);
    expect(w.viewTop).toBe(-60);
  });

  it('il countdown lascia il posto alla partita', () => {
    const w = createWorld(900, 0, 7);
    startRun(w);
    for (let i = 0; i < 200; i++) stepWorld(w, 1 / 60);
    expect(w.state).toBe('running');
  });

  it('in pausa il mondo non si muove', () => {
    const w = runningWorld();
    addObstacle(w, 'bush', 500);
    w.state = 'paused';
    const x = w.obstacles[0].x;
    stepWorld(w, 0.5);
    expect(w.obstacles[0].x).toBe(x);
    expect(w.score).toBe(0);
  });

  it('una corsa lunga accumula punti e ostacoli', () => {
    const w = createWorld(900, 0, 3);
    w.state = 'running';
    for (let i = 0; i < 60 * 20; i++) {
      w.lives = MAX_LIVES;      // corsa "invincibile": misuriamo solo il progresso
      w.hurtUntil = w.time + 1;
      stepWorld(w, 1 / 60);
    }
    expect(w.score).toBeGreaterThan(100);
    expect(w.level).toBeGreaterThan(1);
    expect(w.obstacles.length).toBeGreaterThan(0);
  });
});

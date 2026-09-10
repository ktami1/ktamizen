import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import faceUrl from '@/assets/kid-face.png';
import '@/game/park.css';
import {
  GameWorld, MAX_LIVES, WORLD_H, burst, createWorld, jump, setDuck, startRun, stepWorld,
} from '@/game/parkEngine';
import { drawWorld, paletteFor } from '@/game/parkRender';
import { ParkAudio } from '@/game/parkAudio';

const BEST_KEY = 'ktamizen-park-best';
const MUTE_KEY = 'ktamizen-park-mute';
/** Larghezza minima del mondo: garantisce il tempo per vedere e saltare gli ostacoli. */
const MIN_WORLD_W = 900;
/** Quanta scena si può mostrare in altezza: evita personaggi minuscoli su schermi stretti. */
const MAX_VIEW_H = 1000;

const TITLE = 'KTAMIZEN';

function readBest(): number {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch { return 0; }
}
function writeBest(v: number): void {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* ignora */ }
}

type Screen = 'title' | 'playing' | 'paused' | 'over';

export default function ParkGame() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<GameWorld>(createWorld(MIN_WORLD_W, readBest()));
  const audioRef = useRef<ParkAudio | null>(null);
  const faceRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);
  const topRef = useRef(0);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const gelatiElRef = useRef<HTMLSpanElement>(null);
  const lastCountRef = useRef(4);

  const [screen, setScreen] = useState<Screen>('title');
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState({ score: 0, gelati: 0, best: readBest(), record: false });
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  });
  const [jumpDown, setJumpDown] = useState(false);
  const [duckDown, setDuckDown] = useState(false);

  /* ------------------------------------------------ immagine della faccia */
  useEffect(() => {
    const img = new Image();
    img.src = faceUrl;
    img.decoding = 'async';
    faceRef.current = img;
  }, []);

  /* ------------------------------------------------ audio */
  const audio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new ParkAudio();
      audioRef.current.muted = muted;
    }
    return audioRef.current;
  }, [muted]);

  useEffect(() => () => { audioRef.current?.dispose(); }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignora */ }
  }, [muted]);

  /* ------------------------------------------------ dimensioni canvas */
  useEffect(() => {
    const fit = () => {
      const cvs = canvasRef.current;
      const root = rootRef.current;
      if (!cvs || !root) return;
      const cw = root.clientWidth || window.innerWidth;
      const ch = root.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.round(cw * dpr);
      cvs.height = Math.round(ch * dpr);
      cvs.style.width = `${cw}px`;
      cvs.style.height = `${ch}px`;
      // zoom scelto sulla larghezza, ma senza mai tagliare il terreno
      // né rimpicciolire troppo la scena sugli schermi stretti
      const scale = Math.min(ch / WORLD_H, Math.max(cw / MIN_WORLD_W, ch / MAX_VIEW_H));
      const w = worldRef.current;
      w.width = cw / scale;
      w.viewTop = WORLD_H - ch / scale;
      scaleRef.current = scale * dpr;
      topRef.current = w.viewTop;
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);

  /* ------------------------------------------------ ciclo di gioco */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const w = worldRef.current;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 1 / 25) dt = 1 / 25;

      stepWorld(w, dt);

      /* suoni + reazioni agli eventi */
      const a = audioRef.current;
      for (const ev of w.events) {
        switch (ev.type) {
          case 'jump': a?.jump(ev.double); break;
          case 'land': a?.land(); break;
          case 'duck': a?.duck(); break;
          case 'coin': a?.coin(ev.combo); break;
          case 'star': a?.star(); break;
          case 'heart': a?.heart(); break;
          case 'smash': a?.smash(); break;
          case 'hit': a?.hit(); break;
          case 'levelup': a?.levelup(); a?.setTempo(ev.level); break;
          case 'gameover': {
            a?.stopMusic();
            a?.gameover();
            const prev = readBest();
            const record = ev.score > prev;
            if (record) {
              writeBest(ev.score);
              w.best = ev.score;
              window.setTimeout(() => a?.fanfare(), 700);
              for (let i = 0; i < 6; i++) {
                burst(w, 120 + Math.random() * (w.width - 240), 120 + Math.random() * 200, 16);
              }
            }
            setResult({ score: ev.score, gelati: w.gelati, best: Math.max(prev, ev.score), record });
            setScreen('over');
            break;
          }
        }
      }
      w.events.length = 0;

      /* countdown parlante */
      if (w.state === 'countdown') {
        const n = Math.ceil(w.countdown);
        if (n !== lastCountRef.current) {
          lastCountRef.current = n;
          setCount(n);
          a?.countdown(n);
        }
      } else if (lastCountRef.current !== 0) {
        lastCountRef.current = 0;
        setCount(0);
      }

      /* disegno */
      const scale = scaleRef.current;
      const top = topRef.current;
      ctx.setTransform(scale, 0, 0, scale, 0, -top * scale);
      drawWorld(ctx, w, faceRef.current, now / 1000);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      /* HUD: i numeri via DOM diretto, il resto via stato */
      if (scoreElRef.current) scoreElRef.current.textContent = String(w.score);
      if (gelatiElRef.current) gelatiElRef.current.textContent = String(w.gelati);
      hudTick += dt;
      if (hudTick > 0.1) {
        hudTick = 0;
        setLives((v) => (v === w.lives ? v : w.lives));
        setLevel((v) => (v === w.level ? v : w.level));
        setCombo((v) => (v === w.combo ? v : w.combo));
        const b = w.banner?.text ?? null;
        setBanner((v) => (v === b ? v : b));
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ------------------------------------------------ pausa automatica */
  useEffect(() => {
    const onHide = () => {
      const w = worldRef.current;
      if (document.hidden && w.state === 'running') {
        w.state = 'paused';
        audioRef.current?.stopMusic();
        setScreen('paused');
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  /* ------------------------------------------------ comandi */
  const doJump = useCallback(() => {
    audio().unlock();
    jump(worldRef.current);
  }, [audio]);

  const doDuck = useCallback((held: boolean) => {
    audio().unlock();
    setDuck(worldRef.current, held);
  }, [audio]);

  const play = useCallback(() => {
    const a = audio();
    a.unlock();
    a.setMuted(muted);
    a.setTempo(1);
    a.startMusic();
    lastCountRef.current = 4;
    setCount(0);
    startRun(worldRef.current);
    setLives(MAX_LIVES);
    setLevel(1);
    setCombo(0);
    setScreen('playing');
  }, [audio, muted]);

  const resume = useCallback(() => {
    const w = worldRef.current;
    if (w.state === 'paused') {
      w.state = 'running';
      audioRef.current?.startMusic();
      setScreen('playing');
    }
  }, []);

  const pause = useCallback(() => {
    const w = worldRef.current;
    if (w.state === 'running' || w.state === 'countdown') {
      w.state = 'paused';
      audioRef.current?.stopMusic();
      setScreen('paused');
    }
  }, []);

  const goTitle = useCallback(() => {
    const w = worldRef.current;
    w.state = 'ready';
    audioRef.current?.stopMusic();
    setScreen('title');
  }, []);

  /* tastiera (desktop) */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key;
      if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
        e.preventDefault();
        if (screen === 'title') play();
        else if (screen === 'over') play();
        else if (screen === 'paused') resume();
        else doJump();
      } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
        e.preventDefault();
        doDuck(true);
      } else if (k === 'Escape' || k === 'p' || k === 'P') {
        if (screen === 'paused') resume();
        else pause();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') doDuck(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [screen, play, resume, pause, doJump, doDuck]);

  /* il dito può uscire dal tasto: rilascia comunque l'abbassata */
  useEffect(() => {
    const release = () => { setDuckDown(false); setJumpDown(false); doDuck(false); };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [doDuck]);

  const playing = screen === 'playing';
  const pal = paletteFor(level);

  return (
    <div className="park-root" ref={rootRef} onContextMenu={(e) => e.preventDefault()}>
      <canvas className="park-canvas" ref={canvasRef} />

      <div className="park-layer">
        {/* ------------------------------ HUD ------------------------------ */}
        <div className="park-hud" style={{ opacity: screen === 'title' ? 0 : 1, transition: 'opacity .3s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <div className="park-badge park-badge--score">
              <span>🏆</span>
              <span className="park-score-num" ref={scoreElRef}>0</span>
            </div>
            <div className="park-badge">
              <span>🍦</span>
              <span ref={gelatiElRef}>0</span>
            </div>
          </div>

          <div className="park-badge park-badge--level" style={{ alignSelf: 'flex-start' }}>
            LIV. {level}<span className="park-wide-only"> · {pal.name}</span>
          </div>

          <div className="park-hearts">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className={
                  'park-heart' +
                  (i < lives ? (lives === 1 ? ' park-heart--beat' : '') : ' park-heart--off')
                }
              >
                ❤️
              </span>
            ))}
          </div>
        </div>

        {combo >= 3 && playing && (
          <div className="park-combo" key={combo}>COMBO x{combo}</div>
        )}

        {banner && playing && <div className="park-banner" key={banner}>{banner}</div>}

        {screen === 'playing' && count > 0 && (
          <div className="park-screen" style={{ background: 'transparent', pointerEvents: 'none' }}>
            <div className="park-count" key={count}>{count}</div>
          </div>
        )}

        {/* ------------------------------ tasti ------------------------------ */}
        {playing && (
          <>
            <div
              className="park-tapzone"
              onPointerDown={(e) => { e.preventDefault(); doJump(); }}
            />
            <div className="park-mini-row">
              <button className="park-mini" onPointerDown={(e) => { e.stopPropagation(); setMuted((m) => !m); }} aria-label="Audio">
                {muted ? '🔇' : '🔊'}
              </button>
              <button className="park-mini" onPointerDown={(e) => { e.stopPropagation(); pause(); }} aria-label="Pausa">
                ⏸️
              </button>
            </div>
            <div className="park-controls">
              <button
                className={'park-key park-key--down' + (duckDown ? ' is-down' : '')}
                aria-label="Abbassati"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setDuckDown(true); doDuck(true); }}
                onPointerUp={(e) => { e.stopPropagation(); setDuckDown(false); doDuck(false); }}
                onPointerLeave={() => { setDuckDown(false); doDuck(false); }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21 3 10h5.5V3h7v7H21z" /></svg>
                <span>GIÙ</span>
              </button>
              <button
                className={'park-key park-key--jump' + (jumpDown ? ' is-down' : '')}
                aria-label="Salta"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setJumpDown(true); doJump(); }}
                onPointerUp={(e) => { e.stopPropagation(); setJumpDown(false); }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 11h-5.5v7h-7v-7H3z" /></svg>
                <span>SALTA</span>
              </button>
            </div>
          </>
        )}

        {/* ------------------------------ schermate ------------------------------ */}
        {screen === 'title' && (
          <div className="park-screen">
            <img src={faceUrl} alt="" className="park-face" />
            <h1 className="park-title" aria-label={TITLE}>
              {TITLE.split('').map((c, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.09}s, ${i * 0.12}s` }}>{c}</span>
              ))}
            </h1>
            <div className="park-sub">PARK EDITION</div>
            <button className="park-cta" onPointerDown={(e) => { e.preventDefault(); play(); }}>
              ▶ GIOCA!
            </button>
            <div className="park-help">
              <div className="park-help-item"><b>⬆️</b> Salta gli ostacoli</div>
              <div className="park-help-item"><b>⬇️</b> Abbassati sotto i rami</div>
              <div className="park-help-item"><b>🍦</b> Prendi i gelati</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="park-cta park-cta--alt" onPointerDown={(e) => { e.preventDefault(); setMuted((m) => !m); }}>
                {muted ? '🔇 Audio OFF' : '🔊 Audio ON'}
              </button>
              <button className="park-cta park-cta--alt" onPointerDown={(e) => { e.preventDefault(); navigate('/'); }}>
                🏠 Home
              </button>
            </div>
            <div style={{ fontWeight: 800, opacity: 0.85, marginTop: 2 }}>
              🏅 Record: {result.best}
            </div>
          </div>
        )}

        {screen === 'paused' && (
          <div className="park-screen">
            <div className="park-gameover-emoji">⏸️</div>
            <h2 className="park-title" style={{ fontSize: 'clamp(30px,8vmin,72px)' }}>
              {'PAUSA'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * 0.09}s, ${i * 0.12}s` }}>{c}</span>)}
            </h2>
            <button className="park-cta" onPointerDown={(e) => { e.preventDefault(); resume(); }}>▶ CONTINUA</button>
            <button className="park-cta park-cta--alt" onPointerDown={(e) => { e.preventDefault(); goTitle(); }}>🏠 Menu</button>
          </div>
        )}

        {screen === 'over' && (
          <div className="park-screen">
            <div className="park-gameover-emoji">{result.record ? '🎉' : '😵'}</div>
            <h2 className="park-title" style={{ fontSize: 'clamp(30px,8vmin,78px)' }}>
              {(result.record ? 'EVVIVA!' : 'OPS!').split('').map((c, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.09}s, ${i * 0.12}s` }}>{c}</span>
              ))}
            </h2>
            {result.record && <div className="park-record">🏅 NUOVO RECORD!</div>}
            <div className="park-stats">
              <div className="park-stat"><b>{result.score}</b><small>PUNTI</small></div>
              <div className="park-stat"><b>{result.gelati}</b><small>GELATI</small></div>
              <div className="park-stat"><b>{result.best}</b><small>RECORD</small></div>
            </div>
            <button className="park-cta" onPointerDown={(e) => { e.preventDefault(); play(); }}>🔁 RIGIOCA</button>
            <button className="park-cta park-cta--alt" onPointerDown={(e) => { e.preventDefault(); goTitle(); }}>🏠 Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}

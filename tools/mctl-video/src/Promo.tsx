import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, spring, staticFile, useCurrentFrame} from 'remotion';
import T from './timeline.json';

export const FPS = T.fps;
export const DURATION = T.duration;

// ---------------------------------------------------------------- design (Terya)

const INK = '#020609';
const BG = '#F2F2F2';
const OR = '#EC6906';
const LINE = '#C7C7C9';
const GRAY = '#737373';
const GRAY_DARK = '#575757';
const FONT = 'Roboto, system-ui, sans-serif';
const MONO = 'Mono, monospace';

// UI reale dell'app (palette Google)
const UI = {
  bg: '#F8F9FA', border: '#DADCE0', text: '#202124', sub: '#5F6368', accent: '#1A73E8', soft: '#E8F0FE',
  green: '#34A853', orange: '#FB8C00', red: '#EA4335', grey: '#BDC1C6',
  greenT: '#137333', orangeT: '#B25C00', redT: '#C5221F',
};

// ---------------------------------------------------------------- motion

type Feel = 'snappy' | 'default' | 'heavy' | 'pop';
const FEEL: Record<Feel, {stiffness: number; damping: number; mass: number}> = {
  snappy: {stiffness: 320, damping: 30, mass: 1},
  default: {stiffness: 170, damping: 26, mass: 1},
  heavy: {stiffness: 120, damping: 24, mass: 1.4},
  pop: {stiffness: 260, damping: 13, mass: 1},
};

const sp = (f: number, at: number, feel: Feel = 'default') =>
  f < at ? 0 : spring({frame: f - at, fps: FPS, config: FEEL[feel]});
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Valore con piu' target: somma di una spring per ogni cambio (moto continuo).
const track = (f: number, keys: [number, number][], feel: Feel = 'default') => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * sp(f, keys[i][0], feel);
  return v;
};

const Reveal: React.FC<{f: number; at: number; style?: React.CSSProperties; children: React.ReactNode}> = ({f, at, style, children}) => {
  const p = sp(f, at, 'default');
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.12em', whiteSpace: 'nowrap', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- dati (esempio M_CTL999.DAT)

type Op = {code: string; name: string; key: string; cassa: string; pw: string; state: string; date: string; open: string; close: string};
const RAW = [
  '0256:CASSIERE 256:02560256:0056:99:01:170303:0823:0000',
  '0257:CASSIERE 257:02570257:0000:00:00:000000:0000:0000',
  '0258:CASSIERE 258:02580258:0000:00:00:000000:0000:0000',
  '0259:CASSIERE 259:02590259:0000:00:00:000000:0000:0000',
  '0600:CASSIERE 600:06000600:0000:00:00:000000:0000:0000',
  '0601:CASSIERE 601:06010601:0021:01:01:170303:1441:0000',
  '0602:CASSIERE 602:06020602:0012:47:02:170303:0800:1400',
  '0603:CASSIERE 603:06030603:0000:00:00:000000:0000:0000',
  '0604:CASSIERE 604:06040604:0018:35:08:170303:0930:0000',
  '0605:CASSIERE 605:06050605:0000:00:00:000000:0000:0000',
  '0606:CASSIERE 606:06060606:0000:00:00:000000:0000:0000',
  '0607:CASSIERE 607:06070607:0000:00:00:000000:0000:0000',
  '0608:CASSIERE 608:06080608:0000:00:00:000000:0000:0000',
  '0609:CASSIERE 609:06090609:0024:09:01:170303:1011:0000',
];
const OPS: Op[] = RAW.map((l) => {
  const [code, name, key, cassa, pw, state, date, open, close] = l.split(':');
  return {code, name, key, cassa, pw, state, date, open, close};
});
const trimZ = (s: string) => s.replace(/^0+/, '') || '0';
const fmtTime = (s: string) => (/^0+$/.test(s) ? '—' : `${s.slice(0, 2)}:${s.slice(2)}`);
const fmtDate = (s: string) => (/^0+$/.test(s) ? '—' : `${s.slice(4, 6)}/${s.slice(2, 4)}/20${s.slice(0, 2)}`);
const opLed = (o: Op) => ({'01': UI.green, '08': UI.orange, '02': UI.red}[o.state] ?? UI.grey);
const opText = (o: Op) => ({'01': UI.greenT, '08': UI.orangeT, '02': UI.redT}[o.state] ?? UI.sub);
const opMsg = (o: Op) =>
  ({'01': `Risulta aperto in cassa ${trimZ(o.cassa)}`, '08': `Risulta in pausa in cassa ${trimZ(o.cassa)}`, '02': 'Risulta chiuso'}[o.state] ??
  'Non risulta ancora aperto');
const opShort = (o: Op) =>
  ({'01': `Aperto · cassa ${trimZ(o.cassa)}`, '08': `In pausa · cassa ${trimZ(o.cassa)}`, '02': 'Chiuso'}[o.state] ?? 'Non aperto');

// Stato della ricerca al frame f (stessa logica dell'app)
const queryAt = (f: number) => {
  let q = '';
  let since = 0;
  for (const [t, v] of T.typing as [number, string][]) if (f >= t) { q = v; since = t; }
  return {q, since};
};
const matches = (q: string) => (q ? OPS.filter((o) => trimZ(o.code).startsWith(trimZ(q))) : OPS);

// ---------------------------------------------------------------- icone

const Lock: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill={color} />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth="2.2" />
  </svg>
);

const Key: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="11.5" cy="16" r="5" stroke={color} strokeWidth="3" />
    <path d="M16.5 16H26M22.5 16v4.5M26 16v3" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Cursor: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24">
    <path d="M4 2.5l15 9.2-6.6 1.4 3.9 7.2-2.9 1.5-3.9-7.2L4.6 19z" fill={INK} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const Led: React.FC<{color: string; size: number; glow?: number}> = ({color, size, glow = 0}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    {glow > 0 && (
      <div style={{position: 'absolute', inset: -size * 0.45 * glow, borderRadius: '50%', background: color, opacity: 0.22}} />
    )}
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: color}} />
  </div>
);

// ---------------------------------------------------------------- scena A: le richieste arrivano

const STORES = ['PdV 014', 'PdV 031', 'PdV 007', 'PdV 022', 'PdV 018', 'PdV 041', 'PdV 003', 'PdV 027', 'PdV 009', 'PdV 036'];
const CODES = ['609', '256', '601', '604', '602', '609', '258', '603', '607', '600'];
const HOURS = ['08:02', '08:47', '09:15', '09:58', '10:31', '11:20', '12:44', '14:09', '15:36', '17:52'];

const SceneA: React.FC<{f: number}> = ({f}) => {
  const n = T.requests.filter((t) => f >= t).length;
  const last = T.requests[Math.max(0, n - 1)];
  const punch = n > 0 ? 1.16 - 0.16 * sp(f, last, 'pop') : 0;
  const exit = sp(f, T.toB, 'default');
  return (
    <AbsoluteFill style={{background: INK, transform: `translateY(${-exit * 260}px)`}}>
      <div style={{position: 'absolute', left: 150, top: 170, color: OR, fontFamily: FONT, fontWeight: 900, fontSize: 380, lineHeight: 1,
        transform: `scale(${punch})`, transformOrigin: '0% 80%', fontVariantNumeric: 'tabular-nums'}}>
        {n}
      </div>
      <Reveal f={f} at={4} style={{position: 'absolute', left: 160, top: 600}}>
        <div style={{color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 70, lineHeight: 1.15}}>richieste password</div>
      </Reveal>
      <Reveal f={f} at={12} style={{position: 'absolute', left: 162, top: 690}}>
        <div style={{color: 'rgba(255,255,255,0.6)', fontFamily: FONT, fontWeight: 400, fontSize: 46}}>ogni giorno, dai negozi.</div>
      </Reveal>
      {T.requests.map((t, i) => {
        const inP = sp(f, t, 'snappy');
        if (inP <= 0) return null;
        let depth = 0;
        for (let j = i + 1; j < T.requests.length; j++) depth += sp(f, T.requests[j], 'snappy');
        const y = 800 - depth * 138 + (1 - inP) * 320;
        const scale = 1 - depth * 0.035;
        const op = clamp(inP * 3) * clamp(1 - (depth - 4.2) * 0.8);
        return (
          <div key={i} style={{position: 'absolute', left: 1000, top: y, width: 800, height: 120, background: '#fff', borderRadius: 30,
            display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', boxSizing: 'border-box', opacity: op,
            transform: `scale(${scale})`, transformOrigin: '50% 100%'}}>
            <div style={{width: 64, height: 64, borderRadius: 32, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Lock size={34} color="#fff" />
            </div>
            <div style={{fontFamily: FONT}}>
              <div style={{color: GRAY, fontSize: 22, fontWeight: 500}}>{STORES[i]} · {HOURS[i]}</div>
              <div style={{color: INK, fontSize: 31, fontWeight: 700, marginTop: 2}}>Mi serve la password dell'operatore {CODES[i]}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scena B: come si fa oggi

const STEPS = ['Collegarsi al server del negozio', 'Aprire M_CTL999.DAT', 'Decifrare righe e colonne'];

const SceneB: React.FC<{f: number}> = ({f}) => {
  const rise = sp(f, T.toB, 'default');
  const focus = sp(f, 148, 'default');
  return (
    <div style={{position: 'absolute', left: 0, top: (1 - rise) * 1100, width: 1920, height: 1080 + 60, background: BG,
      borderTopLeftRadius: 40 * (1 - rise), borderTopRightRadius: 40 * (1 - rise)}}>
      <Reveal f={f} at={92} style={{position: 'absolute', left: 160, top: 140}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 80, color: INK}}>Oggi, per ogni richiesta:</div>
      </Reveal>
      {STEPS.map((s, i) => {
        const at = T.steps[i];
        const line = sp(f, at, 'snappy');
        const dim = i < 2 ? 1 - focus * 0.72 : 1;
        const hot = i === 2 ? focus : 0;
        return (
          <div key={i} style={{position: 'absolute', left: 160, top: 330 + i * 200, width: 1600, opacity: dim}}>
            <div style={{height: 2, background: LINE, transform: `scaleX(${line})`, transformOrigin: '0 0'}} />
            <div style={{display: 'flex', alignItems: 'baseline', gap: 44, marginTop: 34}}>
              <Reveal f={f} at={at + 2}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: OR}}>0{i + 1}</div>
              </Reveal>
              <Reveal f={f} at={at + 4}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 92, color: interpolateColors(hot, [0, 1], [INK, OR]), lineHeight: 1.15}}>{s}</div>
              </Reveal>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- contenitore unico: pannello file -> finestra app

const PANEL = {x: 80, y: 80, w: 1760, h: 920, r: 40};
const WIN = {x: 1010, y: 90, w: 780, h: 900, r: 26};

const frameRect = (f: number) => {
  const up = sp(f, T.toC, 'heavy');
  const m = sp(f, T.morph, 'default');
  return {
    x: lerp(PANEL.x, WIN.x, m),
    y: lerp(PANEL.y + (1 - up) * 1100, WIN.y, m),
    w: lerp(PANEL.w, WIN.w, m),
    h: lerp(PANEL.h, WIN.h, m),
    r: lerp(PANEL.r, WIN.r, m),
    m,
  };
};

const LABELS: (string | null)[] = ['CODICE', 'NOME', null, 'CASSA 24', 'PASSWORD 09', 'STATO aperto', 'DATA 03/03/17', 'APERTURA 10:11', 'CHIUSURA —'];

const FileView: React.FC<{f: number}> = ({f}) => {
  const scanP = interpolate(f, T.scan, [0, 13], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)});
  const found = clamp((f - T.scan[1]) / 5);
  const ex = sp(f, T.expand, 'heavy');
  const gap = ex * 30;
  const fields = RAW[13].split(':');
  return (
    <>
      <div style={{position: 'absolute', left: 60, top: 46, display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 24, color: 'rgba(242,242,242,0.55)'}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: OR}} />
        C:\Server\Data\M_CTL999.DAT
      </div>
      {f < T.scan[1] + 1 && (
        <div style={{position: 'absolute', left: 44, top: 120 + scanP * 50, width: 1672, height: 50, borderRadius: 10, background: 'rgba(236,105,6,0.22)'}} />
      )}
      {RAW.map((l, i) => {
        if (i === 13) return null;
        const inP = clamp((f - (T.toC + 14 + i)) / 6);
        return (
          <div key={i} style={{position: 'absolute', left: 60 + (1 - inP) * 40, top: 128 + i * 50, fontFamily: MONO, fontSize: 30, whiteSpace: 'pre',
            color: '#F2F2F2', opacity: inP * lerp(0.55, 0.1, found) * (1 - ex * 0.65)}}>
            {l}
          </div>
        );
      })}
      {(() => {
        const inP = clamp((f - (T.toC + 27)) / 6);
        const y = lerp(128 + 13 * 50, 330, ex);
        return (
          <div style={{position: 'absolute', left: 60 + (1 - inP) * 40, top: y, opacity: inP, transform: `scale(${1 + ex * 0.32})`, transformOrigin: '0 50%',
            display: 'flex', fontFamily: MONO, fontSize: 30, whiteSpace: 'pre', color: interpolateColors(found, [0, 1], ['rgba(242,242,242,0.55)', '#ffffff'])}}>
            {fields.map((s, k) => {
              const lp = sp(f, T.labels + k * 3, 'pop');
              const label = LABELS[k];
              const above = k % 2 === 1;
              const isPw = k === 4;
              return (
                <div key={k} style={{position: 'relative', display: 'flex'}}>
                  <span style={{color: isPw ? interpolateColors(lp, [0, 1], ['#fff', OR]) : undefined}}>{s}</span>
                  {k < fields.length - 1 && <span style={{opacity: 1 - ex * 0.7, padding: `0 ${gap / 2}px`}}>:</span>}
                  {label && lp > 0 && (
                    <div style={{position: 'absolute', left: 0, top: above ? -50 : 48, whiteSpace: 'nowrap', fontFamily: FONT, fontWeight: 700, fontSize: 19,
                      letterSpacing: 0.5, color: isPw ? '#fff' : 'rgba(255,255,255,0.7)', background: isPw ? OR : 'transparent',
                      padding: isPw ? '3px 10px' : 0, borderRadius: 99, transform: `translateY(${(1 - lp) * (above ? 14 : -14)}px) scale(${lp})`,
                      transformOrigin: '0 50%'}}>
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      <Reveal f={f} at={T.caption} style={{position: 'absolute', left: 60, top: 560}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 72, color: '#fff', lineHeight: 1.15}}>9 campi, zero etichette.</div>
      </Reveal>
      <Reveal f={f} at={T.caption + 6} style={{position: 'absolute', left: 62, top: 650}}>
        <div style={{fontFamily: FONT, fontWeight: 400, fontSize: 46, color: 'rgba(255,255,255,0.6)'}}>Dieci volte al giorno.</div>
      </Reveal>
    </>
  );
};

// ---------------------------------------------------------------- l'app (UI reale ricostruita)

const AppView: React.FC<{f: number}> = ({f}) => {
  const {q, since} = queryAt(f);
  const res = matches(q);
  const exact = q ? res.find((o) => trimZ(o.code) === trimZ(q)) : undefined;
  const sel = exact ?? (q && res.length === 1 ? res[0] : undefined);
  const focused = f >= T.clicks[0];
  const selAll = (T.selectAll as number[]).some((t) => f >= t && f < t + 4);
  const caret = focused && Math.floor(f / 8) % 2 === 0;
  const enter = sp(f, since, 'snappy');
  const chip = sp(f, since + 2, 'pop');
  const W = WIN.w;
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: FONT}}>
      <div style={{height: 46, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, borderBottom: `1px solid ${UI.border}`, background: '#fff'}}>
        <div style={{width: 20, height: 20, borderRadius: 10, background: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Key size={16} color="#fff" />
        </div>
        <div style={{fontSize: 16, color: UI.sub}}>Password Operatori</div>
        <div style={{flex: 1}} />
        <div style={{fontSize: 16, color: UI.sub, letterSpacing: 18}}>–▢✕</div>
      </div>
      <div style={{position: 'absolute', top: 46, left: 0, right: 0, bottom: 0, background: UI.bg}}>
        <div style={{position: 'absolute', left: 32, top: 22, fontSize: 32, color: UI.text}}>Password Operatori</div>
        <div style={{position: 'absolute', left: 34, top: 66, fontSize: 15, color: UI.sub}}>C:\Server\Data\M_CTL999.DAT · 14 operatori · aggiornato alle 10:12:05</div>
        <div style={{position: 'absolute', right: 40, top: 30, fontSize: 18, fontWeight: 500, color: UI.accent}}>Aggiorna</div>

        <div style={{position: 'absolute', left: 32, top: 106, width: W - 64, height: 64, background: '#fff', borderRadius: 16, boxSizing: 'border-box',
          border: focused ? `2px solid ${UI.accent}` : `1px solid ${UI.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: 24}}>
          {q ? <span style={{color: UI.text, background: selAll ? '#C6DAFC' : 'transparent'}}>{q}</span> : !focused && <span style={{color: '#9AA0A6'}}>Cerca operatore (es. 609 o nome)</span>}
          {caret && <span style={{width: 2, height: 28, background: UI.text, marginLeft: 2}} />}
        </div>

        <div style={{position: 'absolute', left: 32, top: 192, width: W - 64, height: 300, background: '#fff', borderRadius: 20, border: `1px solid ${UI.border}`, boxSizing: 'border-box', overflow: 'hidden'}}>
          {sel ? (
            <div style={{position: 'absolute', inset: 0, padding: 30, opacity: clamp(enter * 2), transform: `translateY(${(1 - enter) * 14}px)`}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <Led color={opLed(sel)} size={18} glow={1} />
                <div style={{fontSize: 18, color: UI.sub}}>{sel.name}   ·   cod. {sel.code}</div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 24}}>
                <div style={{fontSize: 31, color: UI.text}}>La password dell'operatore {trimZ(sel.code)} è</div>
                <div style={{fontSize: 31, fontWeight: 700, color: UI.accent, background: UI.soft, borderRadius: 12, padding: '4px 18px', transform: `scale(${chip})`}}>{sel.pw}</div>
              </div>
              <div style={{fontSize: 25, color: opText(sel), marginTop: 22}}>{opMsg(sel)}</div>
              <div style={{height: 1, background: UI.border, marginTop: 24}} />
              <div style={{display: 'flex', marginTop: 18}}>
                {[['CASSA', /^0+$/.test(sel.cassa) ? '—' : trimZ(sel.cassa)], ['DATA', fmtDate(sel.date)], ['APERTURA', fmtTime(sel.open)], ['CHIUSURA', fmtTime(sel.close)]].map(([l, v]) => (
                  <div key={l} style={{flex: 1}}>
                    <div style={{fontSize: 13, fontWeight: 700, color: UI.sub}}>{l}</div>
                    <div style={{fontSize: 25, color: UI.text, marginTop: 4}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 20, color: UI.sub, padding: 40, lineHeight: 1.4}}>
              {q ? `${res.length} operatori trovati: selezionane uno dall'elenco.` : 'Cerca un operatore per codice o nome per vedere password, cassa e stato.'}
            </div>
          )}
        </div>

        <div style={{position: 'absolute', left: 32, top: 512, width: W - 64, height: 316, background: '#fff', borderRadius: 20, border: `1px solid ${UI.border}`, boxSizing: 'border-box', overflow: 'hidden', padding: '10px 6px'}}>
          {res.slice(0, 5).map((o) => {
            const isSel = sel === o;
            return (
              <div key={o.code} style={{height: 58, display: 'flex', alignItems: 'center', gap: 0, padding: '0 18px', borderRadius: 12, background: isSel ? UI.soft : 'transparent'}}>
                <Led color={opLed(o)} size={12} />
                <div style={{width: 80, marginLeft: 20, fontSize: 18, fontWeight: 700, color: isSel ? UI.accent : UI.text}}>{o.code}</div>
                <div style={{flex: 1, fontSize: 18, color: isSel ? UI.accent : UI.text}}>{o.name}</div>
                <div style={{fontSize: 17, color: o.state === '00' ? UI.sub : opText(o)}}>{opShort(o)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scena D: colonna sinistra

const LEGEND: [string, string, string][] = [['open', UI.green, 'Aperto'], ['pause', UI.orange, 'In pausa'], ['closed', UI.red, 'Chiuso']];

const SceneDLeft: React.FC<{f: number}> = ({f}) => {
  let active = '';
  for (const [t, s] of T.reveal as [number, string][]) if (f >= t) active = s;
  return (
    <div style={{position: 'absolute', left: 150, top: 0, fontFamily: FONT}}>
      <Reveal f={f} at={T.morph + 14} style={{position: 'absolute', top: 210}}>
        <div style={{fontSize: 26, fontWeight: 700, color: OR, letterSpacing: 2}}>LA SOLUZIONE</div>
      </Reveal>
      <Reveal f={f} at={T.morph + 18} style={{position: 'absolute', top: 252}}>
        <div style={{fontSize: 118, fontWeight: 900, color: INK, whiteSpace: 'nowrap', lineHeight: 1.1}}>MCTL Viewer</div>
      </Reveal>
      <Reveal f={f} at={T.morph + 24} style={{position: 'absolute', top: 400, width: 760}}>
        <div style={{fontSize: 44, color: GRAY_DARK, lineHeight: 1.2}}>Scrivi il codice operatore.<br />Password, cassa e stato, subito.</div>
      </Reveal>
      {LEGEND.map(([key, color, label], i) => {
        const inP = sp(f, T.morph + 32 + i * 3, 'snappy');
        const idx = (T.reveal as [number, string][]).findIndex(([, s]) => s === key);
        const on = active === key ? sp(f, T.reveal[idx][0] as number, 'pop') : 0;
        const seen = active === '' ? 1 : active === key ? 1 : 0.35;
        return (
          <div key={key} style={{position: 'absolute', top: 600 + i * 92, display: 'flex', alignItems: 'center', gap: 30, opacity: inP * seen,
            transform: `translateX(${(1 - inP) * -40}px)`}}>
            <div style={{transform: `scale(${1 + on * 0.25})`}}>
              <Led color={color} size={34} glow={on} />
            </div>
            <div style={{fontSize: 46, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- scena E: payoff

const LED_ABS = {x: WIN.x + 32 + 30 + 9, y: WIN.y + 46 + 192 + 30 + 9};

const SceneE: React.FC<{f: number}> = ({f}) => {
  const r = sp(f, T.toE, 'heavy') * 2400;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: LED_ABS.x - r, top: LED_ABS.y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: OR}} />
      <Reveal f={f} at={T.toE + 14} style={{position: 'absolute', left: 150, top: 250}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 136, color: '#fff', lineHeight: 1.1}}>10 richieste al giorno.</div>
      </Reveal>
      <Reveal f={f} at={T.toE + 24} style={{position: 'absolute', left: 154, top: 420}}>
        <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 84, color: INK}}>Risolte in pochi secondi.</div>
      </Reveal>
      {Array.from({length: 10}).map((_, i) => {
        const inP = sp(f, T.toE + 20 + i, 'snappy');
        const c = sp(f, T.checks + i * 2.5, 'pop');
        return (
          <div key={i} style={{position: 'absolute', left: 160 + i * 116, top: 680, width: 84, height: 84, borderRadius: 42, boxSizing: 'border-box',
            border: '4px solid #fff', background: c > 0.01 ? '#fff' : 'transparent', opacity: inP, transform: `scale(${(0.6 + inP * 0.4) * (c > 0.01 ? 0.8 + c * 0.2 : 1)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {c > 0.01 && (
              <svg width="44" height="44" viewBox="0 0 24 24" style={{transform: `scale(${c})`}}>
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={OR} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scena F: chiusura

const PILLS = ['Un solo .exe', 'Nessuna installazione', 'Accesso solo responsabile'];

const SceneF: React.FC<{f: number}> = ({f}) => {
  const rise = sp(f, T.toF, 'default');
  const icon = sp(f, T.toF + 14, 'pop');
  const drift = (f - T.toF) * 0.25;
  return (
    <div style={{position: 'absolute', left: 0, top: (1 - rise) * 1100, width: 1920, height: 1140, background: INK,
      borderTopLeftRadius: 40 * (1 - rise), borderTopRightRadius: 40 * (1 - rise), fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 150 - drift, top: 0}}>
        <div style={{position: 'absolute', top: 268, width: 150, height: 150, borderRadius: 75, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${icon})`}}>
          <Key size={104} color="#fff" />
        </div>
        <Reveal f={f} at={T.toF + 18} style={{position: 'absolute', left: 190, top: 262}}>
          <div style={{fontSize: 148, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1.1}}>MCTL Viewer</div>
        </Reveal>
        <Reveal f={f} at={T.toF + 24} style={{position: 'absolute', top: 470, width: 1500}}>
          <div style={{fontSize: 52, color: 'rgba(255,255,255,0.6)'}}>La password dell'operatore, in un colpo d'occhio.</div>
        </Reveal>
        <div style={{position: 'absolute', top: 610, display: 'flex', gap: 24}}>
          {PILLS.map((p, i) => {
            const s = sp(f, T.toF + 30 + i * 4, 'pop');
            return (
              <div key={p} style={{fontSize: 32, fontWeight: 700, color: '#fff', padding: '20px 44px', borderRadius: 999, whiteSpace: 'nowrap',
                border: `2px solid ${i === 0 ? OR : '#fff'}`, background: i === 0 ? OR : 'transparent', transform: `scale(${s})`, opacity: clamp(s * 2)}}>
                {p}
              </div>
            );
          })}
        </div>
        <Reveal f={f} at={T.toF + 44} style={{position: 'absolute', top: 790}}>
          <div style={{fontSize: 30, color: 'rgba(255,255,255,0.5)'}}>Service Desk Terya</div>
        </Reveal>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- composizione

export const Promo: React.FC = () => {
  const f = useCurrentFrame();
  const fr = frameRect(f);
  const fileOpacity = 1 - clamp((f - T.morph) / 6);
  const appOpacity = clamp((f - (T.morph + 4)) / 6);

  // cursore
  const [c1, c2, c3] = T.clicks;
  const cx = track(f, [[0, 1700], [T.cursorMove, WIN.x + 330], [c3 + 20, WIN.x + 520]], 'default');
  const cy = track(f, [[0, 1150], [T.cursorMove, WIN.y + 46 + 150], [c3 + 20, WIN.y + 46 + 192 + 104]], 'default');
  const press = [c1, c2, c3].reduce((s, t) => s * (f >= t && f < t + 8 ? 1 - 0.18 * Math.sin(((f - t) / 8) * Math.PI) : 1), 1);
  const showCursor = f >= T.cursorMove - 2 && f < T.toE + 6;

  return (
    <AbsoluteFill style={{background: BG}}>
      <Audio src={staticFile('music.wav')} />

      {f < T.toB + 30 && <SceneA f={f} />}
      {f >= T.toB - 2 && f < T.toC + 40 && <SceneB f={f} />}

      {f >= T.morph && f < T.toE + 30 && <SceneDLeft f={f} />}

      {f >= T.toC && f < T.toE + 30 && (
        <div style={{position: 'absolute', left: fr.x, top: fr.y, width: fr.w, height: fr.h, borderRadius: fr.r, overflow: 'hidden',
          background: interpolateColors(fr.m, [0, 1], [INK, '#ffffff']), boxSizing: 'border-box',
          border: fr.m > 0.5 ? `1px solid ${UI.border}` : 'none'}}>
          {fileOpacity > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: PANEL.w, height: PANEL.h, opacity: fileOpacity}}><FileView f={f} /></div>}
          {appOpacity > 0 && <div style={{position: 'absolute', inset: 0, opacity: appOpacity}}><AppView f={f} /></div>}
        </div>
      )}

      {showCursor && (
        <div style={{position: 'absolute', left: cx, top: cy, transform: `scale(${press})`, transformOrigin: '0 0'}}>
          {[c1, c2, c3].map((t) =>
            f >= t && f < t + 14 ? (
              <div key={t} style={{position: 'absolute', left: 6 - (f - t) * 3, top: 6 - (f - t) * 3, width: (f - t) * 6, height: (f - t) * 6,
                borderRadius: '50%', border: `3px solid ${UI.accent}`, opacity: 1 - (f - t) / 14}} />
            ) : null,
          )}
          <Cursor />
        </div>
      )}

      {f >= T.toE && f < T.toF + 30 && <SceneE f={f} />}
      {f >= T.toF && <SceneF f={f} />}
    </AbsoluteFill>
  );
};

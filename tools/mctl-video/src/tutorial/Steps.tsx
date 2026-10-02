import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from './timeline.json';
import {AppDemo, MOSTRA} from '../launch/AppDemo';
import {BG, FONT, GRAY, INK, OR, POP, ease} from '../launch/brand';
import {Cursor} from './Cursor';
import {Explorer} from './Explorer';
import {LoginUI} from './LoginUI';

const S = T.steps;
const STEPS: [string, string][] = [
  ['Avvia PasswordOperatori.exe', 'Doppio clic, sul server del negozio. Nessuna installazione.'],
  ['Accedi con il tuo utente', 'Responsabile del box o direttore.'],
  ['Scrivi il codice operatore', 'Per esempio 09, oppure il nome.'],
  ['Clicca Mostra', 'Comunica la password all\'operatore. Fatto.'],
];

// Schermo a destra: dove sta la UI.
const SCREEN = {x: 920, y: 90, w: 880, h: 900};
const APP = {x: 1010, y: 90};
const LOGIN = {x: 920, y: 260};
const EXPLORER = {x: 950, y: 260};

const Callout: React.FC<{f: number; at: number; x: number; y: number; w: number; h: number; label: string; below?: boolean}> = ({f, at, x, y, w, h, label, below}) => {
  const p = ease(f, at, at + 16, 0, 1, POP);
  if (p <= 0.001) return null;
  return (
    <>
      <div style={{position: 'absolute', left: x - 8, top: y - 8, width: w + 16, height: h + 16, borderRadius: 18, border: `3px solid ${OR}`, opacity: Math.min(1, p * 2), scale: String(0.9 + 0.1 * p)}} />
      <div style={{position: 'absolute', left: x - 8, top: below ? y + h + 16 : y - 50, background: INK, color: '#fff', fontSize: 17, fontWeight: 700, padding: '7px 14px',
        borderRadius: 99, whiteSpace: 'nowrap', opacity: Math.min(1, p * 2), translate: `0px ${(1 - p) * (below ? -8 : 8)}px`}}>{label}</div>
    </>
  );
};

export const Steps: React.FC = () => {
  const f = useCurrentFrame();
  let active = 0;
  S.active.forEach((t, i) => { if (f >= t) active = i; });

  // fasi dello schermo
  const explorerVis = 1 - ease(f, S.toLogin, S.toLogin + 12);
  const loginIn = ease(f, S.toLogin + 4, S.toLogin + 26);
  const loginOut = ease(f, S.toApp, S.toApp + 12);
  const appIn = ease(f, S.toApp + 6, S.toApp + 28);

  const userTyped = 'direttore'.slice(0, Math.floor(ease(f, S.user[0], S.user[1], 0, 9, (x) => x)));
  const dots = Math.floor(ease(f, S.pass[0], S.pass[1], 0, 8, (x) => x));
  const focus = f < S.pass[0] - 4 ? 'user' : 'pass';
  const caret = Math.floor(f / 8) % 2 === 0;

  const app = f - S.toApp; // tempo locale dell'app
  const mostra = {x: APP.x + MOSTRA.x + 40, y: APP.y + MOSTRA.y + 20};

  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT}}>
      {/* passi */}
      <div style={{position: 'absolute', left: 130, top: 130, fontSize: 26, fontWeight: 700, color: OR, letterSpacing: '0.14em'}}>COME SI USA</div>
      <div style={{position: 'absolute', left: 156, top: 236, width: 3, height: 3 * 168, background: '#D9D9D9'}} />
      <div style={{position: 'absolute', left: 156, top: 236, width: 3, height: ease(f, 0, S.active[3] + 20, 0, 3 * 168, (x) => x), background: OR}} />
      {STEPS.map(([title, sub], i) => {
        const on = i === active;
        const done = i < active;
        const p = ease(f, S.active[i], S.active[i] + 18);
        return (
          <div key={title} style={{position: 'absolute', left: 130, top: 200 + i * 168, display: 'flex', gap: 30, alignItems: 'flex-start', opacity: on ? 1 : done ? 0.55 : 0.35}}>
            <div style={{width: 56, height: 56, borderRadius: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700,
              background: on || done ? OR : BG, border: on || done ? 'none' : '3px solid #C7C7C9', color: on || done ? '#fff' : GRAY, boxSizing: 'border-box',
              scale: String(on ? 1 + 0.12 * (1 - p) * p * 4 : 1)}}>{done ? '✓' : i + 1}</div>
            <div style={{width: 640}}>
              <div style={{fontSize: on ? 48 : 38, fontWeight: 700, color: INK, letterSpacing: '-0.02em', lineHeight: 1.1}}>{title}</div>
              {on && <div style={{fontSize: 26, color: '#575757', marginTop: 12, opacity: p, translate: `0px ${(1 - p) * 10}px`}}>{sub}</div>}
            </div>
          </div>
        );
      })}

      {/* schermo */}
      {explorerVis > 0.01 && (
        <div style={{position: 'absolute', left: EXPLORER.x, top: EXPLORER.y, opacity: explorerVis * ease(f, 0, 14), scale: String(0.97 + 0.03 * ease(f, 0, 20))}}>
          <Explorer selected={f >= S.dblclick[0]} />
        </div>
      )}
      {loginIn > 0.01 && loginOut < 0.99 && (
        <div style={{position: 'absolute', left: LOGIN.x, top: LOGIN.y, opacity: loginIn * (1 - loginOut), scale: String(0.94 + 0.06 * loginIn)}}>
          <LoginUI user={userTyped} dots={dots} focus={f >= S.user[0] - 6 ? focus : 'none'} caret={caret} pressed={f >= S.login && f < S.login + 6} />
        </div>
      )}
      {appIn > 0.01 && (
        <div style={{position: 'absolute', left: APP.x, top: APP.y, opacity: appIn, scale: String(0.96 + 0.04 * appIn), boxShadow: '0 30px 80px rgba(2,6,9,0.12)', borderRadius: 26}}>
          <AppDemo f={app} typing={(S.typing as [number, string][]).map(([t, v]) => [t - S.toApp, v] as [number, string])} reveal={S.reveal - S.toApp} />
        </div>
      )}

      {/* evidenziazioni sul risultato */}
      <Callout f={f} at={S.callouts} x={APP.x + MOSTRA.x} y={APP.y + MOSTRA.y} w={100} h={MOSTRA.h} label="La password" />
      <Callout f={f} at={S.callouts + 10} x={APP.x + 56} y={APP.y + 384} w={250} h={34} label="Stato e cassa" below />
      <Callout f={f} at={S.callouts + 20} x={APP.x + 54} y={APP.y + 254} w={160} h={44} label="LED verde: aperto" />

      <Cursor f={f}
        path={[[0, 1500, 980], [36, EXPLORER.x + 220, EXPLORER.y + 228], [72, EXPLORER.x + 220, EXPLORER.y + 228],
          [100, 1640, 960], [192, LOGIN.x + 630, LOGIN.y + 379], [S.toApp, LOGIN.x + 630, LOGIN.y + 379],
          [S.reveal - 30, 1700, 900], [S.reveal - 8, mostra.x, mostra.y], [S.reveal + 30, mostra.x, mostra.y], [S.reveal + 60, 1760, 980]]}
        clicks={[S.dblclick[0], S.dblclick[1], S.login, S.reveal]}
        visible={f < S.reveal + 70} />
      <div style={{position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: 0, height: 0}} />
    </AbsoluteFill>
  );
};

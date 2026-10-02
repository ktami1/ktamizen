import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from './timeline.json';
import {FONT, INK, OR, POP, ease} from './brand';

const ITEMS: [string, string, number][] = [
  ['Sola lettura', 'Il file del gestionale non viene mai modificato.', 0],
  ['Nessuna rete', 'Nessun dato esce dal server del negozio.', 1],
  ['Accessi personali', 'Ogni responsabile ha il suo utente.', 2],
  ['Tutto registrato', 'Ogni password vista finisce nel registro.', 3],
];

const Icon: React.FC<{kind: number}> = ({kind}) => {
  const s = {stroke: '#fff', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width="64" height="64" viewBox="0 0 24 24">
      {kind === 0 && <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" {...s} /><circle cx="12" cy="12" r="3" {...s} /></>}
      {kind === 1 && <><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0" {...s} /><path d="M3 3l18 18" {...s} /></>}
      {kind === 2 && <><circle cx="12" cy="8" r="4" {...s} /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...s} /></>}
      {kind === 3 && <><path d="M8 6h12M8 12h12M8 18h12" {...s} /><path d="M3 6l1.2 1.2L6 5M3 12l1.2 1.2L6 11M3 18l1.2 1.2L6 17" {...s} /></>}
    </svg>
  );
};

// Quattro promesse, una alla volta, come in una keynote.
export const Security: React.FC = () => {
  const f = useCurrentFrame();
  const step = T.security.step;
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontSize: 30, fontWeight: 700, color: OR, letterSpacing: '0.12em',
        opacity: ease(f, 0, 16)}}>SICURO PER IL SERVER DEL NEGOZIO</div>
      {ITEMS.map(([title, sub, kind], i) => {
        const at = i * step;
        const inP = ease(f, at, at + 16);
        const outP = i === ITEMS.length - 1 ? 0 : ease(f, at + step - 6, at + step + 4);
        const vis = inP * (1 - outP);
        if (vis <= 0.001) return null;
        return (
          <div key={title} style={{position: 'absolute', inset: 0, opacity: vis, filter: `blur(${(1 - inP) * 14 + outP * 14}px)`,
            scale: String(0.94 + 0.06 * inP - 0.03 * outP)}}>
            <div style={{position: 'absolute', left: 960 - 70, top: 290, width: 140, height: 140, borderRadius: 70, background: OR,
              display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(ease(f, at, at + 18, 0.5, 1, POP))}}>
              <Icon kind={kind} />
            </div>
            <div style={{position: 'absolute', top: 480, width: '100%', textAlign: 'center', fontSize: 150, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'}}>
              {title}<span style={{color: OR}}>.</span>
            </div>
            <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center', fontSize: 46, color: 'rgba(255,255,255,0.6)'}}>{sub}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

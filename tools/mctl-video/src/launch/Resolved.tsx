import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, LED_TEXT, OR, POP, TicketCard, ease} from './brand';

// Risposta al negozio, ticket chiuso, poi tutti gli altri.
export const Resolved: React.FC = () => {
  const f = useCurrentFrame();
  const reply = ease(f, 8, 30);
  const closed = f >= 40;
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 410, top: 110}}>
        <TicketCard id="276084" title="Richiesta password operatore 09" store="Italmark · PdV 14" time="13:52"
          status={closed ? 'Chiuso' : 'Nuovo'} closedP={ease(f, 40, 60, 0, 1, POP)} />
      </div>
      <div style={{position: 'absolute', left: 410, top: 440, width: 1100, background: 'rgba(255,255,255,0.08)', borderRadius: 32, padding: '30px 40px', boxSizing: 'border-box',
        opacity: reply, translate: `0px ${(1 - reply) * 30}px`}}>
        <div style={{fontSize: 22, color: 'rgba(255,255,255,0.5)', marginBottom: 10}}>Risposta al negozio</div>
        <div style={{fontSize: 33, color: '#fff', lineHeight: 1.3, whiteSpace: 'nowrap'}}>
          La password dell'operatore 09 è <b style={{color: OR}}>47</b>. Risulta aperto in cassa 3.
        </div>
      </div>
      <div style={{position: 'absolute', top: 690, width: '100%', display: 'flex', justifyContent: 'center', gap: 22}}>
        {Array.from({length: 12}).map((_, i) => {
          const p = ease(f, 52 + i * 2.5, 66 + i * 2.5, 0, 1, POP);
          return (
            <div key={i} style={{width: 64, height: 64, borderRadius: 32, boxSizing: 'border-box', border: '3px solid rgba(255,255,255,0.25)',
              background: p > 0.02 ? '#E6F4EA' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(0.7 + 0.3 * Math.max(p, 0.001) + (p > 0.02 ? 0 : 0.3))}}>
              {p > 0.02 && (
                <svg width="34" height="34" viewBox="0 0 24 24" style={{scale: String(p)}}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={LED_TEXT.open} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 820, width: '100%'}}>
        <BlurIn f={f} at={70} text="Ogni ticket, chiuso in pochi secondi." accent={['pochi', 'secondi.']} stagger={3}
          style={{fontSize: 64, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em'}} />
      </div>
    </AbsoluteFill>
  );
};

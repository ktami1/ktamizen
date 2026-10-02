import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BG, BlurIn, FONT, GRAY_DARK, INK, Logo, OR, POP, Wordmark, ease} from './brand';

// Chiusura sul grigio Terya.
export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const logo = ease(f, 4, 26, 0, 1, POP);
  const title = ease(f, 10, 34);
  const pill = ease(f, 34, 52, 0, 1, POP);
  const sign = ease(f, 46, 66);
  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 960 - 70, top: 200, scale: String(logo)}}><Logo size={140} /></div>
      <div style={{position: 'absolute', top: 390, width: '100%', display: 'flex', justifyContent: 'center',
        opacity: title, filter: `blur(${(1 - title) * 14}px)`, translate: `0px ${(1 - title) * 30}px`}}>
        <Wordmark size={128} color={INK} />
      </div>
      <div style={{position: 'absolute', top: 560, width: '100%'}}>
        <BlurIn f={f} at={20} text="Un solo .exe. Nessuna installazione." stagger={3} style={{fontSize: 46, color: GRAY_DARK}} />
      </div>
      <div style={{position: 'absolute', top: 660, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{background: OR, color: '#fff', fontSize: 34, fontWeight: 700, padding: '22px 56px', borderRadius: 999, scale: String(pill), opacity: Math.min(1, pill * 2)}}>
          Disponibile per i punti vendita
        </div>
      </div>
      <div style={{position: 'absolute', top: 900, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: sign}}>
        <div style={{fontSize: 40, fontWeight: 700, color: INK, letterSpacing: '-0.02em'}}>Terya<span style={{color: OR}}>.</span></div>
        <div style={{width: 1, height: 34, background: '#C7C7C9'}} />
        <div style={{fontSize: 30, color: GRAY_DARK}}>Service Desk</div>
      </div>
    </AbsoluteFill>
  );
};

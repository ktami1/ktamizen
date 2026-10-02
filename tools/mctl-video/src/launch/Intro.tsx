import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Backlight, BlurIn, FONT, INK, Logo, OR, POP, Wordmark, ease} from './brand';

// "Presentiamo" → logo → Password Operatori.
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const logo = ease(f, 20, 44, 0, 1, POP);
  const title = ease(f, 34, 60);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <Backlight x={960} y={520} r={900} o={ease(f, 10, 80)} />
      <div style={{position: 'absolute', top: 250, width: '100%'}}>
        <BlurIn f={f} at={6} text="Presentiamo" style={{fontSize: 42, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em'}} />
      </div>
      <div style={{position: 'absolute', left: 960 - 90, top: 340, scale: String(logo)}}>
        <Logo size={180} />
      </div>
      <div style={{position: 'absolute', top: 580, width: '100%', display: 'flex', justifyContent: 'center',
        opacity: title, filter: `blur(${(1 - title) * 16}px)`, translate: `0px ${(1 - title) * 40}px`}}>
        <Wordmark size={148} color="#fff" />
      </div>
      <div style={{position: 'absolute', top: 790, width: '100%'}}>
        <BlurIn f={f} at={62} text="La password dell'operatore, in un colpo d'occhio." stagger={3}
          style={{fontSize: 46, color: 'rgba(255,255,255,0.6)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: OR, scale: `${ease(f, 30, 100)} 1`, transformOrigin: '0 50%'}} />
    </AbsoluteFill>
  );
};

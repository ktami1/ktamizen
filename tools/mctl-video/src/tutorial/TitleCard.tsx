import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, Logo, POP, ease} from '../launch/brand';

export const TitleCard: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 960 - 55, top: 250, scale: String(ease(f, 0, 20, 0, 1, POP))}}><Logo size={110} /></div>
      <div style={{position: 'absolute', top: 420, width: '100%'}}>
        <BlurIn f={f} at={4} text="Come si usa" style={{fontSize: 140, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'}} />
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%'}}>
        <BlurIn f={f} at={16} text="Password Operatori, in 4 passi." accent={['4']} stagger={3} style={{fontSize: 48, color: 'rgba(255,255,255,0.6)'}} />
      </div>
    </AbsoluteFill>
  );
};

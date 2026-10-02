import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, Logo, POP, Wordmark, ease} from '../launch/brand';

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const sign = ease(f, 34, 54);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', top: 300, width: '100%'}}>
        <BlurIn f={f} at={4} text="Fatto. Nessun ticket." accent={['ticket.']} style={{fontSize: 150, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'}} />
      </div>
      <div style={{position: 'absolute', top: 520, width: '100%'}}>
        <BlurIn f={f} at={18} text="La password è nel registro: si sa sempre chi l'ha vista." stagger={2} style={{fontSize: 40, color: 'rgba(255,255,255,0.6)'}} />
      </div>
      <div style={{position: 'absolute', top: 760, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, opacity: sign,
        scale: String(0.95 + 0.05 * ease(f, 34, 60, 0, 1, POP))}}>
        <Logo size={72} />
        <Wordmark size={64} color="#fff" />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, ease} from './brand';

// "Ogni giorno." → "10 richieste password."
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT, color: '#fff', alignItems: 'center', justifyContent: 'center',
      scale: String(1 + ease(f, 0, 105, 0, 0.04))}}>
      <div style={{position: 'absolute', top: 420, width: '100%'}}>
        <BlurIn f={f} at={4} out={44} text="Ogni giorno." style={{fontSize: 150, fontWeight: 700, letterSpacing: '-0.03em'}} />
      </div>
      <div style={{position: 'absolute', top: 380, width: '100%'}}>
        <BlurIn f={f} at={54} text="10–15 richieste password." accent={["10–15"]} style={{fontSize: 150, fontWeight: 700, letterSpacing: '-0.03em'}} />
        <BlurIn f={f} at={70} text="Dai negozi, al Service Desk." stagger={3}
          style={{fontSize: 46, fontWeight: 400, color: 'rgba(255,255,255,0.55)', marginTop: 34}} />
      </div>
    </AbsoluteFill>
  );
};

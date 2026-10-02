import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, OR, ease} from './brand';

// Il risultato: il negozio fa da solo, i ticket non partono più.
export const Resolved: React.FC = () => {
  const f = useCurrentFrame();
  const count = Math.round(ease(f, 10, 52, 15, 0, (x) => 1 - Math.pow(1 - x, 2)));
  const zero = ease(f, 52, 64);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', top: 150, width: '100%'}}>
        <BlurIn f={f} at={0} text="Ticket password aperti oggi" stagger={3} style={{fontSize: 44, color: 'rgba(255,255,255,0.55)'}} />
      </div>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center', fontSize: 340, fontWeight: 900, lineHeight: 1,
        letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color: count === 0 ? OR : '#fff', opacity: ease(f, 0, 12),
        scale: String(1 + 0.08 * zero - 0.08 * ease(f, 64, 80))}}>
        {count}
      </div>
      <div style={{position: 'absolute', top: 640, width: '100%'}}>
        <BlurIn f={f} at={58} text="Il punto vendita fa da solo." accent={['solo.']} stagger={3}
          style={{fontSize: 84, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em'}} />
      </div>
      <div style={{position: 'absolute', top: 780, width: '100%'}}>
        <BlurIn f={f} at={72} text="La responsabile del box o il direttore recupera la password in autonomia." stagger={2}
          style={{fontSize: 40, color: 'rgba(255,255,255,0.6)'}} />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, MONO, OR, ease} from './brand';

const FIELDS = ['0009', 'CASSIERE 09', '00090009', '0003', '47', '01', '261002', '0802', '0000'];

// Il "prima": la riga grezza del file M_CTL999.DAT.
export const OldWay: React.FC = () => {
  const f = useCurrentFrame();
  const found = ease(f, 50, 64);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT}}>
      <div style={{position: 'absolute', top: 250, width: '100%'}}>
        <BlurIn f={f} at={4} text="Fino a oggi:" style={{fontSize: 44, color: 'rgba(255,255,255,0.5)'}} />
      </div>
      <div style={{position: 'absolute', top: 440, left: 0, whiteSpace: 'pre', fontFamily: MONO, fontSize: 92, color: '#fff',
        translate: `${ease(f, 0, 90, 260, -260, (x) => x)}px 0px`, opacity: ease(f, 0, 14)}}>
        {FIELDS.map((s, i) => (
          <span key={i}>
            <span style={{color: i === 4 ? (found > 0 ? OR : '#fff') : `rgba(255,255,255,${1 - found * 0.75})`}}>{s}</span>
            <span style={{color: 'rgba(255,255,255,0.25)'}}>{i < FIELDS.length - 1 ? ':' : ''}</span>
          </span>
        ))}
      </div>
      <div style={{position: 'absolute', top: 680, width: '100%'}}>
        <BlurIn f={f} at={16} text="Server, file, nove colonne da decifrare." stagger={3}
          style={{fontSize: 60, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em'}} />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import T from './timeline.json';
import {APP_H, APP_W, AppDemo, MOSTRA} from './AppDemo';
import {Backlight, BlurIn, Dot, FONT, INK, LED, OR, Pointer, ease} from './brand';

const P = T.product;
const LEFT: React.CSSProperties = {justifyContent: 'flex-start', fontSize: 104, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em'};

// Il prodotto in scena: si scrive 09, si clicca Mostra, compare la password.
export const Product: React.FC = () => {
  const f = useCurrentFrame();
  const enter = ease(f, 0, 44);
  const typing = P.typing as [number, string][];
  const cx = ease(f, P.reveal - 26, P.reveal - 6, 640, MOSTRA.x + 30);
  const cy = ease(f, P.reveal - 26, P.reveal - 6, 800, MOSTRA.y + 22);
  const click = f - P.reveal;
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT, perspective: 2200}}>
      <Backlight x={1410} y={560} r={820} o={ease(f, 0, 60)} />
      <div style={{position: 'absolute', left: 140, top: 410, width: 860}}>
        <BlurIn f={f} at={30} out={92} text="Scrivi il codice." style={LEFT} />
      </div>
      <div style={{position: 'absolute', left: 140, top: 410, width: 860}}>
        <BlurIn f={f} at={98} out={146} text="Clicca Mostra." style={LEFT} />
      </div>
      <div style={{position: 'absolute', left: 140, top: 350, width: 860}}>
        <BlurIn f={f} at={150} text="La password." style={LEFT} />
        <BlurIn f={f} at={160} text="Subito." accent={['Subito.']} style={LEFT} />
      </div>
      {f >= P.reveal + 10 && (
        <div style={{position: 'absolute', left: 142, top: 700, display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.08)',
          borderRadius: 99, padding: '16px 28px', fontSize: 26, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
          opacity: ease(f, P.reveal + 10, P.reveal + 24), translate: `0px ${ease(f, P.reveal + 10, P.reveal + 30, 20, 0)}px`}}>
          <Dot color={LED.open} size={12} glow={1} /> Registrato nel log · anna · operatore 0009
        </div>
      )}
      <div style={{position: 'absolute', left: 1060, top: 90, width: APP_W, height: APP_H, transformStyle: 'preserve-3d',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 180}px) rotateY(${-20 + enter * 12 + ease(f, 44, 210, 0, 5, (x) => x)}deg) rotateX(${(1 - enter) * 14}deg) scale(${1 + ease(f, P.reveal, P.reveal + 60, 0, 0.03)})`,
        transformOrigin: '50% 50%'}}>
        <AppDemo f={f} typing={typing} reveal={P.reveal} />
        {f >= P.reveal - 28 && f < 200 && (
          <div style={{position: 'absolute', left: cx, top: cy, scale: String(click >= 0 && click < 8 ? 1 - 0.18 * Math.sin((click / 8) * Math.PI) : 1), transformOrigin: '0 0'}}>
            {click >= 0 && click < 14 && (
              <div style={{position: 'absolute', left: 6 - click * 3, top: 6 - click * 3, width: click * 6, height: click * 6, borderRadius: '50%',
                border: `3px solid ${OR}`, opacity: 1 - click / 14}} />
            )}
            <Pointer />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

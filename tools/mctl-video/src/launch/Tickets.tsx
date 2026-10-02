import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BlurIn, FONT, INK, TicketCard, ease} from './brand';

export const STACK = [
  ['276083', 'Richiesta password op. 18', 'Iperal · PdV 32', '12:58'],
  ['276082', 'Password operatore 4', 'Italmark · PdV 7', '12:20'],
  ['276081', 'Richiesta password operatore 30', 'Iperal · PdV 11', '11:46'],
  ['276080', 'Password cassiere 15', 'Italmark · PdV 21', '11:12'],
  ['276079', 'Richiesta password operatore 7', 'Iperal · PdV 5', '10:31'],
  ['276078', 'Password operatore cassa 5', 'Italmark · PdV 3', '09:58'],
  ['276077', 'Richiesta password operatore 3', 'Iperal · PdV 18', '09:20'],
  ['276076', 'Password cassiera 21', 'Italmark · PdV 9', '08:47'],
  ['276075', 'Richiesta password operatore 12', 'Iperal · PdV 26', '08:05'],
];

// Il ticket arriva, poi altri nove uguali si impilano dietro.
export const Tickets: React.FC = () => {
  const f = useCurrentFrame();
  const enter = ease(f, 0, 34);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: FONT, perspective: 1600, scale: String(1.06 - ease(f, 0, 120, 0, 0.06))}}>
      <div style={{position: 'absolute', left: 410, top: 340, width: 1100, height: 300, transformStyle: 'preserve-3d'}}>
        {STACK.map(([id, title, store, time], i) => {
          const at = 30 + (STACK.length - 1 - i) * 4;
          const p = ease(f, at, at + 20);
          const depth = STACK.length - i;
          return (
            <TicketCard key={id} id={id} title={title} store={store} time={time}
              style={{position: 'absolute', left: 0, top: 0, opacity: p * (1 - depth * 0.09),
                translate: `0px ${-depth * 44 * p + (1 - p) * 40}px`, scale: String(1 - depth * 0.045),
                filter: `brightness(${1 - depth * 0.07})`}} />
          );
        })}
        <TicketCard id="276084" title="Richiesta password operatore 09" store="Italmark · PdV 14" time="13:52"
          style={{position: 'absolute', left: 0, top: 0, opacity: enter,
            transform: `translateY(${(1 - enter) * 140}px) rotateX(${(1 - enter) * 28}deg)`, transformOrigin: '50% 100%'}} />
      </div>
      <div style={{position: 'absolute', top: 740, width: '100%'}}>
        <BlurIn f={f} at={58} text="Stessa domanda. Ogni volta, un ticket." stagger={3}
          style={{fontSize: 60, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em'}} />
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {Easing, interpolate} from 'remotion';
import {OR, Pointer} from '../launch/brand';

// Puntatore che segue una sequenza di punti [frame, x, y]; clic = anello arancione.
export const Cursor: React.FC<{f: number; path: [number, number, number][]; clicks: number[]; visible?: boolean}> = ({f, path, clicks, visible = true}) => {
  if (!visible) return null;
  const frames = path.map((p) => p[0]);
  const opts = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.bezier(0.45, 0, 0.2, 1)};
  // tratti separati, ognuno con la sua curva
  let x = path[0][1];
  let y = path[0][2];
  for (let i = 1; i < path.length; i++) {
    if (f >= frames[i - 1]) {
      x = interpolate(f, [frames[i - 1], frames[i]], [path[i - 1][1], path[i][1]], opts);
      y = interpolate(f, [frames[i - 1], frames[i]], [path[i - 1][2], path[i][2]], opts);
    }
  }
  const press = clicks.reduce((s, t) => s * (f >= t && f < t + 8 ? 1 - 0.18 * Math.sin(((f - t) / 8) * Math.PI) : 1), 1);
  return (
    <div style={{position: 'absolute', left: x, top: y, scale: String(press), transformOrigin: '0 0'}}>
      {clicks.map((t) => {
        const c = f - t;
        return c >= 0 && c < 14 ? (
          <div key={t} style={{position: 'absolute', left: 6 - c * 3, top: 6 - c * 3, width: c * 6, height: c * 6, borderRadius: '50%', border: `3px solid ${OR}`, opacity: 1 - c / 14}} />
        ) : null;
      })}
      <Pointer />
    </div>
  );
};

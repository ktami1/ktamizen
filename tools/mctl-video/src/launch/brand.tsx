// Linguaggio visivo del lancio: design system Terya + ritmo "keynote".
import React from 'react';
import {Easing, interpolate} from 'remotion';

export const INK = '#020609';
export const BG = '#F2F2F2';
export const OR = '#EC6906';
export const OR_DARK = '#954103';
export const GRAY = '#737373';
export const GRAY_DARK = '#575757';
export const BORDER = '#C7C7C9';
export const DIVIDER = '#E0E0E0';
export const MUTED = '#F3F4F6';
export const SOFT = '#FDEEE2';
export const FONT = 'Roboto, system-ui, sans-serif';
export const MONO = 'Mono, monospace';
export const LED = {open: '#22A447', pause: '#F5A623', closed: '#E5383B', off: '#B5B5B5'};
export const LED_TEXT = {open: '#137333', closed: '#B3261E'};

// Ease-out lunga e morbida, tipica delle keynote.
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const POP = Easing.spring({damping: 12, stiffness: 180, mass: 1});

export const ease = (f: number, a: number, b: number, from = 0, to = 1, easing = EASE) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

// Testo che entra parola per parola: da sfocato e basso a nitido.
export const BlurIn: React.FC<{
  f: number;
  at: number;
  out?: number;
  text: string;
  accent?: string[];
  style?: React.CSSProperties;
  stagger?: number;
}> = ({f, at, out, text, accent = [], style, stagger = 4}) => {
  const words = text.split(' ');
  const gone = out === undefined ? 0 : ease(f, out, out + 12);
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.26em', ...style}}>
      {words.map((w, i) => {
        const p = ease(f, at + i * stagger, at + i * stagger + 22);
        const vis = p * (1 - gone);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: vis,
              filter: `blur(${(1 - p) * 14 + gone * 14}px)`,
              translate: `0px ${(1 - p) * 34 - gone * 20}px`,
              color: accent.includes(w) ? OR : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Key: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="11.5" cy="16" r="5" stroke={color} strokeWidth="3" />
    <path d="M16.5 16H26M22.5 16v4.5M26 16v3" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Logo: React.FC<{size: number; bg?: string; fg?: string}> = ({size, bg = OR, fg = '#fff'}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <Key size={size * 0.72} color={fg} />
  </div>
);

// "Password Operatori" con il punto arancione del linguaggio Terya.
export const Wordmark: React.FC<{size: number; color: string}> = ({size, color}) => (
  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: size, color, letterSpacing: '-0.03em', whiteSpace: 'nowrap', lineHeight: 1.05}}>
    Password Operatori<span style={{color: OR}}>.</span>
  </div>
);

export const Dot: React.FC<{color: string; size: number; glow?: number}> = ({color, size, glow = 0}) => (
  <div style={{position: 'relative', width: size, height: size, flexShrink: 0}}>
    {glow > 0 && <div style={{position: 'absolute', inset: -size * 0.45 * glow, borderRadius: '50%', background: color, opacity: 0.22}} />}
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: color}} />
  </div>
);

export const Pointer: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24">
    <path d="M4 2.5l15 9.2-6.6 1.4 3.9 7.2-2.9 1.5-3.9-7.2L4.6 19z" fill={INK} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// Luce calda dietro al prodotto (sullo sfondo, mai sulla UI).
export const Backlight: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
    background: `radial-gradient(circle, rgba(236,105,6,${0.42 * o}) 0%, rgba(236,105,6,${0.12 * o}) 40%, rgba(236,105,6,0) 70%)`}} />
);

// Biglietto SysAid stilizzato (dati inventati).
export const TicketCard: React.FC<{
  id: string;
  title: string;
  store: string;
  time: string;
  status?: 'Nuovo' | 'Chiuso';
  closedP?: number;
  style?: React.CSSProperties;
}> = ({id, title, store, time, status = 'Nuovo', closedP = 0, style}) => (
  <div style={{width: 1100, height: 300, background: '#fff', borderRadius: 36, padding: '40px 52px', boxSizing: 'border-box', fontFamily: FONT, ...style}}>
    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 24, color: GRAY}}>
      <span><b style={{color: '#3C6EB4'}}>SysAid</b> · Help Desk · L1 Retail</span>
      <span>#{id}</span>
    </div>
    <div style={{fontSize: 58, fontWeight: 700, color: INK, marginTop: 26, letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>{title}</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 26, fontSize: 26, color: GRAY_DARK}}>
      <span>{store}</span>
      <span style={{color: BORDER}}>·</span>
      <span>{time}</span>
      <div style={{flex: 1}} />
      <div style={{height: 46, borderRadius: 23, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 24,
        background: status === 'Chiuso' ? '#E6F4EA' : '#DCE6F2', color: status === 'Chiuso' ? LED_TEXT.open : '#3C64B4',
        scale: String(status === 'Chiuso' ? 0.85 + 0.15 * closedP : 1)}}>
        {status === 'Chiuso' ? '✓ Chiuso' : 'Nuovo'}
      </div>
    </div>
  </div>
);

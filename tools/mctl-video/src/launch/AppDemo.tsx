import React from 'react';
import {BG, BORDER, DIVIDER, Dot, FONT, GRAY, INK, LED, LED_TEXT, Logo, MUTED, OR, POP, SOFT, ease} from './brand';

// Password Operatori, ricostruito con la stessa grafica dell'app reale (dati di esempio).
export const APP_W = 700;
export const APP_H = 900;
export const MOSTRA = {x: 452, y: 318, w: 108, h: 58};

const OP = {code: '0009', name: 'CASSIERE 09', pw: '47', short: 'Aperto · cassa 3', msg: 'Risulta aperto in cassa 3', cassa: '3', date: '02/10/2026', open: '08:02', close: '—'};
const OTHER = {code: '0019', name: 'CASSIERE 19', short: 'Non aperto'};

export const AppDemo: React.FC<{f: number; typing: [number, string][]; reveal: number}> = ({f, typing, reveal}) => {
  let q = '';
  let since = 0;
  for (const [t, v] of typing) if (f >= t) { q = v; since = t; }
  const sel = q === '09';
  const enter = ease(f, since, since + 14);
  const revealed = f >= reveal;
  const chip = ease(f, reveal, reveal + 18, 0, 1, POP);
  const left = Math.max(0, 30 - Math.floor((f - reveal) / 30));
  const focused = f >= typing[0][0] - 10;
  const caret = focused && Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: APP_W, height: APP_H, fontFamily: FONT, background: BG, overflow: 'hidden', borderRadius: 26}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: APP_W, height: 76, background: INK, display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', gap: 14}}>
        <Logo size={36} />
        <div style={{color: '#fff', fontWeight: 700, fontSize: 20}}>Password Operatori</div>
        <div style={{width: 7, height: 7, borderRadius: 4, background: OR, marginLeft: -9, marginTop: 10}} />
        <div style={{flex: 1, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 12}}>Aggiornato alle 13:53:02</div>
        <div style={{border: '1px solid #fff', borderRadius: 99, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px 20px'}}>Aggiorna</div>
        <div style={{background: OR, borderRadius: 99, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px 18px'}}>anna ▾</div>
      </div>
      <div style={{position: 'absolute', left: 28, top: 102, width: 644, height: 56, borderRadius: 28, background: '#fff', boxSizing: 'border-box',
        border: focused ? `2px solid ${OR}` : `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14, fontSize: 18, color: INK}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" stroke={focused ? OR : GRAY} strokeWidth="2.2" /><path d="M14.5 14.5L20 20" stroke={focused ? OR : GRAY} strokeWidth="2.2" strokeLinecap="round" /></svg>
        {q ? <span>{q}</span> : <span style={{color: '#9A9A9A'}}>Cerca operatore per codice o nome</span>}
        {caret && <span style={{width: 2, height: 24, background: INK, marginLeft: q ? -12 : 0}} />}
      </div>
      <div style={{position: 'absolute', left: 28, top: 174, display: 'flex', gap: 8, fontSize: 12.5}}>
        {([['Tutti', '14', ''], ['Aperti', '3', LED.open], ['In pausa', '1', LED.pause], ['Chiusi', '1', LED.closed]] as const).map(([n, c, d], i) => (
          <div key={n} style={{height: 36, borderRadius: 18, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 7, boxSizing: 'border-box',
            background: i === 0 ? INK : '#fff', border: i === 0 ? 'none' : `1px solid ${BORDER}`, color: i === 0 ? '#fff' : INK, fontWeight: 700}}>
            {d && <Dot color={d} size={8} />}{n}<span style={{fontWeight: 400, color: i === 0 ? 'rgba(255,255,255,0.65)' : GRAY}}>{c}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 28, top: 230, width: 644, height: 316, background: '#fff', borderRadius: 24, overflow: 'hidden'}}>
        {sel ? (
          <div style={{position: 'absolute', inset: 0, opacity: enter, translate: `0px ${(1 - enter) * 14}px`}}>
            <div style={{position: 'absolute', left: 30, top: 30, height: 32, borderRadius: 16, background: 'rgba(34,164,71,0.12)', display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 16px 0 12px', color: LED_TEXT.open, fontSize: 12.5, fontWeight: 700}}>
              <Dot color={LED.open} size={10} glow={1} /> {OP.short}
            </div>
            <div style={{position: 'absolute', right: 30, top: 38, fontSize: 12.5, color: GRAY}}>{OP.name}   ·   cod. {OP.code}</div>
            <div style={{position: 'absolute', left: 30, top: MOSTRA.y - 230, height: MOSTRA.h, display: 'flex', alignItems: 'center', fontSize: 24, color: INK}}>
              La password dell'operatore 9 è
            </div>
            <div style={{position: 'absolute', left: MOSTRA.x - 28, top: MOSTRA.y - 230, width: revealed ? 100 : MOSTRA.w, height: MOSTRA.h, borderRadius: 29, boxSizing: 'border-box',
              background: revealed ? OR : '#fff', border: revealed ? 'none' : `2px solid ${OR}`, color: revealed ? '#fff' : OR,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: revealed ? 32 : 17,
              scale: String(revealed ? 0.6 + chip * 0.4 : 1)}}>
              {revealed ? OP.pw : 'Mostra'}
            </div>
            <div style={{position: 'absolute', left: 30, top: 160, fontSize: 17, fontWeight: 500, color: LED_TEXT.open}}>{OP.msg}</div>
            <div style={{position: 'absolute', right: 30, top: 164, fontSize: 12, color: GRAY}}>
              {!revealed ? 'Ogni visualizzazione viene registrata' : `Clic sulla password per copiarla  ·  si nasconde tra ${left} s`}
            </div>
            <div style={{position: 'absolute', left: 30, right: 30, top: 210, height: 1, background: DIVIDER}} />
            <div style={{position: 'absolute', left: 30, right: 30, top: 228, display: 'flex'}}>
              {[['CASSA', OP.cassa], ['DATA', OP.date], ['APERTURA', OP.open], ['CHIUSURA', OP.close]].map(([l, v]) => (
                <div key={l} style={{flex: 1}}>
                  <div style={{fontSize: 10.5, fontWeight: 700, color: GRAY}}>{l}</div>
                  <div style={{fontSize: 24, fontWeight: 700, color: INK, marginTop: 4}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12}}>
            <div style={{width: 60, height: 60, borderRadius: 30, background: SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" stroke={OR} strokeWidth="2.2" /><path d="M14.5 14.5L20 20" stroke={OR} strokeWidth="2.2" strokeLinecap="round" /></svg>
            </div>
            <div style={{fontSize: 19, fontWeight: 700, color: INK}}>{q ? 'Più operatori trovati' : 'Cerca un operatore'}</div>
            <div style={{fontSize: 13.5, color: GRAY}}>Scrivi il codice o il nome per vedere password, cassa e stato.</div>
          </div>
        )}
      </div>
      <div style={{position: 'absolute', left: 28, top: 564, width: 644, height: APP_H - 564 - 46, background: '#fff', borderRadius: 24, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 28, top: 22, fontSize: 17, fontWeight: 700, color: INK}}>
          Operatori <span style={{fontSize: 13, fontWeight: 400, color: GRAY, marginLeft: 8}}>{sel ? '1 di 14' : '14'}</span>
        </div>
        {(sel ? [OP] : [OP, OTHER]).map((o, i) => (
          <div key={o.code} style={{position: 'absolute', left: 8, right: 8, top: 62 + i * 54, height: 48, borderRadius: 14, background: sel ? MUTED : 'transparent',
            display: 'flex', alignItems: 'center', padding: '0 16px 0 20px', fontSize: 14, color: INK}}>
            {sel && <div style={{position: 'absolute', left: 0, top: 11, width: 4, height: 26, borderRadius: 2, background: OR}} />}
            <Dot color={o === OP ? LED.open : LED.off} size={10} />
            <div style={{width: 64, marginLeft: 16, fontWeight: 700, color: sel ? OR : INK}}>{o.code}</div>
            <div style={{flex: 1}}>{o.name}</div>
            <div style={{fontSize: 12.5, fontWeight: 500, color: o === OP ? LED_TEXT.open : GRAY}}>{o.short}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 32, bottom: 14, fontSize: 12, color: GRAY}}>C:\Server\Data\M_CTL999.DAT</div>
      <div style={{position: 'absolute', right: 32, bottom: 14, fontSize: 12, color: OR, fontWeight: 700}}>Cambia file</div>
    </div>
  );
};

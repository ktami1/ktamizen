import React from 'react';
import {BG, BORDER, FONT, GRAY, GRAY_DARK, INK, Logo, OR} from '../launch/brand';

// Schermata di accesso di Password Operatori (stessa grafica dell'app).
export const LoginUI: React.FC<{user: string; dots: number; focus: 'user' | 'pass' | 'none'; caret: boolean; pressed: boolean}> = ({user, dots, focus, caret, pressed}) => (
  <div style={{width: 880, height: 560, display: 'flex', fontFamily: FONT, overflow: 'hidden', borderRadius: 20, border: '1px solid #D5D5D5'}}>
    <div style={{width: 380, background: INK, padding: 48, boxSizing: 'border-box', position: 'relative'}}>
      <Logo size={52} />
      <div style={{color: '#fff', fontSize: 40, fontWeight: 700, marginTop: 70, lineHeight: 1.15}}>Password<br />Operatori<span style={{color: OR}}>.</span></div>
      <div style={{color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 24, lineHeight: 1.4}}>Accesso riservato alle responsabili<br />di cassa autorizzate.</div>
      <div style={{position: 'absolute', left: 48, bottom: 40, color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 2}}>
        <span style={{color: OR}}>•</span> Sola lettura del file M_CTL999.DAT<br /><span style={{color: OR}}>•</span> Nessuna connessione di rete<br /><span style={{color: OR}}>•</span> Ogni accesso viene registrato
      </div>
    </div>
    <div style={{flex: 1, background: BG, padding: '64px 68px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 32, fontWeight: 700, color: INK}}>Accedi</div>
      <div style={{fontSize: 14, color: GRAY, marginTop: 8}}>Inserisci le credenziali per continuare.</div>
      {[['Utente', user, 'user'], ['Password', '•'.repeat(dots), 'pass']].map(([label, value, key]) => (
        <div key={label} style={{marginTop: 26}}>
          <div style={{fontSize: 12, fontWeight: 700, color: GRAY_DARK, marginLeft: 4, marginBottom: 8}}>{label}</div>
          <div style={{height: 50, borderRadius: 25, background: '#fff', border: focus === key ? `2px solid ${OR}` : `1px solid ${BORDER}`, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: 17, color: INK, letterSpacing: key === 'pass' ? 3 : 0}}>
            {value}
            {focus === key && caret && <span style={{width: 2, height: 22, background: INK, marginLeft: 2}} />}
          </div>
        </div>
      ))}
      <div style={{marginTop: 34, height: 52, borderRadius: 26, background: pressed ? '#954103' : OR, color: '#fff', fontWeight: 700, fontSize: 17,
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Accedi</div>
      <div style={{marginTop: 16, fontSize: 13, fontWeight: 700, color: OR}}>Password dimenticata?</div>
    </div>
  </div>
);

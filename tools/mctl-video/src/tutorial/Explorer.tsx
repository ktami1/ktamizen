import React from 'react';
import {FONT, Logo} from '../launch/brand';

// Esplora file di Windows con la cartella del programma.
const FILES: [string, 'folder' | 'exe' | 'doc' | 'code', string][] = [
  ['esempio', 'folder', 'Cartella di file'],
  ['fonts', 'folder', 'Cartella di file'],
  ['PasswordOperatori.exe', 'exe', 'Applicazione'],
  ['README.md', 'doc', 'File MD'],
  ['SICUREZZA.md', 'doc', 'File MD'],
];

const Icon: React.FC<{kind: string}> = ({kind}) => {
  if (kind === 'exe') return <Logo size={30} />;
  if (kind === 'folder') return <div style={{width: 30, height: 24, background: '#F3C64A', borderRadius: 3, marginTop: 3}} />;
  return <div style={{width: 24, height: 30, border: '2px solid #9AA0A6', borderRadius: 2, background: '#fff', boxSizing: 'border-box', marginLeft: 3}} />;
};

export const Explorer: React.FC<{selected: boolean}> = ({selected}) => (
  <div style={{width: 820, height: 560, background: '#fff', border: '1px solid #C9C9C9', fontFamily: 'SysSans, Arial, sans-serif', color: '#1F1F1F', overflow: 'hidden'}}>
    <div style={{height: 40, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, fontSize: 15, borderBottom: '1px solid #E5E5E5'}}>
      <div style={{width: 18, height: 14, background: '#F3C64A', borderRadius: 2}} /> PasswordOperatori
      <div style={{flex: 1}} />
      <span style={{color: '#666', letterSpacing: 18}}>–▢✕</span>
    </div>
    <div style={{height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, fontSize: 15, borderBottom: '1px solid #E5E5E5', color: '#444'}}>
      <span>←  →  ↑</span>
      <div style={{flex: 1, height: 28, border: '1px solid #D0D0D0', display: 'flex', alignItems: 'center', padding: '0 10px'}}>Questo PC  ›  Download  ›  PasswordOperatori</div>
    </div>
    <div style={{display: 'flex', height: 36, alignItems: 'center', padding: '0 24px', fontSize: 14, color: '#555', borderBottom: '1px solid #F0F0F0'}}>
      <div style={{width: 420}}>Nome</div><div>Tipo</div>
    </div>
    {FILES.map(([name, kind, type]) => {
      const sel = selected && kind === 'exe';
      return (
        <div key={name} style={{height: 52, display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: 17, background: sel ? '#CCE8FF' : 'transparent',
          border: sel ? '1px solid #99D1FF' : '1px solid transparent', fontWeight: kind === 'exe' ? 700 : 400}}>
          <div style={{width: 46}}><Icon kind={kind} /></div>
          <div style={{width: 374}}>{name}</div>
          <div style={{color: '#666', fontWeight: 400}}>{type}</div>
        </div>
      );
    })}
    <div style={{position: 'relative', top: 70, padding: '0 24px', fontSize: 14, color: '#888', fontFamily: FONT}}>5 elementi</div>
  </div>
);

import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, spring, staticFile, useCurrentFrame} from 'remotion';
import T from './ticket-timeline.json';

export const TICKET_FPS = T.fps;
export const TICKET_DURATION = T.duration;

// ---------------------------------------------------------------- design

const INK = '#020609';
const BG = '#F2F2F2';
const OR = '#EC6906';
const OR_DARK = '#954103';
const GRAY = '#737373';
const GRAY_DARK = '#575757';
const DIVIDER = '#E0E0E0';
const BORDER = '#C7C7C9';
const MUTED = '#F3F4F6';
const SOFT = '#FDEEE2';
const FONT = 'Roboto, system-ui, sans-serif';
const MONO = 'Mono, monospace';
const SYS = 'SysSans, Arial, sans-serif';

const LED = {open: '#22A447', pause: '#F5A623', closed: '#E5383B', off: '#B5B5B5'};
const LED_TEXT = {open: '#137333', pause: '#8A5300', closed: '#B3261E', off: GRAY};

// ---------------------------------------------------------------- motion

type Feel = 'snappy' | 'default' | 'heavy' | 'pop';
const FEEL: Record<Feel, {stiffness: number; damping: number; mass: number}> = {
  snappy: {stiffness: 320, damping: 30, mass: 1},
  default: {stiffness: 170, damping: 26, mass: 1},
  heavy: {stiffness: 120, damping: 24, mass: 1.4},
  pop: {stiffness: 260, damping: 13, mass: 1},
};
const sp = (f: number, at: number, feel: Feel = 'default') =>
  f < at ? 0 : spring({frame: f - at, fps: T.fps, config: FEEL[feel]});
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const track = (f: number, keys: [number, number][], feel: Feel = 'default') => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * sp(f, keys[i][0], feel);
  return v;
};

const Reveal: React.FC<{f: number; at: number; style?: React.CSSProperties; children: React.ReactNode}> = ({f, at, style, children}) => {
  const p = sp(f, at, 'default');
  return (
    <div style={{overflow: 'hidden', paddingBottom: '0.12em', whiteSpace: 'nowrap', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- icone

const Key: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="11.5" cy="16" r="5" stroke={color} strokeWidth="3" />
    <path d="M16.5 16H26M22.5 16v4.5M26 16v3" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Logo: React.FC<{size: number; bg?: string; fg?: string}> = ({size, bg = OR, fg = '#fff'}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <Key size={size * 0.72} color={fg} />
  </div>
);

const Pointer: React.FC = () => (
  <svg width="38" height="38" viewBox="0 0 24 24">
    <path d="M4 2.5l15 9.2-6.6 1.4 3.9 7.2-2.9 1.5-3.9-7.2L4.6 19z" fill={INK} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const Warn: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 3l10 18H2z" fill="#555" /><rect x="11" y="9" width="2" height="6" fill="#fff" /><rect x="11" y="16.5" width="2" height="2" fill="#fff" /></svg>
);

const Dot: React.FC<{color: string; size: number; glow?: number}> = ({color, size, glow = 0}) => (
  <div style={{position: 'relative', width: size, height: size, flexShrink: 0}}>
    {glow > 0 && <div style={{position: 'absolute', inset: -size * 0.45 * glow, borderRadius: '50%', background: color, opacity: 0.22}} />}
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: color}} />
  </div>
);

// ---------------------------------------------------------------- dati SysAid (tutti inventati)

type Row = {id: string; padre: string; negozio: string; titolo: string; stato: string; assegnato: string; priorita: string; urgenza: string; aperto: string};

const BASE: Row[] = [
  ['276074', 'SINGOLO', 'MARKET SOLE SRL', 'Stampante cassa 2 in errore', 'Assegnato', 'Luca Ferri', '3 - Normale', 'Media', '01-10-2026 18:41:55'],
  ['276072', 'GRUPPO NORD', 'GRUPPO NORD SRL BERGAMO', 'Bilancia non comunica', 'Preso In', 'Sara Conti', '2 - Urgente', 'Media', '01-10-2026 17:34:07'],
  ['276065', 'SINGOLO', 'PANIFICIO AURORA', 'Richiesta modifica listino', 'Con Cliente', 'Marco Galli', '3 - Normale', 'Media', '01-10-2026 16:56:11'],
  ['276064', 'ALIMENTA', 'ALIMENTA SPA VERONA', 'Chiusura giornaliera bloccata', 'Preso In', 'Luca Ferri', '2 - Urgente', 'Da Pianificare', '01-10-2026 15:51:15'],
  ['276063', 'SINGOLO', 'ENOTECA DEL CORSO', 'Etichette prezzi non stampano', 'Assegnato', 'none', '3 - Normale', 'Media', '01-10-2026 14:50:11'],
  ['276057', 'SINGOLO', 'PASTICCERIA LUNA', 'Richiesta info fatturazione', 'Con Cliente', 'Sara Conti', '3 - Normale', 'Da Pianificare', '01-10-2026 12:12:29'],
  ['276055', 'GRUPPO NORD', 'GRUPPO NORD SRL BRESCIA', 'Cassa 4 molto lenta', 'Assegnato', 'none', '2 - Urgente', 'Media', '01-10-2026 12:09:11'],
  ['276052', 'SINGOLO', 'MACELLERIA ROSSI', 'Errore invio corrispettivi', 'Preso In', 'Marco Galli', '3 - Normale', 'Media', '01-10-2026 11:02:11'],
  ['276050', 'ALIMENTA', 'ALIMENTA SPA PADOVA', 'Aggiornamento anagrafica articoli', 'Con Terze', 'Elena Riva', '3 - Normale', 'Media', '01-10-2026 10:47:11'],
  ['276044', 'SINGOLO', 'FRUTTA E VERDURA BELLI', 'Lettore barcode non legge', 'Assegnato', 'none', '3 - Normale', 'Da Pianificare', '01-10-2026 10:29:17'],
  ['276041', 'SINGOLO', 'CAFFÈ CENTRALE', 'Report vendite mancante', 'Con Cliente', 'Elena Riva', '3 - Normale', 'Media', '01-10-2026 09:20:12'],
  ['276034', 'GRUPPO NORD', 'GRUPPO NORD SRL LECCO', 'Richiesta nuova postazione cassa', 'Preso In', 'Luca Ferri', '2 - Urgente', 'Media', '01-10-2026 08:51:11'],
].map(([id, padre, negozio, titolo, stato, assegnato, priorita, urgenza, aperto]) => ({id, padre, negozio, titolo, stato, assegnato, priorita, urgenza, aperto}));

const PW: Row[] = [
  ['276075', 'SINGOLO', 'MARKET SOLE SRL', 'Richiesta password operatore 12', '08:05:41'],
  ['276076', 'ALIMENTA', 'ALIMENTA SPA VERONA', 'PASSWORD CASSIERA 21', '08:47:02'],
  ['276077', 'SINGOLO', 'PANIFICIO AURORA', 'richiesta password operatore 3', '09:20:15'],
  ['276078', 'GRUPPO NORD', 'GRUPPO NORD SRL BERGAMO', 'Password operatore cassa 5', '09:58:33'],
  ['276079', 'SINGOLO', 'MACELLERIA ROSSI', 'RICHIESTA PASSWORD OPERATORE 7', '10:31:09'],
  ['276080', 'SINGOLO', 'ENOTECA DEL CORSO', 'password cassiere 15', '11:12:48'],
  ['276081', 'ALIMENTA', 'ALIMENTA SPA PADOVA', 'Richiesta password operatore 30', '11:46:20'],
  ['276082', 'SINGOLO', 'CAFFÈ CENTRALE', 'PASSWORD OPERATORE 4', '12:20:57'],
  ['276083', 'GRUPPO NORD', 'GRUPPO NORD SRL LECCO', 'richiesta password op. 18', '12:58:14'],
  ['276084', 'SINGOLO', 'SUPERMERCATO STELLA', 'Richiesta password operatore 09', '13:52:10'],
].map(([id, padre, negozio, titolo, ora]) => ({id, padre, negozio, titolo, stato: 'Nuovo', assegnato: 'none', priorita: '3 - Normale', urgenza: 'Media', aperto: `02-10-2026 ${ora}`}));
const OURS = PW[PW.length - 1];

// ---------------------------------------------------------------- SysAid: elenco

const COLS: [string, number][] = [
  ['', 36], ['#', 64], ['Tipo RA', 86], ['Avviso', 64], ['Aperto il', 136], ['Padre', 108], ['Ragione Sociale Negozio', 196],
  ['Titolo', 250], ['Stato', 92], ['Assegnato a', 116], ['Gruppo', 88], ['Priorità', 100], ['Urgenza', 104], ['Ultimo Sollecito', 112], ['SLA Timer Risol', 128],
];
const PAGE_X = 40;
const PAGE_Y = 36;
const TABLE_Y = 124;
const ROW_H = 30;
const colX = (name: string) => {
  let x = 0;
  for (const [n, w] of COLS) { if (n === name) return x; x += w; }
  return x;
};

const SysTopBar: React.FC<{count: number; crumb?: string}> = ({count, crumb = 'Tutti'}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1840, height: TABLE_Y, fontFamily: SYS, color: '#222'}}>
    <div style={{position: 'absolute', left: 0, top: 0, fontSize: 13}}>
      <span style={{color: '#2A5DB0', textDecoration: 'underline', fontWeight: 700}}>Help Desk</span>
      <span style={{color: '#888'}}> &gt; </span>
      <span style={{fontSize: 17}}>{crumb}</span>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 24, height: 1, background: '#D5E3CF'}} />
    <div style={{position: 'absolute', left: 0, top: 34, fontSize: 15, fontWeight: 700}}>Visualizza: L1 Retail ˅</div>
    <div style={{position: 'absolute', right: 0, top: 30, height: 26, padding: '0 12px', border: '1px solid #3E7D5E', borderRadius: 14, fontSize: 15, display: 'flex', alignItems: 'center'}}>+ Nuovo</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 62, height: 1, background: '#E2E2E2'}} />
    <div style={{position: 'absolute', left: 0, top: 72, width: 222, height: 26, border: '1px solid #BDBDBD', fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', paddingLeft: 6, boxSizing: 'border-box'}}>Cerca</div>
    {['⌕', '◷', '⏷', '▲', '⋮'].map((s, i) => (
      <div key={i} style={{position: 'absolute', left: 226 + i * 40, top: 72, width: 26, height: 26, border: i < 4 ? '1px solid #BDBDBD' : 'none', fontSize: 16, color: '#555',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>{s}</div>
    ))}
    <div style={{position: 'absolute', right: 0, top: 78, fontSize: 12}}>
      Showing <span style={{color: '#3A9A3A'}}>1-{count} of {count}</span>
    </div>
  </div>
);

const SlaPill: React.FC = () => (
  <div style={{height: 22, borderRadius: 11, background: '#DCE6F2', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, fontSize: 11, color: '#3C64B4'}}>
    <div style={{width: 13, height: 13, borderRadius: 7, border: '1.5px solid #3C64B4', boxSizing: 'border-box'}} /> Nessuno SLA
  </div>
);

type RowState = {row: Row; h: number; bg: string; stato: string; statoColor?: string; bold?: boolean};

const SysTable: React.FC<{rows: RowState[]}> = ({rows}) => (
  <div style={{position: 'absolute', left: 0, top: TABLE_Y, width: 1840, height: 1000 - TABLE_Y, border: '1px solid #D0D0D0', boxSizing: 'border-box',
    padding: 6, background: '#fff', overflow: 'hidden', fontFamily: SYS}}>
    <div style={{display: 'flex', height: 44, background: '#EFEFEF', borderBottom: '1px solid #CFCFCF', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#333'}}>
      {COLS.map(([n, w], i) => (
        <div key={i} style={{width: w, paddingLeft: 8, boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden', borderLeft: i ? '1px solid #DDD' : 'none'}}>
          {i === 0 ? <div style={{width: 13, height: 13, border: '1px solid #777', marginLeft: 4}} /> : <><span style={{color: '#999', fontWeight: 400}}>⇵ </span>{n}</>}
        </div>
      ))}
    </div>
    {rows.map(({row, h, bg, stato, statoColor, bold}) => (
      <div key={row.id} style={{height: ROW_H * h, overflow: 'hidden', background: bg, borderBottom: h > 0.05 ? '1px solid #E4E4E4' : 'none'}}>
        <div style={{display: 'flex', height: ROW_H, alignItems: 'center', fontSize: 12.5, color: '#222', fontWeight: bold ? 700 : 400}}>
          {COLS.map(([n, w], i) => {
            let c: React.ReactNode = null;
            if (i === 0) c = <div style={{width: 12, height: 12, border: '1px solid #777', marginLeft: 4, background: '#fff'}} />;
            else if (n === '#') c = row.id;
            else if (n === 'Tipo RA') c = <div style={{marginLeft: 32}}><Warn /></div>;
            else if (n === 'Aperto il') c = row.aperto;
            else if (n === 'Padre') c = row.padre;
            else if (n === 'Ragione Sociale Negozio') c = row.negozio;
            else if (n === 'Titolo') c = row.titolo;
            else if (n === 'Stato') c = <span style={{color: statoColor, fontWeight: statoColor ? 700 : undefined}}>{stato}</span>;
            else if (n === 'Assegnato a') c = row.assegnato;
            else if (n === 'Gruppo') c = 'L1 Retail';
            else if (n === 'Priorità') c = row.priorita;
            else if (n === 'Urgenza') c = row.urgenza;
            else if (n === 'SLA Timer Risol') c = <SlaPill />;
            return <div key={i} style={{width: w, paddingLeft: 10, boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden'}}>{c}</div>;
          })}
        </div>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------- SysAid: dettaglio ticket

const SOLUTION = "Buongiorno, la password dell'operatore 09 è 47. Risulta aperto in cassa 3. Buon lavoro!";
const DESCRIPTION = "Buongiorno, l'operatore 09 non ricorda la password e deve aprire la cassa. Potete indicarcela? Grazie, Supermercato Stella";
const STATI = ['Nuovo', 'Assegnato', 'Preso In', 'Con Cliente', 'Chiuso'];

const Field: React.FC<{label: string; value: React.ReactNode; x: number; y: number; w: number; active?: boolean}> = ({label, value, x, y, w, active}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    <div style={{fontSize: 13, color: '#555', marginBottom: 6}}>{label}</div>
    <div style={{height: 34, border: `1px solid ${active ? '#3C6EB4' : '#C9C9C9'}`, borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 14, color: '#222', background: '#fff',
      boxShadow: active ? '0 0 0 2px rgba(60,110,180,0.2)' : 'none'}}>{value}</div>
  </div>
);

const STATO_FIELD = {x: 470, y: 188, w: 400};
const SAVE_BTN = {x: 1600, y: 56, w: 110, h: 36};

const SysDetail: React.FC<{f: number; phase: 1 | 2}> = ({f, phase}) => {
  const typed = phase === 2 ? Math.floor(interpolate(f, T.solution, [0, SOLUTION.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) : 0;
  const open = phase === 2 && f >= T.statusClick && f < T.statusPick + 2;
  const stato = phase === 2 && f >= T.statusPick ? 'Chiuso' : 'Nuovo';
  const saved = phase === 2 ? sp(f, T.save + 2, 'snappy') : 0;
  const caret = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: SYS, color: '#222'}}>
      <div style={{position: 'absolute', left: 0, top: 0, fontSize: 13}}>
        <span style={{color: '#2A5DB0', textDecoration: 'underline', fontWeight: 700}}>Help Desk</span>
        <span style={{color: '#888'}}> &gt; </span><span style={{color: '#2A5DB0', textDecoration: 'underline'}}>Tutti</span>
        <span style={{color: '#888'}}> &gt; </span><span style={{fontSize: 17}}>Richiesta di servizio #{OURS.id}</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 24, height: 1, background: '#D5E3CF'}} />
      {saved > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 30, height: 34, background: '#E6F4EA', border: '1px solid #9CCFAA', borderRadius: 3,
          display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: '#137333', fontWeight: 700, opacity: saved, transform: `translateY(${(1 - saved) * -10}px)`}}>
          ✓ Richiesta di servizio #{OURS.id} salvata · Stato: Chiuso
        </div>
      )}
      <div style={{position: 'absolute', left: 0, top: 74, fontSize: 26, fontWeight: 700}}>#{OURS.id} · {OURS.titolo}</div>
      <div style={{position: 'absolute', left: SAVE_BTN.x, top: SAVE_BTN.y + 14, width: SAVE_BTN.w, height: SAVE_BTN.h, background: '#3C6EB4', color: '#fff', borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700}}>Salva</div>
      <div style={{position: 'absolute', left: SAVE_BTN.x + 124, top: SAVE_BTN.y + 14, width: 110, height: SAVE_BTN.h, border: '1px solid #BDBDBD', borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15}}>Chiudi</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 122, height: 40, borderBottom: '1px solid #DDD', display: 'flex', gap: 34, fontSize: 15}}>
        {['Generale', 'Note', 'Attività', 'Allegati', 'SLA'].map((t, i) => (
          <div key={t} style={{paddingTop: 10, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#222' : '#666', borderBottom: i === 0 ? '3px solid #3C6EB4' : 'none'}}>{t}</div>
        ))}
      </div>
      <Field label="Ragione Sociale Negozio" value={OURS.negozio} x={0} y={188} w={420} />
      <Field label="Padre" value={OURS.padre} x={0} y={262} w={420} />
      <Field label="Aperto il" value={OURS.aperto} x={0} y={336} w={420} />
      <Field label="Gruppo" value="L1 Retail" x={0} y={410} w={420} />
      <Field label="Stato" x={STATO_FIELD.x} y={STATO_FIELD.y} w={STATO_FIELD.w} active={open}
        value={<><span style={{flex: 1, color: stato === 'Chiuso' ? '#137333' : '#222', fontWeight: stato === 'Chiuso' ? 700 : 400}}>{stato}</span><span style={{color: '#666'}}>▾</span></>} />
      <Field label="Assegnato a" value="Tecnico L1" x={470} y={262} w={400} />
      <Field label="Priorità" value={OURS.priorita} x={470} y={336} w={400} />
      <Field label="Urgenza" value={OURS.urgenza} x={470} y={410} w={400} />
      {open && (
        <div style={{position: 'absolute', left: STATO_FIELD.x, top: STATO_FIELD.y + 60, width: STATO_FIELD.w, background: '#fff', border: '1px solid #9DB3D6', zIndex: 5}}>
          {STATI.map((s) => (
            <div key={s} style={{height: 32, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 14,
              background: s === 'Chiuso' && f >= T.statusPick - 8 ? '#3C6EB4' : '#fff', color: s === 'Chiuso' && f >= T.statusPick - 8 ? '#fff' : '#222'}}>{s}</div>
          ))}
        </div>
      )}
      <div style={{position: 'absolute', left: 940, top: 188, width: 880}}>
        <div style={{fontSize: 13, color: '#555', marginBottom: 6}}>Descrizione</div>
        <div style={{height: 120, border: '1px solid #C9C9C9', borderRadius: 3, padding: 12, fontSize: 15, lineHeight: 1.45, boxSizing: 'border-box', background: '#FAFAFA'}}>{DESCRIPTION}</div>
      </div>
      <div style={{position: 'absolute', left: 940, top: 336, width: 880}}>
        <div style={{fontSize: 13, color: '#555', marginBottom: 6}}>Soluzione</div>
        <div style={{height: 140, border: `1px solid ${phase === 2 && f < T.solution[1] + 6 ? '#3C6EB4' : '#C9C9C9'}`, borderRadius: 3, padding: 12, fontSize: 18, lineHeight: 1.45, boxSizing: 'border-box'}}>
          {SOLUTION.slice(0, typed)}
          {phase === 2 && f < T.statusClick && caret && <span style={{display: 'inline-block', width: 2, height: 22, background: '#222', verticalAlign: 'middle', marginLeft: 1}} />}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 520, width: 1840, height: 1, background: '#E5E5E5'}} />
      <div style={{position: 'absolute', left: 0, top: 540, fontSize: 13, color: '#777'}}>Cronologia</div>
      {[['02-10-2026 13:52:10', 'Richiesta creata dal portale negozio'], ['02-10-2026 13:52:10', 'Assegnata al gruppo L1 Retail']].map(([d, t], i) => (
        <div key={i} style={{position: 'absolute', left: 0, top: 570 + i * 30, fontSize: 14, color: '#444'}}><span style={{color: '#888', marginRight: 16}}>{d}</span>{t}</div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- file M_CTL (il "prima")

const RAW = [
  '0001:CASSIERE 01:00010001:0001:83:02:261002:0700:1330',
  '0002:CASSIERE 02:00020002:0002:15:01:261002:0715:0000',
  '0003:CASSIERE 03:00030003:0000:00:00:000000:0000:0000',
  '0004:CASSIERE 04:00040004:0004:62:08:261002:0730:0000',
  '0005:CASSIERE 05:00050005:0000:00:00:000000:0000:0000',
  '0006:CASSIERE 06:00060006:0005:28:01:261002:0745:0000',
  '0007:CASSIERE 07:00070007:0000:00:00:000000:0000:0000',
  '0008:CASSIERE 08:00080008:0006:91:02:261002:0700:1200',
  '0009:CASSIERE 09:00090009:0003:47:01:261002:0802:0000',
  '0010:CASSIERE 10:00100010:0000:00:00:000000:0000:0000',
  '0011:CASSIERE 11:00110011:0000:00:00:000000:0000:0000',
  '0012:CASSIERE 12:00120012:0007:54:01:261002:0900:0000',
];

const DatView: React.FC<{f: number}> = ({f}) => {
  const scan = interpolate(f, T.scan, [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)});
  const found = clamp((f - T.scan[1]) / 5);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 50, top: 44, display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 20, color: 'rgba(242,242,242,0.55)'}}>
        <div style={{width: 10, height: 10, borderRadius: 5, background: OR}} /> C:\Server\Data\M_CTL999.DAT
      </div>
      <div style={{position: 'absolute', left: 36, top: 104 + scan * 44, width: 810, height: 44, borderRadius: 10, background: `rgba(236,105,6,${0.2 + found * 0.15})`}} />
      {RAW.map((l, i) => {
        const inP = clamp((f - (T.datIn + 4 + i)) / 6);
        const hot = i === 8;
        return (
          <div key={i} style={{position: 'absolute', left: 50 + (1 - inP) * 30, top: 112 + i * 44, fontFamily: MONO, fontSize: 21, whiteSpace: 'pre',
            color: hot ? interpolateColors(found, [0, 1], ['rgba(242,242,242,0.6)', '#fff']) : '#F2F2F2', opacity: inP * (hot ? 1 : lerp(0.6, 0.15, found))}}>
            {l}
          </div>
        );
      })}
      <Reveal f={f} at={T.scan[0] + 4} style={{position: 'absolute', left: 50, top: 670}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: '#fff'}}>Collegarsi al server del negozio.</div>
      </Reveal>
      <Reveal f={f} at={T.scan[0] + 12} style={{position: 'absolute', left: 50, top: 734}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: '#fff'}}>Trovare la riga. Decifrare 9 campi.</div>
      </Reveal>
      <Reveal f={f} at={T.scan[1]} style={{position: 'absolute', left: 52, top: 806}}>
        <div style={{fontFamily: FONT, fontSize: 30, color: 'rgba(255,255,255,0.6)'}}>Per ogni ticket. Dieci volte al giorno.</div>
      </Reveal>
    </div>
  );
};

// ---------------------------------------------------------------- Password Operatori (UI reale, design Terya)

const APP_W = 700;
const WIN = {x: 1060, y: 70, w: 760, h: 940, r: 22};
const APP_SCALE = WIN.w / APP_W;
const DAT = {x: 960, y: 110, w: 900, h: 880, r: 40};
const OPS = [
  {code: '0009', name: 'CASSIERE 09', pw: '47', state: 'open', msg: 'Risulta aperto in cassa 3', short: 'Aperto · cassa 3', cassa: '3', date: '02/10/2026', open: '08:02', close: '—'},
  {code: '0019', name: 'CASSIERE 19', pw: '12', state: 'off', msg: 'Non risulta ancora aperto', short: 'Non aperto', cassa: '—', date: '—', open: '—', close: '—'},
];
const queryAt = (f: number) => {
  let q = '';
  let since = 0;
  for (const [t, v] of T.typing as [number, string][]) if (f >= t) { q = v; since = t; }
  return {q, since};
};
const MOSTRA = {x: 452, y: 318, w: 108, h: 58};   // coordinate interne dell'app

const PwApp: React.FC<{f: number}> = ({f}) => {
  const {q} = queryAt(f);
  const sel = q === '09' ? OPS[0] : null;
  const rows = q === '' ? [OPS[0], OPS[1]] : q === '0' ? [OPS[0], OPS[1]] : [OPS[0]];
  const enter = sp(f, T.typing[1][0] as number, 'snappy');
  const revealed = f >= T.reveal;
  const chip = sp(f, T.reveal, 'pop');
  const copied = f >= T.copy;
  const left = Math.max(0, 30 - Math.floor((f - T.reveal) / T.fps));
  const focused = f >= T.toApp + 20;
  const caret = focused && Math.floor(f / 8) % 2 === 0;
  const H = WIN.h / APP_SCALE;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: APP_W, height: H, transform: `scale(${APP_SCALE})`, transformOrigin: '0 0', fontFamily: FONT, background: BG}}>
      {/* barra superiore */}
      <div style={{position: 'absolute', left: 0, top: 0, width: APP_W, height: 76, background: INK, display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', gap: 14}}>
        <Logo size={36} />
        <div style={{color: '#fff', fontWeight: 700, fontSize: 20}}>Password Operatori</div>
        <div style={{width: 7, height: 7, borderRadius: 4, background: OR, marginLeft: -9, marginTop: 10}} />
        <div style={{flex: 1, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 12}}>Aggiornato alle 13:53:02</div>
        <div style={{border: '1px solid #fff', borderRadius: 99, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px 20px'}}>Aggiorna</div>
        <div style={{background: OR, borderRadius: 99, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '9px 18px'}}>anna ▾</div>
      </div>
      {/* ricerca */}
      <div style={{position: 'absolute', left: 28, top: 102, width: 644, height: 56, borderRadius: 28, background: '#fff', boxSizing: 'border-box',
        border: focused ? `2px solid ${OR}` : `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14, fontSize: 17, color: INK}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" stroke={focused ? OR : GRAY} strokeWidth="2.2" /><path d="M14.5 14.5L20 20" stroke={focused ? OR : GRAY} strokeWidth="2.2" strokeLinecap="round" /></svg>
        <span>{q}</span>
        {caret && <span style={{width: 2, height: 24, background: INK, marginLeft: -12}} />}
      </div>
      {/* filtri */}
      <div style={{position: 'absolute', left: 28, top: 174, display: 'flex', gap: 8, fontSize: 12.5}}>
        {[['Tutti', '14', ''], ['Aperti', '3', LED.open], ['In pausa', '1', LED.pause], ['Chiusi', '1', LED.closed]].map(([n, c, d], i) => (
          <div key={n} style={{height: 36, borderRadius: 18, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 7, boxSizing: 'border-box',
            background: i === 0 ? INK : '#fff', border: i === 0 ? 'none' : `1px solid ${BORDER}`, color: i === 0 ? '#fff' : INK, fontWeight: 700}}>
            {d && <Dot color={d} size={8} />}{n}<span style={{fontWeight: 400, color: i === 0 ? 'rgba(255,255,255,0.65)' : GRAY}}>{c}</span>
          </div>
        ))}
      </div>
      {/* scheda */}
      <div style={{position: 'absolute', left: 28, top: 230, width: 644, height: 316, background: '#fff', borderRadius: 24, overflow: 'hidden'}}>
        {sel ? (
          <div style={{position: 'absolute', inset: 0, opacity: clamp(enter * 2), transform: `translateY(${(1 - enter) * 12}px)`}}>
            <div style={{position: 'absolute', left: 30, top: 30, height: 32, borderRadius: 16, background: 'rgba(34,164,71,0.12)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 0 12px',
              color: LED_TEXT.open, fontSize: 12.5, fontWeight: 700}}>
              <Dot color={LED.open} size={10} glow={1} /> {sel.short}
            </div>
            <div style={{position: 'absolute', right: 30, top: 38, fontSize: 12.5, color: GRAY}}>{sel.name}   ·   cod. {sel.code}</div>
            <div style={{position: 'absolute', left: 30, top: MOSTRA.y - 230, height: MOSTRA.h, display: 'flex', alignItems: 'center', fontSize: 24, color: INK}}>
              La password dell'operatore 9 è
            </div>
            <div style={{position: 'absolute', left: MOSTRA.x - 28, top: MOSTRA.y - 230, width: revealed ? 100 : MOSTRA.w, height: MOSTRA.h, borderRadius: 29, boxSizing: 'border-box',
              background: revealed ? OR : '#fff', border: revealed ? 'none' : `2px solid ${OR}`, color: revealed ? '#fff' : OR,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: revealed ? 32 : 17,
              transform: `scale(${revealed ? 0.7 + chip * 0.3 : 1})`}}>
              {revealed ? sel.pw : 'Mostra'}
            </div>
            <div style={{position: 'absolute', left: 30, top: 160, fontSize: 17, fontWeight: 500, color: LED_TEXT.open}}>{sel.msg}</div>
            <div style={{position: 'absolute', right: 30, top: 164, fontSize: 12, color: copied ? LED_TEXT.open : GRAY, fontWeight: copied ? 700 : 400}}>
              {!revealed ? 'Ogni visualizzazione viene registrata' : `${copied ? 'Copiata ✓' : 'Clic sulla password per copiarla'}  ·  si nasconde tra ${left} s`}
            </div>
            <div style={{position: 'absolute', left: 30, right: 30, top: 210, height: 1, background: DIVIDER}} />
            <div style={{position: 'absolute', left: 30, right: 30, top: 228, display: 'flex'}}>
              {[['CASSA', sel.cassa], ['DATA', sel.date], ['APERTURA', sel.open], ['CHIUSURA', sel.close]].map(([l, v]) => (
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
            <div style={{fontSize: 13.5, color: GRAY}}>Scrivi il codice (es. 609) o il nome per vedere password, cassa e stato.</div>
          </div>
        )}
      </div>
      {/* elenco */}
      <div style={{position: 'absolute', left: 28, top: 564, width: 644, height: H - 564 - 46, background: '#fff', borderRadius: 24, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 28, top: 22, fontSize: 17, fontWeight: 700, color: INK}}>Operatori <span style={{fontSize: 13, fontWeight: 400, color: GRAY, marginLeft: 8}}>{rows.length === 2 ? '14' : '1 di 14'}</span></div>
        {rows.map((o, i) => {
          const isSel = sel === o;
          return (
            <div key={o.code} style={{position: 'absolute', left: 8, right: 8, top: 62 + i * 54, height: 48, borderRadius: 14, background: isSel ? MUTED : 'transparent',
              display: 'flex', alignItems: 'center', padding: '0 16px 0 20px', fontSize: 14, color: INK}}>
              {isSel && <div style={{position: 'absolute', left: 0, top: 11, width: 4, height: 26, borderRadius: 2, background: OR}} />}
              <Dot color={o.state === 'open' ? LED.open : LED.off} size={10} />
              <div style={{width: 64, marginLeft: 16, fontWeight: 700, color: isSel ? OR : INK}}>{o.code}</div>
              <div style={{flex: 1}}>{o.name}</div>
              <div style={{fontSize: 12.5, fontWeight: 500, color: o.state === 'open' ? LED_TEXT.open : GRAY}}>{o.short}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 32, bottom: 14, fontSize: 12, color: GRAY}}>C:\Server\Data\M_CTL999.DAT</div>
      <div style={{position: 'absolute', right: 32, bottom: 14, fontSize: 12, color: OR, fontWeight: 700}}>Cambia file</div>
    </div>
  );
};

// ---------------------------------------------------------------- overlay contatore (Terya)

const Counter: React.FC<{f: number}> = ({f}) => {
  const phase2 = f >= T.toList2;
  const inAt = phase2 ? T.toList2 + 8 : T.counterIn;
  const outAt = phase2 ? T.toSecurity : T.zoom;
  const p = sp(f, inAt, 'default') * (1 - sp(f, outAt - 4, 'snappy'));
  if (p <= 0.001) return null;
  let n: number;
  let label: string;
  let sub: string;
  if (!phase2) {
    n = T.inserts.filter((t) => f >= t).length;
    label = 'richieste password';
    sub = 'in un giorno, dai negozi.';
  } else {
    n = 1 + Array.from({length: 9}).filter((_, k) => f >= T.closeRows + k * 4).length;
    label = n === 10 ? 'ticket chiusi' : 'ticket chiusi';
    sub = 'Con Password Operatori.';
  }
  const last = phase2 ? T.closeRows + (n - 2) * 4 : T.inserts[Math.max(0, n - 1)];
  const punch = 1.14 - 0.14 * sp(f, last, 'pop');
  return (
    <div style={{position: 'absolute', left: 1240, top: 620, width: 620, height: 360, background: INK, borderRadius: 40,
      transform: `translateY(${(1 - p) * 460}px)`, fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 50, top: 22, color: phase2 ? '#5BD37A' : OR, fontWeight: 900, fontSize: 200, lineHeight: 1,
        transform: `scale(${punch})`, transformOrigin: '0 80%', fontVariantNumeric: 'tabular-nums'}}>
        {n}{phase2 && <span style={{fontSize: 90, color: 'rgba(255,255,255,0.35)'}}>/10</span>}
      </div>
      <div style={{position: 'absolute', left: 54, top: 236, color: '#fff', fontWeight: 700, fontSize: 46}}>{label}</div>
      <div style={{position: 'absolute', left: 56, top: 294, color: 'rgba(255,255,255,0.6)', fontSize: 30}}>{sub}</div>
    </div>
  );
};

// ---------------------------------------------------------------- sicurezza

const TileIcon: React.FC<{kind: number}> = ({kind}) => {
  const s = {stroke: '#fff', strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width="40" height="40" viewBox="0 0 24 24">
      {kind === 0 && <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" {...s} /><circle cx="12" cy="12" r="3" {...s} /></>}
      {kind === 1 && <><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0" {...s} /><path d="M3 3l18 18" {...s} /></>}
      {kind === 2 && <><circle cx="12" cy="8" r="4" {...s} /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...s} /></>}
      {kind === 3 && <><path d="M8 6h12M8 12h12M8 18h12" {...s} /><path d="M3 6l1.2 1.2L6 5M3 12l1.2 1.2L6 11M3 18l1.2 1.2L6 17" {...s} /></>}
    </svg>
  );
};

const TILES = [
  ['Sola lettura', 'M_CTL999.DAT non viene mai modificato.'],
  ['Nessuna rete', 'Zero connessioni: nulla esce dal server.'],
  ['Accessi personali', 'Utenti nominali, blocco dopo 5 tentativi.'],
  ['Tutto registrato', 'Registro a catena, a prova di manomissione.'],
];

const Security: React.FC<{f: number}> = ({f}) => {
  const rise = sp(f, T.toSecurity, 'default');
  return (
    <div style={{position: 'absolute', left: 0, top: (1 - rise) * 1100, width: 1920, height: 1140, background: INK, fontFamily: FONT,
      borderTopLeftRadius: 40 * (1 - rise), borderTopRightRadius: 40 * (1 - rise)}}>
      <Reveal f={f} at={T.toSecurity + 6} style={{position: 'absolute', left: 140, top: 150}}>
        <div style={{fontSize: 30, fontWeight: 700, color: OR, letterSpacing: 2}}>SICURO PER IL CLIENTE</div>
      </Reveal>
      <Reveal f={f} at={T.toSecurity + 10} style={{position: 'absolute', left: 140, top: 196}}>
        <div style={{fontSize: 88, fontWeight: 900, color: '#fff', lineHeight: 1.1}}>Pensato per il server del negozio.</div>
      </Reveal>
      {TILES.map(([t, d], i) => {
        const p = sp(f, T.tiles[i], 'pop');
        return (
          <div key={t} style={{position: 'absolute', left: 140 + i * 418, top: 430, width: 390, height: 420, borderRadius: 40, boxSizing: 'border-box',
            border: '2px solid rgba(255,255,255,0.16)', padding: 44, transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + p * 0.1})`, opacity: clamp(p * 2)}}>
            <div style={{width: 84, height: 84, borderRadius: 42, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><TileIcon kind={i} /></div>
            <div style={{fontSize: 44, fontWeight: 700, color: '#fff', marginTop: 44, whiteSpace: 'nowrap'}}>{t}</div>
            <div style={{fontSize: 27, color: 'rgba(255,255,255,0.6)', marginTop: 16, lineHeight: 1.3}}>{d}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- chiusura

const PILLS = ['Un solo .exe', 'Nessuna installazione', 'Sola lettura'];

const EndCard: React.FC<{f: number}> = ({f}) => {
  const r = sp(f, T.toEnd, 'heavy') * 2400;
  const icon = sp(f, T.toEnd + 12, 'pop');
  const drift = Math.max(0, f - T.toEnd) * 0.25;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: 960 - r, top: 540 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: OR}} />
      <div style={{position: 'absolute', left: 150 - drift, top: 0}}>
        <div style={{position: 'absolute', top: 236, transform: `scale(${icon})`}}><Logo size={150} bg="#fff" fg={OR} /></div>
        <Reveal f={f} at={T.toEnd + 16} style={{position: 'absolute', left: 190, top: 232}}>
          <div style={{fontSize: 140, fontWeight: 900, color: '#fff', lineHeight: 1.1}}>Password Operatori</div>
        </Reveal>
        <Reveal f={f} at={T.toEnd + 24} style={{position: 'absolute', top: 450}}>
          <div style={{fontSize: 64, fontWeight: 700, color: INK}}>10 ticket al giorno.</div>
        </Reveal>
        <Reveal f={f} at={T.toEnd + 30} style={{position: 'absolute', top: 530}}>
          <div style={{fontSize: 64, fontWeight: 400, color: INK}}>Chiusi in pochi secondi.</div>
        </Reveal>
        <div style={{position: 'absolute', top: 690, display: 'flex', gap: 22}}>
          {PILLS.map((p, i) => {
            const s = sp(f, T.toEnd + 40 + i * 4, 'pop');
            return (
              <div key={p} style={{fontSize: 32, fontWeight: 700, padding: '20px 44px', borderRadius: 999, whiteSpace: 'nowrap', transform: `scale(${s})`, opacity: clamp(s * 2),
                background: i === 0 ? INK : 'transparent', color: i === 0 ? '#fff' : INK, border: `2px solid ${INK}`}}>{p}</div>
            );
          })}
        </div>
        <Reveal f={f} at={T.toEnd + 54} style={{position: 'absolute', top: 860}}>
          <div style={{fontSize: 30, color: 'rgba(2,6,9,0.6)'}}>Service Desk Terya</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- composizione

export const TicketPromo: React.FC = () => {
  const f = useCurrentFrame();

  // elenco SysAid, fase 1 (arrivo dei ticket) e fase 2 (chiusura)
  const listRows = (phase: 1 | 2): RowState[] => {
    const pw: RowState[] = PW.map((row, i) => {
      const t = T.inserts[i];
      const isOurs = row === OURS;
      if (phase === 1) {
        const flash = clamp(1 - (f - t) / 24);
        const bg = isOurs ? '#FDEBD7' : interpolateColors(flash, [0, 1], [i % 2 ? '#F7F7F7' : '#fff', '#FDEBD7']);
        return {row, h: sp(f, t, 'snappy'), bg, stato: 'Nuovo', bold: isOurs};
      }
      const order = PW.length - 1 - i; // 0 = in alto (il nostro)
      const closeAt = isOurs ? T.toList2 : T.closeRows + (order - 1) * 4;
      const c = clamp((f - closeAt) / 6);
      const closed = f >= closeAt;
      return {row, h: 1, bg: interpolateColors(c, [0, 1], ['#fff', '#E6F4EA']), stato: closed ? '✓ Chiuso' : 'Nuovo', statoColor: closed ? '#137333' : undefined};
    }).reverse();
    const base: RowState[] = BASE.map((row, i) => ({row, h: 1, bg: i % 2 ? '#F7F7F7' : '#fff', stato: row.stato}));
    return [...pw, ...base];
  };

  // camera elenco fase 1: zoom sul ticket appena arrivato
  const zoom = sp(f, T.zoom, 'heavy');
  const focus = {x: PAGE_X + 6 + colX('Titolo') + 90, y: PAGE_Y + TABLE_Y + 6 + 44 + ROW_H / 2};
  const listScale = 1 + zoom * 1.25;

  // transizioni di pagina
  const detail1In = sp(f, T.toDetail, 'snappy');
  const datRect = (() => {
    const up = sp(f, T.datIn, 'heavy');
    const m = sp(f, T.toApp, 'default');
    return {
      x: lerp(DAT.x + (1 - up) * 1000, WIN.x, m), y: lerp(DAT.y, WIN.y, m), w: lerp(DAT.w, WIN.w, m), h: lerp(DAT.h, WIN.h, m), r: lerp(DAT.r, WIN.r, m), m,
    };
  })();
  const lightIn = sp(f, T.toApp, 'default');
  const detail2In = sp(f, T.toDetail2, 'snappy');
  const list2In = sp(f, T.toList2, 'snappy');
  const D2 = {ox: 1640, oy: 330, s: 1 + 0.2 * sp(f, T.toDetail2 + 8, 'heavy')};
  const d2 = (x: number, y: number) => ({x: D2.ox + (x - D2.ox) * D2.s, y: D2.oy + (y - D2.oy) * D2.s});

  // cursore
  type K = [number, number][];
  let cursor: {x: number; y: number; clicks: number[]} | null = null;
  if (f >= T.zoom && f < T.toDetail + 4) {
    cursor = {x: track(f, [[0, 1650], [T.zoom + 6, focus.x - 10]] as K), y: track(f, [[0, 1000], [T.zoom + 6, focus.y - 6]] as K), clicks: [T.clickList]};
  } else if (f >= T.reveal - 26 && f < T.toDetail2 - 20) {
    const mx = WIN.x + (MOSTRA.x + MOSTRA.w / 2 - 10) * APP_SCALE;
    const my = WIN.y + (MOSTRA.y + MOSTRA.h / 2 - 8) * APP_SCALE;
    cursor = {x: track(f, [[0, 1750], [T.reveal - 22, mx], [T.copy + 20, mx + 260]] as K), y: track(f, [[0, 1040], [T.reveal - 22, my], [T.copy + 20, my + 300]] as K), clicks: [T.reveal, T.copy]};
  } else if (f >= T.solution[1] - 6 && f < T.toList2) {
    const a = d2(PAGE_X + STATO_FIELD.x + 200, PAGE_Y + STATO_FIELD.y + 40);
    const c = d2(PAGE_X + STATO_FIELD.x + 200, PAGE_Y + STATO_FIELD.y + 60 + 4 * 32 + 16);
    const b = d2(PAGE_X + SAVE_BTN.x + 50, PAGE_Y + SAVE_BTN.y + 30);
    const sx = a.x, sy = a.y, cy = c.y, bx = b.x, by = b.y;
    cursor = {
      x: track(f, [[0, 1500], [T.solution[1] - 4, sx], [T.statusPick - 8, sx], [T.save - 10, bx]] as K, 'snappy'),
      y: track(f, [[0, 900], [T.solution[1] - 4, sy], [T.statusPick - 8, cy], [T.save - 10, by]] as K, 'snappy'),
      clicks: [T.statusClick, T.statusPick, T.save],
    };
  }
  const press = cursor ? cursor.clicks.reduce((s, t) => s * (f >= t && f < t + 8 ? 1 - 0.18 * Math.sin(((f - t) / 8) * Math.PI) : 1), 1) : 1;

  const nList = 12 + T.inserts.filter((t) => f >= t).length;

  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Audio src={staticFile('ticket-music.wav')} />

      {/* 1. elenco SysAid */}
      {f < T.toDetail + 20 && (
        <AbsoluteFill style={{transform: `scale(${listScale})`, transformOrigin: `${focus.x}px ${focus.y}px`}}>
          <div style={{position: 'absolute', left: PAGE_X, top: PAGE_Y, width: 1840, height: 1000}}>
            <SysTopBar count={nList} />
            <SysTable rows={listRows(1)} />
          </div>
        </AbsoluteFill>
      )}

      {/* 2. dettaglio ticket (prima volta) */}
      {f >= T.toDetail && f < T.toApp + 30 && (
        <div style={{position: 'absolute', left: (1 - detail1In) * 1920, top: 0, width: 1920, height: 1080, background: '#fff'}}>
          <div style={{position: 'absolute', left: PAGE_X, top: PAGE_Y, width: 1840, height: 1000}}><SysDetail f={f} phase={1} /></div>
        </div>
      )}
      {f >= T.detailCaption && f < T.datIn + 10 && (
        <div style={{position: 'absolute', left: PAGE_X, top: 760, width: 860, height: 230, background: INK, borderRadius: 40, padding: '44px 50px', boxSizing: 'border-box',
          transform: `translateY(${(1 - sp(f, T.detailCaption, 'default')) * 400}px)`, fontFamily: FONT}}>
          <div style={{fontSize: 26, fontWeight: 700, color: OR, letterSpacing: 2}}>OGGI</div>
          <div style={{fontSize: 52, fontWeight: 700, color: '#fff', marginTop: 10}}>Per rispondere a questo ticket…</div>
        </div>
      )}

      {/* 3. Password Operatori */}
      {f >= T.toApp && f < T.toDetail2 + 30 && (
        <div style={{position: 'absolute', left: (lightIn - 1) * 1920, top: 0, width: 1920, height: 1080, background: BG}} />
      )}
      {f >= T.toApp + 8 && f < T.toDetail2 + 30 && (
        <div style={{position: 'absolute', left: 140, top: 0, fontFamily: FONT}}>
          <Reveal f={f} at={T.toApp + 12} style={{position: 'absolute', top: 170}}>
            <div style={{fontSize: 28, fontWeight: 700, color: OR, letterSpacing: 2}}>CON PASSWORD OPERATORI</div>
          </Reveal>
          <Reveal f={f} at={T.toApp + 16} style={{position: 'absolute', top: 214}}>
            <div style={{fontSize: 104, fontWeight: 900, color: INK, lineHeight: 1.08}}>Scrivi 09.</div>
          </Reveal>
          <Reveal f={f} at={T.toApp + 24} style={{position: 'absolute', top: 330}}>
            <div style={{fontSize: 104, fontWeight: 900, color: INK, lineHeight: 1.08}}>Clicca Mostra.</div>
          </Reveal>
          <Reveal f={f} at={T.reveal + 4} style={{position: 'absolute', top: 446}}>
            <div style={{fontSize: 104, fontWeight: 900, color: OR, lineHeight: 1.08}}>Fatto.</div>
          </Reveal>
          {f >= T.auditToast && (
            <div style={{position: 'absolute', top: 610, display: 'flex', alignItems: 'center', gap: 16, background: INK, color: '#fff', borderRadius: 99, padding: '18px 30px',
              fontSize: 24, whiteSpace: 'nowrap', transform: `scale(${sp(f, T.auditToast, 'pop')})`, transformOrigin: '0 50%'}}>
              <Dot color={LED.open} size={14} glow={1} />
              <span style={{fontWeight: 700}}>Registrato</span>
              <span style={{color: 'rgba(255,255,255,0.65)'}}>anna · PASSWORD_VIEW · operatore 0009 · 13:53</span>
            </div>
          )}
          {['Accesso personale con password', 'Password visibile solo 30 secondi', 'Ogni consultazione nel registro'].map((b, i) => {
            const p = sp(f, T.bullets[i], 'snappy');
            return (
              <div key={b} style={{position: 'absolute', top: 730 + i * 66, display: 'flex', alignItems: 'center', gap: 20, opacity: p, transform: `translateX(${(1 - p) * -40}px)`,
                fontSize: 34, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>
                <Dot color={OR} size={14} /> {b}
              </div>
            );
          })}
        </div>
      )}
      {f >= T.datIn && f < T.toDetail2 + 30 && (
        <div style={{position: 'absolute', left: datRect.x, top: datRect.y, width: datRect.w, height: datRect.h, borderRadius: datRect.r, overflow: 'hidden',
          background: interpolateColors(datRect.m, [0, 1], [INK, BG])}}>
          {datRect.m < 0.6 && <div style={{position: 'absolute', inset: 0, opacity: 1 - clamp((f - T.toApp) / 6)}}><DatView f={f} /></div>}
          {f >= T.toApp + 4 && <div style={{position: 'absolute', inset: 0, opacity: clamp((f - T.toApp - 4) / 6)}}><PwApp f={f} /></div>}
        </div>
      )}

      {/* 4. dettaglio ticket: risposta e chiusura */}
      {f >= T.toDetail2 && f < T.toList2 + 20 && (
        <div style={{position: 'absolute', left: (1 - detail2In) * 1920, top: 0, width: 1920, height: 1080, background: '#fff', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, transform: `scale(${D2.s})`, transformOrigin: `${D2.ox}px ${D2.oy}px`}}>
            <div style={{position: 'absolute', left: PAGE_X, top: PAGE_Y, width: 1840, height: 1000}}><SysDetail f={f} phase={2} /></div>
          </div>
        </div>
      )}

      {/* 5. elenco: tutti i ticket password chiusi */}
      {f >= T.toList2 && f < T.toSecurity + 30 && (
        <div style={{position: 'absolute', left: (list2In - 1) * 1920, top: 0, width: 1920, height: 1080, background: '#fff'}}>
          <div style={{position: 'absolute', left: PAGE_X, top: PAGE_Y, width: 1840, height: 1000}}>
            <SysTopBar count={22} />
            <SysTable rows={listRows(2)} />
          </div>
        </div>
      )}

      <Counter f={f} />

      {cursor && (
        <div style={{position: 'absolute', left: cursor.x, top: cursor.y, transform: `scale(${press})`, transformOrigin: '0 0'}}>
          {cursor.clicks.map((t) =>
            f >= t && f < t + 14 ? (
              <div key={t} style={{position: 'absolute', left: 6 - (f - t) * 3, top: 6 - (f - t) * 3, width: (f - t) * 6, height: (f - t) * 6,
                borderRadius: '50%', border: `3px solid ${OR}`, opacity: 1 - (f - t) / 14}} />
            ) : null,
          )}
          <Pointer />
        </div>
      )}

      {f >= T.toSecurity && f < T.toEnd + 30 && <Security f={f} />}
      {f >= T.toEnd && <EndCard f={f} />}
    </AbsoluteFill>
  );
};

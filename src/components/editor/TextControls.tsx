import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  CaseSensitive, ChevronsUp, ChevronsDown,
} from 'lucide-react';

const FONT_FAMILIES = [
  'Inter Tight', 'Space Grotesk', 'Playfair Display', 'Instrument Serif',
  'Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana',
  'Trebuchet MS', 'Impact', 'Comic Sans MS',
];

const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
  { label: 'Black', value: '900' },
];

export default function TextControls() {
  const { fabricCanvas, pushHistory } = useEditorStore();
  const [textObj, setTextObj] = useState<fabric.IText | null>(null);
  const [fontFamily, setFontFamily] = useState('Inter Tight');
  const [fontSize, setFontSize] = useState(40);
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState<'' | 'italic'>('');
  const [textAlign, setTextAlign] = useState('left');
  const [fill, setFill] = useState('#000000');
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textTransform, setTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
  const [shadow, setShadow] = useState({ color: '#000000', blur: 0, offsetX: 0, offsetY: 2, opacity: 50 });
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#000000');

  useEffect(() => {
    if (!fabricCanvas) return;

    const syncFromObj = () => {
      const obj = fabricCanvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
        const t = obj as fabric.IText;
        setTextObj(t);
        setFontFamily(t.fontFamily || 'Inter Tight');
        setFontSize(t.fontSize || 40);
        setFontWeight(String(t.fontWeight || '400'));
        setFontStyle((t.fontStyle as '' | 'italic') || '');
        setTextAlign(t.textAlign || 'left');
        setFill((t.fill as string) || '#000000');
        setCharSpacing(t.charSpacing || 0);
        setLineHeight(t.lineHeight || 1.2);
        setStrokeWidth(t.strokeWidth || 0);
        setStrokeColor(t.stroke || '#000000');
        if (t.shadow) {
          const s = t.shadow as fabric.Shadow;
          setShadow({ color: s.color || '#000000', blur: s.blur || 0, offsetX: s.offsetX || 0, offsetY: s.offsetY || 2, opacity: 50 });
        }
      } else {
        setTextObj(null);
      }
    };

    fabricCanvas.on('selection:created', syncFromObj);
    fabricCanvas.on('selection:updated', syncFromObj);
    fabricCanvas.on('selection:cleared', () => setTextObj(null));
    syncFromObj();

    return () => {
      fabricCanvas.off('selection:created', syncFromObj);
      fabricCanvas.off('selection:updated', syncFromObj);
      fabricCanvas.off('selection:cleared');
    };
  }, [fabricCanvas]);

  const apply = useCallback((props: Record<string, any>) => {
    if (!textObj || !fabricCanvas) return;
    textObj.set(props);
    fabricCanvas.renderAll();
    pushHistory();
  }, [textObj, fabricCanvas, pushHistory]);

  if (!textObj) {
    return (
      <div className="text-center text-muted-foreground text-xs py-8 animate-fade-in">
        Select a text element to edit its properties
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <label className="editor-label mb-1.5 block">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => { setFontFamily(e.target.value); apply({ fontFamily: e.target.value }); }}
          className="editor-input w-full"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="editor-label mb-1.5 block">Size</label>
          <input type="number" value={fontSize} min={8} max={400} onChange={(e) => { const v = Number(e.target.value); setFontSize(v); apply({ fontSize: v }); }} className="editor-input w-full" />
        </div>
        <div>
          <label className="editor-label mb-1.5 block">Weight</label>
          <select value={fontWeight} onChange={(e) => { setFontWeight(e.target.value); apply({ fontWeight: e.target.value }); }} className="editor-input w-full">
            {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Style</label>
        <div className="flex gap-1">
          <button onClick={() => { const v = fontWeight === '700' ? '400' : '700'; setFontWeight(v); apply({ fontWeight: v }); }} className={`editor-btn ${fontWeight === '700' ? 'editor-btn-active' : ''}`}><Bold size={14} /></button>
          <button onClick={() => { const v = fontStyle === 'italic' ? '' : 'italic'; setFontStyle(v as any); apply({ fontStyle: v || 'normal' }); }} className={`editor-btn ${fontStyle === 'italic' ? 'editor-btn-active' : ''}`}><Italic size={14} /></button>
          <div className="w-px h-6 bg-editor-border mx-1 self-center" />
          <button onClick={() => { setTextAlign('left'); apply({ textAlign: 'left' }); }} className={`editor-btn ${textAlign === 'left' ? 'editor-btn-active' : ''}`}><AlignLeft size={14} /></button>
          <button onClick={() => { setTextAlign('center'); apply({ textAlign: 'center' }); }} className={`editor-btn ${textAlign === 'center' ? 'editor-btn-active' : ''}`}><AlignCenter size={14} /></button>
          <button onClick={() => { setTextAlign('right'); apply({ textAlign: 'right' }); }} className={`editor-btn ${textAlign === 'right' ? 'editor-btn-active' : ''}`}><AlignRight size={14} /></button>
          <button onClick={() => { setTextAlign('justify'); apply({ textAlign: 'justify' }); }} className={`editor-btn ${textAlign === 'justify' ? 'editor-btn-active' : ''}`}><AlignJustify size={14} /></button>
        </div>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Text Transform</label>
        <div className="flex gap-1">
          {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((tt) => (
            <button
              key={tt}
              onClick={() => {
                setTextTransform(tt);
                if (!textObj) return;
                let text = textObj.text || '';
                switch (tt) {
                  case 'uppercase': text = text.toUpperCase(); break;
                  case 'lowercase': text = text.toLowerCase(); break;
                  case 'capitalize': text = text.replace(/\b\w/g, (c) => c.toUpperCase()); break;
                  default: break;
                }
                apply({ text });
              }}
              className={`editor-btn text-[10px] px-2 ${textTransform === tt ? 'editor-btn-active' : ''}`}
            >
              {tt === 'none' ? 'Aa' : tt === 'uppercase' ? 'AA' : tt === 'lowercase' ? 'aa' : 'Aa'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={fill} onChange={(e) => { setFill(e.target.value); apply({ fill: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <input type="text" value={fill} onChange={(e) => { setFill(e.target.value); apply({ fill: e.target.value }); }} className="editor-input flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="editor-label mb-1.5 block">Letter Spacing</label>
          <input type="number" value={charSpacing} min={-200} max={1000} step={10} onChange={(e) => { const v = Number(e.target.value); setCharSpacing(v); apply({ charSpacing: v }); }} className="editor-input w-full" />
        </div>
        <div>
          <label className="editor-label mb-1.5 block">Line Height</label>
          <input type="number" value={lineHeight} min={0.5} max={4} step={0.1} onChange={(e) => { const v = Number(e.target.value); setLineHeight(v); apply({ lineHeight: v }); }} className="editor-input w-full" />
        </div>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Text Stroke</label>
        <div className="flex items-center gap-2">
          <input type="color" value={strokeColor} onChange={(e) => { setStrokeColor(e.target.value); apply({ stroke: e.target.value, strokeWidth: strokeWidth || 1 }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <input type="number" value={strokeWidth} min={0} max={20} onChange={(e) => { const v = Number(e.target.value); setStrokeWidth(v); apply({ strokeWidth: v, stroke: strokeColor }); }} className="editor-input w-16" />
        </div>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Shadow</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-10">Blur</label>
            <input type="range" min={0} max={50} value={shadow.blur} onChange={(e) => {
              const s = { ...shadow, blur: Number(e.target.value) };
              setShadow(s);
              apply({ shadow: new fabric.Shadow({ color: s.color, blur: s.blur, offsetX: s.offsetX, offsetY: s.offsetY }) });
            }} className="flex-1 accent-primary" />
            <span className="text-[10px] text-muted-foreground w-6 text-right">{shadow.blur}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground w-10">X / Y</label>
            <input type="number" value={shadow.offsetX} onChange={(e) => {
              const s = { ...shadow, offsetX: Number(e.target.value) };
              setShadow(s);
              apply({ shadow: new fabric.Shadow({ color: s.color, blur: s.blur, offsetX: s.offsetX, offsetY: s.offsetY }) });
            }} className="editor-input w-14" />
            <input type="number" value={shadow.offsetY} onChange={(e) => {
              const s = { ...shadow, offsetY: Number(e.target.value) };
              setShadow(s);
              apply({ shadow: new fabric.Shadow({ color: s.color, blur: s.blur, offsetX: s.offsetX, offsetY: s.offsetY }) });
            }} className="editor-input w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

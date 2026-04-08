import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import SliderInput from './SliderInput';
import RecentColors from './RecentColors';
import TextPresets from './TextPresets';

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
  const { fabricCanvas, pushHistory, addRecentColor } = useEditorStore();
  const [textObj, setTextObj] = useState<fabric.IText | null>(null);
  const [fontFamily, setFontFamily] = useState('Inter Tight');
  const [fontSize, setFontSize] = useState(40);
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState<'' | 'italic'>('');
  const [textAlign, setTextAlign] = useState('left');
  const [fill, setFill] = useState('#000000');
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [strokeEnabled, setStrokeEnabled] = useState(false);
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
        const sw = t.strokeWidth || 0;
        setStrokeWidth(sw);
        setStrokeEnabled(sw > 0);
        setStrokeColor(t.stroke || '#000000');
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

  const handleColorChange = (color: string) => {
    setFill(color);
    apply({ fill: color });
    addRecentColor(color);
  };

  if (!textObj) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center text-muted-foreground text-xs py-4">
          Select a text element to edit
        </div>
        <TextPresets />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <TextPresets />

      <div className="w-full h-px bg-editor-border" />

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

      <SliderInput label="Font Size" value={fontSize} min={8} max={400} step={1} unit="px" onChange={(v) => { setFontSize(v); apply({ fontSize: v }); }} />

      <div>
        <label className="editor-label mb-1.5 block">Weight</label>
        <select value={fontWeight} onChange={(e) => { setFontWeight(e.target.value); apply({ fontWeight: e.target.value }); }} className="editor-input w-full">
          {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>
      </div>

      <div>
        <label className="editor-label mb-1.5 block">Style & Alignment</label>
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
        <label className="editor-label mb-1.5 block">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={fill} onChange={(e) => handleColorChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <input type="text" value={fill} onChange={(e) => handleColorChange(e.target.value)} className="editor-input flex-1" />
        </div>
      </div>

      <RecentColors onSelect={handleColorChange} />

      <SliderInput label="Letter Spacing" value={charSpacing} min={-200} max={1000} step={10} onChange={(v) => { setCharSpacing(v); apply({ charSpacing: v }); }} />
      <SliderInput label="Line Height" value={lineHeight} min={0.5} max={4} step={0.1} onChange={(v) => { setLineHeight(v); apply({ lineHeight: v }); }} />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="editor-label">Stroke</label>
          <button
            onClick={() => {
              const next = !strokeEnabled;
              setStrokeEnabled(next);
              if (!next) {
                setStrokeWidth(0);
                apply({ strokeWidth: 0, stroke: '' });
              } else {
                setStrokeWidth(1);
                apply({ strokeWidth: 1, stroke: strokeColor });
              }
            }}
            className={`w-8 h-4 rounded-full transition-colors relative ${strokeEnabled ? 'bg-primary' : 'bg-editor-surface'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${strokeEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {strokeEnabled && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <input type="color" value={strokeColor} onChange={(e) => { setStrokeColor(e.target.value); apply({ stroke: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input type="text" value={strokeColor} onChange={(e) => { setStrokeColor(e.target.value); apply({ stroke: e.target.value }); }} className="editor-input flex-1" />
            </div>
            <SliderInput label="Stroke Width" value={strokeWidth} min={0} max={20} step={0.5} onChange={(v) => { setStrokeWidth(v); apply({ strokeWidth: v, stroke: strokeColor }); }} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useEditorStore, GradientStop } from '@/stores/editorStore';
import { useCallback, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import SliderInput from './SliderInput';
import RecentColors from './RecentColors';
import AlignmentTools from './AlignmentTools';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { CANVAS_PRESETS } from './CanvasPresets';

export default function DesignControls() {
  const { format, setFormat, fabricCanvas, activeSlideIndex, updateSlide, pushHistory, addRecentColor } = useEditorStore();
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedObj, setSelectedObj] = useState<any>(null);
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientStops, setGradientStops] = useState<GradientStop[]>([
    { offset: 0, color: '#000000', opacity: 1 },
    { offset: 1, color: '#000000', opacity: 0 },
  ]);
  const [showPresets, setShowPresets] = useState(false);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    setBgColor(fabricCanvas.backgroundColor as string || '#ffffff');

    const onSelect = () => {
      const obj = fabricCanvas.getActiveObject();
      setSelectedObj(obj || null);
      if (obj) {
        setFillColor((typeof obj.fill === 'string' ? obj.fill : '#000000'));
        setStrokeColor(obj.stroke || '#000000');
        setStrokeWidth(obj.strokeWidth || 0);
        setOpacity(Math.round((obj.opacity || 1) * 100));
        setRotation(Math.round(obj.angle || 0));
        const isGrad = obj.fill instanceof fabric.Gradient;
        setGradientEnabled(isGrad);
        if (isGrad) {
          const g = obj.fill as fabric.Gradient;
          setGradientType((g.type as 'linear' | 'radial') || 'linear');
          const stops = (g.colorStops || []).map((s: any) => ({
            offset: s.offset,
            color: s.color.startsWith('rgba') ? '#000000' : s.color,
            opacity: s.opacity !== undefined ? s.opacity : 1,
          }));
          if (stops.length >= 2) setGradientStops(stops);
        }
      }
    };
    const onClear = () => setSelectedObj(null);

    fabricCanvas.on('selection:created', onSelect);
    fabricCanvas.on('selection:updated', onSelect);
    fabricCanvas.on('selection:cleared', onClear);
    return () => {
      fabricCanvas.off('selection:created', onSelect);
      fabricCanvas.off('selection:updated', onSelect);
      fabricCanvas.off('selection:cleared', onClear);
    };
  }, [fabricCanvas]);

  const handleBgChange = (color: string) => {
    setBgColor(color);
    addRecentColor(color);
    if (fabricCanvas) {
      fabricCanvas.backgroundColor = color;
      fabricCanvas.renderAll();
      const json = JSON.stringify(fabricCanvas.toJSON(['id', 'name']));
      updateSlide(activeSlideIndex, { objects: json });
    }
  };

  const applyToSelected = useCallback((props: Record<string, any>) => {
    if (!fabricCanvas || !selectedObj) return;
    selectedObj.set(props);
    fabricCanvas.renderAll();
    pushHistory();
  }, [fabricCanvas, selectedObj, pushHistory]);

  const applyGradient = useCallback((stops: GradientStop[], angle: number, type: 'linear' | 'radial') => {
    if (!selectedObj || !fabricCanvas) return;

    const colorStops = stops.map(s => ({
      offset: s.offset,
      color: s.opacity < 1
        ? `rgba(${parseInt(s.color.slice(1, 3), 16)},${parseInt(s.color.slice(3, 5), 16)},${parseInt(s.color.slice(5, 7), 16)},${s.opacity})`
        : s.color,
    }));

    if (type === 'linear') {
      const rad = (angle * Math.PI) / 180;
      const x1 = Math.round(50 + Math.sin(rad) * -50);
      const y1 = Math.round(50 + Math.cos(rad) * 50);
      const x2 = Math.round(50 + Math.sin(rad) * 50);
      const y2 = Math.round(50 + Math.cos(rad) * -50);
      const gradient = new fabric.Gradient({
        type: 'linear',
        coords: {
          x1: (x1 / 100) * (selectedObj.width || 100),
          y1: (y1 / 100) * (selectedObj.height || 100),
          x2: (x2 / 100) * (selectedObj.width || 100),
          y2: (y2 / 100) * (selectedObj.height || 100),
        },
        colorStops,
      });
      selectedObj.set({ fill: gradient });
    } else {
      const gradient = new fabric.Gradient({
        type: 'radial',
        coords: {
          x1: (selectedObj.width || 100) / 2,
          y1: (selectedObj.height || 100) / 2,
          r1: 0,
          x2: (selectedObj.width || 100) / 2,
          y2: (selectedObj.height || 100) / 2,
          r2: Math.max(selectedObj.width || 100, selectedObj.height || 100) / 2,
        },
        colorStops,
      });
      selectedObj.set({ fill: gradient });
    }

    fabricCanvas.renderAll();
    pushHistory();
  }, [selectedObj, fabricCanvas, pushHistory]);

  const handleFillChange = (color: string) => {
    setFillColor(color);
    addRecentColor(color);
    if (gradientEnabled) {
      const newStops = [...gradientStops];
      newStops[0] = { ...newStops[0], color };
      setGradientStops(newStops);
      applyGradient(newStops, gradientAngle, gradientType);
    } else {
      applyToSelected({ fill: color });
    }
  };

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    newStops.sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    applyGradient(newStops, gradientAngle, gradientType);
  };

  const addStop = () => {
    const newStops = [...gradientStops, { offset: 0.5, color: '#888888', opacity: 1 }];
    newStops.sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    applyGradient(newStops, gradientAngle, gradientType);
  };

  const removeStop = (index: number) => {
    if (gradientStops.length <= 2) return;
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
    applyGradient(newStops, gradientAngle, gradientType);
  };

  const applyPreset = (name: string, width: number, height: number) => {
    setFormat({ name, width, height, ratio: `${width}:${height}` });
    setShowPresets(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Canvas Format */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="editor-label">Canvas Size</label>
          <button onClick={() => setShowPresets(!showPresets)} className="editor-btn text-[10px] gap-1 px-2">
            {format.name} <ChevronDown size={10} />
          </button>
        </div>

        {showPresets && (
          <div className="bg-editor-surface rounded-lg border border-editor-border max-h-64 overflow-y-auto mb-3">
            {CANVAS_PRESETS.map((cat) => (
              <div key={cat.name}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-editor-text-bright hover:bg-editor-hover transition-colors flex items-center justify-between"
                >
                  {cat.name}
                  <ChevronDown size={10} className={`transition-transform ${expandedCategory === cat.name ? 'rotate-180' : ''}`} />
                </button>
                {expandedCategory === cat.name && (
                  <div>
                    {cat.presets.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => applyPreset(p.name, p.width, p.height)}
                        className="w-full text-left px-4 py-1 text-[10px] text-editor-text hover:bg-editor-hover transition-colors"
                      >
                        {p.name} <span className="text-muted-foreground ml-1">{p.width}×{p.height}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Custom */}
            <div className="px-3 py-2 border-t border-editor-border">
              <span className="text-[10px] font-semibold text-editor-text-bright">Custom</span>
              <div className="flex gap-1 mt-1">
                <input type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} className="editor-input w-20 text-center" placeholder="W" />
                <span className="text-muted-foreground self-center text-xs">×</span>
                <input type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} className="editor-input w-20 text-center" placeholder="H" />
                <button onClick={() => applyPreset(`${customW}×${customH}`, customW, customH)} className="editor-btn text-[10px] px-2 bg-primary/20 text-primary">Set</button>
              </div>
            </div>
          </div>
        )}

        <div className="text-[10px] text-muted-foreground">{format.width} × {format.height}px</div>
      </div>

      <div>
        <label className="editor-label mb-2 block">Background Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={bgColor} onChange={(e) => handleBgChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
          <input type="text" value={bgColor} onChange={(e) => handleBgChange(e.target.value)} className="editor-input flex-1" />
        </div>
      </div>

      <RecentColors onSelect={handleBgChange} />

      <AlignmentTools />

      {selectedObj && (
        <>
          <div className="w-full h-px bg-editor-border" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="editor-label">Fill</label>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">Gradient</span>
                <button
                  onClick={() => {
                    const next = !gradientEnabled;
                    setGradientEnabled(next);
                    if (next) {
                      applyGradient(gradientStops, gradientAngle, gradientType);
                    } else {
                      applyToSelected({ fill: fillColor });
                    }
                  }}
                  className={`w-8 h-4 rounded-full transition-colors relative ${gradientEnabled ? 'bg-primary' : 'bg-editor-surface'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${gradientEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {gradientEnabled ? (
              <div className="space-y-3">
                <div className="flex gap-1">
                  <button onClick={() => { setGradientType('linear'); applyGradient(gradientStops, gradientAngle, 'linear'); }} className={`flex-1 py-1 text-[10px] rounded-md transition-colors ${gradientType === 'linear' ? 'bg-primary/20 text-primary' : 'bg-editor-surface text-editor-text'}`}>Linear</button>
                  <button onClick={() => { setGradientType('radial'); applyGradient(gradientStops, gradientAngle, 'radial'); }} className={`flex-1 py-1 text-[10px] rounded-md transition-colors ${gradientType === 'radial' ? 'bg-primary/20 text-primary' : 'bg-editor-surface text-editor-text'}`}>Radial</button>
                </div>

                <div
                  className="h-6 rounded-md border border-editor-border"
                  style={{
                    background: `linear-gradient(90deg, ${gradientStops.map(s => {
                      const r = parseInt(s.color.slice(1, 3), 16);
                      const g = parseInt(s.color.slice(3, 5), 16);
                      const b = parseInt(s.color.slice(5, 7), 16);
                      return `rgba(${r},${g},${b},${s.opacity}) ${s.offset * 100}%`;
                    }).join(', ')})`,
                  }}
                />

                <div className="space-y-2">
                  {gradientStops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input type="color" value={stop.color} onChange={(e) => updateStop(i, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent flex-shrink-0" />
                      <input type="range" min={0} max={100} value={Math.round(stop.offset * 100)} onChange={(e) => updateStop(i, { offset: Number(e.target.value) / 100 })} className="flex-1 accent-primary h-1" />
                      <input type="number" min={0} max={100} value={Math.round(stop.opacity * 100)} onChange={(e) => updateStop(i, { opacity: Number(e.target.value) / 100 })} className="editor-input w-12 text-center text-[10px]" />
                      {gradientStops.length > 2 && (
                        <button onClick={() => removeStop(i)} className="editor-btn p-0.5"><Trash2 size={10} /></button>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={addStop} className="editor-btn text-[10px] gap-1 w-full justify-center py-1">
                  <Plus size={10} /> Add Stop
                </button>

                {gradientType === 'linear' && (
                  <SliderInput label="Angle" value={gradientAngle} min={0} max={360} step={1} unit="°" onChange={(v) => { setGradientAngle(v); applyGradient(gradientStops, v, gradientType); }} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input type="color" value={fillColor} onChange={(e) => handleFillChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <input type="text" value={fillColor} onChange={(e) => handleFillChange(e.target.value)} className="editor-input flex-1" />
              </div>
            )}
          </div>

          <div>
            <label className="editor-label mb-2 block">Stroke</label>
            <div className="flex items-center gap-2">
              <input type="color" value={strokeColor} onChange={(e) => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div className="mt-2">
              <SliderInput label="Stroke Width" value={strokeWidth} min={0} max={20} step={0.5} onChange={(v) => { setStrokeWidth(v); applyToSelected({ strokeWidth: v, stroke: strokeColor }); }} />
            </div>
          </div>

          <SliderInput label="Opacity" value={opacity} min={0} max={100} step={1} unit="%" onChange={(v) => { setOpacity(v); applyToSelected({ opacity: v / 100 }); }} />
          <SliderInput label="Rotation" value={rotation} min={0} max={360} step={1} unit="°" onChange={(v) => { setRotation(v); applyToSelected({ angle: v }); }} />
        </>
      )}
    </div>
  );
}

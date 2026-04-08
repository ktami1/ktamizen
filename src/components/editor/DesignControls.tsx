import { useEditorStore, FORMAT_PRESETS } from '@/stores/editorStore';
import { useCallback, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import SliderInput from './SliderInput';
import RecentColors from './RecentColors';
import AlignmentTools from './AlignmentTools';

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
  const [gradientColor1, setGradientColor1] = useState('#000000');
  const [gradientColor2, setGradientColor2] = useState('rgba(0,0,0,0)');
  const [gradientAngle, setGradientAngle] = useState(0);

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
        setGradientEnabled(obj.fill instanceof fabric.Gradient);
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

  const applyGradient = (c1: string, c2: string, angle: number) => {
    if (!selectedObj || !fabricCanvas) return;
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
      colorStops: [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 },
      ],
    });

    selectedObj.set({ fill: gradient });
    fabricCanvas.renderAll();
    pushHistory();
  };

  const handleFillChange = (color: string) => {
    setFillColor(color);
    addRecentColor(color);
    if (gradientEnabled) {
      setGradientColor1(color);
      applyGradient(color, gradientColor2, gradientAngle);
    } else {
      applyToSelected({ fill: color });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <label className="editor-label mb-2 block">Canvas Format</label>
        <div className="space-y-1">
          {FORMAT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setFormat(preset)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                format.name === preset.name ? 'bg-primary/20 text-primary' : 'text-editor-text hover:bg-editor-hover'
              }`}
            >
              <span className="font-medium">{preset.name}</span>
              <span className="text-muted-foreground ml-2">{preset.width}×{preset.height}</span>
            </button>
          ))}
        </div>
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
                      applyGradient(gradientColor1, gradientColor2, gradientAngle);
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="color" value={gradientColor1} onChange={(e) => { setGradientColor1(e.target.value); applyGradient(e.target.value, gradientColor2, gradientAngle); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <input type="color" value={gradientColor2 === 'rgba(0,0,0,0)' ? '#000000' : gradientColor2} onChange={(e) => { setGradientColor2(e.target.value); applyGradient(gradientColor1, e.target.value, gradientAngle); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                  <button
                    onClick={() => { setGradientColor2('rgba(0,0,0,0)'); applyGradient(gradientColor1, 'rgba(0,0,0,0)', gradientAngle); }}
                    className="editor-btn text-[9px] px-2"
                  >
                    → Transparent
                  </button>
                </div>
                <SliderInput label="Angle" value={gradientAngle} min={0} max={360} step={1} unit="°" onChange={(v) => { setGradientAngle(v); applyGradient(gradientColor1, gradientColor2, v); }} />
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

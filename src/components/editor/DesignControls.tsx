import { useEditorStore, FORMAT_PRESETS } from '@/stores/editorStore';
import { useCallback, useEffect, useState } from 'react';

export default function DesignControls() {
  const { format, setFormat, fabricCanvas, activeSlideIndex, updateSlide, pushHistory } = useEditorStore();
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedObj, setSelectedObj] = useState<fabric.Object | null>(null);
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (!fabricCanvas) return;
    setBgColor(fabricCanvas.backgroundColor as string || '#ffffff');

    const onSelect = () => {
      const obj = fabricCanvas.getActiveObject();
      setSelectedObj(obj || null);
      if (obj) {
        setFillColor((obj.fill as string) || '#000000');
        setStrokeColor(obj.stroke || '#000000');
        setStrokeWidth(obj.strokeWidth || 0);
        setOpacity(Math.round((obj.opacity || 1) * 100));
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

      {selectedObj && (
        <>
          <div>
            <label className="editor-label mb-2 block">Fill Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={fillColor} onChange={(e) => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input type="text" value={fillColor} onChange={(e) => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }} className="editor-input flex-1" />
            </div>
          </div>

          <div>
            <label className="editor-label mb-2 block">Stroke</label>
            <div className="flex items-center gap-2">
              <input type="color" value={strokeColor} onChange={(e) => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <input type="number" value={strokeWidth} min={0} max={20} onChange={(e) => { const v = Number(e.target.value); setStrokeWidth(v); applyToSelected({ strokeWidth: v }); }} className="editor-input w-16" />
            </div>
          </div>

          <div>
            <label className="editor-label mb-2 block">Opacity — {opacity}%</label>
            <input type="range" min={0} max={100} value={opacity} onChange={(e) => { const v = Number(e.target.value); setOpacity(v); applyToSelected({ opacity: v / 100 }); }} className="w-full accent-primary" />
          </div>
        </>
      )}
    </div>
  );
}

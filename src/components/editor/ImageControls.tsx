import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  blur: number;
  opacity: number;
};

const DEFAULT_ADJ: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  blur: 0,
  opacity: 100,
};

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; step: number }[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1 },
  { key: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1 },
  { key: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1 },
];

export default function ImageControls() {
  const { fabricCanvas, pushHistory } = useEditorStore();
  const [imgObj, setImgObj] = useState<fabric.Image | null>(null);
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULT_ADJ });

  useEffect(() => {
    if (!fabricCanvas) return;

    const onSelect = () => {
      const obj = fabricCanvas.getActiveObject();
      if (obj && obj.type === 'image') {
        setImgObj(obj as fabric.Image);
        setAdj({ ...DEFAULT_ADJ });
      } else {
        setImgObj(null);
      }
    };

    fabricCanvas.on('selection:created', onSelect);
    fabricCanvas.on('selection:updated', onSelect);
    fabricCanvas.on('selection:cleared', () => setImgObj(null));
    onSelect();

    return () => {
      fabricCanvas.off('selection:created', onSelect);
      fabricCanvas.off('selection:updated', onSelect);
      fabricCanvas.off('selection:cleared');
    };
  }, [fabricCanvas]);

  const applyFilters = useCallback((newAdj: Adjustments) => {
    if (!imgObj || !fabricCanvas) return;

    const filters: fabric.IBaseFilter[] = [];

    if (newAdj.brightness !== 0) {
      filters.push(new fabric.Image.filters.Brightness({ brightness: newAdj.brightness / 200 }));
    }
    if (newAdj.contrast !== 0) {
      filters.push(new fabric.Image.filters.Contrast({ contrast: newAdj.contrast / 100 }));
    }
    if (newAdj.saturation !== 0) {
      filters.push(new fabric.Image.filters.Saturation({ saturation: newAdj.saturation / 100 }));
    }
    if (newAdj.exposure !== 0) {
      filters.push(new fabric.Image.filters.Brightness({ brightness: newAdj.exposure / 400 }));
    }
    if (newAdj.temperature !== 0) {
      const matrix = newAdj.temperature > 0
        ? [1 + newAdj.temperature / 200, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1 - newAdj.temperature / 200, 0, 0, 0, 0, 0, 1, 0]
        : [1 + newAdj.temperature / 200, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1 - newAdj.temperature / 200, 0, 0, 0, 0, 0, 1, 0];
      filters.push(new fabric.Image.filters.ColorMatrix({ matrix }));
    }
    if (newAdj.blur > 0) {
      filters.push(new fabric.Image.filters.Blur({ blur: newAdj.blur / 10 }));
    }

    imgObj.filters = filters;
    imgObj.applyFilters();
    imgObj.set({ opacity: newAdj.opacity / 100 });
    fabricCanvas.renderAll();
  }, [imgObj, fabricCanvas]);

  const handleChange = (key: keyof Adjustments, value: number) => {
    const newAdj = { ...adj, [key]: value };
    setAdj(newAdj);
    applyFilters(newAdj);
  };

  const handleTransform = (action: 'rotate' | 'flipX' | 'flipY') => {
    if (!imgObj || !fabricCanvas) return;
    switch (action) {
      case 'rotate':
        imgObj.rotate((imgObj.angle || 0) + 90);
        break;
      case 'flipX':
        imgObj.set({ flipX: !imgObj.flipX });
        break;
      case 'flipY':
        imgObj.set({ flipY: !imgObj.flipY });
        break;
    }
    fabricCanvas.renderAll();
    pushHistory();
  };

  const resetAll = () => {
    setAdj({ ...DEFAULT_ADJ });
    applyFilters({ ...DEFAULT_ADJ });
  };

  if (!imgObj) {
    return (
      <div className="text-center text-muted-foreground text-xs py-8 animate-fade-in">
        Select an image to edit its adjustments
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="editor-label">Transform</span>
        <div className="flex gap-1">
          <button onClick={() => handleTransform('rotate')} className="editor-btn" title="Rotate 90°"><RotateCw size={14} /></button>
          <button onClick={() => handleTransform('flipX')} className="editor-btn" title="Flip Horizontal"><FlipHorizontal size={14} /></button>
          <button onClick={() => handleTransform('flipY')} className="editor-btn" title="Flip Vertical"><FlipVertical size={14} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="editor-label">Adjustments</span>
        <button onClick={resetAll} className="text-[10px] text-primary hover:underline">Reset</button>
      </div>

      {SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-editor-text">{label}</label>
            <span className="text-[10px] text-muted-foreground">{adj[key]}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={adj[key]}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>
      ))}
    </div>
  );
}

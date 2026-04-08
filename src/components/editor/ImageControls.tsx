import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { RotateCw, FlipHorizontal, FlipVertical, Lock, Unlock } from 'lucide-react';
import SliderInput from './SliderInput';

type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  blur: number;
  grain: number;
  opacity: number;
};

const DEFAULT_ADJ: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  blur: 0,
  grain: 0,
  opacity: 100,
};

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1 },
  { key: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1 },
  { key: 'grain', label: 'Grain', min: 0, max: 100, step: 1 },
  { key: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1, unit: '%' },
];

export default function ImageControls() {
  const { fabricCanvas, pushHistory } = useEditorStore();
  const [imgObj, setImgObj] = useState<fabric.Image | null>(null);
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULT_ADJ });
  const [lockAspect, setLockAspect] = useState(true);
  const [imgScale, setImgScale] = useState(100);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;

    const onSelect = () => {
      const obj = fabricCanvas.getActiveObject();
      if (obj && obj.type === 'image') {
        const img = obj as fabric.Image;
        setImgObj(img);
        setAdj({ ...DEFAULT_ADJ });
        const locked = (img as any).lockUniScaling !== false;
        setLockAspect(locked);
        setImgScale(Math.round((img.scaleX || 1) * 100));
        setImgWidth(Math.round((img.width || 0) * (img.scaleX || 1)));
        setImgHeight(Math.round((img.height || 0) * (img.scaleY || 1)));
      } else {
        setImgObj(null);
      }
    };

    fabricCanvas.on('selection:created', onSelect);
    fabricCanvas.on('selection:updated', onSelect);
    fabricCanvas.on('selection:cleared', () => setImgObj(null));
    fabricCanvas.on('object:modified', onSelect);
    fabricCanvas.on('object:scaling', onSelect);
    onSelect();

    return () => {
      fabricCanvas.off('selection:created', onSelect);
      fabricCanvas.off('selection:updated', onSelect);
      fabricCanvas.off('selection:cleared');
      fabricCanvas.off('object:modified', onSelect);
      fabricCanvas.off('object:scaling', onSelect);
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
    if (newAdj.grain > 0) {
      filters.push(new fabric.Image.filters.Noise({ noise: newAdj.grain * 2.5 }) as any);
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
      case 'rotate': imgObj.rotate((imgObj.angle || 0) + 90); break;
      case 'flipX': imgObj.set({ flipX: !imgObj.flipX }); break;
      case 'flipY': imgObj.set({ flipY: !imgObj.flipY }); break;
    }
    fabricCanvas.renderAll();
    pushHistory();
  };

  const handleLockToggle = () => {
    if (!imgObj || !fabricCanvas) return;
    const next = !lockAspect;
    setLockAspect(next);
    imgObj.set({ lockUniScaling: next } as any);
    fabricCanvas.renderAll();
  };

  const handleScaleChange = (val: number) => {
    if (!imgObj || !fabricCanvas) return;
    setImgScale(val);
    const s = val / 100;
    imgObj.set({ scaleX: s, scaleY: s });
    setImgWidth(Math.round((imgObj.width || 0) * s));
    setImgHeight(Math.round((imgObj.height || 0) * s));
    fabricCanvas.renderAll();
  };

  const handleWidthChange = (val: number) => {
    if (!imgObj || !fabricCanvas) return;
    const s = val / (imgObj.width || 1);
    imgObj.set({ scaleX: s });
    if (lockAspect) {
      imgObj.set({ scaleY: s });
      setImgHeight(Math.round((imgObj.height || 0) * s));
    }
    setImgWidth(val);
    setImgScale(Math.round(s * 100));
    fabricCanvas.renderAll();
  };

  const handleHeightChange = (val: number) => {
    if (!imgObj || !fabricCanvas) return;
    const s = val / (imgObj.height || 1);
    imgObj.set({ scaleY: s });
    if (lockAspect) {
      imgObj.set({ scaleX: s });
      setImgWidth(Math.round((imgObj.width || 0) * s));
    }
    setImgHeight(val);
    setImgScale(Math.round(s * 100));
    fabricCanvas.renderAll();
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
      {/* Transform */}
      <div className="flex items-center justify-between">
        <span className="editor-label">Transform</span>
        <div className="flex gap-1">
          <button onClick={() => handleTransform('rotate')} className="editor-btn" title="Rotate 90°"><RotateCw size={14} /></button>
          <button onClick={() => handleTransform('flipX')} className="editor-btn" title="Flip Horizontal"><FlipHorizontal size={14} /></button>
          <button onClick={() => handleTransform('flipY')} className="editor-btn" title="Flip Vertical"><FlipVertical size={14} /></button>
        </div>
      </div>

      {/* Aspect ratio lock */}
      <div className="flex items-center justify-between">
        <span className="editor-label">Lock Aspect Ratio</span>
        <button onClick={handleLockToggle} className={`editor-btn ${lockAspect ? 'editor-btn-active' : ''}`}>
          {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>

      {/* Scale */}
      <SliderInput label="Scale" value={imgScale} min={5} max={300} step={1} unit="%" onChange={handleScaleChange} />

      {/* Width / Height */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="editor-label mb-1 block">Width</label>
          <input type="number" value={imgWidth} onChange={(e) => handleWidthChange(Number(e.target.value))} className="editor-input w-full text-center" />
        </div>
        <div>
          <label className="editor-label mb-1 block">Height</label>
          <input type="number" value={imgHeight} onChange={(e) => handleHeightChange(Number(e.target.value))} className="editor-input w-full text-center" />
        </div>
      </div>

      <div className="w-full h-px bg-editor-border" />

      {/* Adjustments */}
      <div className="flex items-center justify-between">
        <span className="editor-label">Adjustments</span>
        <button onClick={resetAll} className="text-[10px] text-primary hover:underline">Reset</button>
      </div>

      {SLIDERS.map(({ key, label, min, max, step, unit }) => (
        <SliderInput
          key={key}
          label={label}
          value={adj[key]}
          min={min}
          max={max}
          step={step}
          unit={unit}
          onChange={(v) => handleChange(key, v)}
        />
      ))}
    </div>
  );
}

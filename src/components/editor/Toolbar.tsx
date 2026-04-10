import { 
  MousePointer2, Type, Square, Image,
  Undo2, Redo2,
  Circle, Triangle, Minus, ImagePlus
} from 'lucide-react';
import { useEditorStore, EditorTool } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { useState, useRef } from 'react';

const tools: { id: EditorTool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'shape', icon: Square, label: 'Shape' },
  { id: 'image', icon: Image, label: 'Image' },
];

const shapes = [
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'line', icon: Minus, label: 'Line' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, fabricCanvas, canUndo, canRedo, undo, redo, format, pushHistory } = useEditorStore();
  const [showShapes, setShowShapes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 10);

  const handleToolClick = (tool: EditorTool) => {
    if (tool === 'text') {
      addText();
      setActiveTool('select');
    } else if (tool === 'shape') {
      setShowShapes(!showShapes);
    } else if (tool === 'image') {
      fileInputRef.current?.click();
    } else {
      setActiveTool(tool);
      setShowShapes(false);
    }
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const isMobile = window.innerWidth < 768;
    const text = new fabric.IText(isMobile ? 'Tap to edit' : 'Double click to edit', {
      left: format.width / 2 - 200,
      top: format.height / 2 - 30,
      fontFamily: 'Inter Tight',
      fontSize: 60,
      fill: '#ffffff',
      fontWeight: '700',
      textAlign: 'center',
    } as any);
    (text as any).id = generateId();
    (text as any).name = 'Text';
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    if (isMobile) {
      setTimeout(() => { (text as fabric.IText).enterEditing(); fabricCanvas.renderAll(); }, 100);
    }
  };

  const addShape = (type: string) => {
    if (!fabricCanvas) return;
    let shape: fabric.Object;
    const center = { left: format.width / 2 - 75, top: format.height / 2 - 75 };

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...center, width: 150, height: 150, fill: '#3b82f6', rx: 8, ry: 8 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...center, radius: 75, fill: '#8b5cf6' });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...center, width: 150, height: 150, fill: '#ef4444' });
        break;
      case 'line':
        shape = new fabric.Line([center.left, center.top + 75, center.left + 200, center.top + 75], {
          stroke: '#000000',
          strokeWidth: 3,
        });
        break;
      default:
        return;
    }

    (shape as any).id = generateId();
    (shape as any).name = type.charAt(0).toUpperCase() + type.slice(1);
    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
    setShowShapes(false);
    setActiveTool('select');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      fabric.Image.fromURL(imgUrl, (img) => {
        const scaleX = format.width / (img.width || 1);
        const scaleY = format.height / (img.height || 1);
        const scale = Math.max(scaleX, scaleY);
        const scaledW = (img.width || 0) * scale;
        const scaledH = (img.height || 0) * scale;
        img.set({
          left: (format.width - scaledW) / 2,
          top: (format.height - scaledH) / 2,
          scaleX: scale,
          scaleY: scale,
          lockUniScaling: true,
        });
        (img as any).id = generateId();
        (img as any).name = file.name.split('.')[0] || 'Image';
        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        setActiveTool('select');
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addLogo = () => {
    if (!fabricCanvas) return;
    fabric.loadSVGFromURL('/ktamizen-logo.svg', (objects, options) => {
      if (!objects || objects.length === 0) return;
      const logo = fabric.util.groupSVGElements(objects, options);
      logo.setCoords();
      const naturalW = logo.width || 252;
      const naturalH = logo.height || 252;
      const targetW = format.width * 0.18;
      const scale = targetW / naturalW;
      const scaledH = naturalH * scale;
      logo.set({
        scaleX: scale,
        scaleY: scale,
        left: (format.width - targetW) / 2,
        top: format.height - scaledH - format.height * 0.05,
        originX: 'left',
        originY: 'top',
        lockUniScaling: true,
      });
      (logo as any).id = Math.random().toString(36).slice(2);
      (logo as any).name = 'Ktamizen Logo';
      fabricCanvas.add(logo);
      fabricCanvas.bringToFront(logo);
      fabricCanvas.setActiveObject(logo);
      fabricCanvas.requestRenderAll();
      pushHistory();
    });
  };

  return (
    <div className="h-11 bg-editor-panel border-b border-editor-border flex items-center px-2 sm:px-3 gap-0.5 relative z-20">
      <div className="flex items-center gap-0.5 mr-2">
        <button onClick={undo} disabled={!canUndo()} className="editor-btn disabled:opacity-30" title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button onClick={redo} disabled={!canRedo()} className="editor-btn disabled:opacity-30" title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-editor-border mx-0.5" />

      <div className="flex items-center gap-0.5 relative">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`editor-btn px-2 py-1.5 text-xs gap-1 ${activeTool === tool.id ? 'editor-btn-active' : ''}`}
            title={tool.label}
          >
            <tool.icon size={16} />
            <span className="hidden sm:inline text-[11px]">{tool.label}</span>
          </button>
        ))}

        <button onClick={addLogo} className="editor-btn px-2 py-1.5 text-xs gap-1" title="Add Logo">
          <ImagePlus size={16} />
          <span className="hidden sm:inline text-[11px]">Logo</span>
        </button>

        {showShapes && (
          <div className="absolute top-full left-0 mt-1 bg-editor-panel border border-editor-border rounded-lg p-1 shadow-xl animate-fade-in z-50">
            {shapes.map((shape) => (
              <button key={shape.id} onClick={() => addShape(shape.id)} className="editor-btn w-full px-3 py-1.5 gap-2 text-xs justify-start">
                <shape.icon size={14} />
                {shape.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

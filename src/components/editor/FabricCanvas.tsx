import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores/editorStore';

export default function FabricCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    format,
    fabricCanvas,
    setFabricCanvas,
    activeSlideIndex,
    slides,
    updateSlide,
    setSelectedObjectIds,
    zoom,
    setZoom,
    pushHistory,
  } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: format.width,
      height: format.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    // Better selection styling
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#3b82f6',
      borderColor: '#3b82f6',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderDashArray: undefined,
      padding: 4,
      rotatingPointOffset: 30,
    });

    canvas.renderAll();
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setWidth(format.width);
    fabricCanvas.setHeight(format.height);
    fabricCanvas.renderAll();
    fitCanvasToContainer();
  }, [format, fabricCanvas]);

  const fitCanvasToContainer = useCallback(() => {
    if (!containerRef.current || !fabricCanvas) return;
    const container = containerRef.current;
    const padding = 60;
    const scaleX = (container.clientWidth - padding) / format.width;
    const scaleY = (container.clientHeight - padding) / format.height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    setZoom(newZoom);
  }, [fabricCanvas, format, setZoom]);

  useEffect(() => {
    fitCanvasToContainer();
    const handleResize = () => fitCanvasToContainer();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitCanvasToContainer]);

  const saveCurrentSlide = useCallback(() => {
    if (!fabricCanvas) return;
    const json = JSON.stringify(fabricCanvas.toJSON(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'visible', 'hasControls']));
    updateSlide(activeSlideIndex, { objects: json });
  }, [fabricCanvas, activeSlideIndex, updateSlide]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const slide = slides[activeSlideIndex];
    if (!slide) return;

    try {
      const data = JSON.parse(slide.objects);
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
      });
    } catch {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
    }
  }, [activeSlideIndex, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const onSelectionCreated = (e: fabric.IEvent) => {
      const selected = (e as any).selected || [];
      setSelectedObjectIds(selected.map((o: fabric.Object) => (o as any).id || ''));
    };

    const onSelectionUpdated = (e: fabric.IEvent) => {
      const selected = (e as any).selected || [];
      setSelectedObjectIds(selected.map((o: fabric.Object) => (o as any).id || ''));
    };

    const onSelectionCleared = () => {
      setSelectedObjectIds([]);
    };

    const onObjectModified = () => {
      saveCurrentSlide();
      pushHistory();
    };

    fabricCanvas.on('selection:created', onSelectionCreated);
    fabricCanvas.on('selection:updated', onSelectionUpdated);
    fabricCanvas.on('selection:cleared', onSelectionCleared);
    fabricCanvas.on('object:modified', onObjectModified);
    fabricCanvas.on('object:added', onObjectModified);

    return () => {
      fabricCanvas.off('selection:created', onSelectionCreated);
      fabricCanvas.off('selection:updated', onSelectionUpdated);
      fabricCanvas.off('selection:cleared', onSelectionCleared);
      fabricCanvas.off('object:modified', onObjectModified);
      fabricCanvas.off('object:added', onObjectModified);
    };
  }, [fabricCanvas, saveCurrentSlide, pushHistory, setSelectedObjectIds]);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;
  }, [fabricCanvas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fabricCanvas.getActiveObjects();
        activeObjects.forEach((obj) => fabricCanvas.remove(obj));
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        saveCurrentSlide();
        pushHistory();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const activeObj = fabricCanvas.getActiveObject();
        if (activeObj) {
          activeObj.clone((cloned: fabric.Object) => {
            (window as any).__clipboard = cloned;
          });
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const clipboard = (window as any).__clipboard;
        if (clipboard) {
          clipboard.clone((cloned: fabric.Object) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20, id: Math.random().toString(36).substring(2, 10) } as any);
            fabricCanvas.add(cloned);
            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.renderAll();
            saveCurrentSlide();
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, saveCurrentSlide, pushHistory]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-editor-bg overflow-hidden relative">
      <div
        className="relative shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-editor-panel/90 backdrop-blur-sm border border-editor-border rounded-lg px-3 py-1.5">
        <button onClick={() => setZoom(zoom - 0.1)} className="editor-btn text-xs">−</button>
        <span className="text-xs text-editor-text min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.1)} className="editor-btn text-xs">+</button>
        <button onClick={fitCanvasToContainer} className="editor-btn text-[10px] px-2">Fit</button>
      </div>
    </div>
  );
}

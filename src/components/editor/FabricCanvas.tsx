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
    setInspectorTab,
    setMobilePanel,
    setTextInputValue,
  } = useEditorStore();

  const lastTouchDist = useRef<number>(0);
  const lastTouchAngle = useRef<number>(0);
  const isPinching = useRef(false);

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

    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#3b82f6',
      borderColor: '#3b82f6',
      cornerSize: 10,
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
    const json = JSON.stringify(fabricCanvas.toJSON(['id', 'name', 'selectable', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'visible', 'hasControls', 'lockUniScaling']));
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

  // Selection events & auto-switch inspector
  useEffect(() => {
    if (!fabricCanvas) return;

    const onSelectionCreated = (e: fabric.IEvent) => {
      const selected = (e as any).selected || [];
      setSelectedObjectIds(selected.map((o: fabric.Object) => (o as any).id || ''));
      autoSwitchPanel(selected[0]);
    };

    const onSelectionUpdated = (e: fabric.IEvent) => {
      const selected = (e as any).selected || [];
      setSelectedObjectIds(selected.map((o: fabric.Object) => (o as any).id || ''));
      autoSwitchPanel(selected[0]);
    };

    const onSelectionCleared = () => {
      setSelectedObjectIds([]);
      setTextInputValue('');
    };

    const onObjectModified = () => {
      saveCurrentSlide();
      pushHistory();
    };

    const onTextChanged = () => {
      const obj = fabricCanvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
        setTextInputValue((obj as fabric.IText).text || '');
      }
      saveCurrentSlide();
    };

    fabricCanvas.on('selection:created', onSelectionCreated);
    fabricCanvas.on('selection:updated', onSelectionUpdated);
    fabricCanvas.on('selection:cleared', onSelectionCleared);
    fabricCanvas.on('object:modified', onObjectModified);
    fabricCanvas.on('object:added', onObjectModified);
    fabricCanvas.on('text:changed', onTextChanged);

    return () => {
      fabricCanvas.off('selection:created', onSelectionCreated);
      fabricCanvas.off('selection:updated', onSelectionUpdated);
      fabricCanvas.off('selection:cleared', onSelectionCleared);
      fabricCanvas.off('object:modified', onObjectModified);
      fabricCanvas.off('object:added', onObjectModified);
      fabricCanvas.off('text:changed', onTextChanged);
    };
  }, [fabricCanvas, saveCurrentSlide, pushHistory, setSelectedObjectIds, setInspectorTab, setMobilePanel, setTextInputValue]);

  const autoSwitchPanel = (obj?: fabric.Object) => {
    if (!obj) return;
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      setInspectorTab('text');
      setTextInputValue((obj as fabric.IText).text || '');
    } else if (obj.type === 'image') {
      setInspectorTab('image');
    } else {
      setInspectorTab('design');
    }
  };

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;
  }, [fabricCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fabricCanvas.getActiveObjects();
        activeObjects.forEach((obj: fabric.Object) => fabricCanvas.remove(obj));
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

  // Touch gestures: pinch to zoom canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (t1: Touch, t2: Touch) => {
      return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
        lastTouchDist.current = getDistance(e.touches[0], e.touches[1]);
        lastTouchAngle.current = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching.current) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const scale = dist / lastTouchDist.current;
        const currentZoom = useEditorStore.getState().zoom;
        useEditorStore.getState().setZoom(currentZoom * scale);
        lastTouchDist.current = dist;
      }
    };

    const onTouchEnd = () => {
      isPinching.current = false;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = useEditorStore.getState().zoom;
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        useEditorStore.getState().setZoom(currentZoom + delta);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-editor-bg overflow-hidden relative touch-none">
      <div
        className="relative shadow-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-editor-panel/90 backdrop-blur-sm border border-editor-border rounded-full px-3 py-1.5 shadow-lg">
        <button onClick={() => setZoom(zoom - 0.1)} className="editor-btn text-xs w-7 h-7 rounded-full">−</button>
        <span className="text-[11px] text-editor-text-bright min-w-[3rem] text-center font-medium">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.1)} className="editor-btn text-xs w-7 h-7 rounded-full">+</button>
        <div className="w-px h-4 bg-editor-border" />
        <button onClick={fitCanvasToContainer} className="editor-btn text-[10px] px-2.5 h-7 rounded-full">Fit</button>
      </div>
    </div>
  );
}

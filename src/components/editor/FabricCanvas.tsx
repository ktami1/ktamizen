import { useEffect, useRef, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores/editorStore';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';

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
  const isPinching = useRef(false);
  const autoSaveInterval = useRef<ReturnType<typeof setInterval>>();
  const [objectCount, setObjectCount] = useState(0);

  // Init canvas
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

    const isMobile = window.innerWidth < 768;
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#c8a96e',
      cornerStrokeColor: '#0c0c0c',
      borderColor: '#c8a96e',
      cornerSize: isMobile ? 20 : 10,
      cornerStyle: 'circle',
      borderDashArray: undefined,
      padding: isMobile ? 10 : 4,
      rotatingPointOffset: isMobile ? 44 : 30,
    });

    canvas.renderAll();
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  // Format change
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
    const isMobile = window.innerWidth < 768;
    const targetW = isMobile
      ? container.clientWidth * 0.90
      : container.clientWidth - 60;
    const scaleByW = targetW / format.width;
    const maxH = container.clientHeight - (isMobile ? 20 : 60);
    const scaleByH = maxH / format.height;
    const newZoom = Math.min(scaleByW, scaleByH, isMobile ? 999 : 1);
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

  // Load slide
  useEffect(() => {
    if (!fabricCanvas) return;
    const slide = slides[activeSlideIndex];
    if (!slide) return;

    try {
      const data = JSON.parse(slide.objects);
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
        setObjectCount(fabricCanvas.getObjects().length);
      });
    } catch {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      setObjectCount(0);
    }
  }, [activeSlideIndex, fabricCanvas]);

  const autoSwitchPanel = (obj?: fabric.Object) => {
    if (!obj) return;
    const isMobile = window.innerWidth < 768;
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      setInspectorTab('text');
      setTextInputValue((obj as fabric.IText).text || '');
      if (isMobile) setMobilePanel('text');
    } else if (obj.type === 'image') {
      setInspectorTab('image');
      if (isMobile) setMobilePanel('image');
    } else {
      setInspectorTab('design');
    }
  };

  // Selection events
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
      setObjectCount(fabricCanvas.getObjects().length);
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
    fabricCanvas.on('object:removed', () => setObjectCount(fabricCanvas.getObjects().length));
    fabricCanvas.on('text:changed', onTextChanged);

    return () => {
      fabricCanvas.off('selection:created', onSelectionCreated);
      fabricCanvas.off('selection:updated', onSelectionUpdated);
      fabricCanvas.off('selection:cleared', onSelectionCleared);
      fabricCanvas.off('object:modified', onObjectModified);
      fabricCanvas.off('object:added', onObjectModified);
      fabricCanvas.off('object:removed');
      fabricCanvas.off('text:changed', onTextChanged);
    };
  }, [fabricCanvas, saveCurrentSlide, pushHistory, setSelectedObjectIds, setInspectorTab, setMobilePanel, setTextInputValue]);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;
  }, [fabricCanvas]);

  // Single tap = enter text edit mode on mobile
  useEffect(() => {
    if (!fabricCanvas || window.innerWidth >= 768) return;
    const onDown = () => {
      const obj = fabricCanvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'textbox')) {
        const t = obj as fabric.IText;
        if (!t.isEditing) setTimeout(() => { t.enterEditing(); fabricCanvas.renderAll(); }, 80);
      }
    };
    fabricCanvas.on('mouse:down', onDown);
    return () => { fabricCanvas.off('mouse:down', onDown); };
  }, [fabricCanvas]);

  // Auto-save every 30s
  useEffect(() => {
    autoSaveInterval.current = setInterval(() => {
      if (!fabricCanvas) return;
      const state = useEditorStore.getState();
      const data = {
        slides: state.slides,
        activeSlideIndex: state.activeSlideIndex,
        format: state.format,
        projectName: state.projectName,
      };
      localStorage.setItem('studio-autosave', JSON.stringify(data));
      toast.success('Auto-saved', { duration: 1500 });
    }, 30000);

    return () => { if (autoSaveInterval.current) clearInterval(autoSaveInterval.current); };
  }, [fabricCanvas]);

  // Comprehensive keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      
      const activeObj = fabricCanvas.getActiveObject();
      const isEditingText = activeObj && (activeObj as any).isEditing;

      const mod = e.metaKey || e.ctrlKey;

      if (e.key === '?' && !isInputField) {
        e.preventDefault();
        useEditorStore.getState().setShowShortcuts(true);
        return;
      }

      if (e.key === 'Escape') {
        if (isEditingText) {
          (activeObj as fabric.IText).exitEditing();
          fabricCanvas.renderAll();
        } else {
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
        }
        return;
      }

      if (isInputField && !mod) return;
      if (isEditingText && !mod) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingText && !isInputField) {
        const activeObjects = fabricCanvas.getActiveObjects();
        activeObjects.forEach((obj: fabric.Object) => fabricCanvas.remove(obj));
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        saveCurrentSlide();
        pushHistory();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditingText && !isInputField) {
        e.preventDefault();
        const obj = fabricCanvas.getActiveObject();
        if (!obj) return;

        if (mod) {
          const bound = obj.getBoundingRect();
          switch (e.key) {
            case 'ArrowLeft': obj.set({ left: (obj.left || 0) - bound.left }); break;
            case 'ArrowRight': obj.set({ left: (obj.left || 0) + (format.width - bound.left - bound.width) }); break;
            case 'ArrowUp': obj.set({ top: (obj.top || 0) - bound.top }); break;
            case 'ArrowDown': obj.set({ top: (obj.top || 0) + (format.height - bound.top - bound.height) }); break;
          }
        } else {
          const step = e.shiftKey ? 10 : 1;
          switch (e.key) {
            case 'ArrowLeft': obj.set({ left: (obj.left || 0) - step }); break;
            case 'ArrowRight': obj.set({ left: (obj.left || 0) + step }); break;
            case 'ArrowUp': obj.set({ top: (obj.top || 0) - step }); break;
            case 'ArrowDown': obj.set({ top: (obj.top || 0) + step }); break;
          }
        }
        obj.setCoords();
        fabricCanvas.renderAll();
        saveCurrentSlide();
        pushHistory();
        return;
      }

      if (!mod) return;

      e.preventDefault();

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
        return;
      }
      if (e.key === 'y') {
        useEditorStore.getState().redo();
        return;
      }

      if (e.key === 'a') {
        fabricCanvas.discardActiveObject();
        const allObjs = fabricCanvas.getObjects();
        if (allObjs.length > 0) {
          const sel = new fabric.ActiveSelection(allObjs, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
          fabricCanvas.renderAll();
        }
        return;
      }

      if (e.key === 'c' && !e.shiftKey) {
        if (activeObj) {
          activeObj.clone((cloned: fabric.Object) => { (window as any).__clipboard = cloned; });
        }
        return;
      }

      if (e.key === 'v') {
        const clipboard = (window as any).__clipboard;
        if (clipboard) {
          clipboard.clone((cloned: fabric.Object) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            (cloned as any).id = Math.random().toString(36).substring(2, 10);
            fabricCanvas.add(cloned);
            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.renderAll();
            saveCurrentSlide();
            (window as any).__clipboard = cloned;
          });
        }
        return;
      }

      if (e.key === 'd') {
        if (activeObj) {
          activeObj.clone((cloned: fabric.Object) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            (cloned as any).id = Math.random().toString(36).substring(2, 10);
            (cloned as any).name = ((activeObj as any).name || 'Object') + ' copy';
            fabricCanvas.add(cloned);
            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.renderAll();
            saveCurrentSlide();
            pushHistory();
          });
        }
        return;
      }

      if (e.key === 'g') {
        if (activeObj && activeObj.type === 'activeSelection') {
          (activeObj as fabric.ActiveSelection).toGroup();
          fabricCanvas.renderAll();
          pushHistory();
        }
        return;
      }

      if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'textbox')) {
        const t = activeObj as fabric.IText;
        if (e.key === 'b') {
          t.set({ fontWeight: t.fontWeight === '700' || t.fontWeight === 'bold' ? '400' : '700' });
          fabricCanvas.renderAll();
          pushHistory();
          return;
        }
        if (e.key === 'i') {
          t.set({ fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' });
          fabricCanvas.renderAll();
          pushHistory();
          return;
        }
        if (e.key === 'u') {
          t.set({ underline: !t.underline } as any);
          fabricCanvas.renderAll();
          pushHistory();
          return;
        }
      }

      if (e.key === ']') {
        if (activeObj) {
          if (e.shiftKey) fabricCanvas.bringToFront(activeObj);
          else fabricCanvas.bringForward(activeObj);
          fabricCanvas.renderAll();
          pushHistory();
        }
        return;
      }
      if (e.key === '[') {
        if (activeObj) {
          if (e.shiftKey) fabricCanvas.sendToBack(activeObj);
          else fabricCanvas.sendBackwards(activeObj);
          fabricCanvas.renderAll();
          pushHistory();
        }
        return;
      }

      if (e.key === 'l') {
        if (activeObj) {
          const lock = !activeObj.lockMovementX;
          activeObj.set({
            lockMovementX: lock, lockMovementY: lock, lockRotation: lock,
            lockScalingX: lock, lockScalingY: lock, hasControls: !lock, selectable: !lock,
          });
          fabricCanvas.renderAll();
          toast(lock ? 'Layer locked' : 'Layer unlocked', { duration: 1500 });
        }
        return;
      }

      if (e.key === 'h') {
        if (activeObj) {
          activeObj.set({ flipX: !activeObj.flipX });
          fabricCanvas.renderAll();
          pushHistory();
        }
        return;
      }

      if (e.key === 'j') {
        if (activeObj) {
          activeObj.set({ flipY: !activeObj.flipY });
          fabricCanvas.renderAll();
          pushHistory();
        }
        return;
      }

      if (e.key === '0') { fitCanvasToContainer(); return; }
      if (e.key === '1') { setZoom(1); return; }
      if (e.key === '2') { setZoom(2); return; }
    };

    const handleKeyDownF2 = (e: KeyboardEvent) => {
      if (e.key === 'F2' && fabricCanvas) {
        const obj = fabricCanvas.getActiveObject();
        if (obj) {
          const name = prompt('Rename layer:', (obj as any).name || 'Object');
          if (name !== null) {
            (obj as any).name = name;
            fabricCanvas.renderAll();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDownF2);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDownF2);
    };
  }, [fabricCanvas, saveCurrentSlide, pushHistory, format, fitCanvasToContainer, setZoom]);

  // Touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (t1: Touch, t2: Touch) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
        lastTouchDist.current = getDistance(e.touches[0], e.touches[1]);
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

    const onTouchEnd = () => { isPinching.current = false; };

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

  const handleEmptyCanvasTap = () => {
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-editor-bg overflow-hidden relative" style={{ touchAction: 'none' }}>
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

      {/* Empty canvas overlay */}
      {fabricCanvas && objectCount === 0 && (
        <div
          onClick={handleEmptyCanvasTap}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 12, background: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImagePlus size={24} color="#c8a96e" />
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Aggiungi immagine</span>
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-editor-panel/90 backdrop-blur-sm border border-editor-border rounded-full px-3 py-1.5 shadow-lg">
        <button onClick={() => setZoom(zoom - 0.1)} className="editor-btn text-xs w-7 h-7 rounded-full" title="Zoom Out">−</button>
        <span className="text-[11px] text-editor-text-bright min-w-[3rem] text-center font-medium">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.1)} className="editor-btn text-xs w-7 h-7 rounded-full" title="Zoom In">+</button>
        <div className="w-px h-4 bg-editor-border" />
        <button onClick={fitCanvasToContainer} className="editor-btn text-[10px] px-2.5 h-7 rounded-full" title="Fit to Screen (Ctrl+0)">Fit</button>
      </div>
    </div>
  );
}

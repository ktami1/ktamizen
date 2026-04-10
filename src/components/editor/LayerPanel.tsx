import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { fabric } from 'fabric';

type LayerItem = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  obj: fabric.Object;
  zIndex: number;
};

export default function LayerPanel() {
  const { fabricCanvas, pushHistory } = useEditorStore();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const refreshLayers = () => {
    if (!fabricCanvas) return;
    const objs = fabricCanvas.getObjects();
    const items: LayerItem[] = objs.map((obj, i) => ({
      id: (obj as any).id || `layer-${i}`,
      name: (obj as any).name || obj.type || 'Object',
      type: obj.type || 'unknown',
      visible: obj.visible !== false,
      locked: !!(obj.lockMovementX && obj.lockMovementY),
      obj,
      zIndex: i,
    }));
    setLayers(items.reverse());
  };

  useEffect(() => {
    if (!fabricCanvas) return;
    refreshLayers();

    const handler = () => refreshLayers();
    fabricCanvas.on('object:added', handler);
    fabricCanvas.on('object:removed', handler);
    fabricCanvas.on('object:modified', handler);
    fabricCanvas.on('selection:created', () => {
      const obj = fabricCanvas.getActiveObject();
      setSelectedId((obj as any)?.id || null);
    });
    fabricCanvas.on('selection:updated', () => {
      const obj = fabricCanvas.getActiveObject();
      setSelectedId((obj as any)?.id || null);
    });
    fabricCanvas.on('selection:cleared', () => setSelectedId(null));

    return () => {
      fabricCanvas.off('object:added', handler);
      fabricCanvas.off('object:removed', handler);
      fabricCanvas.off('object:modified', handler);
    };
  }, [fabricCanvas]);

  const selectLayer = (layer: LayerItem) => {
    if (!fabricCanvas) return;
    fabricCanvas.setActiveObject(layer.obj);
    fabricCanvas.renderAll();
    setSelectedId(layer.id);
  };

  const toggleVisibility = (layer: LayerItem) => {
    layer.obj.set({ visible: !layer.visible });
    fabricCanvas?.renderAll();
    refreshLayers();
    pushHistory();
  };

  const toggleLock = (layer: LayerItem) => {
    const lock = !layer.locked;
    layer.obj.set({
      lockMovementX: lock,
      lockMovementY: lock,
      lockRotation: lock,
      lockScalingX: lock,
      lockScalingY: lock,
      hasControls: !lock,
      selectable: !lock,
    });
    fabricCanvas?.renderAll();
    refreshLayers();
  };

  const deleteLayer = (layer: LayerItem) => {
    fabricCanvas?.remove(layer.obj);
    fabricCanvas?.renderAll();
    pushHistory();
  };

  const duplicateLayer = (layer: LayerItem) => {
    layer.obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      (cloned as any).id = Math.random().toString(36).substring(2, 10);
      (cloned as any).name = layer.name + ' copy';
      fabricCanvas?.add(cloned);
      fabricCanvas?.renderAll();
      pushHistory();
    });
  };

  const moveLayer = (layer: LayerItem, direction: 'up' | 'down') => {
    if (!fabricCanvas) return;
    if (direction === 'up') {
      fabricCanvas.bringForward(layer.obj);
    } else {
      fabricCanvas.sendBackwards(layer.obj);
    }
    fabricCanvas.renderAll();
    refreshLayers();
    pushHistory();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    if (dragRef.current !== null && dropIndex !== null && dragRef.current !== dropIndex) {
      reorderByDrag(dragRef.current, dropIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
    dragRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  };

  const reorderByDrag = (fromDisplayIndex: number, toDisplayIndex: number) => {
    if (!fabricCanvas) return;
    const objs = fabricCanvas.getObjects();
    const totalCount = objs.length;
    const fromCanvasIndex = totalCount - 1 - fromDisplayIndex;
    const toCanvasIndex = totalCount - 1 - toDisplayIndex;
    
    const obj = objs[fromCanvasIndex];
    if (!obj) return;

    fabricCanvas.moveTo(obj, toCanvasIndex);
    fabricCanvas.renderAll();
    refreshLayers();
    pushHistory();
  };

  return (
    <div className="w-full md:w-56 bg-editor-panel md:border-r border-editor-border flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-editor-border">
        <span className="editor-label">Layers</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-6">No layers yet</div>
        )}
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onClick={() => selectLayer(layer)}
            className={`flex items-center gap-1.5 px-2 py-2 min-h-[44px] border-b border-editor-border/50 cursor-pointer transition-colors group
              ${selectedId === layer.id ? 'bg-primary/10' : 'hover:bg-editor-hover'}
              ${dropIndex === index && dragIndex !== index ? 'border-t-2 border-t-primary' : ''}`}
          >
            <GripVertical size={12} className="text-muted-foreground/50 flex-shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-editor-text-bright truncate">{layer.name}</div>
              <div className="text-[9px] text-muted-foreground capitalize">{layer.type}</div>
            </div>
            {/* Mobile: always visible actions */}
            <div className="flex gap-0.5 md:hidden">
              <button onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'up'); }} className="editor-btn p-0.5" title="Bring Forward"><ChevronUp size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'down'); }} className="editor-btn p-0.5" title="Send Backward"><ChevronDown size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer); }} className="editor-btn p-0.5" title={layer.visible ? 'Hide' : 'Show'}>
                {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleLock(layer); }} className="editor-btn p-0.5" title={layer.locked ? 'Unlock' : 'Lock'}>
                {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer); }} className="editor-btn p-0.5" title="Duplicate"><Copy size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer); }} className="editor-btn p-0.5 hover:text-destructive" title="Delete"><Trash2 size={11} /></button>
            </div>
            {/* Desktop: hover only */}
            <div className="hidden md:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'up'); }} className="editor-btn p-0.5" title="Bring Forward"><ChevronUp size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'down'); }} className="editor-btn p-0.5" title="Send Backward"><ChevronDown size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer); }} className="editor-btn p-0.5" title={layer.visible ? 'Hide' : 'Show'}>
                {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleLock(layer); }} className="editor-btn p-0.5" title={layer.locked ? 'Unlock' : 'Lock'}>
                {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer); }} className="editor-btn p-0.5" title="Duplicate"><Copy size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer); }} className="editor-btn p-0.5 hover:text-destructive" title="Delete"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

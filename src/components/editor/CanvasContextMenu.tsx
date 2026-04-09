import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import {
  Copy, Clipboard, ClipboardPaste, Trash2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  Lock, Unlock, Paintbrush, PaintBucket, Scissors
} from 'lucide-react';

type MenuPosition = { x: number; y: number };

export default function CanvasContextMenu() {
  const { fabricCanvas, pushHistory } = useEditorStore();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    const canvasEl = fabricCanvas.getElement();
    const wrapper = canvasEl.parentElement;
    if (!wrapper) return;

    const handler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const obj = fabricCanvas.getActiveObject();
      setHasSelection(!!obj);
      setHasClipboard(!!(window as any).__clipboard);
      setIsLocked(!!obj?.lockMovementX);
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    wrapper.addEventListener('contextmenu', handler);
    const closeHandler = () => setVisible(false);
    window.addEventListener('click', closeHandler);
    window.addEventListener('keydown', closeHandler);
    
    return () => {
      wrapper.removeEventListener('contextmenu', handler);
      window.removeEventListener('click', closeHandler);
      window.removeEventListener('keydown', closeHandler);
    };
  }, [fabricCanvas]);

  const exec = (fn: () => void) => { fn(); setVisible(false); };

  const copyObj = () => {
    const obj = fabricCanvas?.getActiveObject();
    if (obj) obj.clone((c: fabric.Object) => { (window as any).__clipboard = c; });
  };

  const cutObj = () => {
    copyObj();
    const obj = fabricCanvas?.getActiveObject();
    if (obj && fabricCanvas) {
      fabricCanvas.remove(obj);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      pushHistory();
    }
  };

  const pasteObj = () => {
    const clip = (window as any).__clipboard;
    if (!clip || !fabricCanvas) return;
    clip.clone((cloned: fabric.Object) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      (cloned as any).id = Math.random().toString(36).substring(2, 10);
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      pushHistory();
      (window as any).__clipboard = cloned;
    });
  };

  const duplicateObj = () => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj || !fabricCanvas) return;
    obj.clone((cloned: fabric.Object) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      (cloned as any).id = Math.random().toString(36).substring(2, 10);
      (cloned as any).name = ((obj as any).name || 'Object') + ' copy';
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.renderAll();
      pushHistory();
    });
  };

  const deleteObj = () => {
    if (!fabricCanvas) return;
    const objs = fabricCanvas.getActiveObjects();
    objs.forEach(o => fabricCanvas.remove(o));
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    pushHistory();
  };

  const bringForward = () => { const o = fabricCanvas?.getActiveObject(); if (o) { fabricCanvas?.bringForward(o); fabricCanvas?.renderAll(); pushHistory(); } };
  const sendBackward = () => { const o = fabricCanvas?.getActiveObject(); if (o) { fabricCanvas?.sendBackwards(o); fabricCanvas?.renderAll(); pushHistory(); } };
  const bringToFront = () => { const o = fabricCanvas?.getActiveObject(); if (o) { fabricCanvas?.bringToFront(o); fabricCanvas?.renderAll(); pushHistory(); } };
  const sendToBack = () => { const o = fabricCanvas?.getActiveObject(); if (o) { fabricCanvas?.sendToBack(o); fabricCanvas?.renderAll(); pushHistory(); } };

  const toggleLock = () => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return;
    const lock = !obj.lockMovementX;
    obj.set({
      lockMovementX: lock, lockMovementY: lock, lockRotation: lock,
      lockScalingX: lock, lockScalingY: lock, hasControls: !lock, selectable: !lock,
    });
    fabricCanvas?.renderAll();
  };

  const copyStyle = () => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return;
    (window as any).__styleClipboard = {
      fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth, opacity: obj.opacity,
      fontFamily: (obj as any).fontFamily, fontSize: (obj as any).fontSize, fontWeight: (obj as any).fontWeight,
      fontStyle: (obj as any).fontStyle, charSpacing: (obj as any).charSpacing, lineHeight: (obj as any).lineHeight,
      shadow: obj.shadow,
    };
  };

  const pasteStyle = () => {
    const style = (window as any).__styleClipboard;
    const obj = fabricCanvas?.getActiveObject();
    if (!style || !obj) return;
    const props: Record<string, any> = {};
    if (style.fill !== undefined) props.fill = style.fill;
    if (style.stroke !== undefined) props.stroke = style.stroke;
    if (style.strokeWidth !== undefined) props.strokeWidth = style.strokeWidth;
    if (style.opacity !== undefined) props.opacity = style.opacity;
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      if (style.fontFamily) props.fontFamily = style.fontFamily;
      if (style.fontSize) props.fontSize = style.fontSize;
      if (style.fontWeight) props.fontWeight = style.fontWeight;
      if (style.fontStyle) props.fontStyle = style.fontStyle;
      if (style.charSpacing !== undefined) props.charSpacing = style.charSpacing;
      if (style.lineHeight !== undefined) props.lineHeight = style.lineHeight;
    }
    obj.set(props);
    fabricCanvas?.renderAll();
    pushHistory();
  };

  if (!visible) return null;

  const MenuItem = ({ icon: Icon, label, onClick, disabled, danger }: { icon: any; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) => (
    <button
      onClick={() => exec(onClick)}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors text-left
        ${danger ? 'text-destructive hover:bg-destructive/10' : 'text-editor-text-bright hover:bg-editor-hover'}
        ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <Icon size={13} />
      {label}
    </button>
  );

  return (
    <div
      className="fixed z-[200] bg-editor-panel border border-editor-border rounded-lg py-1 shadow-2xl min-w-[180px] backdrop-blur-sm"
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem icon={Scissors} label="Cut" onClick={cutObj} disabled={!hasSelection} />
      <MenuItem icon={Copy} label="Copy" onClick={copyObj} disabled={!hasSelection} />
      <MenuItem icon={ClipboardPaste} label="Paste" onClick={pasteObj} disabled={!hasClipboard} />
      <MenuItem icon={Clipboard} label="Duplicate" onClick={duplicateObj} disabled={!hasSelection} />
      <div className="h-px bg-editor-border my-1" />
      <MenuItem icon={ChevronsUp} label="Bring to Front" onClick={bringToFront} disabled={!hasSelection} />
      <MenuItem icon={ChevronUp} label="Bring Forward" onClick={bringForward} disabled={!hasSelection} />
      <MenuItem icon={ChevronDown} label="Send Backward" onClick={sendBackward} disabled={!hasSelection} />
      <MenuItem icon={ChevronsDown} label="Send to Back" onClick={sendToBack} disabled={!hasSelection} />
      <div className="h-px bg-editor-border my-1" />
      <MenuItem icon={isLocked ? Unlock : Lock} label={isLocked ? 'Unlock' : 'Lock'} onClick={toggleLock} disabled={!hasSelection} />
      <MenuItem icon={Paintbrush} label="Copy Style" onClick={copyStyle} disabled={!hasSelection} />
      <MenuItem icon={PaintBucket} label="Paste Style" onClick={pasteStyle} disabled={!hasSelection} />
      <div className="h-px bg-editor-border my-1" />
      <MenuItem icon={Trash2} label="Delete" onClick={deleteObj} disabled={!hasSelection} danger />
    </div>
  );
}

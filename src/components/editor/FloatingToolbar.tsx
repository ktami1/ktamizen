import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { Bold, Italic, Underline, Minus, Plus, Trash2, Copy, FlipHorizontal, FlipVertical, Crop } from 'lucide-react';

type ToolbarPosition = { x: number; y: number; belowElement: boolean };

export default function FloatingToolbar() {
  const { fabricCanvas, pushHistory, zoom } = useEditorStore();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition>({ x: 0, y: 0, belowElement: false });
  const [objType, setObjType] = useState<string>('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(40);
  const [fillColor, setFillColor] = useState('#000000');
  const [opacity, setOpacity] = useState(100);

  const updatePosition = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { setVisible(false); return; }

    const bound = obj.getBoundingRect();
    const canvasEl = fabricCanvas.getElement();
    const canvasRect = canvasEl.getBoundingClientRect();

    const objCenterX = canvasRect.left + bound.left * zoom + (bound.width * zoom) / 2;
    const objTopY = canvasRect.top + bound.top * zoom;
    const objBottomY = canvasRect.top + (bound.top + bound.height) * zoom;

    const isMobile = window.innerWidth < 768;
    const belowElement = isMobile || objTopY < 80;

    setPosition({
      x: objCenterX,
      y: belowElement ? objBottomY + 12 : objTopY - 12,
      belowElement,
    });
  }, [fabricCanvas, zoom]);

  const syncState = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { setVisible(false); return; }

    // Don't show when editing text inline
    if ((obj as any).isEditing) { setVisible(false); return; }

    setVisible(true);
    setObjType(obj.type || '');
    setOpacity(Math.round((obj.opacity || 1) * 100));

    if (obj.type === 'i-text' || obj.type === 'textbox') {
      const t = obj as fabric.IText;
      setIsBold(t.fontWeight === 'bold' || t.fontWeight === '700');
      setIsItalic(t.fontStyle === 'italic');
      setIsUnderline(t.underline === true);
      setFontSize(t.fontSize || 40);
      setFillColor((t.fill as string) || '#000000');
    } else {
      setFillColor(typeof obj.fill === 'string' ? obj.fill : '#000000');
    }

    updatePosition();
  }, [fabricCanvas, updatePosition]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.on('selection:created', syncState);
    fabricCanvas.on('selection:updated', syncState);
    fabricCanvas.on('selection:cleared', () => setVisible(false));
    fabricCanvas.on('object:moving', updatePosition);
    fabricCanvas.on('object:scaling', updatePosition);
    fabricCanvas.on('object:rotating', updatePosition);
    fabricCanvas.on('object:modified', syncState);
    fabricCanvas.on('text:editing:entered', () => setVisible(false));
    fabricCanvas.on('text:editing:exited', syncState);

    return () => {
      fabricCanvas.off('selection:created', syncState);
      fabricCanvas.off('selection:updated', syncState);
      fabricCanvas.off('selection:cleared');
      fabricCanvas.off('object:moving', updatePosition);
      fabricCanvas.off('object:scaling', updatePosition);
      fabricCanvas.off('object:rotating', updatePosition);
      fabricCanvas.off('object:modified', syncState);
      fabricCanvas.off('text:editing:entered');
      fabricCanvas.off('text:editing:exited', syncState);
    };
  }, [fabricCanvas, syncState, updatePosition]);

  const apply = (props: Record<string, any>) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set(props);
    fabricCanvas.renderAll();
    pushHistory();
  };

  const duplicate = () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
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

  if (!visible) return null;

  const isText = objType === 'i-text' || objType === 'textbox';
  const isImage = objType === 'image';

  return (
    <div
      className="fixed z-[100] pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: `translateX(-50%) ${position.belowElement ? '' : 'translateY(-100%)'}`,
      }}
    >
      <div className="flex items-center gap-0.5 bg-editor-panel border border-editor-border rounded-lg px-1.5 py-1 shadow-2xl backdrop-blur-sm">
        {isText && (
          <>
            <button
              onClick={() => { const v = isBold ? '400' : '700'; setIsBold(!isBold); apply({ fontWeight: v }); }}
              className={`editor-btn p-1.5 min-w-[32px] min-h-[32px] ${isBold ? 'editor-btn-active' : ''}`}
              title="Bold (Ctrl+B)"
            ><Bold size={14} /></button>
            <button
              onClick={() => { const v = isItalic ? 'normal' : 'italic'; setIsItalic(!isItalic); apply({ fontStyle: v }); }}
              className={`editor-btn p-1.5 min-w-[32px] min-h-[32px] ${isItalic ? 'editor-btn-active' : ''}`}
              title="Italic (Ctrl+I)"
            ><Italic size={14} /></button>
            <button
              onClick={() => { setIsUnderline(!isUnderline); apply({ underline: !isUnderline }); }}
              className={`editor-btn p-1.5 min-w-[32px] min-h-[32px] ${isUnderline ? 'editor-btn-active' : ''}`}
              title="Underline (Ctrl+U)"
            ><Underline size={14} /></button>
            <div className="w-px h-5 bg-editor-border mx-0.5" />
            <button onClick={() => { const v = fontSize - 2; setFontSize(v); apply({ fontSize: v }); }} className="editor-btn p-1.5 min-w-[32px] min-h-[32px]"><Minus size={12} /></button>
            <span className="text-[11px] text-editor-text-bright min-w-[28px] text-center font-medium">{fontSize}</span>
            <button onClick={() => { const v = fontSize + 2; setFontSize(v); apply({ fontSize: v }); }} className="editor-btn p-1.5 min-w-[32px] min-h-[32px]"><Plus size={12} /></button>
            <div className="w-px h-5 bg-editor-border mx-0.5" />
            <input
              type="color"
              value={fillColor}
              onChange={(e) => { setFillColor(e.target.value); apply({ fill: e.target.value }); }}
              className="w-7 h-7 rounded cursor-pointer border border-editor-border bg-transparent"
              title="Text Color"
            />
          </>
        )}
        {isImage && (
          <>
            <button className="editor-btn p-1.5 min-w-[32px] min-h-[32px]" title="Crop (coming soon)"><Crop size={14} /></button>
            <button onClick={() => apply({ flipX: !(fabricCanvas?.getActiveObject()?.flipX) })} className="editor-btn p-1.5 min-w-[32px] min-h-[32px]" title="Flip Horizontal"><FlipHorizontal size={14} /></button>
            <button onClick={() => apply({ flipY: !(fabricCanvas?.getActiveObject()?.flipY) })} className="editor-btn p-1.5 min-w-[32px] min-h-[32px]" title="Flip Vertical"><FlipVertical size={14} /></button>
            <div className="w-px h-5 bg-editor-border mx-0.5" />
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => { const v = Number(e.target.value); setOpacity(v); apply({ opacity: v / 100 }); }}
              className="w-16 accent-primary h-1"
              title="Opacity"
            />
            <span className="text-[10px] text-editor-text min-w-[26px]">{opacity}%</span>
          </>
        )}
        {!isText && !isImage && (
          <>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => { setFillColor(e.target.value); apply({ fill: e.target.value }); }}
              className="w-7 h-7 rounded cursor-pointer border border-editor-border bg-transparent"
              title="Fill Color"
            />
            <div className="w-px h-5 bg-editor-border mx-0.5" />
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => { const v = Number(e.target.value); setOpacity(v); apply({ opacity: v / 100 }); }}
              className="w-16 accent-primary h-1"
              title="Opacity"
            />
            <span className="text-[10px] text-editor-text min-w-[26px]">{opacity}%</span>
          </>
        )}
        <div className="w-px h-5 bg-editor-border mx-0.5" />
        <button onClick={duplicate} className="editor-btn p-1.5 min-w-[32px] min-h-[32px]" title="Duplicate (Ctrl+D)"><Copy size={14} /></button>
        <button onClick={deleteObj} className="editor-btn p-1.5 min-w-[32px] min-h-[32px] hover:text-destructive" title="Delete"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

import { useEditorStore } from '@/stores/editorStore';
import {
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignEndVertical,
  AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween,
} from 'lucide-react';
import { fabric } from 'fabric';

export default function AlignmentTools() {
  const { fabricCanvas, format, pushHistory } = useEditorStore();

  const getSelected = (): fabric.Object[] => {
    if (!fabricCanvas) return [];
    const active = fabricCanvas.getActiveObject();
    if (!active) return [];
    if (active.type === 'activeSelection') {
      return (active as fabric.ActiveSelection).getObjects();
    }
    return [active];
  };

  const align = (type: string) => {
    if (!fabricCanvas) return;
    const objects = getSelected();
    if (objects.length === 0) return;

    if (objects.length === 1) {
      const obj = objects[0];
      const bound = obj.getBoundingRect();
      switch (type) {
        case 'left': obj.set({ left: 0 }); break;
        case 'right': obj.set({ left: format.width - bound.width }); break;
        case 'top': obj.set({ top: 0 }); break;
        case 'bottom': obj.set({ top: format.height - bound.height }); break;
        case 'centerH': obj.set({ left: (format.width - bound.width) / 2 }); break;
        case 'centerV': obj.set({ top: (format.height - bound.height) / 2 }); break;
      }
      obj.setCoords();
    } else {
      const bounds = objects.map(o => ({ obj: o, rect: o.getBoundingRect() }));
      switch (type) {
        case 'left': {
          const minLeft = Math.min(...bounds.map(b => b.rect.left));
          bounds.forEach(b => { b.obj.set({ left: (b.obj.left || 0) - b.rect.left + minLeft }); b.obj.setCoords(); });
          break;
        }
        case 'right': {
          const maxRight = Math.max(...bounds.map(b => b.rect.left + b.rect.width));
          bounds.forEach(b => { b.obj.set({ left: (b.obj.left || 0) + maxRight - (b.rect.left + b.rect.width) }); b.obj.setCoords(); });
          break;
        }
        case 'top': {
          const minTop = Math.min(...bounds.map(b => b.rect.top));
          bounds.forEach(b => { b.obj.set({ top: (b.obj.top || 0) - b.rect.top + minTop }); b.obj.setCoords(); });
          break;
        }
        case 'bottom': {
          const maxBottom = Math.max(...bounds.map(b => b.rect.top + b.rect.height));
          bounds.forEach(b => { b.obj.set({ top: (b.obj.top || 0) + maxBottom - (b.rect.top + b.rect.height) }); b.obj.setCoords(); });
          break;
        }
        case 'centerH': {
          const avgX = bounds.reduce((s, b) => s + b.rect.left + b.rect.width / 2, 0) / bounds.length;
          bounds.forEach(b => { b.obj.set({ left: (b.obj.left || 0) + avgX - (b.rect.left + b.rect.width / 2) }); b.obj.setCoords(); });
          break;
        }
        case 'centerV': {
          const avgY = bounds.reduce((s, b) => s + b.rect.top + b.rect.height / 2, 0) / bounds.length;
          bounds.forEach(b => { b.obj.set({ top: (b.obj.top || 0) + avgY - (b.rect.top + b.rect.height / 2) }); b.obj.setCoords(); });
          break;
        }
        case 'distributeH': {
          const sorted = [...bounds].sort((a, b) => a.rect.left - b.rect.left);
          const totalWidth = sorted.reduce((s, b) => s + b.rect.width, 0);
          const totalSpace = (sorted[sorted.length - 1].rect.left + sorted[sorted.length - 1].rect.width) - sorted[0].rect.left - totalWidth;
          const gap = totalSpace / (sorted.length - 1);
          let x = sorted[0].rect.left + sorted[0].rect.width;
          for (let i = 1; i < sorted.length - 1; i++) {
            x += gap;
            sorted[i].obj.set({ left: (sorted[i].obj.left || 0) + x - sorted[i].rect.left });
            sorted[i].obj.setCoords();
            x += sorted[i].rect.width;
          }
          break;
        }
        case 'distributeV': {
          const sorted = [...bounds].sort((a, b) => a.rect.top - b.rect.top);
          const totalHeight = sorted.reduce((s, b) => s + b.rect.height, 0);
          const totalSpace = (sorted[sorted.length - 1].rect.top + sorted[sorted.length - 1].rect.height) - sorted[0].rect.top - totalHeight;
          const gap = totalSpace / (sorted.length - 1);
          let y = sorted[0].rect.top + sorted[0].rect.height;
          for (let i = 1; i < sorted.length - 1; i++) {
            y += gap;
            sorted[i].obj.set({ top: (sorted[i].obj.top || 0) + y - sorted[i].rect.top });
            sorted[i].obj.setCoords();
            y += sorted[i].rect.height;
          }
          break;
        }
      }
    }

    fabricCanvas.renderAll();
    pushHistory();
  };

  const buttons = [
    { id: 'left', icon: AlignStartHorizontal, label: 'Align Left' },
    { id: 'centerH', icon: AlignHorizontalJustifyCenter, label: 'Center Horizontally' },
    { id: 'right', icon: AlignEndHorizontal, label: 'Align Right' },
    { id: 'top', icon: AlignStartVertical, label: 'Align Top' },
    { id: 'centerV', icon: AlignVerticalJustifyCenter, label: 'Center Vertically' },
    { id: 'bottom', icon: AlignEndVertical, label: 'Align Bottom' },
    { id: 'distributeH', icon: AlignHorizontalSpaceBetween, label: 'Distribute Horizontally' },
    { id: 'distributeV', icon: AlignVerticalSpaceBetween, label: 'Distribute Vertically' },
  ];

  return (
    <div>
      <label className="editor-label mb-2 block">Align & Distribute</label>
      <div className="grid grid-cols-4 gap-1">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => align(btn.id)}
            className="editor-btn p-2"
            title={btn.label}
          >
            <btn.icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

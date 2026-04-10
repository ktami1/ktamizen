import { useEditorStore } from '@/stores/editorStore';
import { Plus, Copy, Trash2 } from 'lucide-react';

export default function SlideStrip() {
  const { slides, activeSlideIndex, setActiveSlideIndex, addSlide, duplicateSlide, deleteSlide, fabricCanvas, updateSlide } = useEditorStore();

  const handleSlideClick = (index: number) => {
    if (!fabricCanvas) return;
    const json = JSON.stringify(fabricCanvas.toJSON(['id', 'name']));
    updateSlide(activeSlideIndex, { objects: json });
    setActiveSlideIndex(index);
  };

  return (
    <div className="h-24 bg-editor-panel border-t border-editor-border flex items-center px-3 gap-2 overflow-x-auto">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="group relative flex-shrink-0"
        >
          <button
            onClick={() => handleSlideClick(i)}
            className={`w-[72px] h-16 rounded-md border-2 transition-all bg-editor-surface flex items-center justify-center text-[10px] text-muted-foreground
              ${i === activeSlideIndex ? 'border-primary shadow-lg shadow-primary/20' : 'border-editor-border hover:border-editor-text/30'}`}
          >
            {i + 1}
          </button>
          {/* Mobile: always visible */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex md:hidden gap-0.5 bg-editor-panel border border-editor-border rounded-md p-0.5 shadow-lg z-10">
            <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="editor-btn p-1" title="Duplicate"><Copy size={11} /></button>
            {slides.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="editor-btn p-1 hover:text-destructive" title="Delete"><Trash2 size={11} /></button>
            )}
          </div>
          {/* Desktop: hover only */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden md:group-hover:flex gap-0.5 bg-editor-panel border border-editor-border rounded-md p-0.5 shadow-lg z-10">
            <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="editor-btn p-1" title="Duplicate"><Copy size={11} /></button>
            {slides.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="editor-btn p-1 hover:text-destructive" title="Delete"><Trash2 size={11} /></button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addSlide} className="w-[72px] h-16 rounded-md border-2 border-dashed border-editor-border hover:border-editor-text/30 flex items-center justify-center text-muted-foreground hover:text-editor-text-bright transition-colors flex-shrink-0">
        <Plus size={18} />
      </button>
    </div>
  );
}

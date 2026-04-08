import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { Download, Package, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ExportPanel() {
  const { fabricCanvas, slides, activeSlideIndex, format, exportScale, setExportScale, transparentBg, setTransparentBg, projectName } = useEditorStore();
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  const exportCurrentSlide = async () => {
    if (!fabricCanvas) return;
    setExporting(true);

    try {
      const origBg = fabricCanvas.backgroundColor;
      if (transparentBg) fabricCanvas.backgroundColor = '';
      fabricCanvas.renderAll();

      const dataUrl = fabricCanvas.toDataURL({
        format: exportFormat,
        quality: exportFormat === 'jpeg' ? 0.95 : undefined,
        multiplier: exportScale,
      });

      if (transparentBg) {
        fabricCanvas.backgroundColor = origBg;
        fabricCanvas.renderAll();
      }

      const link = document.createElement('a');
      link.download = `${projectName}_slide_${activeSlideIndex + 1}.${exportFormat}`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportAllAsZip = async () => {
    if (!fabricCanvas) return;
    setExporting(true);

    try {
      const zip = new JSZip();
      const currentIndex = activeSlideIndex;

      for (let i = 0; i < slides.length; i++) {
        // Load slide
        const slideData = JSON.parse(slides[i].objects);
        await new Promise<void>((resolve) => {
          fabricCanvas.loadFromJSON(slideData, () => {
            fabricCanvas.renderAll();
            resolve();
          });
        });

        const origBg = fabricCanvas.backgroundColor;
        if (transparentBg) fabricCanvas.backgroundColor = '';
        fabricCanvas.renderAll();

        const dataUrl = fabricCanvas.toDataURL({
          format: exportFormat,
          quality: exportFormat === 'jpeg' ? 0.95 : undefined,
          multiplier: exportScale,
        });

        if (transparentBg) {
          fabricCanvas.backgroundColor = origBg;
          fabricCanvas.renderAll();
        }

        const base64 = dataUrl.split(',')[1];
        zip.file(`slide_${i + 1}.${exportFormat}`, base64, { base64: true });
      }

      // Restore current slide
      const currentData = JSON.parse(slides[currentIndex].objects);
      fabricCanvas.loadFromJSON(currentData, () => fabricCanvas.renderAll());

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName}.zip`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <label className="editor-label mb-2 block">Format</label>
        <div className="flex gap-2">
          {(['png', 'jpeg'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setExportFormat(f)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${exportFormat === f ? 'bg-primary/20 text-primary' : 'bg-editor-surface text-editor-text hover:bg-editor-hover'}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="editor-label mb-2 block">Resolution Scale</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => setExportScale(s)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${exportScale === s ? 'bg-primary/20 text-primary' : 'bg-editor-surface text-editor-text hover:bg-editor-hover'}`}
            >
              {s}x
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Output: {format.width * exportScale} × {format.height * exportScale}px
        </p>
      </div>

      {exportFormat === 'png' && (
        <div className="flex items-center justify-between">
          <label className="text-xs text-editor-text">Transparent Background</label>
          <button
            onClick={() => setTransparentBg(!transparentBg)}
            className={`w-10 h-5 rounded-full transition-colors relative ${transparentBg ? 'bg-primary' : 'bg-editor-surface'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${transparentBg ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <button
          onClick={exportCurrentSlide}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Export Current Slide
        </button>

        {slides.length > 1 && (
          <button
            onClick={exportAllAsZip}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-editor-surface text-editor-text-bright py-2.5 rounded-lg text-sm font-medium hover:bg-editor-hover transition-colors disabled:opacity-50 border border-editor-border"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            Export All as ZIP ({slides.length} slides)
          </button>
        )}
      </div>
    </div>
  );
}

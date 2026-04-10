import { useEditorStore } from '@/stores/editorStore';
import { fabric } from 'fabric';
import LayerPanel from './LayerPanel';
import TextControls from './TextControls';
import ImageControls from './ImageControls';
import DesignControls from './DesignControls';
import ExportPanel from './ExportPanel';
import AlignmentTools from './AlignmentTools';
import { X, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL_TITLES: Record<string, string> = {
  text:      'Text',
  image:     'Image',
  overlay:   'Overlay',
  move:      'Move',
  layers:    'Layers',
  inspector: 'Export',
  adjust:    'Adjust',
  shapes:    'Design',
};

export default function MobileBottomSheet() {
  const { mobilePanel, setMobilePanel, fabricCanvas, format, pushHistory } = useEditorStore();

  if (mobilePanel === 'none') return null;

  const addLogoToCanvas = () => {
    if (!fabricCanvas) return;
    fabric.loadSVGFromURL('/ktamizen-logo.svg', (objects: any[], options: any) => {
      if (!objects?.length) return;
      const logo = fabric.util.groupSVGElements(objects, options);
      logo.setCoords();
      const w = logo.width || 252;
      const targetW = format.width * 0.18;
      const scale = targetW / w;
      const scaledH = (logo.height || 252) * scale;
      logo.set({ scaleX: scale, scaleY: scale, left: (format.width - targetW) / 2, top: format.height - scaledH - format.height * 0.05, originX: 'left', originY: 'top', lockUniScaling: true });
      (logo as any).id = Math.random().toString(36).slice(2);
      (logo as any).name = 'Ktamizen Logo';
      fabricCanvas.add(logo);
      fabricCanvas.bringToFront(logo);
      fabricCanvas.requestRenderAll();
      pushHistory();
    });
  };

  const addGradientOverlay = (preset: any) => {
    if (!fabricCanvas) return;
    const { format: fmt } = useEditorStore.getState();
    let gradient: fabric.Gradient;
    if (preset.radial) {
      gradient = new fabric.Gradient({ type: 'radial', coords: { x1: fmt.width/2, y1: fmt.height/2, r1: 0, x2: fmt.width/2, y2: fmt.height/2, r2: Math.max(fmt.width, fmt.height)/2 }, colorStops: preset.stops.map(([o,c,a]: any) => ({ offset: o, color: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},${a})` })) });
    } else {
      const rad = ((preset.angle - 90) * Math.PI) / 180;
      gradient = new fabric.Gradient({ type: 'linear', coords: { x1: fmt.width/2 - Math.cos(rad)*fmt.width/2, y1: fmt.height/2 - Math.sin(rad)*fmt.height/2, x2: fmt.width/2 + Math.cos(rad)*fmt.width/2, y2: fmt.height/2 + Math.sin(rad)*fmt.height/2 }, colorStops: preset.stops.map(([o,c,a]: any) => ({ offset: o, color: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},${a})` })) });
    }
    const rect = new fabric.Rect({ left:0, top:0, width:fmt.width, height:fmt.height, fill:gradient, selectable:false, evented:false, lockMovementX:true, lockMovementY:true, lockScalingX:true, lockScalingY:true, lockRotation:true, hasControls:false });
    (rect as any).id = Math.random().toString(36).slice(2);
    (rect as any).name = preset.label + ' overlay';
    fabricCanvas.add(rect);
    const imageObjs = fabricCanvas.getObjects().filter((o: any) => o.type === 'image');
    fabricCanvas.moveTo(rect, imageObjs.length);
    fabricCanvas.requestRenderAll();
    pushHistory();
  };

  const renderContent = () => {
    switch (mobilePanel) {
      case 'text':
        return <TextControls />;
      case 'image':
      case 'adjust':
        return <ImageControls />;
      case 'overlay':
        return (
          <div className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <span className="editor-label">Brand</span>
              <button
                onClick={addLogoToCanvas}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-editor-border hover:bg-editor-hover transition-colors"
              >
                <ImagePlus size={20} style={{ color: '#c8a96e' }} />
                <div className="text-left">
                  <div className="text-xs text-editor-text-bright font-medium">Aggiungi Logo</div>
                  <div className="text-[10px] text-muted-foreground">Centrato in basso · 5% padding</div>
                </div>
              </button>
            </div>

            {/* Gradient presets */}
            <div className="space-y-2">
              <span className="editor-label">Gradiente</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Bottom Fade', preview: 'linear-gradient(to top, #000 0%, transparent 100%)', stops: [[0,'#000000',1],[0.5,'#000000',0.4],[1,'#000000',0]], angle: 90 },
                  { label: 'Top Fade', preview: 'linear-gradient(to bottom, #000 0%, transparent 100%)', stops: [[0,'#000000',1],[0.5,'#000000',0.4],[1,'#000000',0]], angle: 270 },
                  { label: 'Vignette', preview: 'radial-gradient(ellipse, transparent 30%, #000 100%)', stops: [[0,'#000000',0],[0.6,'#000000',0.3],[1,'#000000',0.9]], radial: true },
                  { label: 'Dbl Fade', preview: 'linear-gradient(to top, #000 0%, transparent 40%, #000 100%)', stops: [[0,'#000000',1],[0.4,'#000000',0],[0.6,'#000000',0],[1,'#000000',1]], angle: 90 },
                ].map(preset => (
                  <button key={preset.label} onClick={() => addGradientOverlay(preset)} style={{ height: 70, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', position: 'relative', padding: 0, width: '100%' }}>
                    <div style={{ position: 'absolute', inset: 0, background: preset.preview }} />
                    <span style={{ position: 'relative', zIndex: 1, fontSize: 10, color: 'white', fontWeight: 500 }}>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'move':
        return <AlignmentTools />;
      case 'shapes':
      case 'inspector':
        return <ExportPanel />;
      case 'layers':
        return <LayerPanel />;
      default:
        return <DesignControls />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 56,
          height: '44vh',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10,10,10,0.97)',
          borderTop: '1px solid rgba(200,169,110,0.3)',
          borderRadius: '20px 20px 0 0',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(200,169,110,0.4)' }} />
        </div>
        <div className="flex items-center justify-between px-4 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-medium" style={{ color: '#c8a96e' }}>
            {PANEL_TITLES[mobilePanel] || mobilePanel}
          </span>
          <button onClick={() => setMobilePanel('none')} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

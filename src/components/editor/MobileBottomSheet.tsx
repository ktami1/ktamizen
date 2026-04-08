import { useEditorStore } from '@/stores/editorStore';
import LayerPanel from './LayerPanel';
import TextControls from './TextControls';
import ImageControls from './ImageControls';
import DesignControls from './DesignControls';
import ExportPanel from './ExportPanel';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PANEL_TITLES: Record<string, string> = {
  layers: 'Layers',
  inspector: 'Design',
  text: 'Text',
  image: 'Image',
  shapes: 'Shapes',
  adjust: 'Adjustments',
};

export default function MobileBottomSheet() {
  const { mobilePanel, setMobilePanel } = useEditorStore();

  if (mobilePanel === 'none') return null;

  const renderContent = () => {
    switch (mobilePanel) {
      case 'layers':
        return <LayerPanel />;
      case 'text':
        return <TextControls />;
      case 'image':
      case 'adjust':
        return <ImageControls />;
      case 'shapes':
      case 'inspector':
        return <DesignControls />;
      default:
        return <ExportPanel />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-editor-panel border-t border-editor-border rounded-t-2xl max-h-[55vh] flex flex-col"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-editor-border" />
        </div>
        <div className="flex items-center justify-between px-4 py-1 border-b border-editor-border">
          <span className="text-xs font-medium text-editor-text-bright">
            {PANEL_TITLES[mobilePanel] || mobilePanel}
          </span>
          <button onClick={() => setMobilePanel('none')} className="editor-btn p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

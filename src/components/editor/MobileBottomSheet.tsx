import { useEditorStore } from '@/stores/editorStore';
import LayerPanel from './LayerPanel';
import TextControls from './TextControls';
import ImageControls from './ImageControls';
import DesignControls from './DesignControls';
import ExportPanel from './ExportPanel';
import { X, Palette, Type, Image, Download } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomSheet() {
  const { mobilePanel, setMobilePanel, inspectorTab, setInspectorTab } = useEditorStore();
  const [tab, setTab] = useState(inspectorTab);

  if (mobilePanel === 'none') return null;

  const tabs = [
    { id: 'design' as const, icon: Palette, label: 'Design' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'image' as const, icon: Image, label: 'Image' },
    { id: 'export' as const, icon: Download, label: 'Export' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-editor-panel border-t border-editor-border rounded-t-2xl max-h-[60vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-editor-border">
          <span className="text-xs font-medium text-editor-text-bright capitalize">
            {mobilePanel}
          </span>
          <button onClick={() => setMobilePanel('none')} className="editor-btn p-1">
            <X size={16} />
          </button>
        </div>

        {mobilePanel === 'layers' && (
          <div className="flex-1 overflow-y-auto">
            <LayerPanel />
          </div>
        )}

        {mobilePanel === 'inspector' && (
          <>
            <div className="flex border-b border-editor-border">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setInspectorTab(t.id); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] transition-colors
                    ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-editor-text'}`}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {tab === 'design' && <DesignControls />}
              {tab === 'text' && <TextControls />}
              {tab === 'image' && <ImageControls />}
              {tab === 'export' && <ExportPanel />}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

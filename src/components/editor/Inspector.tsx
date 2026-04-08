import { useEditorStore } from '@/stores/editorStore';
import TextControls from './TextControls';
import ImageControls from './ImageControls';
import DesignControls from './DesignControls';
import ExportPanel from './ExportPanel';
import { Palette, Type, Image, Download } from 'lucide-react';

const tabs = [
  { id: 'design' as const, icon: Palette, label: 'Design' },
  { id: 'text' as const, icon: Type, label: 'Text' },
  { id: 'image' as const, icon: Image, label: 'Image' },
  { id: 'export' as const, icon: Download, label: 'Export' },
];

export default function Inspector() {
  const { inspectorTab, setInspectorTab } = useEditorStore();

  return (
    <div className="w-72 bg-editor-panel border-l border-editor-border flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-editor-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setInspectorTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors
              ${inspectorTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-editor-text hover:text-editor-text-bright'}`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {inspectorTab === 'design' && <DesignControls />}
        {inspectorTab === 'text' && <TextControls />}
        {inspectorTab === 'image' && <ImageControls />}
        {inspectorTab === 'export' && <ExportPanel />}
      </div>
    </div>
  );
}

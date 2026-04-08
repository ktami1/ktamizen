import { useEditorStore } from '@/stores/editorStore';
import Toolbar from '@/components/editor/Toolbar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import Inspector from '@/components/editor/Inspector';
import SlideStrip from '@/components/editor/SlideStrip';
import LayerPanel from '@/components/editor/LayerPanel';
import { Sparkles } from 'lucide-react';

export default function Editor() {
  const { projectName, setProjectName } = useEditorStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-bg">
      {/* Header */}
      <div className="h-10 bg-editor-panel border-b border-editor-border flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-xs font-display font-semibold text-primary">Studio</span>
        </div>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-xs text-editor-text-bright text-center font-medium focus:outline-none focus:text-primary border-b border-transparent focus:border-primary/30 px-2 py-0.5 transition-colors"
        />
        <div className="w-20" />
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <LayerPanel />
        <FabricCanvas />
        <Inspector />
      </div>

      {/* Slide strip */}
      <SlideStrip />
    </div>
  );
}

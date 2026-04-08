import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import Toolbar from '@/components/editor/Toolbar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import Inspector from '@/components/editor/Inspector';
import SlideStrip from '@/components/editor/SlideStrip';
import LayerPanel from '@/components/editor/LayerPanel';
import MobileBottomSheet from '@/components/editor/MobileBottomSheet';
import { Sparkles, Sun, Moon, Layers, Settings } from 'lucide-react';

export default function Editor() {
  const { projectName, setProjectName, theme, setTheme, mobilePanel, setMobilePanel } = useEditorStore();

  useEffect(() => {
    const saved = localStorage.getItem('studio-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-bg">
      <div className="h-10 bg-editor-panel border-b border-editor-border flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-xs font-display font-semibold text-primary hidden sm:inline">Studio</span>
        </div>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-xs text-editor-text-bright text-center font-medium focus:outline-none focus:text-primary border-b border-transparent focus:border-primary/30 px-2 py-0.5 transition-colors max-w-[200px]"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="editor-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block">
          <LayerPanel />
        </div>
        <FabricCanvas />
        <Inspector />
      </div>

      <SlideStrip />

      {/* Mobile bottom nav */}
      <div className="flex lg:hidden border-t border-editor-border bg-editor-panel">
        <button
          onClick={() => setMobilePanel(mobilePanel === 'layers' ? 'none' : 'layers')}
          className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${mobilePanel === 'layers' ? 'text-primary' : 'text-editor-text'}`}
        >
          <Layers size={18} />
          <span>Layers</span>
        </button>
        <button
          onClick={() => setMobilePanel(mobilePanel === 'inspector' ? 'none' : 'inspector')}
          className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${mobilePanel === 'inspector' ? 'text-primary' : 'text-editor-text'}`}
        >
          <Settings size={18} />
          <span>Inspector</span>
        </button>
      </div>

      <MobileBottomSheet />
    </div>
  );
}

import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import Toolbar from '@/components/editor/Toolbar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import Inspector from '@/components/editor/Inspector';
import SlideStrip from '@/components/editor/SlideStrip';
import LayerPanel from '@/components/editor/LayerPanel';
import MobileBottomSheet from '@/components/editor/MobileBottomSheet';
import { Sparkles, Sun, Moon, Layers, Type, Image, Square, Sliders, Download } from 'lucide-react';

const mobileNavItems = [
  { id: 'layers' as const, icon: Layers, label: 'Layers' },
  { id: 'text' as const, icon: Type, label: 'Text' },
  { id: 'image' as const, icon: Image, label: 'Image' },
  { id: 'shapes' as const, icon: Square, label: 'Shapes' },
  { id: 'adjust' as const, icon: Sliders, label: 'Adjust' },
] as const;

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
      {/* Top bar */}
      <div className="h-10 bg-editor-panel border-b border-editor-border flex items-center px-3 justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-[11px] font-display font-semibold text-primary hidden sm:inline">Studio</span>
        </div>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-xs text-editor-text-bright text-center font-medium focus:outline-none focus:text-primary border-b border-transparent focus:border-primary/30 px-2 py-0.5 transition-colors max-w-[180px]"
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

      {/* Mobile bottom nav - PicsArt style */}
      <div className="flex lg:hidden border-t border-editor-border bg-editor-panel safe-area-bottom">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setMobilePanel(mobilePanel === item.id ? 'none' : item.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] transition-colors
              ${mobilePanel === item.id ? 'text-primary' : 'text-editor-text'}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <MobileBottomSheet />
    </div>
  );
}

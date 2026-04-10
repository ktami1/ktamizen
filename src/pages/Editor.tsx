import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import Toolbar from '@/components/editor/Toolbar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import Inspector from '@/components/editor/Inspector';
import SlideStrip from '@/components/editor/SlideStrip';
import LayerPanel from '@/components/editor/LayerPanel';
import MobileBottomSheet from '@/components/editor/MobileBottomSheet';
import FloatingToolbar from '@/components/editor/FloatingToolbar';
import CanvasContextMenu from '@/components/editor/CanvasContextMenu';
import KeyboardShortcutsModal from '@/components/editor/KeyboardShortcutsModal';
import { Sparkles, Sun, Moon, Layers, Type, Image, AlignCenter, Download, Keyboard, Undo2, Redo2 } from 'lucide-react';

const mobileNavItems = [
  { id: 'text'      as const, icon: Type,        label: 'Text'    },
  { id: 'image'     as const, icon: Image,       label: 'Image'   },
  { id: 'overlay'   as const, icon: Sparkles,    label: 'Overlay' },
  { id: 'move'      as const, icon: AlignCenter, label: 'Move'    },
  { id: 'layers'    as const, icon: Layers,      label: 'Layers'  },
  { id: 'inspector' as const, icon: Download,    label: 'Export'  },
] as const;

export default function Editor() {
  const { projectName, setProjectName, theme, setTheme, mobilePanel, setMobilePanel, showShortcuts, setShowShortcuts } = useEditorStore();

  useEffect(() => {
    const saved = localStorage.getItem('studio-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-editor-bg">
      {/* Top bar */}
      <div
        className="h-12 bg-editor-panel border-b border-editor-border flex items-center px-3 justify-between flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#c8a96e' }} />
          <span className="text-[11px] font-display font-semibold hidden sm:inline" style={{ color: '#c8a96e' }}>STUDIO</span>
          <button onClick={() => useEditorStore.getState().undo()} className="editor-btn ml-1 md:hidden" title="Undo">
            <Undo2 size={16} />
          </button>
          <button onClick={() => useEditorStore.getState().redo()} className="editor-btn md:hidden" title="Redo">
            <Redo2 size={16} />
          </button>
        </div>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-xs text-editor-text-bright text-center font-medium focus:outline-none focus:text-primary border-b border-transparent focus:border-primary/30 px-2 py-0.5 transition-colors max-w-[180px]"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowShortcuts(true)}
            className="editor-btn hidden sm:flex"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={14} />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="editor-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Toolbar — hidden on mobile */}
      <div className="hidden md:block">
        <Toolbar />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block">
          <LayerPanel />
        </div>
        <FabricCanvas />
        <Inspector />
      </div>

      <SlideStrip />

      {/* Floating elements */}
      <FloatingToolbar />
      <CanvasContextMenu />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Mobile bottom nav */}
      <div className="flex md:hidden border-t border-editor-border bg-editor-panel" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {mobileNavItems.map((item) => {
          const active = mobilePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMobilePanel(mobilePanel === item.id ? 'none' : item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, border: 'none', background: 'none',
                cursor: 'pointer', minHeight: 56, position: 'relative',
                color: active ? '#c8a96e' : 'rgba(255,255,255,0.3)',
              }}
            >
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, borderRadius: 2, background: '#c8a96e' }} />}
              <item.icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <MobileBottomSheet />
    </div>
  );
}

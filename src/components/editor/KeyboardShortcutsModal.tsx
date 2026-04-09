import { X } from 'lucide-react';

const SECTIONS = [
  {
    title: 'General',
    shortcuts: [
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Shift+Z / Ctrl+Y', 'Redo'],
      ['Ctrl+A', 'Select All'],
      ['Escape', 'Deselect / Exit Edit'],
      ['Delete / Backspace', 'Delete Selected'],
      ['?', 'Toggle Shortcuts'],
    ],
  },
  {
    title: 'Objects',
    shortcuts: [
      ['Ctrl+C', 'Copy'],
      ['Ctrl+V', 'Paste'],
      ['Ctrl+D', 'Duplicate'],
      ['Ctrl+G', 'Group Selection'],
      ['Ctrl+]', 'Bring Forward'],
      ['Ctrl+[', 'Send Backward'],
      ['Ctrl+Shift+]', 'Bring to Front'],
      ['Ctrl+Shift+[', 'Send to Back'],
      ['Ctrl+L', 'Lock / Unlock'],
      ['Ctrl+H', 'Flip Horizontal'],
      ['Ctrl+J', 'Flip Vertical'],
      ['F2', 'Rename Layer'],
    ],
  },
  {
    title: 'Movement',
    shortcuts: [
      ['Arrow Keys', 'Move 1px'],
      ['Shift+Arrow', 'Move 10px'],
      ['Ctrl+Arrow', 'Snap to Canvas Edge'],
    ],
  },
  {
    title: 'Text',
    shortcuts: [
      ['Ctrl+B', 'Bold'],
      ['Ctrl+I', 'Italic'],
      ['Ctrl+U', 'Underline'],
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      ['Ctrl+0', 'Fit to Screen'],
      ['Ctrl+1', '100%'],
      ['Ctrl+2', '200%'],
      ['Ctrl+Scroll', 'Zoom In/Out'],
    ],
  },
];

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-editor-panel border border-editor-border rounded-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-editor-border">
          <h2 className="text-sm font-semibold text-editor-text-bright">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="editor-btn p-1"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto max-h-[70vh] p-5 space-y-5">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="editor-label mb-2">{section.title}</h3>
              <div className="space-y-1">
                {section.shortcuts.map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-xs text-editor-text">{desc}</span>
                    <kbd className="text-[10px] bg-editor-surface border border-editor-border rounded px-2 py-0.5 text-editor-text-bright font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

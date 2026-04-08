import { useEditorStore, TextPreset } from '@/stores/editorStore';
import { fabric } from 'fabric';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function TextPresets() {
  const { fabricCanvas, textPresets, addTextPreset, removeTextPreset, pushHistory } = useEditorStore();
  const [showSave, setShowSave] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'title' | 'subtitle' | 'caption' | 'custom'>('custom');

  const applyPreset = (preset: TextPreset) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || (obj.type !== 'i-text' && obj.type !== 'textbox')) return;

    const props: Record<string, any> = {
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fill: preset.fill,
      charSpacing: preset.charSpacing,
      lineHeight: preset.lineHeight,
    };

    if (preset.strokeEnabled) {
      props.stroke = preset.strokeColor;
      props.strokeWidth = preset.strokeWidth;
    } else {
      props.stroke = '';
      props.strokeWidth = 0;
    }

    obj.set(props);
    fabricCanvas.renderAll();
    pushHistory();
  };

  const saveFromSelection = () => {
    if (!fabricCanvas || !newName.trim()) return;
    const obj = fabricCanvas.getActiveObject() as fabric.IText;
    if (!obj || (obj.type !== 'i-text' && obj.type !== 'textbox')) return;

    const preset: TextPreset = {
      id: Math.random().toString(36).substring(2, 10),
      name: newName.trim(),
      category: newCategory,
      fontFamily: obj.fontFamily || 'Inter Tight',
      fontSize: obj.fontSize || 40,
      fontWeight: String(obj.fontWeight || '400'),
      fill: (obj.fill as string) || '#000000',
      charSpacing: obj.charSpacing || 0,
      lineHeight: obj.lineHeight || 1.2,
      strokeEnabled: (obj.strokeWidth || 0) > 0,
      strokeColor: obj.stroke || '#000000',
      strokeWidth: obj.strokeWidth || 0,
    };

    addTextPreset(preset);
    setShowSave(false);
    setNewName('');
  };

  const categories = ['title', 'subtitle', 'caption', 'custom'] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="editor-label">Text Presets</label>
        <button onClick={() => setShowSave(!showSave)} className="editor-btn p-1" title="Save current style">
          <Plus size={12} />
        </button>
      </div>

      {showSave && (
        <div className="bg-editor-surface rounded-lg p-2 space-y-2 animate-fade-in">
          <input
            type="text"
            placeholder="Preset name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="editor-input w-full"
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="editor-input w-full">
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={saveFromSelection} className="w-full bg-primary/20 text-primary text-xs py-1.5 rounded-md hover:bg-primary/30 transition-colors">
            Save Style
          </button>
        </div>
      )}

      <div className="space-y-1">
        {textPresets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-2 group">
            <button
              onClick={() => applyPreset(preset)}
              className="flex-1 text-left px-2 py-1.5 rounded-md hover:bg-editor-hover transition-colors"
            >
              <div className="text-[11px] text-editor-text-bright" style={{ fontFamily: preset.fontFamily, fontWeight: Number(preset.fontWeight) }}>
                {preset.name}
              </div>
              <div className="text-[9px] text-muted-foreground">
                {preset.fontFamily} · {preset.fontSize}px · {preset.category}
              </div>
            </button>
            {!['p1', 'p2', 'p3', 'p4'].includes(preset.id) && (
              <button onClick={() => removeTextPreset(preset.id)} className="editor-btn p-1 opacity-0 group-hover:opacity-100">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

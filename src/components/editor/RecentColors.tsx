import { useEditorStore } from '@/stores/editorStore';

interface RecentColorsProps {
  onSelect: (color: string) => void;
}

export default function RecentColors({ onSelect }: RecentColorsProps) {
  const { recentColors } = useEditorStore();

  if (recentColors.length === 0) return null;

  return (
    <div>
      <label className="editor-label mb-1.5 block">Recent Colors</label>
      <div className="flex flex-wrap gap-1">
        {recentColors.map((color, i) => (
          <button
            key={`${color}-${i}`}
            onClick={() => onSelect(color)}
            className="w-6 h-6 rounded border border-editor-border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export default function SliderInput({ label, value, min, max, step = 1, onChange, unit = '' }: SliderInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] text-editor-text">{label}</label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary h-1"
        />
        <div className="flex items-center">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="editor-input w-14 text-center text-[11px]"
          />
          {unit && <span className="text-[9px] text-muted-foreground ml-0.5">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

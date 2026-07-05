import { useState } from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  color = '#0ea5e9',
  onChange,
}: SliderControlProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(Math.round(clamped / step) * step);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDecrement}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
          >
            −
          </button>
          <input
            type="text"
            value={isEditing ? inputValue : `${value}${unit}`}
            onChange={handleInputChange}
            onFocus={() => {
              setIsEditing(true);
              setInputValue(value.toString());
            }}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-16 text-right text-xs text-white font-medium bg-transparent outline-none focus:bg-slate-800 rounded px-1 py-0.5 transition-colors"
          />
          <button
            onClick={handleIncrement}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(val);
            setInputValue(val.toString());
          }}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: color,
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #334155 ${percentage}%, #334155 100%)`,
          }}
        />
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between" onClick={() => onChange(!checked)}>
      {label && <span className="text-xs text-slate-400 cursor-pointer">{label}</span>}
      <div className={`toggle-switch ${checked ? 'active' : ''}`}>
        <div className="toggle-switch-thumb" />
      </div>
    </div>
  );
}

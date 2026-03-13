import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorOption {
  id: number;
  colorName: string;
  colorHex: string;
}

interface ColorSwatchSelectorProps {
  colors: ColorOption[];
  selectedColorId: number | null;
  onColorSelect: (colorId: number, colorName: string) => void;
}

export const ColorSwatchSelector: React.FC<ColorSwatchSelectorProps> = ({
  colors,
  selectedColorId,
  onColorSelect,
}) => {
  const [hoveredColorId, setHoveredColorId] = useState<number | null>(null);

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-foreground mb-3">
        Select Color
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorSelect(color.id, color.colorName)}
            onMouseEnter={() => setHoveredColorId(color.id)}
            onMouseLeave={() => setHoveredColorId(null)}
            className="flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200"
            title={color.colorName}
          >
            <div
              className={`w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                selectedColorId === color.id
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-primary'
              } ${hoveredColorId === color.id ? 'scale-110' : 'scale-100'}`}
              style={{
                backgroundColor: color.colorHex,
                boxShadow:
                  selectedColorId === color.id
                    ? `0 0 0 3px ${color.colorHex}40`
                    : 'none',
              }}
            >
              {selectedColorId === color.id && (
                <Check className="w-5 h-5 text-white drop-shadow-lg" />
              )}
            </div>
            <span
              className={`text-xs text-center leading-tight transition-all duration-200 ${
                selectedColorId === color.id
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {color.colorName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

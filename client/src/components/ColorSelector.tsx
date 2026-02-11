import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Color {
  id: number;
  productId: number;
  colorName: string;
  colorHex: string;
}

interface ColorSelectorProps {
  colors: Color[];
  selectedColorId: number | null;
  onColorSelect: (colorId: number) => void;
  disabled?: boolean;
}

export function ColorSelector({
  colors,
  selectedColorId,
  onColorSelect,
  disabled = false,
}: ColorSelectorProps) {
  const colorMap = useMemo(() => {
    return colors.reduce(
      (acc, color) => {
        acc[color.id] = color;
        return acc;
      },
      {} as Record<number, Color>
    );
  }, [colors]);

  if (colors.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No colors available for this product
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-white font-semibold">Select Color</label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorSelect(color.id)}
            disabled={disabled}
            className={cn(
              "relative group transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={color.colorName}
          >
            {/* Color Swatch */}
            <div
              className={cn(
                "w-full aspect-square rounded-lg border-2 transition-all duration-200 shadow-md hover:shadow-lg",
                selectedColorId === color.id
                  ? "border-white scale-105"
                  : "border-gray-600 hover:border-gray-400",
                !disabled && "cursor-pointer hover:scale-105"
              )}
              style={{
                backgroundColor: color.colorHex,
              }}
            >
              {/* Checkmark for selected color */}
              {selectedColorId === color.id && (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white rounded-full p-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                </div>
              )}
            </div>

            {/* Color Name Tooltip */}
            <div
              className={cn(
                "absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10",
                "border border-gray-700"
              )}
            >
              {color.colorName}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Color Display */}
      {selectedColorId && colorMap[selectedColorId] && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">
            Selected: <span className="text-white font-semibold">{colorMap[selectedColorId].colorName}</span>
          </p>
          <div
            className="mt-2 h-8 rounded border border-gray-600"
            style={{
              backgroundColor: colorMap[selectedColorId].colorHex,
            }}
          />
        </div>
      )}
    </div>
  );
}

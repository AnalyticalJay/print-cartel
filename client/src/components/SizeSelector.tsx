import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Size {
  id: number;
  productId: number;
  sizeName: string;
}

interface SizeSelectorProps {
  sizes: Size[];
  selectedSizeId: number | null;
  onSizeSelect: (sizeId: number) => void;
  disabled?: boolean;
}

export function SizeSelector({
  sizes,
  selectedSizeId,
  onSizeSelect,
  disabled = false,
}: SizeSelectorProps) {
  if (sizes.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No sizes available for this product
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-white font-semibold">Select Size</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {sizes.map((size) => (
          <button
            key={size.id}
            onClick={() => onSizeSelect(size.id)}
            disabled={disabled}
            className={cn(
              "relative p-3 rounded-lg border-2 transition-all duration-200 font-semibold text-sm",
              selectedSizeId === size.id
                ? "border-white bg-white text-black shadow-lg scale-105"
                : "border-gray-600 bg-gray-700 text-white hover:border-gray-400 hover:bg-gray-600",
              !disabled && "cursor-pointer hover:scale-105",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title={size.sizeName}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{size.sizeName}</span>
              {selectedSizeId === size.id && (
                <Check className="w-4 h-4" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Size Display */}
      {selectedSizeId && sizes.find(s => s.id === selectedSizeId) && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">
            Selected: <span className="text-white font-semibold">{sizes.find(s => s.id === selectedSizeId)?.sizeName}</span>
          </p>
        </div>
      )}
    </div>
  );
}

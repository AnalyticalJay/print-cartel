import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: number;
  name: string;
  basePrice: string | number;
  imageUrl: string | null;
  description?: string | null;
  fabricType?: string | null;
  productType: string;
}

interface Color {
  id: number;
  colorName: string;
  colorHex: string;
}

interface Size {
  id: number;
  sizeName: string;
}

interface VisualProductSelectorProps {
  products: Product[];
  colors: Color[];
  sizes: Size[];
  selectedProductId: number | null;
  selectedColorId: number | null;
  selectedSizeId: number | null;
  quantity: number;
  isLoadingColors: boolean;
  isLoadingSizes: boolean;
  onSelectProduct: (id: number) => void;
  onSelectColor: (id: number) => void;
  onSelectSize: (id: number) => void;
  onQuantityChange: (qty: number) => void;
  onNext: () => void;
}

export function VisualProductSelector({
  products,
  colors,
  sizes,
  selectedProductId,
  selectedColorId,
  selectedSizeId,
  quantity,
  isLoadingColors,
  isLoadingSizes,
  onSelectProduct,
  onSelectColor,
  onSelectSize,
  onQuantityChange,
  onNext,
}: VisualProductSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keep slider in sync when a thumbnail is clicked
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    const p = products[index];
    if (p) onSelectProduct(p.id);
  };

  const goToPrev = () => {
    const newIndex = (currentIndex - 1 + products.length) % products.length;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % products.length;
    goToSlide(newIndex);
  };

  // Sync slider to selectedProductId when it changes externally
  useEffect(() => {
    if (selectedProductId) {
      const idx = products.findIndex((p) => p.id === selectedProductId);
      if (idx !== -1 && idx !== currentIndex) setCurrentIndex(idx);
    }
  }, [selectedProductId]);

  // Touch / swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goToNext() : goToPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">No products available</div>
    );
  }

  const currentProduct = products[currentIndex];
  const price = parseFloat(currentProduct.basePrice as string);
  const canProceed = !!selectedProductId && !!selectedColorId && !!selectedSizeId;

  return (
    <div className="space-y-6">
      {/* ── Main image slider ── */}
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-lg select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <div className="relative h-72 sm:h-96 md:h-[480px] flex items-center justify-center bg-white">
          {currentProduct.imageUrl ? (
            <img
              key={currentProduct.id}
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              className="w-full h-full object-contain p-6 transition-opacity duration-300"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p className="text-lg">No image available</p>
            </div>
          )}

          {/* Prev / Next arrows */}
          {products.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black p-2 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                aria-label="Next product"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Selected badge */}
          {selectedProductId === currentProduct.id && (
            <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Selected
            </div>
          )}
        </div>

        {/* Product info bar */}
        <div className="px-5 py-4 bg-white border-t border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-0.5">
                {currentIndex + 1} of {products.length}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {currentProduct.name}
              </h3>
              {currentProduct.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {currentProduct.description}
                </p>
              )}
              {currentProduct.fabricType && (
                <p className="text-xs text-gray-400 mt-0.5">{currentProduct.fabricType}</p>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-black text-accent shrink-0 ml-4">
              R{price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Select this garment button */}
        <div className="px-5 pb-5 bg-white">
          <Button
            onClick={() => onSelectProduct(currentProduct.id)}
            className={`w-full font-bold text-base py-3 transition-all ${
              selectedProductId === currentProduct.id
                ? "bg-accent text-accent-foreground"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            {selectedProductId === currentProduct.id ? "✓ Garment Selected" : "Select This Garment"}
          </Button>
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {products.length > 1 && (
        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
          {products.map((product, index) => (
            <button
              key={product.id}
              onClick={() => goToSlide(index)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? "border-accent shadow-md scale-105"
                  : "border-gray-600 opacity-60 hover:opacity-100 hover:border-gray-400"
              }`}
              aria-label={`View ${product.name}`}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-1 bg-white"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                  No img
                </div>
              )}
              {selectedProductId === product.id && (
                <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Dot indicators ── */}
      {products.length > 1 && (
        <div className="flex gap-2 justify-center">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-accent w-8" : "bg-gray-600 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Colour selection ── */}
      {selectedProductId && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
          <p className="text-white font-semibold text-sm sm:text-base">Select Colour</p>
          {isLoadingColors ? (
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse" />
              ))}
            </div>
          ) : colors.length > 0 ? (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onSelectColor(color.id)}
                  title={color.colorName}
                  aria-label={`Select colour: ${color.colorName}`}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-3 transition-all active:scale-95 relative ${
                    selectedColorId === color.id
                      ? "border-white ring-2 ring-white scale-110 shadow-lg"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color.colorHex }}
                >
                  {selectedColorId === color.id && (
                    <CheckCircle2
                      className="absolute inset-0 m-auto w-4 h-4 drop-shadow"
                      style={{ color: isLight(color.colorHex) ? "#000" : "#fff" }}
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No colours available</p>
          )}
          {selectedColorId && (
            <p className="text-xs text-accent font-medium">
              {colors.find((c) => c.id === selectedColorId)?.colorName}
            </p>
          )}
        </div>
      )}

      {/* ── Size selection ── */}
      {selectedProductId && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
          <p className="text-white font-semibold text-sm sm:text-base">Select Size</p>
          {isLoadingSizes ? (
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-700 animate-pulse" />
              ))}
            </div>
          ) : sizes.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => onSelectSize(size.id)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
                    selectedSizeId === size.id
                      ? "border-accent bg-accent text-black"
                      : "border-gray-600 bg-gray-700 text-white hover:border-gray-400"
                  }`}
                >
                  {size.sizeName}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No sizes available</p>
          )}
        </div>
      )}

      {/* ── Quantity ── */}
      {selectedProductId && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
          <p className="text-white font-semibold text-sm sm:text-base">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center active:scale-95 transition-all"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1) onQuantityChange(val);
              }}
              className="flex-1 h-12 rounded-xl bg-gray-700 border border-gray-600 text-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-12 h-12 rounded-xl bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white font-bold text-xl flex items-center justify-center active:scale-95 transition-all"
            >
              +
            </button>
          </div>
          {quantity >= 50 && (
            <p className="text-xs text-accent font-semibold">
              {quantity >= 100 ? "10% Bulk Discount Applied 🎉" : "5% Bulk Discount Applied 🎉"}
            </p>
          )}
        </div>
      )}

      {/* ── Continue button ── */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        className={`w-full py-4 text-base font-bold rounded-xl transition-all ${
          canProceed
            ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        {canProceed ? "Continue to Print Placement →" : "Select garment, colour & size to continue"}
      </Button>
    </div>
  );
}

// Helper: determine if a hex colour is light (for checkmark contrast)
function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

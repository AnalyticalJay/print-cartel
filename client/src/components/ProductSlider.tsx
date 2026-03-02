import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: number;
  name: string;
  basePrice: string;
  imageUrl: string | null;
  description?: string | null;
}

interface ProductSliderProps {
  products: Product[];
}

export function ProductSlider({ products }: ProductSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay || products.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, products.length]);

  const goToPrevious = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlay(false);
    setCurrentIndex(index);
  };

  if (products.length === 0) {
    return <div className="text-center py-12">No products available</div>;
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="w-full">
      {/* Main Slider */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg">
        {/* Product Image Container */}
        <div className="relative h-96 sm:h-[500px] md:h-[600px] flex items-center justify-center bg-white">
          {currentProduct.imageUrl ? (
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              className="w-full h-full object-contain p-8 transition-transform duration-500"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p className="text-lg">No image available</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Previous product"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-black p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Next product"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                {currentProduct.name}
              </h3>
              {currentProduct.description && (
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {currentProduct.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-accent">
                R{parseFloat(currentProduct.basePrice as any).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex gap-3 sm:gap-4 mt-6 justify-center flex-wrap">
        {products.map((product, index) => (
          <button
            key={product.id}
            onClick={() => goToSlide(index)}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
              index === currentIndex
                ? "border-accent shadow-lg scale-105"
                : "border-gray-300 hover:border-accent opacity-70 hover:opacity-100"
            }`}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Slide Indicators */}
      <div className="flex gap-2 justify-center mt-6">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-accent w-8"
                : "bg-gray-300 w-2 hover:bg-accent/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, ShoppingCart, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { SizeGuideModal } from "./SizeGuideModal";

interface Product {
  id: number;
  name: string;
  basePrice: string;
  imageUrl: string | null;
  description?: string | null;
  fabricType?: string | null;
  productType: string;
}

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  isOpen,
  onClose,
}: ProductQuickViewModalProps) {
  const [, setLocation] = useLocation();
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const colorsQuery = trpc.products.getColors.useQuery(
    { productId: product?.id || 0 },
    { enabled: !!product?.id }
  );
  const sizesQuery = trpc.products.getSizes.useQuery(
    { productId: product?.id || 0 },
    { enabled: !!product?.id }
  );

  if (!product) return null;

  const handleOrderNow = () => {
    onClose();
    setLocation("/order");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Product Image */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-auto max-h-96 object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center py-12">
                <p>No image available</p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Price */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-3xl font-black text-accent">
                R{parseFloat(product.basePrice as any).toFixed(2)}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-foreground">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-3 border-y border-border py-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Product Type
                </p>
                <p className="text-foreground capitalize">{product.productType}</p>
              </div>
              {product.fabricType && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Fabric Type
                  </p>
                  <p className="text-foreground">{product.fabricType}</p>
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-3">
                Available Colors
              </p>
              {colorsQuery.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-muted-foreground">Loading colors...</span>
                </div>
              ) : colorsQuery.data && colorsQuery.data.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {colorsQuery.data.map((color) => (
                    <div key={color.id} className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                        style={{ backgroundColor: color.colorHex }}
                        title={color.colorName}
                      />
                      <p className="text-xs text-center text-muted-foreground truncate w-full">
                        {color.colorName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No colors available</p>
              )}
            </div>

            {/* Sizes */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-3">
                Available Sizes
              </p>
              {sizesQuery.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-muted-foreground">Loading sizes...</span>
                </div>
              ) : sizesQuery.data && sizesQuery.data.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sizesQuery.data.map((size) => (
                    <div
                      key={size.id}
                      className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                    >
                      {size.sizeName}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sizes available</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSizeGuide(true)}
                variant="outline"
                className="flex-1 py-6 font-bold flex items-center justify-center gap-2"
              >
                <Ruler className="w-5 h-5" />
                Size Guide
              </Button>
              <Button
                onClick={handleOrderNow}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-base py-6 font-bold flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Order Now
              </Button>
            </div>

            {/* Size Guide Modal */}
            <SizeGuideModal
              isOpen={showSizeGuide}
              onClose={() => setShowSizeGuide(false)}
              productType={product.productType as "T-Shirt" | "Polo" | "Hoodie"}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Upload, Check } from "lucide-react";

interface Product {
  id: number;
  productName: string;
  basePrice: number;
  image?: string;
}

interface ProductColor {
  id: number;
  colorName: string;
  colorCode: string;
}

interface ProductSize {
  id: number;
  sizeName: string;
}

interface Placement {
  id: number;
  placementName: string;
}

interface PrintOption {
  id: number;
  optionName: string;
  price: number;
}

interface DesignUpload {
  id: string;
  placementId: number;
  placementName: string;
  file: File;
  preview: string;
  uploadedAt: Date;
}

interface LineItemQuantity {
  quantityNumber: number;
  hasCustomDesign: boolean;
  designs: DesignUpload[];
}

interface LineItem {
  id: string;
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  designVariation: "same_across_all" | "different_per_quantity";
  quantities: LineItemQuantity[];
}

type WizardStep = "garment" | "quantity" | "placement" | "variation" | "summary";

export function AdvancedOrderWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("garment");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [currentLineItemIndex, setCurrentLineItemIndex] = useState(0);

  // Step 1: Garment Selection
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Step 2: Placement Selection
  const [selectedPlacements, setSelectedPlacements] = useState<number[]>([]);

  // Step 3: Design Variation
  const [designVariation, setDesignVariation] = useState<"same_across_all" | "different_per_quantity">(
    "same_across_all"
  );

  // Step 4: Design Uploads
  const [uploads, setUploads] = useState<DesignUpload[]>([]);

  const handleAddGarment = useCallback(() => {
    if (!selectedProduct || !selectedColor || !selectedSize) {
      alert("Please select product, color, and size");
      return;
    }

    const newLineItem: LineItem = {
      id: `line-${Date.now()}`,
      productId: selectedProduct,
      colorId: selectedColor,
      sizeId: selectedSize,
      quantity,
      designVariation: "same_across_all",
      quantities: Array.from({ length: quantity }, (_, i) => ({
        quantityNumber: i + 1,
        hasCustomDesign: false,
        designs: [],
      })),
    };

    setLineItems([...lineItems, newLineItem]);
    setCurrentLineItemIndex(lineItems.length);
    setCurrentStep("placement");

    // Reset selections
    setSelectedProduct(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
  }, [selectedProduct, selectedColor, selectedSize, quantity, lineItems]);

  const handlePlacementToggle = useCallback((placementId: number) => {
    setSelectedPlacements((prev) =>
      prev.includes(placementId) ? prev.filter((id) => id !== placementId) : [...prev, placementId]
    );
  }, []);

  const handleDesignUpload = useCallback(
    (file: File, placementId: number, placementName: string, quantityNumber?: number) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const newUpload: DesignUpload = {
          id: `upload-${Date.now()}-${Math.random()}`,
          placementId,
          placementName,
          file,
          preview,
          uploadedAt: new Date(),
        };

        setUploads([...uploads, newUpload]);

        // Update line item with design
        if (currentLineItemIndex !== undefined) {
          const updatedLineItems = [...lineItems];
          const currentLineItem = updatedLineItems[currentLineItemIndex];

          if (currentLineItem) {
            if (designVariation === "same_across_all") {
              // Apply to all quantities
              currentLineItem.quantities.forEach((qty) => {
                qty.designs.push(newUpload);
                qty.hasCustomDesign = true;
              });
            } else if (quantityNumber) {
              // Apply to specific quantity
              const qty = currentLineItem.quantities[quantityNumber - 1];
              if (qty) {
                qty.designs.push(newUpload);
                qty.hasCustomDesign = true;
              }
            }

            setLineItems(updatedLineItems);
          }
        }
      };
      reader.readAsDataURL(file);
    },
    [uploads, currentLineItemIndex, designVariation, lineItems]
  );

  const handleNextStep = useCallback(() => {
    const steps: WizardStep[] = ["garment", "quantity", "placement", "variation", "summary"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    const steps: WizardStep[] = ["garment", "quantity", "placement", "variation", "summary"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const stepIndex = ["garment", "quantity", "placement", "variation", "summary"].indexOf(currentStep);
  const progress = ((stepIndex + 1) / 5) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Order Wizard</CardTitle>
          <CardDescription>Design and order your custom DTF printed garments</CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent>
          {/* Step 1: Garment Selection */}
          {currentStep === "garment" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 1: Select Garment</h3>

              <div className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <Select value={selectedProduct?.toString() || ""} onValueChange={(v) => setSelectedProduct(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a garment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lightweight T-Shirt</SelectItem>
                      <SelectItem value="2">Men's Polo</SelectItem>
                      <SelectItem value="3">Men's Dry Fit Polo</SelectItem>
                      <SelectItem value="4">Hoodie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Color</Label>
                  <Select value={selectedColor?.toString() || ""} onValueChange={(v) => setSelectedColor(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Black</SelectItem>
                      <SelectItem value="2">White</SelectItem>
                      <SelectItem value="3">Navy Blue</SelectItem>
                      <SelectItem value="4">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Size</Label>
                  <Select value={selectedSize?.toString() || ""} onValueChange={(v) => setSelectedSize(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Small</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Large</SelectItem>
                      <SelectItem value="4">XL</SelectItem>
                      <SelectItem value="5">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddGarment} className="flex-1">
                  Add Garment
                </Button>
              </div>

              {lineItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Selected Garments:</h4>
                  <div className="space-y-2">
                    {lineItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-100 rounded">
                        <span>
                          Garment {idx + 1} - {item.quantity}x Qty
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentLineItemIndex(idx);
                            setCurrentStep("placement");
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Placement Selection */}
          {currentStep === "placement" && lineItems.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Step 2: Select Placement Areas (Garment {currentLineItemIndex + 1})
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 1, name: "Front" },
                  { id: 2, name: "Back" },
                  { id: 3, name: "Left Sleeve" },
                  { id: 4, name: "Right Sleeve" },
                ].map((placement) => (
                  <button
                    key={placement.id}
                    onClick={() => handlePlacementToggle(placement.id)}
                    className={`p-4 rounded border-2 transition ${
                      selectedPlacements.includes(placement.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{placement.name}</span>
                      {selectedPlacements.includes(placement.id) && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextStep} disabled={selectedPlacements.length === 0} className="flex-1">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Design Variation */}
          {currentStep === "variation" && lineItems.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Step 3: Design Variation (Garment {currentLineItemIndex + 1})
              </h3>

              <div className="space-y-4">
                <Label>How would you like to apply designs?</Label>

                <div className="space-y-3">
                  <button
                    onClick={() => setDesignVariation("same_across_all")}
                    className={`w-full p-4 rounded border-2 text-left transition ${
                      designVariation === "same_across_all"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="font-semibold">Same Design on All {lineItems[currentLineItemIndex]?.quantity || 1} Items</div>
                    <div className="text-sm text-gray-600">Upload once, apply to all quantities</div>
                  </button>

                  <button
                    onClick={() => setDesignVariation("different_per_quantity")}
                    className={`w-full p-4 rounded border-2 text-left transition ${
                      designVariation === "different_per_quantity"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="font-semibold">Different Design on Some Items</div>
                    <div className="text-sm text-gray-600">Upload unique designs for specific items</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Design Upload */}
          {currentStep === "summary" && lineItems.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 4: Order Summary</h3>

              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-base">Garment {idx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">Quantity:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="font-semibold">Variation:</span> {item.designVariation}
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold">Designs:</span>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {item.quantities.map((qty) =>
                            qty.designs.map((design) => (
                              <div key={design.id} className="relative group">
                                <img
                                  src={design.preview}
                                  alt={design.placementName}
                                  className="w-full h-24 object-cover rounded border"
                                />
                                <Badge className="absolute top-1 left-1">{design.placementName}</Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Submit Order
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { FileUploadZone } from "@/components/FileUploadZone";
import { PricingDisplay, type PricingBreakdownData } from "@/components/PricingDisplay";
import { ColorSelector } from "@/components/ColorSelector";
import { SizeSelector } from "@/components/SizeSelector";
import { DeliveryMethodSelector } from "@/components/DeliveryMethodSelector";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface OrderData {
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  prints: Array<{
    printSizeId: number;
    placementId: number;
    uploadedFilePath: string;
    uploadedFileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  deliveryMethod?: 'collection' | 'delivery';
  deliveryAddress?: string;
  additionalNotes?: string;
  totalPriceEstimate: number;
}

export default function OrderWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [orderData, setOrderData] = useState<Partial<OrderData>>({
    quantity: 1,
    prints: [],
  });
  const [pricingData, setPricingData] = useState<PricingBreakdownData | null>(null);

  const productsQuery = trpc.products.list.useQuery();
  const printOptionsQuery = trpc.products.printOptions.useQuery();
  const printPlacementsQuery = trpc.products.printPlacements.useQuery();
  const productDetailsQuery = trpc.products.getById.useQuery(
    { id: orderData.productId || 0 },
    { enabled: !!orderData.productId }
  );
  const calculatePriceQuery = trpc.products.calculatePrice.useQuery(
    {
      productId: orderData.productId || 0,
      quantity: orderData.quantity || 1,
      printPlacements: orderData.prints?.map((p) => ({ printSizeId: p.printSizeId })) || [],
    },
    {
      enabled: !!orderData.productId && (orderData.prints?.length || 0) > 0,
    }
  );
  const createOrderMutation = trpc.orders.create.useMutation();

  const selectedProduct = orderData.productId
    ? productsQuery.data?.find((p) => p.id === orderData.productId)
    : null;

  const productColors = productDetailsQuery.data?.colors || [];
  const productSizes = productDetailsQuery.data?.sizes || [];
  const placements = printPlacementsQuery.data || [];

  // Update pricing when calculation query completes
  useEffect(() => {
    if (calculatePriceQuery.data) {
      setPricingData(calculatePriceQuery.data);
      setOrderData((prev) => ({
        ...prev,
        totalPriceEstimate: calculatePriceQuery.data.totalPrice,
      }));
    }
  }, [calculatePriceQuery.data]);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    try {
      if (
        !orderData.productId ||
        !orderData.colorId ||
        !orderData.sizeId ||
        !orderData.customerFirstName ||
        !orderData.customerLastName ||
        !orderData.customerEmail ||
        !orderData.customerPhone ||
        !orderData.deliveryMethod ||
        !orderData.totalPriceEstimate
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createOrderMutation.mutateAsync({
        productId: orderData.productId,
        colorId: orderData.colorId,
        sizeId: orderData.sizeId,
        quantity: orderData.quantity || 1,
        prints: orderData.prints || [],
        customerFirstName: orderData.customerFirstName,
        customerLastName: orderData.customerLastName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerCompany: orderData.customerCompany,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        additionalNotes: orderData.additionalNotes,
        totalPriceEstimate: orderData.totalPriceEstimate,
      });

      toast.success("Order submitted successfully!");
      setCurrentStep(1);
      setOrderData({ quantity: 1, prints: [] });
      setPricingData(null);
    } catch (error) {
      toast.error("Failed to submit order");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step === currentStep
                    ? "bg-white text-black"
                    : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Content */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {currentStep === 1 && "Step 1: Choose Garment"}
                  {currentStep === 2 && "Step 2: Select Print Options"}
                  {currentStep === 3 && "Step 3: Upload Design"}
                  {currentStep === 4 && "Step 4: Live Preview"}
                  {currentStep === 5 && "Step 5: Contact Details"}
                  {currentStep === 6 && "Step 6: Delivery Method"}
                  {currentStep === 7 && "Step 7: Order Summary"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Select your product, color, size, and quantity"}
                  {currentStep === 2 && "Choose print placements and sizes"}
                  {currentStep === 3 && "Upload your design file"}
                  {currentStep === 4 && "Preview your design on the garment"}
                  {currentStep === 5 && "Enter your contact information"}
                  {currentStep === 6 && "Choose collection or delivery"}
                  {currentStep === 7 && "Review and submit your order"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Choose Garment */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Product</Label>
                      <Select
                        value={orderData.productId?.toString() || ""}
                        onValueChange={(value) =>
                          setOrderData({ ...orderData, productId: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsQuery.data?.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - R{parseFloat(product.basePrice as any).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProduct && (
                      <>
                        {productDetailsQuery.isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        ) : (
                          <>
                            <ColorSelector
                              colors={productColors}
                              selectedColorId={orderData.colorId || null}
                              onColorSelect={(colorId) =>
                                setOrderData({ ...orderData, colorId })
                              }
                            />

                            <SizeSelector
                              sizes={productSizes}
                              selectedSizeId={orderData.sizeId || null}
                              onSizeSelect={(sizeId) =>
                                setOrderData({ ...orderData, sizeId })
                              }
                            />
                          </>
                        )}

                        <div>
                          <Label className="text-white">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={orderData.quantity || 1}
                            onChange={(e) =>
                              setOrderData({
                                ...orderData,
                                quantity: parseInt(e.target.value) || 1,
                              })
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Select Print Options */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-gray-300">Add print placements for your design</p>
                    {orderData.prints && orderData.prints.length > 0 && (
                      <div className="space-y-3">
                        {orderData.prints.map((print, index) => (
                          <Card key={index} className="bg-gray-700 border-gray-600">
                            <CardContent className="pt-6 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-white text-sm">Placement</Label>
                                  <Select
                                    value={print.placementId?.toString() || ""}
                                    onValueChange={(value) => {
                                      const updated = [...(orderData.prints || [])];
                                      updated[index].placementId = parseInt(value);
                                      setOrderData({ ...orderData, prints: updated });
                                    }}
                                  >
                                    <SelectTrigger className="bg-gray-600 border-gray-500 text-white text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {printPlacementsQuery.data?.map((placement) => (
                                        <SelectItem key={placement.id} value={placement.id.toString()}>
                                          {placement.placementName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-white text-sm">Print Size</Label>
                                  <Select
                                    value={print.printSizeId?.toString() || ""}
                                    onValueChange={(value) => {
                                      const updated = [...(orderData.prints || [])];
                                      updated[index].printSizeId = parseInt(value);
                                      setOrderData({ ...orderData, prints: updated });
                                    }}
                                  >
                                    <SelectTrigger className="bg-gray-600 border-gray-500 text-white text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {printOptionsQuery.data?.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>
                                          {option.printSize} (+R{parseFloat(option.additionalPrice as any).toFixed(2)})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <Button
                                onClick={() => {
                                  const updated = orderData.prints?.filter((_, i) => i !== index) || [];
                                  setOrderData({ ...orderData, prints: updated });
                                }}
                                variant="destructive"
                                size="sm"
                                className="w-full"
                              >
                                Remove
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (orderData.prints) {
                          setOrderData({
                            ...orderData,
                            prints: [
                              ...orderData.prints,
                              {
                                printSizeId: 1,
                                placementId: 1,
                                uploadedFilePath: "",
                                uploadedFileName: "",
                                fileSize: 0,
                                mimeType: "",
                              },
                            ],
                          });
                        }
                      }}
                      className="bg-white text-black hover:bg-gray-200 w-full"
                    >
                      + Add Print Placement
                    </Button>
                  </div>
                )}

                {/* Step 3: Upload Design */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-gray-300">Upload artwork for each placement</p>
                    {orderData.prints && orderData.prints.length > 0 ? (
                      <div className="space-y-4">
                        {orderData.prints.map((print, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg space-y-2">
                            <p className="text-white font-semibold">
                              {placements.find((p) => p.id === print.placementId)?.placementName || "Placement"}
                            </p>
                            <FileUploadZone
                              maxFiles={1}
                              onFileUpload={(file) => {
                                const updatedPrints = [...(orderData.prints || [])];
                                updatedPrints[index] = {
                                  ...updatedPrints[index],
                                  uploadedFilePath: file.url,
                                  uploadedFileName: file.name,
                                  fileSize: file.fileSize,
                                  mimeType: file.mimeType,
                                };
                                setOrderData({ ...orderData, prints: updatedPrints });
                              }}
                              onValidationWarnings={(warnings) => {
                                if (warnings.length > 0) {
                                  toast.warning(`${warnings.length} quality warning(s) detected`);
                                }
                              }}
                            />
                            {print.uploadedFilePath && (
                              <p className="text-sm text-green-400">✓ {print.uploadedFileName}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">Add print placements in Step 2 first</p>
                    )}
                  </div>
                )}

                {/* Step 4: Live Preview */}
                {currentStep === 4 && selectedProduct && (
                  <div className="space-y-4">
                    <PreviewCanvas
                      productName={selectedProduct.name}
                      productImageUrl={selectedProduct.imageUrl}
                      garmentColor={productColors.find((c) => c.id === orderData.colorId)?.colorHex || "#000000"}
                      prints={(orderData.prints || []).map((print) => ({
                        placement: placements.find((p) => p.id === print.placementId)?.placementName || "front",
                        uploadedFilePath: print.uploadedFilePath,
                      }))}
                    />
                  </div>
                )}

                {/* Step 5: Contact Details */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white">First Name</Label>
                        <Input
                          value={orderData.customerFirstName || ""}
                          onChange={(e) =>
                            setOrderData({ ...orderData, customerFirstName: e.target.value })
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Last Name</Label>
                        <Input
                          value={orderData.customerLastName || ""}
                          onChange={(e) =>
                            setOrderData({ ...orderData, customerLastName: e.target.value })
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Email</Label>
                      <Input
                        type="email"
                        value={orderData.customerEmail || ""}
                        onChange={(e) =>
                          setOrderData({ ...orderData, customerEmail: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Phone</Label>
                      <Input
                        value={orderData.customerPhone || ""}
                        onChange={(e) =>
                          setOrderData({ ...orderData, customerPhone: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Company (Optional)</Label>
                      <Input
                        value={orderData.customerCompany || ""}
                        onChange={(e) =>
                          setOrderData({ ...orderData, customerCompany: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Additional Notes</Label>
                      <Textarea
                        value={orderData.additionalNotes || ""}
                        onChange={(e) =>
                          setOrderData({ ...orderData, additionalNotes: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Delivery Method */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <DeliveryMethodSelector
                      selectedMethod={orderData.deliveryMethod as 'collection' | 'delivery' | null}
                      onSelect={(method) => {
                        setOrderData({ ...orderData, deliveryMethod: method });
                        if (method === 'delivery') {
                          setOrderData((prev) => ({ ...prev, deliveryAddress: '' }));
                        }
                      }}
                    />
                    {orderData.deliveryMethod === 'delivery' && (
                      <div>
                        <Label className="text-white">Delivery Address</Label>
                        <Textarea
                          value={orderData.deliveryAddress || ''}
                          onChange={(e) =>
                            setOrderData({ ...orderData, deliveryAddress: e.target.value })
                          }
                          placeholder="Enter your full delivery address"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 7: Order Summary */}
                {currentStep === 7 && (
                  <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                      <p className="text-white">
                        <strong>Product:</strong> {selectedProduct?.name}
                      </p>
                      <p className="text-white">
                        <strong>Quantity:</strong> {orderData.quantity}
                      </p>
                      <p className="text-white">
                        <strong>Customer:</strong> {orderData.customerFirstName} {orderData.customerLastName}
                      </p>
                      <p className="text-white">
                        <strong>Email:</strong> {orderData.customerEmail}
                      </p>
                      <p className="text-white">
                        <strong>Print Placements:</strong> {orderData.prints?.length || 0}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    variant="outline"
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  {currentStep === 7 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={createOrderMutation.isPending}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-1">
            <PricingDisplay
              pricing={pricingData}
              isLoading={calculatePriceQuery.isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

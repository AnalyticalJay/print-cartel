"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface PrintSelection {
  placementId: number;
  printSizeId: number;
  designFile?: File;
  designFileName?: string;
  uploadedFilePath?: string;
  uploadedFileName?: string;
}

interface OrderData {
  productId: number | null;
  colorId: number | null;
  sizeId: number | null;
  quantity: number;
  printSelections: PrintSelection[];
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  deliveryMethod?: "collection" | "delivery";
  deliveryAddress?: string;
  additionalNotes?: string;
}

// Calculate bulk discount percentage
const calculateBulkDiscount = (quantity: number): number => {
  if (quantity >= 500) return 0; // Custom pricing
  if (quantity >= 100) return 0.1; // 10% discount
  if (quantity >= 50) return 0.05; // 5% discount
  return 0; // No discount
};

// Get bulk pricing label
const getBulkPricingLabel = (quantity: number): string => {
  if (quantity >= 500) return "Custom pricing available - Contact sales";
  if (quantity >= 100) return "10% Reseller Discount Applied";
  if (quantity >= 50) return "5% Reseller Discount Applied";
  return "Standard Pricing";
};

export default function OrderWizard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [orderData, setOrderData] = useState<OrderData>({
    productId: null,
    colorId: null,
    sizeId: null,
    quantity: 1,
    printSelections: [],
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
  });

  // Fetch products
  const productsQuery = trpc.products.list.useQuery();

  // Fetch colors for selected product
  const colorsQuery = trpc.products.getColors.useQuery(
    { productId: orderData.productId || 0 },
    { enabled: !!orderData.productId && orderData.productId > 0 }
  );

  // Fetch sizes for selected product
  const sizesQuery = trpc.products.getSizes.useQuery(
    { productId: orderData.productId || 0 },
    { enabled: !!orderData.productId && orderData.productId > 0 }
  );

  // Fetch print placements
  const placementsQuery = trpc.products.printPlacements.useQuery();

  // Fetch print options (sizes)
  const printOptionsQuery = trpc.products.getPrintOptions.useQuery();

  const createOrderMutation = trpc.orders.create.useMutation();

  const selectedProduct = productsQuery.data?.find((p) => p.id === orderData.productId);
  const productColors = colorsQuery.data || [];
  const productSizes = sizesQuery.data || [];
  const placements = placementsQuery.data || [];
  const printOptions = printOptionsQuery.data || [];

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Login Required</h1>
          <p className="text-gray-300 mb-8">You need to create an account or login to place an order.</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 py-3"
            size="lg"
          >
            Login / Register
          </Button>
        </div>
      </div>
    );
  }

  const handleAddPrintSelection = (placementId: number, printSizeId: number) => {
    const exists = orderData.printSelections.some(
      (p) => p.placementId === placementId && p.printSizeId === printSizeId
    );
    if (!exists) {
      setOrderData({
        ...orderData,
        printSelections: [...orderData.printSelections, { placementId, printSizeId }],
      });
    }
  };

  const handleRemovePrintSelection = (index: number) => {
    setOrderData({
      ...orderData,
      printSelections: orderData.printSelections.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = (index: number, file: File) => {
    const updatedSelections = [...orderData.printSelections];
    updatedSelections[index] = {
      ...updatedSelections[index],
      designFile: file,
      designFileName: file.name,
    };
    setOrderData({
      ...orderData,
      printSelections: updatedSelections,
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!orderData.productId || !orderData.colorId || !orderData.sizeId) {
        toast.error("Please select product, color, and size");
        return;
      }
    } else if (currentStep === 2) {
      if (orderData.printSelections.length === 0) {
        toast.error("Please select at least one print placement and size");
        return;
      }
    } else if (currentStep === 3) {
      if (orderData.printSelections.some((p) => !p.designFileName)) {
        toast.error("Please upload design files for all print selections");
        return;
      }
    } else if (currentStep === 4) {
      if (!orderData.customerFirstName || !orderData.customerLastName || !orderData.customerEmail || !orderData.customerPhone) {
        toast.error("Please fill in all contact details");
        return;
      }
    } else if (currentStep === 5) {
      if (!orderData.deliveryMethod) {
        toast.error("Please select delivery method");
        return;
      }
    }
    setCurrentStep((currentStep + 1) as Step);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmitOrder = async () => {
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
        orderData.printSelections.length === 0
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createOrderMutation.mutateAsync({
        productId: orderData.productId,
        colorId: orderData.colorId,
        sizeId: orderData.sizeId,
        quantity: orderData.quantity || 1,
        prints: orderData.printSelections.map((p) => ({
          placementId: p.placementId,
          printSizeId: p.printSizeId,
          uploadedFilePath: p.uploadedFilePath || "",
          uploadedFileName: p.uploadedFileName || "",
          fileSize: p.designFile?.size,
          mimeType: p.designFile?.type,
        })),
        totalPriceEstimate: totalPrice,
        customerFirstName: orderData.customerFirstName,
        customerLastName: orderData.customerLastName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerCompany: orderData.customerCompany,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        additionalNotes: orderData.additionalNotes,
      });

      toast.success("Order placed successfully!");
      setCurrentStep(7);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
    }
  };

  // Calculate pricing
  const basePrice = selectedProduct ? parseFloat(selectedProduct.basePrice as string) : 0;
  const printSizePrice = orderData.printSelections.reduce((total, selection) => {
    const printOption = printOptions.find((p) => p.id === selection.printSizeId);
    return total + (printOption ? (typeof printOption.additionalPrice === 'string' ? parseFloat(printOption.additionalPrice) : printOption.additionalPrice) : 0);
  }, 0);
  const bulkDiscount = calculateBulkDiscount(orderData.quantity);
  const subtotal = (basePrice + printSizePrice) * orderData.quantity;
  const discountAmount = subtotal * bulkDiscount;
  const totalPrice = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                  step <= currentStep ? "bg-accent" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm">
            Step {currentStep} of 7
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Select Garment */}
            {currentStep === 1 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Select Your Garment</CardTitle>
                  <CardDescription>Choose product, color, size, and quantity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Selection */}
                  <div>
                    <Label className="text-white font-semibold mb-3 block">Select Product</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {productsQuery.data?.map((product) => (
                        <button
                          key={product.id}
                          onClick={() =>
                            setOrderData({
                              ...orderData,
                              productId: product.id,
                              colorId: null,
                              sizeId: null,
                            })
                          }
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            orderData.productId === product.id
                              ? "border-accent bg-accent/10"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <p className="text-white font-semibold text-sm">{product.name}</p>
                          <p className="text-gray-300 text-xs mt-1">{product.productType}</p>
                          <p className="text-accent font-bold mt-2">R{product.basePrice}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  {orderData.productId && (
                    <div>
                      <Label className="text-white font-semibold mb-3 block">Select Color</Label>
                      {productColors.length > 0 ? (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                          {productColors.map((color: any) => (
                            <button
                              key={color.id}
                              onClick={() => setOrderData({ ...orderData, colorId: color.id })}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                orderData.colorId === color.id
                                  ? "border-white"
                                  : "border-gray-600"
                              }`}
                              style={{ backgroundColor: color.colorHex }}
                              title={color.colorName}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No colors available for this product</p>
                      )}
                    </div>
                  )}

                  {/* Size Selection */}
                  {orderData.productId && (
                    <div>
                      <Label className="text-white font-semibold mb-3 block">Select Size</Label>
                      {productSizes.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {productSizes.map((size: any) => (
                            <button
                              key={size.id}
                              onClick={() => setOrderData({ ...orderData, sizeId: size.id })}
                              className={`p-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                                orderData.sizeId === size.id
                                  ? "border-accent bg-accent text-black"
                                  : "border-gray-600 bg-gray-700 text-white hover:border-gray-500"
                              }`}
                            >
                              {size.sizeName}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No sizes available for this product</p>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <Label className="text-white font-semibold mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={orderData.quantity}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Print Placement & Size */}
            {currentStep === 2 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Select Print Placement & Size</CardTitle>
                  <CardDescription>Choose where and how large to print your design</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {placements.map((placement: any) => (
                    <div key={placement.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                      <h3 className="text-white font-semibold mb-3">{placement.placementName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {printOptions.map((option: any) => (
                          <button
                            key={option.id}
                            onClick={() => handleAddPrintSelection(placement.id, option.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                              orderData.printSelections.some(
                                (p) => p.placementId === placement.id && p.printSizeId === option.id
                              )
                                ? "border-accent bg-accent text-black"
                                : "border-gray-600 bg-gray-600 text-white hover:border-gray-500"
                            }`}
                          >
                            <div>{option.printSize}</div>
                            <div className="text-xs font-normal">+R{option.additionalPrice}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Selected Print Selections */}
                  {orderData.printSelections.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                      <h3 className="text-white font-semibold mb-3">Selected Print Options:</h3>
                      <div className="space-y-2">
                        {orderData.printSelections.map((selection, index) => {
                          const placement = placements.find((p: any) => p.id === selection.placementId);
                          const option = printOptions.find((o: any) => o.id === selection.printSizeId);
                          return (
                            <div key={index} className="flex justify-between items-center bg-gray-600 p-2 rounded">
                              <span className="text-white text-sm">
                                {placement?.placementName} - {option?.printSize}
                              </span>
                              <button
                                onClick={() => handleRemovePrintSelection(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Upload Design Files */}
            {currentStep === 3 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Upload Design Files</CardTitle>
                  <CardDescription>Upload a design file for each print selection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                      {orderData.printSelections.map((selection, index) => {
                        const placement = placements.find((p: any) => p.id === selection.placementId);
                        const option = printOptions.find((o: any) => o.id === selection.printSizeId);
                    return (
                      <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                        <h3 className="text-white font-semibold mb-3">
                          {placement?.placementName} - {option?.printSize}
                        </h3>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id={`file-${index}`}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(index, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            accept="image/*,.pdf"
                          />
                          <label htmlFor={`file-${index}`} className="cursor-pointer">
                            {selection.designFileName ? (
                              <div className="text-white">
                                <p className="font-semibold">{selection.designFileName}</p>
                                <p className="text-gray-400 text-sm mt-1">Click to change</p>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-white font-semibold">Drag and drop or click to upload</p>
                                <p className="text-gray-400 text-sm mt-1">PNG, JPG, PDF up to 50MB</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Your Details */}
            {currentStep === 4 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Your Details</CardTitle>
                  <CardDescription>Enter your contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-semibold mb-2 block">First Name</Label>
                      <Input
                        value={orderData.customerFirstName}
                        onChange={(e) =>
                          setOrderData({ ...orderData, customerFirstName: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-semibold mb-2 block">Last Name</Label>
                      <Input
                        value={orderData.customerLastName}
                        onChange={(e) =>
                          setOrderData({ ...orderData, customerLastName: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-semibold mb-2 block">Email</Label>
                    <Input
                      type="email"
                      value={orderData.customerEmail}
                      onChange={(e) =>
                        setOrderData({ ...orderData, customerEmail: e.target.value })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-semibold mb-2 block">Phone</Label>
                    <Input
                      value={orderData.customerPhone}
                      onChange={(e) =>
                        setOrderData({ ...orderData, customerPhone: e.target.value })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-semibold mb-2 block">Company (Optional)</Label>
                    <Input
                      value={orderData.customerCompany || ""}
                      onChange={(e) =>
                        setOrderData({ ...orderData, customerCompany: e.target.value })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Delivery Method */}
            {currentStep === 5 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Delivery Method</CardTitle>
                  <CardDescription>Choose how you want to receive your order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <button
                      onClick={() => setOrderData({ ...orderData, deliveryMethod: "collection" })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        orderData.deliveryMethod === "collection"
                          ? "border-accent bg-accent/10"
                          : "border-gray-600 bg-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <p className="text-white font-semibold">Collection</p>
                      <p className="text-gray-400 text-sm">Pick up from our office</p>
                    </button>
                    <button
                      onClick={() => setOrderData({ ...orderData, deliveryMethod: "delivery" })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        orderData.deliveryMethod === "delivery"
                          ? "border-accent bg-accent/10"
                          : "border-gray-600 bg-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <p className="text-white font-semibold">Delivery</p>
                      <p className="text-gray-400 text-sm">We'll deliver to your address</p>
                    </button>
                  </div>

                  {orderData.deliveryMethod === "delivery" && (
                    <div>
                      <Label className="text-white font-semibold mb-2 block">Delivery Address</Label>
                      <Textarea
                        value={orderData.deliveryAddress || ""}
                        onChange={(e) =>
                          setOrderData({ ...orderData, deliveryAddress: e.target.value })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={4}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-white font-semibold mb-2 block">Additional Notes (Optional)</Label>
                    <Textarea
                      value={orderData.additionalNotes || ""}
                      onChange={(e) =>
                        setOrderData({ ...orderData, additionalNotes: e.target.value })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 6: Review Order */}
            {currentStep === 6 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Review Your Order</CardTitle>
                  <CardDescription>Please verify all details before confirming</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between text-white">
                      <span>Product:</span>
                      <span className="font-semibold">{selectedProduct?.name}</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Quantity:</span>
                      <span className="font-semibold">{orderData.quantity} units</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Print Selections:</span>
                      <span className="font-semibold">{orderData.printSelections.length}</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Name:</span>
                      <span className="font-semibold">
                        {orderData.customerFirstName} {orderData.customerLastName}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Email:</span>
                      <span className="font-semibold">{orderData.customerEmail}</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Delivery:</span>
                      <span className="font-semibold capitalize">{orderData.deliveryMethod}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Order Confirmed */}
            {currentStep === 7 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-center">Order Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-300">Thank you for your order. We'll be in touch shortly with more details.</p>
                  <Button
                    onClick={() => setLocation("/")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    Return to Home
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProduct && (
                  <>
                    <div className="space-y-2 border-b border-gray-700 pb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Product:</span>
                        <span>{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Base Price:</span>
                        <span>R{selectedProduct.basePrice}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Quantity:</span>
                        <span>{orderData.quantity}</span>
                      </div>
                      {printSizePrice > 0 && (
                        <div className="flex justify-between text-gray-300">
                          <span>Print Size Cost:</span>
                          <span>R{printSizePrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 border-b border-gray-700 pb-4">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal:</span>
                        <span>R{subtotal.toFixed(2)}</span>
                      </div>
                      {bulkDiscount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount ({(bulkDiscount * 100).toFixed(0)}%):</span>
                          <span>-R{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{getBulkPricingLabel(orderData.quantity)}</p>
                    </div>

                    <div className="flex justify-between text-white font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-accent">R{totalPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <ChevronLeft size={20} className="mr-2" />
            Previous
          </Button>

          {currentStep === 6 ? (
            <Button
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  Confirm Order
                  <ChevronRight size={20} className="ml-2" />
                </>
              )}
            </Button>
          ) : currentStep < 7 ? (
            <Button
              onClick={handleNextStep}
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              Next
              <ChevronRight size={20} className="ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

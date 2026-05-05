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
import { Loader2, ChevronRight, ChevronLeft, Upload, X, ChevronDown, Sparkles, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

import { useOrderCart } from "@/hooks/useOrderCart";
import { OrderCartSummary } from "@/components/OrderCartSummary";
import { PrintPlacementSelector } from "@/components/PrintPlacementSelector";
import { FileUploadValidator } from "@/components/FileUploadValidator";

type Step = 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 7;

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
  const { addItem, items: cartItems } = useOrderCart();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [expandedPlacement, setExpandedPlacement] = useState<number | null>(null);

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

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success('Order placed successfully!');
      setCurrentStep(7);
      setTimeout(() => setLocation('/dashboard'), 2000);
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    },
  });
  const createMultiItemMutation = trpc.orders.createMultiItem.useMutation({
    onSuccess: () => {
      toast.success('Order placed successfully!');
      setCurrentStep(7);
      setTimeout(() => setLocation('/dashboard'), 2000);
    },
    onError: (error) => {
      console.error('Multi-item order creation error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    },
  });

  const selectedProduct = productsQuery.data?.find((p) => p.id === orderData.productId);
  const productColors = colorsQuery.data || [];
  const productSizes = sizesQuery.data || [];
  const placements = placementsQuery.data || [];
  // Filter print options to show only first 4 (without brackets)
  const allPrintOptions = printOptionsQuery.data || [];
  const printOptions = allPrintOptions.filter((opt: any) => !opt.printSize.includes('(') && !opt.printSize.includes(')')).slice(0, 4);

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

  const handleFileUpload = (index: number, file: File, s3Url: string) => {
    const updatedSelections = [...orderData.printSelections];
    updatedSelections[index] = {
      ...updatedSelections[index],
      designFile: file,
      designFileName: file.name,
      uploadedFilePath: s3Url,
      uploadedFileName: file.name,
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

  const handleAddToCart = () => {
    if (
      !orderData.productId ||
      !orderData.colorId ||
      !orderData.sizeId ||
      orderData.printSelections.length === 0
    ) {
      toast.error("Please complete the garment selection and placement before adding to cart");
      return;
    }

    const selectedColor = productColors.find((c) => c.id === orderData.colorId);
    const selectedSize = productSizes.find((s) => s.id === orderData.sizeId);
    const selectedPlacement = placements.find((p) => p.id === orderData.printSelections[0]?.placementId);
    const selectedPrintSize = printOptions.find((p) => p.id === orderData.printSelections[0]?.printSizeId);

    // Ensure printSelections[0] exists before accessing properties
    const firstSelection = orderData.printSelections[0];
    if (!firstSelection) {
      toast.error("Please select a placement before adding to cart");
      return;
    }

    addItem({
      id: `${Date.now()}-${Math.random()}`,
      productId: orderData.productId,
      colorId: orderData.colorId,
      sizeId: orderData.sizeId,
      quantity: orderData.quantity,
      placementId: firstSelection.placementId,
      printSizeId: firstSelection.printSizeId,
      unitPrice: basePrice,
      productName: selectedProduct?.name,
      colorName: selectedColor?.colorName,
      sizeName: selectedSize?.sizeName,
      placementName: selectedPlacement?.placementName,
      printSizeName: selectedPrintSize?.printSize,
      // Store all print selections so submission can use the real DB IDs
      printSelections: orderData.printSelections.map((p) => ({
        placementId: p.placementId,
        printSizeId: p.printSizeId,
        designFile: p.designFile,
        designFileName: p.designFileName,
        uploadedFilePath: p.uploadedFilePath,
        uploadedFileName: p.uploadedFileName,
      })),
    });

    toast.success(`Added ${orderData.quantity} ${selectedProduct?.name}(s) to cart`);
    setCurrentStep(1);
  };

  const handleSubmitOrder = async () => {
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

    // If cart has items, submit as multi-item order
    if (cartItems.length > 0) {
      // Prepare cart items for submission
      const cartItemsForSubmission = cartItems.map(item => ({
        productId: item.productId,
        colorId: item.colorId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        printSelections: (item.printSelections || []).map((p: any) => ({
          placementId: p.placementId,
          printSizeId: p.printSizeId,
          uploadedFilePath: p.uploadedFilePath || "",
          uploadedFileName: p.uploadedFileName || "",
          fileSize: p.designFile?.size,
          mimeType: p.designFile?.type,
        })),
        subtotal: item.subtotal || (item.unitPrice * item.quantity),
      }));

      createMultiItemMutation.mutate({
        cartItems: cartItemsForSubmission,
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
    } else {
      // Single item order (legacy)
      createOrderMutation.mutate({
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
      } as any);
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
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-3 md:mb-4 gap-1">
            {[1, 1.5, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 md:h-2 rounded-full transition-all ${
                  step <= currentStep ? "bg-accent" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-200 text-xs md:text-sm font-medium">
            Step {currentStep === 1.5 ? "1" : currentStep} of 7
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Select Garment */}
            {currentStep === 1 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl text-white">Select Your Garment</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Choose product, color, size, and quantity</CardDescription>

                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Product Selection */}
                  <div>
                    <Label className="text-white font-semibold mb-2 md:mb-3 block text-sm md:text-base">Select Product</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {productsQuery.data?.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setOrderData({ ...orderData, productId: product.id, colorId: null, sizeId: null })}
                          className={`p-3 md:p-4 rounded-lg border-2 transition-all text-center active:scale-95 ${
                            orderData.productId === product.id
                              ? "border-accent bg-accent/20"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <p className="text-white font-semibold text-xs md:text-sm">{product.name}</p>
                          <p className="text-gray-300 text-xs mt-1">{product.productType}</p>
                          <p className="text-accent font-bold mt-2 text-sm md:text-base">R{product.basePrice}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  {orderData.productId && (
                    <div>
                      <Label className="text-white font-semibold mb-2 md:mb-3 block text-sm md:text-base">Select Color</Label>
                      {productColors.length > 0 ? (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
                          {productColors.map((color: any) => (
                            <button
                              key={color.id}
                              onClick={() => setOrderData({ ...orderData, colorId: color.id })}
                              className={`w-14 h-14 md:w-12 md:h-12 rounded-lg border-2 transition-all active:scale-95 ${
                                orderData.colorId === color.id
                                  ? "border-white"
                                  : "border-gray-600"
                              }`}
                              style={{ backgroundColor: color.colorHex }}
                              title={color.colorName}
                              aria-label={`Select color: ${color.colorName}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-200">No colors available for this product</p>
                      )}
                    </div>
                  )}

                  {/* Size Selection */}
                  {orderData.productId && (
                    <div>
                      <Label className="text-white font-semibold mb-2 md:mb-3 block text-sm md:text-base">Select Size</Label>
                      {productSizes.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-2">
                          {productSizes.map((size: any) => (
                            <button
                              key={size.id}
                              onClick={() => setOrderData({ ...orderData, sizeId: size.id })}
                              className={`p-2 md:p-2 rounded-lg border-2 transition-all text-xs md:text-sm font-semibold active:scale-95 ${
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
                        <p className="text-gray-200">No sizes available for this product</p>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <Label className="text-white font-semibold mb-2 md:mb-3 block text-sm md:text-base">Quantity</Label>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Button
                        type="button"
                        onClick={() =>
                          setOrderData({
                            ...orderData,
                            quantity: Math.max(1, orderData.quantity - 1),
                          })
                        }
                        variant="outline"
                        size="icon"
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white h-12 w-12 md:h-10 md:w-10 active:scale-95"
                      >
                        <Minus className="w-5 md:w-4 h-5 md:h-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={orderData.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setOrderData({
                              ...orderData,
                              quantity: val,
                            });
                          }
                        }}
                        className="bg-gray-700 border-gray-600 text-white text-center font-semibold text-base md:text-lg flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() =>
                          setOrderData({
                            ...orderData,
                            quantity: orderData.quantity + 1,
                          })
                        }
                        variant="outline"
                        size="icon"
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white h-12 w-12 md:h-10 md:w-10 active:scale-95"
                      >
                        <Plus className="w-5 md:w-4 h-5 md:h-4" />
                      </Button>
                    </div>
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
                <CardContent>
                  <PrintPlacementSelector
                    placements={placements}
                    printOptions={printOptions}
                    printSelections={orderData.printSelections}
                    onAddSelection={handleAddPrintSelection}
                    onRemoveSelection={handleRemovePrintSelection}
                  />
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
                      <FileUploadValidator
                        key={index}
                        placement={placement?.placementName || "Unknown"}
                        printSize={option?.printSize || "Unknown"}
                        uploadedFileName={selection.designFileName}
                        uploadedFileUrl={selection.uploadedFilePath}
                        onFileUpload={(file, s3Url) => handleFileUpload(index, file, s3Url)}
                        onRemoveFile={() => {
                          const updated = [...orderData.printSelections];
                          updated[index] = {
                            ...updated[index],
                            designFile: undefined,
                            designFileName: undefined,
                            uploadedFilePath: undefined,
                            uploadedFileName: undefined,
                          };
                          setOrderData({ ...orderData, printSelections: updated });
                        }}
                      />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">First Name</Label>
                      <Input
                        value={orderData.customerFirstName}
                        onChange={(e) =>
                          setOrderData({
                            ...orderData,
                            customerFirstName: e.target.value,
                          })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Last Name</Label>
                      <Input
                        value={orderData.customerLastName}
                        onChange={(e) =>
                          setOrderData({
                            ...orderData,
                            customerLastName: e.target.value,
                          })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Email</Label>
                    <Input
                      type="email"
                      value={orderData.customerEmail}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          customerEmail: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Phone</Label>
                    <Input
                      value={orderData.customerPhone}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          customerPhone: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Company (Optional)</Label>
                    <Input
                      value={orderData.customerCompany || ""}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          customerCompany: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Additional Notes (Optional)</Label>
                    <Textarea
                      value={orderData.additionalNotes || ""}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          additionalNotes: e.target.value,
                        })
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
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
                  <div
                    onClick={() =>
                      setOrderData({
                        ...orderData,
                        deliveryMethod: "collection",
                        deliveryAddress: undefined,
                      })
                    }
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      orderData.deliveryMethod === "collection"
                        ? "border-accent bg-accent/20"
                        : "border-gray-600 bg-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <p className="text-white font-semibold">Collection</p>
                    <p className="text-gray-200 text-sm mt-1">
                      Collect from our office at 308 Cape Road, Newton Park
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setOrderData({
                        ...orderData,
                        deliveryMethod: "delivery",
                      })
                    }
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      orderData.deliveryMethod === "delivery"
                        ? "border-accent bg-accent/20"
                        : "border-gray-600 bg-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <p className="text-white font-semibold">Delivery</p>
                    <p className="text-gray-200 text-sm mt-1">
                      We'll deliver to your address
                    </p>
                  </div>

                  {orderData.deliveryMethod === "delivery" && (
                    <div>
                      <Label className="text-white">Delivery Address</Label>
                      <Textarea
                        value={orderData.deliveryAddress || ""}
                        onChange={(e) =>
                          setOrderData({
                            ...orderData,
                            deliveryAddress: e.target.value,
                          })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 6: Review Order */}
            {currentStep === 6 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Review Your Order</CardTitle>
                  <CardDescription>Please review all details before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-3">Cart Items ({cartItems.length})</h3>
                      <OrderCartSummary />
                    </div>
                  )}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-200">Product:</span>
                        <span className="text-white">{selectedProduct?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Quantity:</span>
                        <span className="text-white">{orderData.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Print Options:</span>
                        <span className="text-white">{orderData.printSelections.length}</span>
                      </div>
                      <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between">
                        <span className="text-gray-200">Subtotal:</span>
                        <span className="text-white">R{subtotal.toFixed(2)}</span>
                      </div>
                      {bulkDiscount > 0 && (
                        <div className="flex justify-between text-accent">
                          <span>Bulk Discount ({(bulkDiscount * 100).toFixed(0)}%):</span>
                          <span>-R{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-accent text-lg">R{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-200">Name:</span>
                        <span className="text-white">
                          {orderData.customerFirstName} {orderData.customerLastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Email:</span>
                        <span className="text-white">{orderData.customerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-200">Phone:</span>
                        <span className="text-white">{orderData.customerPhone}</span>
                      </div>
                      {orderData.customerCompany && (
                        <div className="flex justify-between">
                          <span className="text-gray-200">Company:</span>
                          <span className="text-white">{orderData.customerCompany}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Delivery</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-200">Method:</span>
                        <span className="text-white capitalize">
                          {orderData.deliveryMethod}
                        </span>
                      </div>
                      {orderData.deliveryMethod === "delivery" && orderData.deliveryAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-200">Address:</span>
                          <span className="text-white text-right">{orderData.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Order Confirmed */}
            {currentStep === 7 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Confirmed!</CardTitle>
                  <CardDescription>Thank you for your order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Order Submitted Successfully</h2>
                    <p className="text-gray-200 mb-4">
                      We've received your order and will review it shortly. You'll receive an email confirmation with all the details.
                    </p>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-white font-semibold mb-2">What happens next?</p>
                    <ol className="text-gray-200 text-sm space-y-2">
                      <li>1. We'll review your artwork and specifications</li>
                      <li>2. Our team will prepare a quote for your order</li>
                      <li>3. You'll receive an email with the final quote</li>
                      <li>4. Once approved, we'll proceed with production</li>
                      <li>5. You'll be notified when your order is ready</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => setLocation("/")}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    Return to Home
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            {currentStep < 7 && (
              <div className="flex gap-2 md:gap-4 mt-4 md:mt-6 flex-wrap">
                <Button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="flex-1 min-w-[100px] md:min-w-[120px] text-xs md:text-sm py-2 md:py-2 h-10 md:h-10"
                >
                  <ChevronLeft size={16} className="mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                {currentStep === 2 && (
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 min-w-[100px] md:min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-semibold text-xs md:text-sm py-2 md:py-2 h-10 md:h-10"
                  >
                    <Plus size={16} className="mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
                {cartItems.length > 0 && currentStep !== 6 && (
                  <Button
                    onClick={() => setCurrentStep(6)}
                    variant="outline"
                    className="flex-1 min-w-[100px] md:min-w-[140px] border-cyan-600 text-cyan-600 hover:bg-cyan-600/10 text-xs md:text-sm py-2 md:py-2 h-10 md:h-10"
                  >
                    <span className="hidden sm:inline">Review Cart</span>
                    <span className="sm:hidden">Cart</span> ({cartItems.length})
                  </Button>
                )}
                {currentStep === 6 ? (
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={createOrderMutation.isPending || createMultiItemMutation.isPending}
                    className="flex-1 min-w-[100px] md:min-w-[120px] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs md:text-sm py-2 md:py-2 h-10 md:h-10"
                  >
                    {(createOrderMutation.isPending || createMultiItemMutation.isPending) ? (
                      <>
                        <Loader2 size={16} className="mr-1 md:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Submit Order</span>
                        <span className="sm:hidden">Submit</span>
                        <ChevronRight size={16} className="ml-1 md:ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 min-w-[100px] md:min-w-[120px] bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs md:text-sm py-2 md:py-2 h-10 md:h-10"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight size={16} className="ml-1 md:ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700 sticky top-4">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-white text-base md:text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {selectedProduct && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Product:</span>
                        <span className="text-white">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Quantity:</span>
                        <span className="text-white">{orderData.quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Base Price:</span>
                        <span className="text-white">R{basePrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {orderData.printSelections.length > 0 && (
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-200">Print Surcharge:</span>
                          <span className="text-white">R{printSizePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-200">Subtotal:</span>
                          <span className="text-white">R{subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {bulkDiscount > 0 && (
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-accent">{getBulkPricingLabel(orderData.quantity)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-accent">Discount:</span>
                          <span className="text-accent">-R{discountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total:</span>
                        <span className="text-accent text-lg">R{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                {!selectedProduct && (
                  <p className="text-gray-200 text-sm">Select a product to see pricing</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


      </div>
    </div>
  );
}

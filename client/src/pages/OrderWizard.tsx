import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type Step = 1 | 2 | 3 | 4 | 5;

interface OrderData {
  productId: number | null;
  colorId: number | null;
  sizeId: number | null;
  quantity: number;
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

  const createOrderMutation = trpc.orders.create.useMutation();

  const selectedProduct = productsQuery.data?.find((p) => p.id === orderData.productId);
  const productColors = colorsQuery.data || [];
  const productSizes = sizesQuery.data || [];

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

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!orderData.productId || !orderData.colorId || !orderData.sizeId) {
        toast.error("Please select product, color, and size");
        return;
      }
    } else if (currentStep === 2) {
      if (!orderData.customerFirstName || !orderData.customerLastName || !orderData.customerEmail || !orderData.customerPhone) {
        toast.error("Please fill in all contact details");
        return;
      }
    } else if (currentStep === 3) {
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
        !orderData.deliveryMethod
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createOrderMutation.mutateAsync({
        productId: orderData.productId,
        colorId: orderData.colorId,
        sizeId: orderData.sizeId,
        quantity: orderData.quantity || 1,
        prints: [],
        customerFirstName: orderData.customerFirstName,
        customerLastName: orderData.customerLastName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerCompany: orderData.customerCompany,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        additionalNotes: orderData.additionalNotes,
        totalPriceEstimate: selectedProduct
          ? parseFloat(selectedProduct.basePrice as any) * (1 - calculateBulkDiscount(orderData.quantity)) * orderData.quantity
          : 0,
      });

      toast.success("Order submitted successfully!");
      setLocation("/dashboard");
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
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
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
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {currentStep === 1 && "Step 1: Select Garment"}
                  {currentStep === 2 && "Step 2: Your Details"}
                  {currentStep === 3 && "Step 3: Delivery Method"}
                  {currentStep === 4 && "Step 4: Review Order"}
                  {currentStep === 5 && "Step 5: Order Confirmed"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Choose your product, color, size, and quantity"}
                  {currentStep === 2 && "Enter your contact information"}
                  {currentStep === 3 && "Select collection or delivery"}
                  {currentStep === 4 && "Review your order details"}
                  {currentStep === 5 && "Your order has been successfully submitted"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Select Garment */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Product Selection */}
                    <div>
                      <Label className="text-white font-semibold mb-4 block text-lg">Select Garment</Label>
                      {productsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  ? "border-white bg-gray-700"
                                  : "border-gray-600 bg-gray-700 hover:border-gray-500"
                              }`}
                            >
                              <p className="text-white font-semibold text-lg">{product.name}</p>
                              <p className="text-accent font-bold text-xl mt-1">R{parseFloat(product.basePrice as any).toFixed(2)}</p>
                              <p className="text-gray-400 text-sm mt-2">{product.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bulk Pricing Info */}
                    <div className="p-4 bg-blue-900 rounded-lg border border-blue-700">
                      <p className="text-sm text-blue-100 font-semibold mb-2">Reseller Bulk Pricing:</p>
                      <div className="text-xs text-blue-100 space-y-1">
                        <p>• 50-100 units: 5% discount</p>
                        <p>• 100-200 units: 10% discount</p>
                        <p>• 500+ units: Custom pricing available</p>
                      </div>
                    </div>

                    {/* Color and Size Selection - Only show if product is selected */}
                    {orderData.productId && selectedProduct && (
                      <div className="space-y-6 border-t border-gray-700 pt-6">
                        {/* Color Selection */}
                        <div>
                          <Label className="text-white font-semibold mb-3 block">Select Color</Label>
                          {colorsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            </div>
                          ) : productColors.length > 0 ? (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                              {productColors.map((color) => (
                                <button
                                  key={color.id}
                                  onClick={() => setOrderData({ ...orderData, colorId: color.id })}
                                  className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                                    orderData.colorId === color.id
                                      ? "ring-2 ring-white"
                                      : "hover:ring-1 hover:ring-gray-500"
                                  }`}
                                  title={color.colorName}
                                >
                                  <div
                                    className="w-12 h-12 rounded-full border-2 border-gray-600"
                                    style={{ backgroundColor: color.colorHex || "#ccc" }}
                                  />
                                  <span className="text-xs text-gray-300 text-center truncate w-full">
                                    {color.colorName}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400">No colors available for this product</p>
                          )}
                        </div>

                        {/* Size Selection */}
                        <div>
                          <Label className="text-white font-semibold mb-3 block">Select Size</Label>
                          {sizesQuery.isLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            </div>
                          ) : productSizes.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                              {productSizes.map((size) => (
                                <button
                                  key={size.id}
                                  onClick={() => setOrderData({ ...orderData, sizeId: size.id })}
                                  className={`py-2 px-3 rounded-lg border-2 transition-all font-semibold ${
                                    orderData.sizeId === size.id
                                      ? "border-white bg-white text-black"
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

                        {/* Quantity Selection */}
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
                          {orderData.quantity && (
                            <div className="mt-3 p-3 bg-green-900 rounded-lg border border-green-700">
                              <p className="text-sm text-green-100 font-semibold">
                                {getBulkPricingLabel(orderData.quantity)}
                              </p>
                              {orderData.quantity >= 50 && orderData.quantity < 500 && (
                                <p className="text-xs text-green-200 mt-1">
                                  Unit Price: R
                                  {(
                                    parseFloat(selectedProduct.basePrice as any) *
                                    (1 - calculateBulkDiscount(orderData.quantity))
                                  ).toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Your Details */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">First Name</Label>
                        <Input
                          value={orderData.customerFirstName}
                          onChange={(e) => setOrderData({ ...orderData, customerFirstName: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Last Name</Label>
                        <Input
                          value={orderData.customerLastName}
                          onChange={(e) => setOrderData({ ...orderData, customerLastName: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Email</Label>
                      <Input
                        type="email"
                        value={orderData.customerEmail}
                        onChange={(e) => setOrderData({ ...orderData, customerEmail: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Phone</Label>
                      <Input
                        type="tel"
                        value={orderData.customerPhone}
                        onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="+27 123 456 7890"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Company (Optional)</Label>
                      <Input
                        value={orderData.customerCompany || ""}
                        onChange={(e) => setOrderData({ ...orderData, customerCompany: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Delivery Method */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white font-semibold mb-3 block">Delivery Method</Label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setOrderData({ ...orderData, deliveryMethod: "collection" })}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            orderData.deliveryMethod === "collection"
                              ? "border-white bg-gray-700"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <p className="text-white font-semibold">Collection</p>
                          <p className="text-gray-400 text-sm">Pick up from our location</p>
                        </button>
                        <button
                          onClick={() => setOrderData({ ...orderData, deliveryMethod: "delivery" })}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            orderData.deliveryMethod === "delivery"
                              ? "border-white bg-gray-700"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                        >
                          <p className="text-white font-semibold">Delivery</p>
                          <p className="text-gray-400 text-sm">We'll deliver to your address</p>
                        </button>
                      </div>
                    </div>
                    {orderData.deliveryMethod === "delivery" && (
                      <div>
                        <Label className="text-white">Delivery Address</Label>
                        <Textarea
                          value={orderData.deliveryAddress || ""}
                          onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white mt-1"
                          placeholder="Enter your delivery address"
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Review Order */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Product</p>
                      <p className="text-white font-semibold">{selectedProduct?.name}</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Color</p>
                      <p className="text-white font-semibold">
                        {productColors.find((c) => c.id === orderData.colorId)?.colorName}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Size</p>
                      <p className="text-white font-semibold">
                        {productSizes.find((s) => s.id === orderData.sizeId)?.sizeName}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Quantity</p>
                      <p className="text-white font-semibold">{orderData.quantity} units</p>
                    </div>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-gray-400 text-sm">Delivery Method</p>
                      <p className="text-white font-semibold">
                        {orderData.deliveryMethod === "collection" ? "Collection" : "Delivery"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-white">Additional Notes (Optional)</Label>
                      <Textarea
                        value={orderData.additionalNotes || ""}
                        onChange={(e) => setOrderData({ ...orderData, additionalNotes: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        placeholder="Any special requests or notes..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Order Confirmed */}
                {currentStep === 5 && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Order Submitted!</h2>
                    <p className="text-gray-300 mb-4">
                      Thank you for your order. We'll review it and get back to you shortly.
                    </p>
                    <p className="text-gray-400">Confirmation email sent to {orderData.customerEmail}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-6 border-t border-gray-700">
                  <Button
                    onClick={handlePreviousStep}
                    variant="outline"
                    className="gap-2"
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  {currentStep < 5 ? (
                    <Button onClick={handleNextStep} className="gap-2 bg-accent hover:bg-accent/90">
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setLocation("/")} className="gap-2 bg-accent hover:bg-accent/90">
                      Back to Home
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <div>
                      <p className="text-gray-400 text-sm">Product</p>
                      <p className="text-white font-semibold">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Quantity</p>
                      <p className="text-white font-semibold">{orderData.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Unit Price</p>
                      <p className="text-white font-semibold">
                        R{(
                          parseFloat(selectedProduct.basePrice as any) *
                          (1 - calculateBulkDiscount(orderData.quantity))
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-gray-400 text-sm">Estimated Total</p>
                      <p className="text-accent font-bold text-2xl">
                        R
                        {(
                          parseFloat(selectedProduct.basePrice as any) *
                          (1 - calculateBulkDiscount(orderData.quantity)) *
                          orderData.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
                <Button
                  onClick={handleNextStep}
                  disabled={currentStep === 5 || !selectedProduct}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mt-4"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

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
  additionalNotes?: string;
  totalPriceEstimate: number;
}

export default function OrderWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [orderData, setOrderData] = useState<Partial<OrderData>>({
    quantity: 1,
    prints: [],
  });

  const productsQuery = trpc.products.list.useQuery();
  const printOptionsQuery = trpc.products.printOptions.useQuery();
  const printPlacementsQuery = trpc.products.printPlacements.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  const selectedProduct = orderData.productId
    ? productsQuery.data?.find((p) => p.id === orderData.productId)
    : null;

  const handleNext = () => {
    if (currentStep < 6) {
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
        additionalNotes: orderData.additionalNotes,
        totalPriceEstimate: orderData.totalPriceEstimate,
      });

      toast.success("Order submitted successfully!");
      setCurrentStep(1);
      setOrderData({ quantity: 1, prints: [] });
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
            {[1, 2, 3, 4, 5, 6].map((step) => (
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
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {currentStep === 1 && "Step 1: Choose Garment"}
              {currentStep === 2 && "Step 2: Select Print Options"}
              {currentStep === 3 && "Step 3: Upload Design"}
              {currentStep === 4 && "Step 4: Live Preview"}
              {currentStep === 5 && "Step 5: Contact Details"}
              {currentStep === 6 && "Step 6: Order Summary"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Select your product, color, size, and quantity"}
              {currentStep === 2 && "Choose print placements and sizes"}
              {currentStep === 3 && "Upload your design file"}
              {currentStep === 4 && "Preview your design on the garment"}
              {currentStep === 5 && "Enter your contact information"}
              {currentStep === 6 && "Review and submit your order"}
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
                    <div>
                      <Label className="text-white">Color</Label>
                      <p className="text-gray-400 text-sm mt-2">Color selection coming soon</p>
                    </div>

                    <div>
                      <Label className="text-white">Size</Label>
                      <p className="text-gray-400 text-sm mt-2">Size selection coming soon</p>
                    </div>

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
                {/* Placeholder for print options */}
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
                  className="bg-white text-black hover:bg-gray-200"
                >
                  + Add Print Placement
                </Button>
              </div>
            )}

            {/* Step 3: Upload Design */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-300">Upload your design file (PNG, JPG, or PDF)</p>
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            {/* Step 4: Live Preview */}
            {currentStep === 4 && selectedProduct && (
              <div className="space-y-4">
                <PreviewCanvas
                  garmentColor="#000000"
                  placementCoordinates={{ x: 50, y: 100, width: 150, height: 150 }}
                  printSize="A4"
                />
              </div>
            )}

            {/* Step 5: Contact Details */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

            {/* Step 6: Order Summary */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                  <p className="text-white">
                    <strong>Product:</strong> {selectedProduct?.name}
                  </p>
                  <p className="text-white">
                    <strong>Quantity:</strong> {orderData.quantity}
                  </p>
                  <p className="text-white">
                    <strong>Customer:</strong> {orderData.customerFirstName}{" "}
                    {orderData.customerLastName}
                  </p>
                  <p className="text-white">
                    <strong>Email:</strong> {orderData.customerEmail}
                  </p>
                  <p className="text-white">
                    <strong>Estimated Total:</strong> R
                    {(orderData.totalPriceEstimate || 0).toFixed(2)}
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
              {currentStep === 6 ? (
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
    </div>
  );
}

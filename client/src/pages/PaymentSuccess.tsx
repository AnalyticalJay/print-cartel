import { useEffect, useState } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaymentMethodDetails, type PaymentMethodType } from "@/components/PaymentMethodDetails";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Download,
  Home,
  Mail,
  AlertCircle,
} from "lucide-react";

/**
 * Payment Success Confirmation Page
 * Displays after PayFast payment completes successfully
 * Shows order confirmation, receipt, production timeline, and next steps
 */
export function PaymentSuccess() {
  const [, navigate] = useRouter() as any;
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract order ID from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    if (id) {
      setOrderId(parseInt(id, 10));
    }
    setIsLoading(false);
  }, []);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  // Fetch payment records for this order
  const { data: paymentRecords } = trpc.orders.getPaymentRecords.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  if (isLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your order confirmation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Order ID Not Found</h3>
                <p className="text-sm text-red-700 mb-4">
                  Please check the payment confirmation email for your order details.
                </p>
                <Button onClick={() => navigate("/my-account")} variant="outline">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Order Not Found</h3>
                <p className="text-sm text-red-700 mb-4">
                  We couldn't find the order details. Please check your email or contact support.
                </p>
                <Button onClick={() => navigate("/my-account")} variant="outline">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estimatedDeliveryDays = 7; // Standard delivery time
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDeliveryDays);

  const productionSteps = [
    {
      step: 1,
      title: "Design Review",
      description: "Our team reviews your design for quality and fit",
      duration: "1-2 hours",
      icon: "📋",
    },
    {
      step: 2,
      title: "Production Setup",
      description: "Garments prepared and DTF printer configured",
      duration: "2-4 hours",
      icon: "⚙️",
    },
    {
      step: 3,
      title: "Printing",
      description: "Your design is printed onto the garments",
      duration: "2-6 hours",
      icon: "🖨️",
    },
    {
      step: 4,
      title: "Quality Check",
      description: "Each item inspected for color accuracy and finish",
      duration: "1-2 hours",
      icon: "✅",
    },
    {
      step: 5,
      title: "Packaging",
      description: "Items carefully packaged and labeled",
      duration: "1 hour",
      icon: "📦",
    },
    {
      step: 6,
      title: "Shipping",
      description: "Order shipped to your address",
      duration: "3-5 business days",
      icon: "🚚",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const totalPrice = typeof order.totalPriceEstimate === 'string' 
    ? parseFloat(order.totalPriceEstimate) 
    : order.totalPriceEstimate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
              <CheckCircle2 className="h-16 w-16 text-green-600 relative" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Your order has been successfully paid and is now in production
          </p>
        </div>

        {/* Order Confirmation Card */}
        <Card className="border-2 border-green-200 bg-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Order Confirmation</CardTitle>
                <CardDescription>Order #{order.id}</CardDescription>
              </div>
              <Badge className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm">
                PAYMENT CONFIRMED
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Order Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline" className="bg-green-50">
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Delivery Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <span className="font-medium">
                      {deliveryDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Time:</span>
                    <span className="font-medium">{estimatedDeliveryDays} business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking:</span>
                    <span className="font-medium text-blue-600">Coming soon</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Method:</span>
                    <span className="font-medium">Standard Courier</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(totalPrice * 0.8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Print Setup:</span>
                  <span>{formatCurrency(totalPrice * 0.15)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span>{formatCurrency(totalPrice * 0.05)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Method:</span>
                  <span className="font-medium capitalize">
                    {paymentRecords && paymentRecords.length > 0
                      ? paymentRecords[0].paymentMethod === 'bank_transfer'
                        ? 'Bank Transfer'
                        : paymentRecords[0].paymentMethod === 'eft'
                        ? 'EFT'
                        : 'PayFast'
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Enhanced Payment Method Details */}
            {paymentRecords && paymentRecords.length > 0 && (
              <div className="mt-6">
                <PaymentMethodDetails
                  method={paymentRecords[0].paymentMethod as PaymentMethodType}
                  amount={parseFloat(paymentRecords[0].amount as any)}
                  isDeposit={paymentRecords[0].paymentType === 'deposit'}
                  showInstructions={true}
                />
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate(`/my-account`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Home className="h-4 w-4 mr-2" />
                View in Dashboard
              </Button>
              <Button
                onClick={() => {
                  if (order.invoiceUrl) {
                    window.open(order.invoiceUrl, "_blank");
                  }
                }}
                variant="outline"
                className="flex-1"
                disabled={!order.invoiceUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Production Timeline */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Production Timeline
            </CardTitle>
            <CardDescription>
              Your order will go through these steps before shipping
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {productionSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                      {step.icon}
                    </div>
                    {index < productionSteps.length - 1 && (
                      <div className="w-1 h-12 bg-gradient-to-b from-blue-300 to-purple-300 my-2"></div>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        ~{step.duration}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Confirmation Email</h4>
                  <p className="text-sm text-gray-600">
                    You'll receive a confirmation email with your order details and invoice
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Production Begins</h4>
                  <p className="text-sm text-gray-600">
                    Our team will start working on your order immediately. Production typically takes 1-2 days
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Tracking Number</h4>
                  <p className="text-sm text-gray-600">
                    Once shipped, you'll receive an email with your tracking number so you can monitor delivery
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Delivery</h4>
                  <p className="text-sm text-gray-600">
                    Your order will arrive within {estimatedDeliveryDays} business days. We'll keep you updated every step of the way
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  If you have any questions about your order, please don't hesitate to contact our support team
                </p>
                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-100">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Shopping */}
        <div className="text-center pt-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                Continue Shopping
              </Button>
        </div>
      </div>
    </div>
  );
}

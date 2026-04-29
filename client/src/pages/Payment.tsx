import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SimplifiedPaymentMethodSelector, type PaymentMethodType } from "@/components/SimplifiedPaymentMethodSelector";
import { SimplifiedPaymentProofUpload } from "@/components/SimplifiedPaymentProofUpload";

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const recordPaymentMethodMutation = trpc.payment.recordPaymentMethod.useMutation();
  const initiatePayFastMutation = trpc.payfast.generatePaymentUrl.useMutation();

  // Get order ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    if (id) {
      setOrderId(parseInt(id));
    }
  }, []);

  // Fetch order details
  const orderQuery = trpc.orders.getById.useQuery(
    { id: orderId || 0 },
    { enabled: !!orderId }
  );

  const order = orderQuery.data;

  if (!user?.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">Please log in to access the payment page.</p>
            <Button onClick={() => setLocation("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Order Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">We couldn't find the order you're trying to pay for.</p>
            <Button onClick={() => setLocation("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = parseFloat(order.totalPriceEstimate);
  const delivery = order.deliveryCharge ? parseFloat(order.deliveryCharge) : 0;
  const total = subtotal + delivery;

  const handlePaymentMethodSelect = async (method: string) => {
    setSelectedPaymentMethod(method as PaymentMethodType);
    setIsProcessing(true);

    try {
      if (method === "payfast") {
        // Initiate PayFast payment
        const result = await initiatePayFastMutation.mutateAsync({
          orderId: orderId || 0,
          amount: total,
          returnUrl: `${window.location.origin}/payment/payfast-return?orderId=${orderId}`,
          cancelUrl: `${window.location.origin}/dashboard`,
          notifyUrl: `${window.location.origin}/api/payfast/callback`,
        });

        // Redirect to PayFast
        window.location.href = result.paymentUrl;
      } else if (method === "bank_transfer") {
        // Record manual payment method
        await recordPaymentMethodMutation.mutateAsync({
          orderId: orderId || 0,
          paymentMethod: "bank_transfer",
          amount: total,
          paymentType: "final_payment",
        });

        toast.success("Payment method recorded. Please upload proof of payment.");
        setLocation(`/payment/manual-upload?orderId=${orderId}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
      setSelectedPaymentMethod(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payment</h1>
            <p className="text-gray-600">Order #{orderId}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Payment Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">
                      {order.customerFirstName} {order.customerLastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{order.customerEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium">
                      {order.deliveryMethod === "collection" ? "Collection" : "Delivery"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* PayFast Option */}
                  <button
                    onClick={() => handlePaymentMethodSelect("payfast")}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 rounded-lg border-2 border-transparent p-4 cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium">Pay with PayFast</p>
                      <p className="text-sm text-gray-600">Credit card, bank transfer, or other methods</p>
                    </div>
                    {isProcessing && selectedPaymentMethod === "payfast" && (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </button>

                  {/* Manual Payment Option */}
                  <button
                    onClick={() => handlePaymentMethodSelect("bank_transfer")}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 rounded-lg border-2 border-transparent p-4 cursor-pointer hover:bg-slate-50 hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium">Manual Bank Transfer</p>
                      <p className="text-sm text-gray-600">Transfer to our bank account and upload proof</p>
                    </div>
                    {isProcessing && selectedPaymentMethod === "bank_transfer" && (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-600">
              After making the payment, please allow 1-2 business days for confirmation. We'll send you an email
              once we've received your payment.
            </p>
          </div>

          {/* Price Summary Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  {delivery > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery:</span>
                      <span>R{delivery.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Due:</span>
                    <span className="text-green-600">R{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 text-sm border border-amber-200">
                  <p className="text-amber-900 font-medium">Full Payment Required</p>
                  <p className="text-amber-700 text-xs mt-1">
                    The full invoice amount must be paid before production begins.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

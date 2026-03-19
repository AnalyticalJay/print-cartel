import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"deposit" | "full_payment">("deposit");
  const [isProcessing, setIsProcessing] = useState(false);

  // Get order ID from URL query parameter
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
    { enabled: !!orderId && !!user?.email }
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
  const depositAmount = order.depositAmount ? parseFloat(order.depositAmount) : total * 0.5;

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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="payment-method"
                      value="deposit"
                      checked={selectedPaymentMethod === "deposit"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as "deposit")}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Deposit Payment</p>
                      <p className="text-sm text-gray-600">
                        Pay R{depositAmount.toFixed(2)} now, R{(total - depositAmount).toFixed(2)} later
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="payment-method"
                      value="full_payment"
                      checked={selectedPaymentMethod === "full_payment"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as "full_payment")}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Full Payment</p>
                      <p className="text-sm text-gray-600">Pay the full amount now</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer Instructions */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Bank Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-900">
                <div>
                  <p className="font-medium">Bank Name:</p>
                  <p>Standard Bank</p>
                </div>
                <div>
                  <p className="font-medium">Account Holder:</p>
                  <p>Print Cartel (Pty) Ltd</p>
                </div>
                <div>
                  <p className="font-medium">Account Number:</p>
                  <p className="font-mono">123456789</p>
                </div>
                <div>
                  <p className="font-medium">Branch Code:</p>
                  <p className="font-mono">051001</p>
                </div>
                <div>
                  <p className="font-medium">Reference:</p>
                  <p className="font-mono">ORD-{orderId}</p>
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
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>

                {selectedPaymentMethod === "deposit" && (
                  <div className="space-y-2 rounded-lg bg-blue-50 p-3 text-sm">
                    <div className="flex justify-between font-medium text-blue-900">
                      <span>Due Now:</span>
                      <span>R{depositAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span>Due Later:</span>
                      <span>R{(total - depositAmount).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setIsProcessing(true);
                    toast.success("Payment details saved. Please complete the bank transfer using the details above.");
                    setTimeout(() => {
                      setLocation("/dashboard");
                    }, 2000);
                  }}
                  disabled={isProcessing}
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                >
                  {isProcessing ? "Processing..." : "Confirm Payment Method"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  disabled={isProcessing}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PaymentSection } from "@/components/PaymentSection";
import { DepositPaymentTracker } from "@/components/DepositPaymentTracker";

export function PaymentPage() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract orderId from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    if (id) {
      setOrderId(parseInt(id, 10));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch order details
  const orderQuery = trpc.admin.getOrderDetail.useQuery(
    { orderId: orderId! },
    {
      enabled: orderId !== null,
    }
  );

  useEffect(() => {
    if (orderQuery.isLoading === false) {
      setIsLoading(false);
    }
  }, [orderQuery.isLoading]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Payment Link</CardTitle>
            <CardDescription>Order ID not found</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The payment link is invalid or expired. Please log in to your account to make payment.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/dashboard")} className="w-full mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>Unable to load order details</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The order could not be found. Please check the link and try again.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setLocation("/dashboard")} className="w-full mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = orderQuery.data;

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalPrice = typeof order.totalPriceEstimate === "string" 
    ? parseFloat(order.totalPriceEstimate) 
    : order.totalPriceEstimate || 0;

  const depositAmount = order.depositAmount ? (typeof order.depositAmount === "string"
    ? parseFloat(order.depositAmount)
    : order.depositAmount) : undefined;

  const depositPaid = depositAmount || 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/dashboard")}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>Order Payment</CardTitle>
              </div>
              <CardDescription>Order #{order.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{order.quantity} units</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>R{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deposit Payment Tracker */}
              {order.status === "approved" || order.status === "quoted" ? (
                <DepositPaymentTracker
                  orderId={order.id}
                  totalPrice={totalPrice}
                  depositPercentage={50}
                  depositPaid={depositPaid}
                  finalPaymentPaid={0}
                  orderStatus={order.status as any}
                />
              ) : null}

              {/* Payment Section */}
              <PaymentSection
                orderId={order.id}
                totalAmount={totalPrice}
                depositAmount={depositAmount || 0}
                amountPaid={0}
                paymentStatus={order.paymentStatus || "unpaid"}
                invoiceUrl={order.invoiceUrl || ""}
              />

              {/* Help Text */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you have any questions about your payment, please contact us at sales@printcartel.co.za
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

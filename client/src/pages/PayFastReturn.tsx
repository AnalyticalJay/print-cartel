import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function PayFastReturn() {
  const [searchParams] = useSearchParams();
  const [, navigate] = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const verifyPaymentMutation = trpc.payment.verifyPayFastNotification.useMutation({
    onSuccess: (data) => {
      if (data.verified) {
        setStatus("success");
        setMessage("Payment verified successfully! Your order status has been updated.");
        toast.success("Payment confirmed!");
        setTimeout(() => {
          navigate(`/dashboard`);
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Payment verification failed. Please contact support.");
        toast.error("Payment verification failed");
      }
    },
    onError: (error: any) => {
      setStatus("error");
      setMessage(error?.message || "An error occurred while verifying payment");
      toast.error("Payment verification error");
    },
  });

  useEffect(() => {
    // Extract payment ID from URL parameters
    const paymentId = searchParams.get("pf_payment_id");
    const mPaymentId = searchParams.get("m_payment_id");

    if (mPaymentId) {
      // Extract order ID from m_payment_id (format: order-{orderId})
      const extractedOrderId = parseInt(mPaymentId.split("-")[1]);
      setOrderId(extractedOrderId);
    }

    // Verify payment with backend
    if (paymentId && mPaymentId) {
      const notificationData: Record<string, string> = {};
      for (const [key, value] of searchParams.entries()) {
        notificationData[key] = value;
      }

      verifyPaymentMutation.mutate(notificationData);
    } else {
      setStatus("error");
      setMessage("Invalid payment response. Missing payment information.");
    }
  }, [searchParams, verifyPaymentMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            {status === "loading" && "Processing Payment"}
            {status === "success" && "Payment Successful"}
            {status === "error" && "Payment Error"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your payment..."}
            {status === "success" && "Your payment has been confirmed"}
            {status === "error" && "There was an issue with your payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="text-lg font-semibold">#{orderId}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              {status === "loading" && (
                <Badge className="bg-blue-600 text-white">Processing...</Badge>
              )}
              {status === "success" && (
                <Badge className="bg-green-600 text-white">Verified</Badge>
              )}
              {status === "error" && (
                <Badge className="bg-red-600 text-white">Failed</Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600">{message}</p>

          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                You will be redirected to your dashboard in a few seconds. If not, click the button below.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">
                Please contact support if the issue persists. Your payment may still be processing.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/dashboard`)}
              className="flex-1"
              variant={status === "error" ? "destructive" : "default"}
            >
              Go to Dashboard
            </Button>
            {status === "error" && (
              <Button
                onClick={() => navigate(`/`)}
                variant="outline"
                className="flex-1"
              >
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

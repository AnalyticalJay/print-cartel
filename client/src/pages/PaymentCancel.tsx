import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw, Home, ShieldCheck } from "lucide-react";

/**
 * Payment Cancelled Page
 *
 * Displayed when PayFast redirects to /payment/cancel after the customer
 * clicks "Cancel" or closes the PayFast payment window.
 *
 * PayFast may append m_payment_id=order-{orderId} to the cancel URL.
 * We extract the orderId so we can offer a direct "Try Again" link.
 */
export function PaymentCancel() {
  const [, navigate] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pfId = params.get("m_payment_id"); // e.g. "order-42"
    const legacyId = params.get("orderId");

    if (pfId && pfId.startsWith("order-")) {
      setOrderId(pfId.replace("order-", ""));
    } else if (legacyId) {
      setOrderId(legacyId);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* ── Hero: Cancel Icon ── */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute h-24 w-24 rounded-full bg-orange-100 opacity-60" />
            <div className="relative h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            No worries — your payment was not processed and{" "}
            <span className="font-semibold text-gray-700">no charge was made</span> to your
            account.
          </p>
        </div>

        {/* ── Info Card ── */}
        <Card className="border-orange-200 shadow-md">
          <CardContent className="pt-6 pb-6 px-6 space-y-4">

            {/* Reassurance row */}
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-800">
                Your order is still saved. You can return to your dashboard at any time to
                complete payment.
              </p>
            </div>

            {/* Order reference if available */}
            {orderId && (
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-500 font-medium">Order reference</span>
                <span className="text-sm font-bold text-gray-800">#{orderId}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {orderId ? (
                <Button
                  onClick={() => navigate(`/payment?orderId=${orderId}`)}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md font-semibold transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Payment Again
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-md font-semibold transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Go to My Orders
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1 font-semibold transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                My Dashboard
              </Button>
            </div>

            {/* Secondary action */}
            <div className="text-center pt-1">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Home
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Help text ── */}
        <p className="text-center text-xs text-muted-foreground">
          Need help? Contact us at{" "}
          <a
            href="mailto:support@printcartel.co.za"
            className="text-primary hover:underline font-medium"
          >
            support@printcartel.co.za
          </a>
        </p>
      </div>
    </div>
  );
}

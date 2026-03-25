import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";

export default function QuoteAcceptance() {
  const [, setLocation] = useLocation();
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const actionParam = window.location.pathname.includes("/accept") ? "accept" : "reject";
    const orderIdParam = params.get("orderId");
    const emailParam = params.get("email");
    const tokenParam = params.get("token");

    if (!orderIdParam || !emailParam) {
      toast.error("Invalid quote link. Please check your email.");
      setLocation("/");
      return;
    }

    setAction(actionParam as "accept" | "reject");
    setOrderId(parseInt(orderIdParam));
    setEmail(emailParam);
    setToken(tokenParam || "");
    setIsLoading(false);
  }, [setLocation]);

  // Fetch quote details
  const { data: quoteDetails, isLoading: isLoadingQuote } = trpc.quoteAcceptance.getQuoteDetails.useQuery(
    {
      orderId: orderId || 0,
      customerEmail: email,
    },
    {
      enabled: orderId !== null && email !== "",
    }
  );

  // Accept quote mutation
  const acceptMutation = trpc.quoteAcceptance.acceptQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote accepted! Invoice has been sent to your email.");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(`Error accepting quote: ${error?.message || "Unknown error"}`);
    },
  });

  // Reject quote mutation
  const rejectMutation = trpc.quoteAcceptance.rejectQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote rejected. Our team will contact you shortly.");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(`Error rejecting quote: ${error?.message || "Unknown error"}`);
    },
  });

  const handleAccept = () => {
    if (!orderId) return;
    acceptMutation.mutate({
      orderId,
      customerEmail: email,
      acceptanceToken: token,
    });
  };

  const handleReject = () => {
    if (!orderId || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting the quote");
      return;
    }
    rejectMutation.mutate({
      orderId,
      customerEmail: email,
      rejectionReason: rejectionReason.trim(),
      acceptanceToken: token,
    });
  };

  if (isLoading || isLoadingQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading quote details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quoteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <p className="text-red-600 font-semibold">Quote Not Found</p>
            <p className="text-red-500 text-sm text-center">
              The quote you're trying to access could not be found or has expired.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {action === "accept" ? (
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle>Accept Quote</CardTitle>
                  <CardDescription>Review and accept your quote to proceed with production</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Quote Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">Quote Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold text-gray-900">#{quoteDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-900">{quoteDetails.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-semibold text-gray-900">{quoteDetails.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {quoteDetails.paymentMethod === "deposit" ? "Deposit + Final" : "Full Payment"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Total Amount</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quote Amount:</span>
                    <span className="font-semibold">R{quoteDetails.totalPrice.toFixed(2)}</span>
                  </div>
                  {quoteDetails.paymentMethod === "deposit" && (
                    <>
                      <div className="flex justify-between text-green-700">
                        <span className="font-semibold">Deposit Due Now (50%):</span>
                        <span className="font-bold text-lg">R{quoteDetails.depositAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Remaining balance of R{(quoteDetails.totalPrice - quoteDetails.depositAmount).toFixed(2)} will be due before production completes.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {acceptMutation.isPending ? "Processing..." : "✓ Accept Quote"}
                </Button>
                <Button
                  onClick={() => setAction("reject")}
                  variant="outline"
                  className="flex-1"
                >
                  ✗ Decline Quote
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By accepting this quote, you agree to proceed with the order. An invoice will be sent to your email.
              </p>
            </CardContent>
          </Card>
        ) : action === "reject" ? (
          <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <CardTitle>Decline Quote</CardTitle>
                  <CardDescription>Let us know why you're declining this quote</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Quote Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">Quote Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-semibold text-gray-900">#{quoteDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quote Amount</p>
                    <p className="font-semibold text-gray-900">R{quoteDetails.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Declining (Required)
                </label>
                <Textarea
                  placeholder="Please tell us why you're declining this quote. This helps us improve our service..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-32"
                />
                <p className="text-xs text-gray-500">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || rejectionReason.trim().length < 10}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {rejectMutation.isPending ? "Processing..." : "✗ Decline Quote"}
                </Button>
                <Button
                  onClick={() => setAction("accept")}
                  variant="outline"
                  className="flex-1"
                >
                  ✓ Accept Quote
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Our team will review your feedback and contact you shortly with alternative options.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

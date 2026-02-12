import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface CustomerQuoteViewProps {
  quoteId: number;
  onQuoteResponded?: (accepted: boolean) => void;
}

export function CustomerQuoteView({ quoteId, onQuoteResponded }: CustomerQuoteViewProps) {
  const [isResponding, setIsResponding] = useState(false);

  const { data: quote, isLoading, error } = trpc.quotes.getCustomerQuote.useQuery({
    quoteId,
  });

  const respondMutation = trpc.quotes.respond.useMutation();

  const handleAccept = async () => {
    try {
      setIsResponding(true);
      await respondMutation.mutateAsync({
        quoteId,
        accepted: true,
      });
      toast.success("Quote accepted! Your order is now approved.");
      onQuoteResponded?.(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to accept quote";
      toast.error(errorMessage);
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsResponding(true);
      await respondMutation.mutateAsync({
        quoteId,
        accepted: false,
      });
      toast.success("Quote rejected. You can contact us to discuss further.");
      onQuoteResponded?.(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reject quote";
      toast.error(errorMessage);
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-white border-2 border-gray-200">
        <p className="text-center text-gray-600">Loading quote...</p>
      </Card>
    );
  }

  if (error || !quote) {
    return (
      <Card className="p-6 bg-white border-2 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-red-900">Quote Not Found</p>
            <p className="text-sm text-red-700 mt-1">
              {error?.message || "This quote may have expired or been deleted."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isExpired = quote.expiresAt && new Date() > new Date(quote.expiresAt);
  const expiresDate = quote.expiresAt ? new Date(quote.expiresAt) : null;
  const daysUntilExpiry = expiresDate
    ? Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const statusColor = {
    draft: "bg-gray-50 border-gray-200",
    sent: "bg-blue-50 border-blue-200",
    accepted: "bg-green-50 border-green-200",
    rejected: "bg-red-50 border-red-200",
    expired: "bg-yellow-50 border-yellow-200",
  };

  const statusIcon = {
    draft: <Clock className="w-5 h-5 text-gray-600" />,
    sent: <Clock className="w-5 h-5 text-blue-600" />,
    accepted: <CheckCircle className="w-5 h-5 text-green-600" />,
    rejected: <XCircle className="w-5 h-5 text-red-600" />,
    expired: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  };

  const statusLabel = {
    draft: "Draft",
    sent: "Awaiting Your Response",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
  };

  return (
    <Card className={`p-6 border-2 ${statusColor[quote.status as keyof typeof statusColor]}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Quote #{quote.id}</h2>
            <p className="text-sm text-gray-600 mt-1">Order #{quote.orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon[quote.status as keyof typeof statusIcon]}
            <span className="font-semibold text-foreground">{statusLabel[quote.status as keyof typeof statusLabel]}</span>
          </div>
        </div>

        {/* Order Details */}
        {quote.order && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-foreground mb-3">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Product</p>
                <p className="font-semibold text-foreground">Order #{quote.orderId}</p>
              </div>
              <div>
                <p className="text-gray-600">Quantity</p>
                <p className="font-semibold text-foreground">{quote.order.quantity} units</p>
              </div>
              <div>
                <p className="text-gray-600">Customer</p>
                <p className="font-semibold text-foreground">
                  {quote.order.customerFirstName} {quote.order.customerLastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Company</p>
                <p className="font-semibold text-foreground">{quote.order.customerCompany || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-foreground mb-3">Pricing</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Price</span>
              <span className="font-semibold text-foreground">R{parseFloat(quote.basePrice.toString()).toFixed(2)}</span>
            </div>
            {quote.priceAdjustmentReason && (
              <div className="text-sm bg-gray-50 p-2 rounded">
                <p className="text-gray-600">Adjustment Reason</p>
                <p className="text-foreground">{quote.priceAdjustmentReason}</p>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
              <span className="font-bold text-foreground">Quoted Price</span>
              <span className="font-bold text-accent text-lg">R{parseFloat(quote.adjustedPrice.toString()).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {quote.adminNotes && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Message from Print Cartel</h3>
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{quote.adminNotes}</p>
          </div>
        )}

        {/* Expiration */}
        {expiresDate && !isExpired && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Quote Expires Soon</p>
                <p className="text-sm text-yellow-800 mt-1">
                  {daysUntilExpiry > 0
                    ? `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} remaining`
                    : "Expires today"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {quote.status === "sent" && !isExpired && (
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isResponding}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isResponding ? "Processing..." : "Accept Quote"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isResponding}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {isResponding ? "Processing..." : "Reject Quote"}
            </Button>
          </div>
        )}

        {isExpired && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Quote Expired</p>
                <p className="text-sm text-red-700 mt-1">
                  This quote is no longer valid. Please contact Print Cartel to request a new quote.
                </p>
              </div>
            </div>
          </div>
        )}

        {(quote.status === "accepted" || quote.status === "rejected") && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              {quote.status === "accepted"
                ? "✓ Your order has been approved and will be processed shortly."
                : "Your quote response has been recorded. Thank you for your consideration."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

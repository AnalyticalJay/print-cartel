import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";


interface Quote {
  id: number;
  orderId: number;
  basePrice: string;
  adjustedPrice: string;
  status: string;
  expiresAt: Date | null;
  sentAt: Date | null;
  priceAdjustmentReason?: string;
  adminNotes?: string;
}

interface QuoteAcceptanceModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export function QuoteAcceptanceModal({
  quote,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: QuoteAcceptanceModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const acceptQuoteMutation = trpc.quoteManagement.acceptQuote.useMutation({
    onSuccess: () => {
      console.log("Quote accepted successfully");
      setIsAccepting(false);
      onAccept?.();
      onClose();
    },
    onError: (error: any) => {
      console.error("Failed to accept quote:", error);
      setIsAccepting(false);
    },
  });

  const rejectQuoteMutation = trpc.quoteManagement.rejectQuote.useMutation({
    onSuccess: () => {
      console.log("Quote rejected successfully");
      setIsRejecting(false);
      onReject?.();
      onClose();
    },
    onError: (error: any) => {
      console.error("Failed to reject quote:", error);
      setIsRejecting(false);
    },
  });

  const handleAccept = async () => {
    setIsAccepting(true);
    await acceptQuoteMutation.mutateAsync({ quoteId: quote.id });
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the quote");
      return;
    }
    setIsRejecting(true);
    await rejectQuoteMutation.mutateAsync({
      quoteId: quote.id,
      reason: rejectionReason,
    });
  };

  const expiresAt = quote.expiresAt ? new Date(quote.expiresAt) : null;
  const now = new Date();
  const isExpired = expiresAt && expiresAt < now;
  const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quote Review</DialogTitle>
          <DialogDescription>
            Review the quote details and decide whether to accept or reject
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quote Status */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {isExpired ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Quote Expired
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Quote Active
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isExpired
                  ? "This quote has expired and can no longer be accepted"
                  : `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium">{formatCurrency(quote.basePrice)}</span>
              </div>

              {quote.priceAdjustmentReason && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Adjustment Reason:</p>
                  <p className="text-sm text-gray-700">{quote.priceAdjustmentReason}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t-2">
                <span className="font-semibold">Final Price:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(quote.adjustedPrice)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {quote.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes from Our Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{quote.adminNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason (shown when rejecting) */}
          {!isExpired && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  If rejecting, please tell us why (optional):
                </label>
                <Textarea
                  placeholder="e.g., Price is too high, Need different specifications, Found another supplier..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAccepting || isRejecting}
            >
              Cancel
            </Button>

            {!isExpired && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isAccepting || isRejecting}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isRejecting ? "Rejecting..." : "Reject Quote"}
                </Button>

                <Button
                  onClick={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isAccepting ? "Accepting..." : "Accept Quote"}
                </Button>
              </>
            )}

            {isExpired && (
              <Button
                variant="outline"
                disabled
                className="text-gray-500"
              >
                Quote Expired - Contact Us for New Quote
              </Button>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Accepting this quote will generate an invoice and proceed to payment. 
              You'll receive a confirmation email with all details.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

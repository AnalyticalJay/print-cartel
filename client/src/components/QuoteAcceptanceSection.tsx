import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Order {
  id: number;
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  totalPriceEstimate: string;
  depositAmount: string;
  paymentMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  quantity: number;
  createdAt: Date;
}

interface QuoteAcceptanceSectionProps {
  order: Order;
  onAcceptanceComplete?: () => void;
}

export function QuoteAcceptanceSection({ order, onAcceptanceComplete }: QuoteAcceptanceSectionProps) {
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const acceptQuoteMutation = trpc.quoteAcceptance.acceptQuote.useMutation();
  const rejectQuoteMutation = trpc.quoteAcceptance.rejectQuote.useMutation();

  const handleAcceptQuote = async () => {
    try {
      setIsProcessing(true);
      await acceptQuoteMutation.mutateAsync({
        orderId: order.id,
        email: order.customerEmail,
      });
      toast.success("Quote accepted! Invoice has been sent to your email.");
      onAcceptanceComplete?.();
    } catch (error) {
      toast.error("Failed to accept quote. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining the quote");
      return;
    }

    try {
      setIsProcessing(true);
      await rejectQuoteMutation.mutateAsync({
        orderId: order.id,
        email: order.customerEmail,
        reason: declineReason,
      });
      toast.success("Quote declined. We'll follow up with you soon.");
      onAcceptanceComplete?.();
    } catch (error) {
      toast.error("Failed to decline quote. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
      setDeclineReason("");
      setShowDeclineReason(false);
    }
  };

  // Only show for pending orders
  if (order.status !== "pending") {
    return null;
  }

  const totalPrice = parseFloat(order.totalPriceEstimate || "0");
  const depositPrice = parseFloat(order.depositAmount || "0");
  const remainingBalance = totalPrice - depositPrice;

  return (
    <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-lg">Quote Awaiting Your Decision</CardTitle>
        </div>
        <CardDescription>
          Please review the quote below and accept or decline
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quote Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-lg">
          <div>
            <p className="text-gray-400 text-sm mb-1">Order ID</p>
            <p className="text-white font-semibold">#{order.id}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Quantity</p>
            <p className="text-white font-semibold">{order.quantity} units</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Price</p>
            <p className="text-white font-semibold text-lg">R{totalPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Payment Method</p>
            <p className="text-white font-semibold capitalize">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Payment Breakdown */}
        {order.paymentMethod === "deposit" && (
          <div className="bg-black/30 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Deposit Required (50%)</span>
              <span className="text-white font-semibold">R{depositPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Remaining Balance</span>
              <span className="text-white font-semibold">R{remainingBalance.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between items-center">
              <span className="text-gray-200 font-medium">Total Amount</span>
              <span className="text-white font-bold text-lg">R{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!showDeclineReason ? (
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptQuote}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Quote
              </Button>
              <Button
                onClick={() => setShowDeclineReason(true)}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline Quote
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Why are you declining this quote?
                </label>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please let us know your reason..."
                  className="bg-black/50 border-gray-700 text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeclineQuote}
                  disabled={isProcessing || !declineReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Decline
                </Button>
                <Button
                  onClick={() => {
                    setShowDeclineReason(false);
                    setDeclineReason("");
                  }}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
          <p className="text-sm text-blue-200">
            💡 Once you accept this quote, an invoice will be sent to your email with payment instructions.
            You can then proceed with payment directly from the email or through your dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

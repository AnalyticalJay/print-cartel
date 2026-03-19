"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface QuoteApprovalCardProps {
  orderId: number;
  orderStatus: string;
  totalPrice: number;
  depositAmount: number;
  paymentMethod: string;
  onApproveSuccess?: () => void;
  onRejectSuccess?: () => void;
}

export function QuoteApprovalCard({
  orderId,
  orderStatus,
  totalPrice,
  depositAmount,
  paymentMethod,
  onApproveSuccess,
  onRejectSuccess,
}: QuoteApprovalCardProps) {

  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Only show if order is in quoted status
  if (orderStatus !== "quoted") {
    return null;
  }

  const approveQuoteMutation = trpc.orders.approveQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote Approved", {
        description: "Your quote has been approved. You will receive an invoice shortly.",
      });
      onApproveSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to approve quote",
      });
    },
  });

  const rejectQuoteMutation = trpc.orders.rejectQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote Rejected", {
        description: "Your quote has been rejected. Our team will contact you shortly.",
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      onRejectSuccess?.();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to reject quote",
      });
    },
  });

  const handleApprove = () => {
    approveQuoteMutation.mutate({ orderId });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Error", {
        description: "Please provide a reason for rejecting the quote",
      });
      return;
    }
    rejectQuoteMutation.mutate({ orderId, reason: rejectionReason });
  };

  const finalAmount = paymentMethod === "deposit" ? depositAmount : totalPrice;
  const amountDue = paymentMethod === "deposit" 
    ? `${depositAmount} (50% deposit)`
    : `${totalPrice} (full payment)`;

  return (
    <Card className="border-cyan-500/30 bg-gray-800/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-cyan-400" />
          <div>
            <CardTitle className="text-lg text-cyan-400">Quote Pending Approval</CardTitle>
            <CardDescription className="text-gray-300">
              Please review and approve or reject this quote to proceed with your order
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quote Details */}
        <div className="space-y-3 rounded-lg bg-gray-900/50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total Price:</span>
            <span className="text-cyan-400 font-semibold">R{totalPrice.toFixed(2)}</span>
          </div>

          {paymentMethod === "deposit" && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Deposit Required (50%):</span>
                <span className="text-cyan-400 font-semibold">R{depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-gray-300">Remaining Balance:</span>
                <span className="text-gray-400">R{(totalPrice - depositAmount).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <span className="text-gray-300 font-medium">Amount Due Now:</span>
            <span className="text-cyan-400 font-bold text-lg">R{finalAmount.toFixed(2)}</span>
          </div>

          <div className="text-xs text-gray-400 pt-2">
            {paymentMethod === "deposit" 
              ? "Pay 50% deposit now to proceed with production. Final payment due before delivery."
              : "Full payment required to proceed with production."}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleApprove}
            disabled={approveQuoteMutation.isPending}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {approveQuoteMutation.isPending ? "Approving..." : "Approve Quote"}
          </Button>

          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-cyan-400">Reject Quote</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Please let us know why you're rejecting this quote. Our team will contact you with alternative options.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Textarea
                  placeholder="Tell us why you're rejecting this quote..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[120px]"
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRejectDialogOpen(false);
                      setRejectionReason("");
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={rejectQuoteMutation.isPending || !rejectionReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {rejectQuoteMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Message */}
        <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-500/20 rounded p-3">
          <p className="font-semibold text-blue-400 mb-1">ℹ️ What happens next?</p>
          <p>
            Once you approve this quote, you'll receive an invoice with payment instructions. 
            Your order will move to production after payment is confirmed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Upload, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface PaymentSectionProps {
  orderId: number;
  totalAmount: number;
  depositAmount?: number;
  amountPaid?: number;
  paymentStatus?: string;
  invoiceUrl?: string;
}

export function PaymentSection({
  orderId,
  totalAmount,
  depositAmount,
  amountPaid = 0,
  paymentStatus = "unpaid",
  invoiceUrl,
}: PaymentSectionProps) {
  const [showPayFastDialog, setShowPayFastDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(depositAmount || totalAmount);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "eft" | "other">("eft");
  const [proofFileName, setProofFileName] = useState("");
  const [proofFileUrl, setProofFileUrl] = useState("");
  const [notes, setNotes] = useState("");

  const paymentStatusQuery = trpc.payment.getPaymentStatus.useQuery({ orderId });

  const initiatePayFastMutation = trpc.payment.initiatePayFastPayment.useMutation({
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      toast.error("Failed to initiate payment: " + (error?.message || "Unknown error"));
    },
  });

  const submitManualPaymentMutation = trpc.payment.submitManualPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment proof submitted successfully. Admin will verify within 24 hours.");
      setShowManualDialog(false);
      setProofFileName("");
      setProofFileUrl("");
      setNotes("");
      paymentStatusQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to submit payment: " + (error?.message || "Unknown error"));
    },
  });

  const handlePayFastPayment = () => {
    initiatePayFastMutation.mutate({
      orderId,
      amount: paymentAmount,
      returnUrl: `${window.location.origin}/orders/${orderId}`,
      cancelUrl: `${window.location.origin}/orders/${orderId}`,
      notifyUrl: `${window.location.origin}/api/payment/payfast-notify`,
    });
  };

  const handleManualPaymentSubmit = () => {
    if (!proofFileUrl) {
      toast.error("Please upload proof of payment");
      return;
    }

    submitManualPaymentMutation.mutate({
      orderId,
      amount: paymentAmount,
      paymentMethod,
      proofFileName,
      proofFileUrl,
      notes,
    });
  };

  const remainingBalance = totalAmount - amountPaid;
  const isPaid = paymentStatus === "paid" || remainingBalance <= 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Status
        </CardTitle>
        <CardDescription>Manage your invoice payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">R {totalAmount.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600">R {amountPaid.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className="text-2xl font-bold text-orange-600">R {remainingBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {isPaid ? (
            <Badge className="bg-green-600 text-white gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Paid
            </Badge>
          ) : paymentStatusQuery.data?.verificationStatus === "pending" ? (
            <Badge className="bg-yellow-600 text-white gap-1">
              <Clock className="h-3 w-3" />
              Pending Verification
            </Badge>
          ) : (
            <Badge className="bg-red-600 text-white gap-1">
              <AlertCircle className="h-3 w-3" />
              Unpaid
            </Badge>
          )}
        </div>

        {/* Verification Notes */}
        {paymentStatusQuery.data?.verificationNotes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">{paymentStatusQuery.data.verificationNotes}</p>
          </div>
        )}

        {/* Payment Methods */}
        {!isPaid && remainingBalance > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Choose Payment Method:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* PayFast Payment */}
              <Dialog open={showPayFastDialog} onOpenChange={setShowPayFastDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pay with PayFast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>PayFast Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payfast-amount">Payment Amount (ZAR)</Label>
                      <Input
                        id="payfast-amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                        min={0}
                        max={remainingBalance}
                        step={0.01}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum: R {remainingBalance.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={handlePayFastPayment}
                      disabled={initiatePayFastMutation.isPending || paymentAmount <= 0}
                      className="w-full"
                    >
                      {initiatePayFastMutation.isPending ? "Processing..." : "Proceed to PayFast"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Manual Payment */}
              <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Upload className="h-4 w-4" />
                    Manual Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Manual Payment Proof</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="manual-amount">Payment Amount (ZAR)</Label>
                      <Input
                        id="manual-amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                        min={0}
                        max={remainingBalance}
                        step={0.01}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum: R {remainingBalance.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <select
                        id="payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm"
                      >
                        <option value="eft">EFT Transfer</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="proof-file">Proof of Payment (URL)</Label>
                      <Input
                        id="proof-file"
                        type="url"
                        placeholder="https://example.com/proof.pdf"
                        value={proofFileUrl}
                        onChange={(e) => {
                          setProofFileUrl(e.target.value);
                          setProofFileName(e.target.value.split("/").pop() || "proof");
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your proof to cloud storage and paste the URL
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="e.g., Reference number, transaction details..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleManualPaymentSubmit}
                      disabled={submitManualPaymentMutation.isPending || !proofFileUrl}
                      className="w-full"
                    >
                      {submitManualPaymentMutation.isPending ? "Submitting..." : "Submit Payment Proof"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Invoice Download */}
        {invoiceUrl && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download Invoice
            </a>
          </Button>
        )}

        {/* Payment Complete Message */}
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-900 font-medium">Payment Complete</p>
            <p className="text-sm text-green-700">Thank you for your payment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

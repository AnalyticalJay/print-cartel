import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle, DollarSign, TrendingUp } from "lucide-react";

interface PaymentReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  paymentId: number;
  onSuccess?: () => void;
}

export function PaymentReconciliationModal({
  isOpen,
  onClose,
  orderId,
  paymentId,
  onSuccess,
}: PaymentReconciliationModalProps) {
  const [activeTab, setActiveTab] = useState<"verify" | "reject">("verify");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [progressToProduction, setProgressToProduction] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const reconciliationQuery = trpc.admin.getReconciliationDetails.useQuery(
    { orderId },
    { enabled: isOpen }
  );

  const verifyPaymentMutation = trpc.admin.verifyPayment.useMutation();
  const rejectPaymentMutation = trpc.admin.rejectPayment.useMutation();

  const handleVerifyPayment = async () => {
    if (!verificationNotes.trim()) {
      toast.error("Please add verification notes");
      return;
    }

    setIsProcessing(true);
    try {
      await verifyPaymentMutation.mutateAsync({
        paymentId,
        orderId,
        verificationNotes,
        progressToProduction,
      });

      toast.success("Payment verified successfully");
      setVerificationNotes("");
      setProgressToProduction(true);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(`Failed to verify payment: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (rejectionReason.length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }

    setIsProcessing(true);
    try {
      await rejectPaymentMutation.mutateAsync({
        paymentId,
        orderId,
        rejectionReason,
      });

      toast.success("Payment rejected successfully");
      setRejectionReason("");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(`Failed to reject payment: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!reconciliationQuery.data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading reconciliation details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { order, financials, payments } = reconciliationQuery.data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Reconciliation - Order #{order.id}</DialogTitle>
          <DialogDescription>
            {order.customerName} ({order.customerEmail})
          </DialogDescription>
        </DialogHeader>

        {/* Order and Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <Badge
                    className={
                      order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Verification:</span>
                  <Badge
                    className={
                      order.paymentVerificationStatus === "verified"
                        ? "bg-green-100 text-green-800"
                        : order.paymentVerificationStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {order.paymentVerificationStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Price:</span>
                  <span className="font-semibold">R{financials.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">R{financials.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Remaining Balance:</span>
                  <span className={`font-semibold ${financials.remainingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                    R{financials.remainingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Payment Records ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">
                      Payment - {payment.paymentMethod}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                      {payment.transactionId ? `TXN: ${payment.transactionId}` : "No transaction ID"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R{payment.amount.toFixed(2)}</p>
                    <Badge
                      className={
                        payment.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : payment.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {payment.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Actions */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "verify" | "reject")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Verify Payment
            </TabsTrigger>
            <TabsTrigger value="reject" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Reject Payment
            </TabsTrigger>
          </TabsList>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-4 mt-4">
            {financials.isFullyPaid && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Payment is fully received. Order can proceed to production.
                </AlertDescription>
              </Alert>
            )}

            {!financials.isFullyPaid && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Remaining balance: R{financials.remainingBalance.toFixed(2)}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <Textarea
                placeholder="Add verification notes (e.g., payment confirmed, reference number, etc.)"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="min-h-24"
              />
            </div>

            {financials.isFullyPaid && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progress"
                  checked={progressToProduction}
                  onCheckedChange={(checked) => setProgressToProduction(checked as boolean)}
                />
                <label htmlFor="progress" className="text-sm cursor-pointer">
                  <span className="font-medium">Progress order to production</span>
                  <p className="text-xs text-gray-500">
                    Order status will change to "in-production" and customer will be notified
                  </p>
                </label>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPayment}
                disabled={isProcessing || !verificationNotes.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : "Verify Payment"}
              </Button>
            </div>
          </TabsContent>

          {/* Reject Tab */}
          <TabsContent value="reject" className="space-y-4 mt-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Rejecting this payment will mark it as failed and notify the customer. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <Textarea
                placeholder="Explain why this payment is being rejected (e.g., insufficient funds, incorrect amount, fraudulent transaction, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 10 characters. Customer will receive this reason in the rejection email.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectPayment}
                disabled={isProcessing || rejectionReason.length < 10}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? "Processing..." : "Reject Payment"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

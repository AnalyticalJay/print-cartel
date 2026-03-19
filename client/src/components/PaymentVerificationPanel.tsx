import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Search } from "lucide-react";
import { toast } from "sonner";

export function PaymentVerificationPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  const { data: orders, isLoading, refetch } = trpc.admin.getPendingPaymentProofs.useQuery({
    search,
    filter: filter === "all" ? undefined : filter,
  });

  const verifyMutation = trpc.admin.verifyPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Payment verified successfully");
      setSelectedOrderId(null);
      setVerificationNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to verify payment: " + error.message);
    },
  });

  const rejectMutation = trpc.admin.rejectPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Payment rejected. Customer will be notified.");
      setSelectedOrderId(null);
      setVerificationNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to reject payment: " + error.message);
    },
  });

  const selectedOrder = orders?.find(o => o.id === selectedOrderId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleVerify = async () => {
    if (!selectedOrderId) return;
    await verifyMutation.mutateAsync({
      orderId: selectedOrderId,
      notes: verificationNotes || undefined,
    });
  };

  const handleReject = async () => {
    if (!selectedOrderId) return;
    await rejectMutation.mutateAsync({
      orderId: selectedOrderId,
      reason: verificationNotes || "Payment proof rejected by admin",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "verified", "rejected"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Payment Proofs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">Loading payment proofs...</div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-semibold">
                        {order.customerFirstName} {order.customerLastName}
                      </p>
                      <p className="text-sm text-gray-600">{order.customerEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getStatusColor(order.paymentVerificationStatus || "pending")}>
                      {order.paymentVerificationStatus === "verified"
                        ? "Verified"
                        : order.paymentVerificationStatus === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </Badge>
                    <Badge variant="outline">Order #{order.id}</Badge>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">R{parseFloat(order.totalPriceEstimate).toFixed(2)}</p>
                  {order.paymentProofUploadedAt && (
                    <p className="text-xs text-gray-600">
                      Uploaded: {new Date(order.paymentProofUploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {order.paymentProofUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(order.paymentProofUrl, "_blank")}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  )}
                  {order.paymentVerificationStatus !== "verified" && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="gap-2"
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-600">No payment proofs to review</div>
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verify Payment Proof</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Order #{selectedOrder.id}</p>
                <p className="font-semibold mb-2">
                  {selectedOrder.customerFirstName} {selectedOrder.customerLastName}
                </p>
                <p className="text-sm text-gray-600 mb-3">{selectedOrder.customerEmail}</p>
                <p className="text-lg font-bold">R{parseFloat(selectedOrder.totalPriceEstimate).toFixed(2)}</p>
              </div>

              {/* Payment Proof Preview */}
              {selectedOrder.paymentProofUrl && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-semibold mb-3">Uploaded Proof:</p>
                  {selectedOrder.paymentProofUrl.endsWith(".pdf") ? (
                    <div className="bg-gray-100 p-8 rounded text-center">
                      <p className="text-gray-600 mb-2">PDF Document</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedOrder.paymentProofUrl, "_blank")}
                      >
                        Open PDF
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={selectedOrder.paymentProofUrl}
                      alt="Payment proof"
                      className="max-h-64 rounded border"
                    />
                  )}
                </div>
              )}

              {/* Verification Notes */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Verification Notes (Optional)</label>
                <Textarea
                  placeholder="Add notes about the verification (e.g., reference number matched, amount correct, etc.)"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {verifyMutation.isPending ? "Verifying..." : "Verify & Mark Paid"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Customer will be notified of verification status via email
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

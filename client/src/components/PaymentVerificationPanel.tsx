import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface PaymentProofWithOrder {
  id: number;
  orderId: number;
  userId: number;
  status: "pending" | "verified" | "rejected";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  submittedAt: Date;
  verifiedAt: Date | null;
  verifiedBy: number | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: number;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    totalPriceEstimate: number;
    status: string;
  };
}

export function PaymentVerificationPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selectedProofId, setSelectedProofId] = useState<number | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationAmount, setVerificationAmount] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationAction, setVerificationAction] = useState<"approve" | "reject" | null>(null);

  const { data: proofs, isLoading, refetch } = trpc.admin.getPaymentProofs.useQuery(
    { status: filter === "all" ? undefined : (filter as any) },
    { refetchInterval: 5000 }
  );

  const verifyMutation = trpc.admin.verifyPaymentProof.useMutation({
    onSuccess: () => {
      toast.success(verificationAction === "approve" ? "Payment approved successfully" : "Payment rejected");
      setSelectedProofId(null);
      setShowVerificationForm(false);
      setVerificationAmount("");
      setVerificationNotes("");
      setVerificationAction(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to verify payment: " + error.message);
    },
  });

  const filteredProofs = useMemo(() => {
    if (!proofs) return [];
    if (!search) return proofs;

    const query = search.toLowerCase();
    return proofs.filter((proof) => {
      const customerName = `${proof.order?.customerFirstName} ${proof.order?.customerLastName}`.toLowerCase();
      const email = proof.order?.customerEmail?.toLowerCase() || "";
      const orderId = proof.orderId.toString();
      return customerName.includes(query) || email.includes(query) || orderId.includes(query);
    });
  }, [proofs, search]);

  const selectedProof = filteredProofs.find(p => p.id === selectedProofId);

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const handleVerify = async () => {
    if (!selectedProof || !verificationAction) {
      toast.error("Please select an action");
      return;
    }

    if (verificationAction === "approve" && !verificationAmount) {
      toast.error("Please enter the verified amount");
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        paymentProofId: selectedProof.id,
        action: verificationAction,
        verifiedAmount: verificationAction === "approve" ? parseFloat(verificationAmount) : undefined,
        adminNotes: verificationNotes || undefined,
      });
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
        <p className="text-gray-600 mt-1">Review and verify manual payment proofs from customers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by customer name, email, or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Proofs List */}
      <div className="space-y-4">
        {filteredProofs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No payment proofs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredProofs.map((proof) => (
            <Card key={proof.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: Customer Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {proof.order?.customerFirstName} {proof.order?.customerLastName}
                        </p>
                        <p className="text-sm text-gray-600">{proof.order?.customerEmail}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline">Order #{proof.orderId}</Badge>
                      <Badge className={getStatusColor(proof.status)}>
                        {proof.status === "pending" ? "Pending Review" : proof.status === "verified" ? "Verified" : "Rejected"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(proof.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Amount Due:</span> R{parseFloat(proof.order?.totalPriceEstimate?.toString() || "0").toFixed(2)}
                    </p>
                  </div>

                  {/* Right: File Info & Actions */}
                  <div className="flex flex-col gap-3 md:items-end">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{proof.fileName}</p>
                      <p className="text-xs">{formatFileSize(proof.fileSize)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProofId(proof.id);
                          setShowVerificationForm(false);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {proof.status === "pending" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedProofId(proof.id);
                            setShowVerificationForm(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={!!selectedProof && !showVerificationForm} onOpenChange={(open) => !open && setSelectedProofId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof - Order #{selectedProof?.orderId}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Preview */}
            <div className="bg-gray-50 rounded-lg p-4 min-h-96 flex items-center justify-center">
              {selectedProof && isImageFile(selectedProof.mimeType) ? (
                <img
                  src={selectedProof.fileUrl}
                  alt="Payment proof"
                  className="max-w-full max-h-96 object-contain"
                />
              ) : selectedProof?.mimeType === "application/pdf" ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">PDF Preview</p>
                  <p className="text-sm text-gray-500 mt-2">{selectedProof.fileName}</p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">File Preview Not Available</p>
                </div>
              )}
            </div>

            {/* File Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">File Name</p>
                <p className="font-medium">{selectedProof?.fileName}</p>
              </div>
              <div>
                <p className="text-gray-600">File Size</p>
                <p className="font-medium">{formatFileSize(selectedProof?.fileSize || 0)}</p>
              </div>
              <div>
                <p className="text-gray-600">Submitted</p>
                <p className="font-medium">
                  {selectedProof && new Date(selectedProof.submittedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium">{selectedProof?.status}</p>
              </div>
            </div>

            {/* Admin Notes (if exists) */}
            {selectedProof?.adminNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">Admin Notes</p>
                <p className="text-sm text-blue-800 mt-1">{selectedProof.adminNotes}</p>
              </div>
            )}

            {/* Download Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (selectedProof?.fileUrl) {
                    const link = document.createElement("a");
                    link.href = selectedProof.fileUrl;
                    link.download = selectedProof.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {selectedProof?.status === "pending" && (
                <Button
                  className="flex-1"
                  onClick={() => setShowVerificationForm(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Payment
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Form Dialog */}
      <Dialog open={showVerificationForm} onOpenChange={setShowVerificationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Due Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Amount Due</p>
              <p className="text-2xl font-bold text-gray-900">
                R{parseFloat(selectedProof?.order?.totalPriceEstimate?.toString() || "0").toFixed(2)}
              </p>
            </div>

            {/* Verification Action */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Action</label>
              <Select value={verificationAction || ""} onValueChange={(value: any) => setVerificationAction(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Payment</SelectItem>
                  <SelectItem value="reject">Reject Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verified Amount (for approval) */}
            {verificationAction === "approve" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Verified Amount (ZAR)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter verified amount"
                  value={verificationAmount}
                  onChange={(e) => setVerificationAmount(e.target.value)}
                />
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {verificationAction === "approve" ? "Notes (optional)" : "Rejection Reason"}
              </label>
              <Textarea
                placeholder={
                  verificationAction === "approve"
                    ? "Add any notes about this payment..."
                    : "Explain why this payment is being rejected..."
                }
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowVerificationForm(false);
                  setVerificationAmount("");
                  setVerificationNotes("");
                  setVerificationAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                variant={verificationAction === "reject" ? "destructive" : "default"}
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : verificationAction === "approve" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

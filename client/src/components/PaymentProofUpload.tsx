import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { toast } from "sonner";

interface PaymentProofUploadProps {
  orderId: number;
  orderAmount: number;
  onUploadSuccess?: () => void;
}

export function PaymentProofUpload({ orderId, orderAmount, onUploadSuccess }: PaymentProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = trpc.orders.uploadPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Payment proof uploaded successfully. Awaiting admin verification.");
      setSelectedFile(null);
      onUploadSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to upload payment proof: " + error.message);
    },
  });

  const getProofQuery = trpc.orders.getPaymentProof.useQuery({ orderId });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Validate file type (images and PDFs only)
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only images (JPG, PNG, GIF) and PDFs are allowed");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      await uploadMutation.mutateAsync({
        orderId,
        file: new Uint8Array(buffer),
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const proof = getProofQuery.data;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Payment Proof</h3>
          <p className="text-sm text-gray-600">
            Upload a screenshot or PDF of your bank transfer confirmation. Amount: <span className="font-bold">R{orderAmount.toFixed(2)}</span>
          </p>
        </div>

        {/* Current Status */}
        {proof && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(proof.status)}
                <span className="font-medium capitalize">{proof.status} Status</span>
              </div>
              <Badge className={getStatusColor(proof.status)}>
                {proof.status === "verified" ? "Verified" : proof.status === "rejected" ? "Rejected" : "Pending Review"}
              </Badge>
            </div>

            {proof.uploadedAt && (
              <p className="text-xs text-gray-600 mb-2">
                Uploaded: {new Date(proof.uploadedAt).toLocaleString()}
              </p>
            )}

            {proof.verifiedAt && (
              <p className="text-xs text-gray-600 mb-2">
                Verified: {new Date(proof.verifiedAt).toLocaleString()}
              </p>
            )}

            {proof.notes && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Admin Notes:</p>
                <p className="text-sm text-gray-600">{proof.notes}</p>
              </div>
            )}

            {proof.url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(proof.url, "_blank")}
                className="mt-3 w-full"
              >
                Download Uploaded Proof
              </Button>
            )}
          </div>
        )}

        {/* Upload Section */}
        {!proof || proof.status === "rejected" ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="payment-proof-input"
              disabled={isUploading}
            />

            <label htmlFor="payment-proof-input" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported: JPG, PNG, GIF, PDF (Max 10MB)
              </p>
            </label>

            {selectedFile && (
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || uploadMutation.isPending}
                  className="flex-1"
                >
                  {isUploading || uploadMutation.isPending ? "Uploading..." : "Upload Proof"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : proof.status === "verified" ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Payment verified! Thank you.</span>
            </div>
            <p className="text-sm text-green-600 mt-2">Your order will proceed to production shortly.</p>
          </div>
        ) : null}

        <p className="text-xs text-gray-500 text-center">
          Our team will review your payment proof within 24 hours and update your order status.
        </p>
      </div>
    </Card>
  );
}

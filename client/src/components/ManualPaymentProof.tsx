import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface ManualPaymentProofProps {
  orderId: number;
  orderNumber: string;
  depositAmount: number;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    branchCode: string;
    reference: string;
  };
  onProofSubmitted?: () => void;
  existingProof?: {
    id: number;
    status: "pending" | "verified" | "rejected";
    submittedAt: Date;
    verifiedAt?: Date;
    fileName: string;
    fileUrl: string;
    adminNotes?: string;
  };
}

export const ManualPaymentProof: React.FC<ManualPaymentProofProps> = ({
  orderId,
  orderNumber,
  depositAmount,
  bankDetails,
  onProofSubmitted,
  existingProof,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast.error("Please upload an image or PDF file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
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
      // TODO: Implement file upload to S3 and create payment proof record
      // For now, just show success
      toast.success("Payment proof submitted successfully");
      setSelectedFile(null);
      onProofSubmitted?.();
    } catch (error) {
      toast.error("Failed to submit payment proof");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-600 text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bank Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
          <CardDescription>Transfer the deposit amount to the account below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bank:</span>
              <span className="font-semibold">{bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Holder:</span>
              <span className="font-semibold">{bankDetails.accountHolder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Number:</span>
              <span className="font-semibold">{bankDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Branch Code:</span>
              <span className="font-semibold">{bankDetails.branchCode}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm text-gray-600">Reference:</span>
              <span className="font-semibold text-blue-600">{bankDetails.reference}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm text-gray-600">Amount to Transfer:</span>
              <span className="font-bold text-lg text-green-600">R {depositAmount.toFixed(2)}</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Use your order number <strong>#{orderNumber}</strong> as the payment reference so we can match your payment to your order.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Existing Proof Status */}
      {existingProof && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Payment Proof Status
              {getStatusBadge(existingProof.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Submitted:</span>
                <span>{new Date(existingProof.submittedAt).toLocaleDateString()}</span>
              </div>
              {existingProof.verifiedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Verified:</span>
                  <span>{new Date(existingProof.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">File:</span>
                <a href={existingProof.fileUrl} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {existingProof.fileName}
                </a>
              </div>
            </div>
            {existingProof.adminNotes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin Notes:</strong> {existingProof.adminNotes}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      {!existingProof || existingProof.status === "rejected" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Payment Proof</CardTitle>
            <CardDescription>Upload a screenshot or PDF of your bank transfer confirmation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                {selectedFile ? selectedFile.name : "Drag and drop your file here or click to browse"}
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">Accepted formats: JPG, PNG, PDF (Max 10MB)</p>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? "Uploading..." : "Submit Payment Proof"}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment proof will be reviewed by our team. You'll receive an email confirmation once it's verified.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

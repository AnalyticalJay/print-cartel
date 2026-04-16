import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SimplifiedPaymentProofUploadProps {
  orderId: number;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SimplifiedPaymentProofUpload({
  orderId,
  amount,
  onSuccess,
  onError,
}: SimplifiedPaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPaymentProof = trpc.orders.uploadPaymentProof.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !transactionRef || !paymentDate) {
      onError?.("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Convert base64 to Uint8Array
        const binaryString = atob(base64.split(',')[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        await submitPaymentProof.mutateAsync({
          orderId,
          file: bytes,
          fileName: file.name,
          mimeType: file.type,
        });

        setFile(null);
        setTransactionRef("");
        setPaymentDate("");
        onSuccess?.();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Failed to submit payment proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle>Upload Payment Proof</CardTitle>
        <CardDescription>
          Upload a screenshot or PDF of your bank transfer confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <p className="font-semibold text-green-400">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="mt-2"
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="font-semibold">Drag and drop your proof here</p>
                <p className="text-sm text-gray-400">or</p>
                <label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, or PDF (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="ref">Transaction Reference / Receipt Number *</Label>
            <Input
              id="ref"
              placeholder="e.g., REF123456789 or Receipt #"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="bg-gray-700 border-gray-600"
              required
            />
            <p className="text-xs text-gray-400">
              This helps us verify your payment quickly
            </p>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Payment Date *</Label>
            <Input
              id="date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="bg-gray-700 border-gray-600"
              required
            />
          </div>

          {/* Amount Confirmation */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-300">Amount to Transfer</p>
                <p className="text-blue-200">R {amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || !transactionRef || !paymentDate || isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
          </Button>

          {/* Info */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>✓ Our team will verify your payment within 24 hours</p>
            <p>✓ You'll receive an email confirmation once verified</p>
            <p>✓ Your order will start production immediately after verification</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

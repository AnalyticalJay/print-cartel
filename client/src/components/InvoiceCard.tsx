import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface InvoiceCardProps {
  orderId: number;
  status: string;
  invoiceUrl?: string;
  invoiceAcceptedAt?: Date;
  invoiceDeclinedAt?: Date;
  invoiceDeclineReason?: string;
  totalPrice: number;
  depositAmount?: number;
  paymentMethod?: string;
  onInvoiceAction?: () => void;
}

export function InvoiceCard({
  orderId,
  status,
  invoiceUrl,
  invoiceAcceptedAt,
  invoiceDeclinedAt,
  invoiceDeclineReason,
  totalPrice,
  depositAmount,
  paymentMethod,
  onInvoiceAction,
}: InvoiceCardProps) {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const acceptInvoiceMutation = trpc.orders.acceptInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice accepted! Redirecting to payment...");
      onInvoiceAction?.();
      setTimeout(() => {
        setLocation(`/payment?orderId=${orderId}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to accept invoice");
      setIsProcessing(false);
    },
  });

  const declineInvoiceMutation = trpc.orders.declineInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice declined. Please provide a reason.");
      onInvoiceAction?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to decline invoice");
      setIsProcessing(false);
    },
  });

  const handleAcceptInvoice = async () => {
    setIsProcessing(true);
    try {
      await acceptInvoiceMutation.mutateAsync({ orderId });
    } catch (error) {
      console.error("Error accepting invoice:", error);
    }
  };

  const handleDeclineInvoice = async () => {
    const reason = window.prompt("Please provide a reason for declining this invoice:");
    if (reason) {
      setIsProcessing(true);
      try {
        await declineInvoiceMutation.mutateAsync({ orderId, reason });
      } catch (error) {
        console.error("Error declining invoice:", error);
      }
    }
  };

  const handleDownloadInvoice = async () => {
    if (invoiceUrl) {
      try {
        const response = await fetch(invoiceUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        toast.error("Failed to download invoice");
      }
    }
  };

  // Only show if status is quoted
  if (status !== "quoted") {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <CardTitle>Invoice</CardTitle>
          </div>
          {invoiceAcceptedAt && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Accepted
            </Badge>
          )}
          {invoiceDeclinedAt && (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="mr-1 h-3 w-3" />
              Declined
            </Badge>
          )}
          {!invoiceAcceptedAt && !invoiceDeclinedAt && (
            <Badge className="bg-amber-100 text-amber-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
        <CardDescription>Your quote is ready for review</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Invoice Summary */}
        <div className="rounded-lg bg-white p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">R{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Total Due:</span>
              <span className="font-bold text-lg">R{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Actions */}
        {!invoiceAcceptedAt && !invoiceDeclinedAt && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {invoiceUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAcceptInvoice}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept & Pay
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineInvoice}
                disabled={isProcessing}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Declined Message */}
        {invoiceDeclinedAt && invoiceDeclineReason && (
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Reason for Decline:</p>
            <p className="mt-1 text-sm text-red-700">{invoiceDeclineReason}</p>
            <p className="mt-3 text-xs text-red-600">
              Our team will contact you to discuss alternative options.
            </p>
          </div>
        )}

        {/* Accepted Message */}
        {invoiceAcceptedAt && (
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">
              ✓ Invoice accepted on {new Date(invoiceAcceptedAt).toLocaleDateString()}
            </p>
            <p className="mt-2 text-sm text-green-700">
              Proceed to payment to complete your order.
            </p>
            <Button
              onClick={() => setLocation(`/payment?orderId=${orderId}`)}
              className="mt-3 w-full bg-green-600 hover:bg-green-700"
            >
              Go to Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

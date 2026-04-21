import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OrderDetailTimeline } from "@/components/OrderDetailTimeline";
import { PaymentStatusDisplay } from "@/components/PaymentStatusDisplay";
import { Download, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface OrderDetailModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState(order?.additionalNotes || "");

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "quoted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "in-production":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "shipped":
        return "bg-cyan-100 text-cyan-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "deposit_paid":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(order.customerEmail);
    toast.success("Email copied to clipboard");
  };

  const handleDownloadInvoice = () => {
    if (order.invoiceUrl) {
      window.open(order.invoiceUrl, "_blank");
      toast.success("Invoice download started");
    } else {
      toast.error("No invoice available");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-2xl">Order #{order.id}</DialogTitle>
          <DialogDescription className="text-base">
            {order.customerFirstName} {order.customerLastName} • {order.createdAt && new Date(order.createdAt).toLocaleDateString("en-ZA")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 px-6 pt-4 bg-transparent border-b">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Name</p>
                    <p className="font-semibold text-sm">
                      {order.customerFirstName} {order.customerLastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Email</p>
                    <div className="flex items-start gap-2">
                      <p className="font-semibold text-sm break-all">{order.customerEmail}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyEmail}
                        className="h-5 w-5 p-0 flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Phone</p>
                    <p className="font-semibold text-sm">{order.customerPhone}</p>
                  </div>
                  {order.customerCompany && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase">Company</p>
                      <p className="font-semibold text-sm">{order.customerCompany}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase mb-1">Order Status</p>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase mb-1">Payment Status</p>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Quantity</p>
                    <p className="font-semibold text-sm">{order.quantity} units</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Total Price</p>
                    <p className="font-semibold text-lg">
                      R{parseFloat(order.totalPriceEstimate).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Amount Paid</p>
                    <p className="font-semibold text-lg text-green-600">
                      R{parseFloat(order.amountPaid || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Amount Due</p>
                    <p className="font-semibold text-lg text-red-600">
                      R{(parseFloat(order.totalPriceEstimate) - parseFloat(order.amountPaid || 0)).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 px-6 py-4">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.deliveryAddress && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase mb-1">Delivery Address</p>
                    <p className="font-semibold">{order.deliveryAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase mb-1">Garment Color</p>
                    <p className="font-semibold">{order.garmentColor || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase mb-1">Garment Size</p>
                    <p className="font-semibold">{order.garmentSize || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Section */}
            {order.invoiceUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleDownloadInvoice}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="px-6 py-4">
            <OrderDetailTimeline order={order} />
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4 px-6 py-4">
            <PaymentStatusDisplay 
              paymentStatus={(order.paymentStatus as any) || "unpaid"}
              totalAmount={parseFloat(String(order.totalPriceEstimate))}
              amountPaid={parseFloat(String(order.amountPaid || "0"))}
              depositAmount={order.depositAmount ? parseFloat(String(order.depositAmount)) : undefined}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 px-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Notes</CardTitle>
                <CardDescription>Internal notes about this order</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  className="min-h-[200px]"
                  readOnly
                />
              </CardContent>
            </Card>

            {order.quoteRejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base text-red-900">Quote Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-800">{order.quoteRejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {order.paymentVerificationNotes && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base text-green-900">Payment Verification Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800">{order.paymentVerificationNotes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

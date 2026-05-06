import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Eye, CheckCircle2, Clock, AlertCircle, Truck, Package, Upload, RefreshCw, XCircle } from "lucide-react";
import { RealtimeOrderTracker } from "@/components/RealtimeOrderTracker";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { CustomerOrderStatusTimeline } from "@/components/CustomerOrderStatusTimeline";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { sendOrderStatusNotification } from "@/lib/pushNotifications";

interface OrderWithPrints {
  id: number;
  userId?: number | null;
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string | null;
  additionalNotes: string | null;
  totalPriceEstimate: string | number;
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  prints?: Array<{
    id: number;
    orderId: number;
    printSizeId: number;
    placementId: number;
    uploadedFilePath: string | null;
    uploadedFileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    designApprovalStatus?: string;
    designApprovalNotes?: string | null;
  }>;
}

export default function OrderTracking() {
  // Read ?order= and ?email= query params from URL for deep-linking from emails
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const deepLinkOrderId = useMemo(() => {
    const v = urlParams.get("order");
    return v ? parseInt(v, 10) : null;
  }, [urlParams]);
  const deepLinkEmail = useMemo(() => urlParams.get("email") || "", [urlParams]);

  const [email, setEmail] = useState(deepLinkEmail);
  const [searchedEmail, setSearchedEmail] = useState(deepLinkEmail);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPrints | null>(null);
  const deepLinkHandled = useRef(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [previousStatuses, setPreviousStatuses] = useState<Record<number, string>>({});
  const [reUploadingPrintId, setReUploadingPrintId] = useState<number | null>(null);
  const [uploadingPrintId, setUploadingPrintId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

  // Get status history for selected order
  const statusHistoryQuery = trpc.orders.getStatusHistory.useQuery(
    { orderId: selectedOrder?.id || 0 },
    { enabled: !!selectedOrder?.id }
  );

  const ordersQuery = trpc.orders.getByEmail.useQuery(
    { email: searchedEmail },
    {
      enabled: !!searchedEmail,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    }
  );

  // Auto-select the order from the ?order= query param once results load
  useEffect(() => {
    if (deepLinkHandled.current) return;
    if (!ordersQuery.data || !deepLinkOrderId) return;
    const match = ordersQuery.data.find((o) => o.id === deepLinkOrderId);
    if (match) {
      setSelectedOrder(match as OrderWithPrints);
      deepLinkHandled.current = true;
    }
  }, [ordersQuery.data, deepLinkOrderId]);

  // Monitor for status changes and send notifications
  useEffect(() => {
    if (!ordersQuery.data) return;

    ordersQuery.data.forEach((order) => {
      const previousStatus = previousStatuses[order.id];
      if (previousStatus && previousStatus !== order.status) {
        // Status changed, send notification
        sendOrderStatusNotification(order.id, order.status);
      }
    });

    // Update previous statuses
    const newStatuses: Record<number, string> = {};
    ordersQuery.data.forEach((order) => {
      newStatuses[order.id] = order.status;
    });
    setPreviousStatuses(newStatuses);
  }, [ordersQuery.data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSearchedEmail(email);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "quoted":
        return "bg-blue-500 text-white";
      case "approved":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const fileUploadMutation = trpc.files.upload.useMutation();
  const updatePrintArtworkMutation = trpc.orders.updatePrintArtwork.useMutation({
    onSuccess: () => {
      toast.success("Artwork re-submitted successfully! Our team will review it shortly.");
      setReUploadingPrintId(null);
      setUploadingPrintId(null);
      ordersQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to re-submit artwork. Please try again.");
      setUploadingPrintId(null);
    },
  });

  const handleReUpload = async (printId: number, orderId: number, file: File) => {
    setUploadingPrintId(printId);
    try {
      // Convert file to Uint8Array for upload
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const uploadResult = await fileUploadMutation.mutateAsync({
        fileName: file.name,
        fileData: uint8Array,
        mimeType: file.type,
      });
      await updatePrintArtworkMutation.mutateAsync({
        printId,
        orderId,
        uploadedFilePath: uploadResult.url,
        uploadedFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Please try again.");
      setUploadingPrintId(null);
    }
  };

  const getArtworkStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-800 text-green-200"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case "changes_requested":
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-200"><XCircle className="w-3 h-3" /> Changes Required</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-800 text-yellow-200"><Clock className="w-3 h-3" /> Pending Review</span>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "quoted":
        return "Quote Sent";
      case "approved":
        return "Approved";
      default:
        return status;
    }
  };

  const colorMap: Record<number, { name: string; hex: string }> = {
    1: { name: "Black", hex: "#000000" },
    2: { name: "White", hex: "#FFFFFF" },
    3: { name: "Red", hex: "#FF0000" },
    4: { name: "Blue", hex: "#0000FF" },
    5: { name: "Green", hex: "#00AA00" },
    6: { name: "Yellow", hex: "#FFFF00" },
  };

  const getColorNameForId = (colorId: number): string => {
    return colorMap[colorId]?.name || `Color ${colorId}`;
  };

  const getColorForId = (colorId: number): string => {
    return colorMap[colorId]?.hex || "#808080";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      {/* Push Notification Prompt */}
      {vapidPublicKey && (
        <PushNotificationPrompt vapidPublicKey={vapidPublicKey} />
      )}
      <div className="max-w-6xl mx-auto mt-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Track Your Order</h1>
        {vapidPublicKey && (
          <p className="text-gray-200 text-sm mb-4">
            💡 Enable notifications above to get real-time order updates!
          </p>
        )}
          <p className="text-gray-200">Enter your email address to view your order status and details</p>
        </div>

        {/* Search Form */}
        {!selectedOrder && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Find Your Order</CardTitle>
              <CardDescription>Enter the email address associated with your order</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={ordersQuery.isLoading}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      {ordersQuery.isLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {selectedOrder ? (
          // Order Detail View
          <div className="space-y-4">
            <Button
              onClick={() => setSelectedOrder(null)}
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              ← Back to Orders
            </Button>

            {/* Real-time Order Tracker */}
            <RealtimeOrderTracker orderId={selectedOrder.id} autoRefreshInterval={5000} />

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">Order #{selectedOrder.id}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-200">Name</p>
                      <p className="text-white">
                        {selectedOrder.customerFirstName} {selectedOrder.customerLastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-200">Email</p>
                      <p className="text-white">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-200">Phone</p>
                      <p className="text-white">{selectedOrder.customerPhone}</p>
                    </div>
                    {selectedOrder.customerCompany && (
                      <div>
                        <p className="text-gray-200">Company</p>
                        <p className="text-white">{selectedOrder.customerCompany}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Order Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-200">Quantity</p>
                      <p className="text-white">{selectedOrder.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-gray-200">Estimated Total</p>
                      <p className="text-white font-semibold">
                        R{parseFloat(String(selectedOrder.totalPriceEstimate)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-200">Garment Color</p>
                      <p className="text-white flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-gray-400"
                          style={{
                            backgroundColor: getColorForId(selectedOrder.colorId),
                          }}
                        />
                        {getColorNameForId(selectedOrder.colorId)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Artwork Files */}
                {selectedOrder.prints && selectedOrder.prints.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Artwork Files</h3>
                    <div className="space-y-3">
                      {selectedOrder.prints.map((print) => (
                        <div key={print.id} className="bg-gray-700 rounded-lg overflow-hidden">
                          {/* File row */}
                          <div className="flex items-center justify-between p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white text-sm font-medium truncate">{print.uploadedFileName}</p>
                                {getArtworkStatusBadge(print.designApprovalStatus)}
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-gray-200">
                                {print.fileSize && (
                                  <span>{(print.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                )}
                                {print.mimeType && <span>{print.mimeType}</span>}
                              </div>
                            </div>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-white hover:text-orange-500 flex-shrink-0"
                              title="Download artwork file"
                            >
                              <a href={print.uploadedFilePath ?? '#'} download>
                                <Download className="w-4 h-4" />
                                <span className="ml-1 hidden sm:inline">Download</span>
                              </a>
                            </Button>
                          </div>

                          {/* Changes requested banner + re-upload */}
                          {print.designApprovalStatus === "changes_requested" && (() => {
                            const artworkLocked = ["quoted", "approved", "in-production", "completed", "shipped", "cancelled"].includes(selectedOrder.status);
                            const lockMessage =
                              selectedOrder.status === "quoted"
                                ? "A quote has been issued — artwork is now locked. Contact us at sales@printcartel.co.za to request changes."
                                : selectedOrder.status === "approved"
                                ? "This order has been approved — artwork can no longer be changed."
                                : "Artwork cannot be changed at this stage of the order.";
                            return (
                              <div className="border-t border-gray-600 bg-red-950 bg-opacity-40 p-3">
                                {print.designApprovalNotes && (
                                  <div className="mb-3">
                                    <p className="text-red-300 text-xs font-semibold uppercase tracking-wide mb-1">Admin Feedback</p>
                                    <p className="text-red-100 text-sm">{print.designApprovalNotes}</p>
                                  </div>
                                )}
                                {artworkLocked ? (
                                  <div className="flex items-start gap-2 text-yellow-200 text-xs bg-yellow-900 bg-opacity-40 rounded p-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{lockMessage}</span>
                                  </div>
                                ) : reUploadingPrintId === print.id ? (
                                  <div className="space-y-2">
                                    <p className="text-yellow-200 text-xs">Select a corrected artwork file (PNG, JPG, PDF, AI, EPS, SVG — max 50MB):</p>
                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      accept=".png,.jpg,.jpeg,.pdf,.ai,.eps,.svg"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleReUpload(print.id, selectedOrder.id, file);
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        disabled={uploadingPrintId === print.id}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-orange-500 hover:bg-orange-600 text-white"
                                      >
                                        {uploadingPrintId === print.id ? (
                                          <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                                        ) : (
                                          <><Upload className="w-3 h-3 mr-1" /> Choose File</>
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-white"
                                        onClick={() => setReUploadingPrintId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={uploadingPrintId === print.id}
                                    onClick={() => setReUploadingPrintId(print.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                  >
                                    <Upload className="w-3 h-3 mr-1" /> Re-Upload Corrected Artwork
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedOrder.additionalNotes && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Special Requests</h3>
                    <p className="text-gray-300 text-sm bg-gray-700 p-3 rounded-lg">
                      {selectedOrder.additionalNotes}
                    </p>
                  </div>
                )}

                {/* Status Timeline */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Order Status History</h3>
                  <CustomerOrderStatusTimeline
                    statusHistory={statusHistoryQuery.data || []}
                    isLoading={statusHistoryQuery.isLoading}
                    estimatedDelivery={selectedOrder.estimatedDelivery}
                  />
                </div>

                {/* Info Message */}
                <div className="p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    {selectedOrder.status === "pending" &&
                      "Your order is being reviewed. You will receive an email with a quote shortly."}
                    {selectedOrder.status === "quoted" &&
                      "A quote has been sent to your email. Please review and confirm to proceed."}
                    {selectedOrder.status === "approved" &&
                      "Your order has been approved and is ready for production."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
          // Orders List
          <div className="space-y-4">
            <p className="text-gray-300 mb-4">
              Found {ordersQuery.data.length} order(s) for {searchedEmail}
            </p>
            {ordersQuery.data.map((order) => (
              <Card
                key={order.id}
                className="bg-gray-800 border-gray-700 hover:border-gray-600 transition cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div
                    onClick={() => setSelectedOrder(order)}
                    className="flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">Order #{order.id}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-200 text-sm">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        {order.quantity} units • R{parseFloat(order.totalPriceEstimate).toFixed(2)}
                      </p>
                    </div>
                    <Eye className="w-5 h-5 text-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ordersQuery.isLoading || ordersQuery.isFetching ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <p className="text-gray-200 text-center">
                {ordersQuery.isFetching ? 'Updating orders...' : 'Searching for orders...'}
              </p>
            </CardContent>
          </Card>
        ) : searchedEmail ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <p className="text-gray-200 text-center">No orders found for {searchedEmail}</p>
              <Button
                onClick={() => {
                  setSearchedEmail("");
                  setEmail("");
                }}
                variant="outline"
                className="w-full mt-4 text-white border-gray-600 hover:bg-gray-700"
              >
                Search Again
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

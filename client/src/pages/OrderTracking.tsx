import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Eye, CheckCircle2, Clock, AlertCircle, Truck, Package } from "lucide-react";
import { RealtimeOrderTracker } from "@/components/RealtimeOrderTracker";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import { CustomerOrderStatusTimeline } from "@/components/CustomerOrderStatusTimeline";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { sendOrderStatusNotification } from "@/lib/pushNotifications";

interface OrderWithPrints {
  id: number;
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
  totalPriceEstimate: string;
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  prints: Array<{
    id: number;
    orderId: number;
    printSizeId: number;
    placementId: number;
    uploadedFilePath: string;
    uploadedFileName: string;
    fileSize: number | null;
    mimeType: string | null;
  }>;
}

export default function OrderTracking() {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPrints | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [previousStatuses, setPreviousStatuses] = useState<Record<number, string>>({});
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
                        R{parseFloat(selectedOrder.totalPriceEstimate).toFixed(2)}
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
                    <div className="space-y-2">
                      {selectedOrder.prints.map((print, index) => (
                        <div
                          key={print.id}
                          className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                        >
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{print.uploadedFileName}</p>
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
                            className="ml-2 text-white hover:text-orange-500"
                            title="Download artwork file"
                          >
                            <a href={print.uploadedFilePath} download>
                              <Download className="w-4 h-4" />
                              <span className="ml-1 hidden sm:inline">Download</span>
                            </a>
                          </Button>
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

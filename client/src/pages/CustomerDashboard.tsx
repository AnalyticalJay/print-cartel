import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Download, Eye, LogOut, ArrowLeft, MessageSquare } from "lucide-react";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderMockupPreview } from "@/components/OrderMockupPreview";
import { CommunicationHistory } from "@/components/CommunicationHistory";
import { toast } from "sonner";

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
  status: "pending" | "quoted" | "approved" | "in-production" | "completed";
  createdAt: Date;
  updatedAt: Date;
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

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'communications'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPrints | null>(null);

  // Fetch orders for authenticated user
  const ordersQuery = trpc.orders.getByEmail.useQuery(
    { email: user?.email || "" },
    { enabled: !!user?.email }
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "quoted":
        return "bg-blue-500 text-white";
      case "approved":
        return "bg-purple-500 text-white";
      case "in-production":
        return "bg-orange-500 text-white";
      case "completed":
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
      case "in-production":
        return "In Production";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDownloadFile = (filePath: string, fileName: string) => {
    // Create a link to download the file from S3
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/")}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="text-white border-gray-700 hover:bg-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Print Cartel</h1>
              <p className="text-gray-400 text-sm">Customer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-800 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'communications'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Communications
          </button>
        </div>

        {/* Orders Section */}
        {activeTab === 'orders' && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

          {ordersQuery.isLoading ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-8">
                <p className="text-center text-gray-400">Loading your orders...</p>
              </CardContent>
            </Card>
          ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
            <div className="grid gap-4">
              {ordersQuery.data.map((order) => (
                <Card
                  key={order.id}
                  className="bg-gray-900 border-gray-800 hover:border-gray-700 cursor-pointer transition"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="py-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Submitted: {formatDate(order.createdAt)}
                        </p>
                        <p className="text-white font-semibold">
                          Quantity: {order.quantity} | Total: {order.totalPriceEstimate}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-8">
                <p className="text-center text-gray-400">No orders found</p>
                <div className="text-center mt-4">
                  <Button
                    onClick={() => setLocation("/order")}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Create Your First Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        )}

        {/* Communications Section */}
        {activeTab === 'communications' && (
          <CommunicationHistory />
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b border-gray-800 sticky top-0 bg-gray-900">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Order #{selectedOrder.id}</CardTitle>
                    <CardDescription>
                      <Badge className={`${getStatusColor(selectedOrder.status)} mt-2`}>
                        {getStatusLabel(selectedOrder.status)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="py-6 space-y-6">
                {/* Timeline */}
                <OrderTimeline
                  currentStatus={selectedOrder.status}
                  createdAt={selectedOrder.createdAt}
                  updatedAt={selectedOrder.updatedAt}
                />

                {/* Customer Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <span className="text-white font-semibold">Name:</span> {selectedOrder.customerFirstName}{" "}
                        {selectedOrder.customerLastName}
                      </p>
                      <p>
                        <span className="text-white font-semibold">Email:</span> {selectedOrder.customerEmail}
                      </p>
                      <p>
                        <span className="text-white font-semibold">Phone:</span> {selectedOrder.customerPhone}
                      </p>
                      {selectedOrder.customerCompany && (
                        <p>
                          <span className="text-white font-semibold">Company:</span> {selectedOrder.customerCompany}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Order Details</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <span className="text-white font-semibold">Quantity:</span> {selectedOrder.quantity}
                      </p>
                      <p>
                        <span className="text-white font-semibold">Total Price:</span> {selectedOrder.totalPriceEstimate}
                      </p>
                      <p>
                        <span className="text-white font-semibold">Submitted:</span>{" "}
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                      <p>
                        <span className="text-white font-semibold">Last Updated:</span>{" "}
                        {formatDate(selectedOrder.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Design Files */}
                {selectedOrder.prints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Design Files</h3>
                    <div className="space-y-2">
                      {selectedOrder.prints.map((print) => (
                        <div
                          key={print.id}
                          className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-700"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{print.uploadedFileName}</p>
                            <p className="text-xs text-gray-400">
                              {print.fileSize ? `${(print.fileSize / 1024).toFixed(2)} KB` : "Unknown size"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadFile(print.uploadedFilePath, print.uploadedFileName)
                            }
                            className="border-gray-700 text-gray-400 hover:text-white"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.additionalNotes && (
                  <div>
                    <h3 className="font-semibold mb-3">Additional Notes</h3>
                    <p className="text-gray-400 text-sm bg-gray-800 p-3 rounded">
                      {selectedOrder.additionalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

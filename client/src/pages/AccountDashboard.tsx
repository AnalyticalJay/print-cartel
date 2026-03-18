import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Download, Eye, LogOut, ArrowLeft, MessageSquare, Settings, Bell } from "lucide-react";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderMockupPreview } from "@/components/OrderMockupPreview";
import { ChatSection } from "@/components/ChatSection";
import { CustomerChatBox } from "@/components/CustomerChatBox";
import { ReferralProgram } from "@/components/ReferralProgram";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { AdminInventoryManager } from "@/components/AdminInventoryManager";
import { formatCurrency } from "@/lib/utils";
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
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
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
  lineItems?: Array<{
    quantity: number;
  }>;
}

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPrints | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

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
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500 text-white",
      quoted: "bg-blue-500 text-white",
      approved: "bg-purple-500 text-white",
      "in-production": "bg-orange-500 text-white",
      completed: "bg-green-500 text-white",
      shipped: "bg-green-500 text-white",
      cancelled: "bg-red-500 text-white",
    };
    return statusColors[status] || "bg-gray-500 text-white";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending Review",
      quoted: "Quote Sent",
      approved: "Approved",
      "in-production": "In Production",
      completed: "Completed",
      shipped: "Shipped",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDownloadFile = (filePath: string, fileName: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-gray-400">Please log in to view your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <nav className="border-b border-gray-700 bg-gray-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="flex-1 text-center font-bold">Print Cartel</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                size="sm"
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Print Cartel</h1>
                <p className="text-gray-400 text-sm">Account Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <div className="text-right">
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        <PushNotificationManager />
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} bg-gray-800 border border-gray-700`}>
            <TabsTrigger value="orders" className="text-gray-300 data-[state=active]:text-white">
              <Eye className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="account" className="text-gray-300 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="communications" className="text-gray-300 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="referral" className="text-gray-300 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Referral
            </TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="inventory" className="text-gray-300 data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Inventory
              </TabsTrigger>
            )}
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

              {ordersQuery.isLoading ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="py-8">
                    <p className="text-center text-gray-400">Loading your orders...</p>
                  </CardContent>
                </Card>
              ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
                <div className="grid gap-4">
                  {ordersQuery.data.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition"
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
                            className="border-gray-600 text-gray-300 hover:text-white"
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
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="py-8">
                    <p className="text-center text-gray-400 mb-4">No orders yet. Start your first order!</p>
                    <Button onClick={() => setLocation("/order")} className="w-full bg-blue-600 hover:bg-blue-700">
                      Place an Order
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                    <CardTitle className="text-white">Order Details</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div>
                      <p className="text-sm text-gray-400">Order ID</p>
                      <p className="font-medium text-lg">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusLabel(selectedOrder.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Order Date</p>
                        <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Price</p>
                        <p className="text-lg font-semibold">{selectedOrder.totalPriceEstimate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-3">Uploaded Files</p>
                      <div className="space-y-2">
                        {selectedOrder.prints && selectedOrder.prints.length > 0 ? (
                          selectedOrder.prints.map((print, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                              <span className="text-sm">{print.uploadedFileName}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadFile(print.uploadedFilePath, print.uploadedFileName)}
                                className="border-gray-600 text-gray-300 hover:text-white"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No files uploaded yet</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Account Information</h2>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-400">First Name</Label>
                      <p className="font-medium mt-2">{user.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Last Name</Label>
                      <p className="font-medium mt-2">{user.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Email</Label>
                      <p className="font-medium mt-2">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Account Type</Label>
                      <p className="font-medium mt-2 capitalize">{user.role}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Member Since</Label>
                      <p className="font-medium mt-2">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Last Signed In</Label>
                      <p className="font-medium mt-2">{formatDate(user.lastSignedIn)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={() => setLocation("/notification-settings")}
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-6 mt-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Messages & Communications</h2>
              <ChatSection />
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral" className="space-y-6 mt-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Referral Program</h2>
              <ReferralProgram />
            </div>
          </TabsContent>

          {/* Inventory Tab (Admin Only) */}
          {user?.role === 'admin' && (
            <TabsContent value="inventory" className="space-y-6 mt-6">
              <div>
                <h2 className="text-3xl font-bold mb-6">Inventory Management</h2>
                <AdminInventoryManager />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

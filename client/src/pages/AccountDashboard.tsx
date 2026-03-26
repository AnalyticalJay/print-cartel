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
import { MobileOrderTimeline } from "@/components/MobileOrderTimeline";
import { OrderMockupPreview } from "@/components/OrderMockupPreview";
import { ChatSection } from "@/components/ChatSection";
import { CustomerChatBox } from "@/components/CustomerChatBox";
import { ReferralProgram } from "@/components/ReferralProgram";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { QuoteApprovalCard } from "@/components/QuoteApprovalCard";

import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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
  paymentMethod?: "deposit" | "full_payment" | null;
  depositAmount?: string | number | null;
  amountPaid?: string | number | null;
  createdAt: Date;
  updatedAt: Date;
  prints?: Array<{
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
            <CardDescription className="text-gray-200">Please log in to view your account</CardDescription>
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
                <p className="text-gray-200 text-sm">Account Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <div className="text-right">
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-gray-200 text-sm">{user.email}</p>
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
          <TabsList className={`grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-1 bg-gray-800 border border-gray-700 p-1`}>
            <TabsTrigger value="orders" className="text-gray-300 data-[state=active]:text-cyan-400 data-[state=active]:bg-gray-700 text-xs md:text-sm">
              <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Orders</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="text-gray-300 data-[state=active]:text-cyan-400 data-[state=active]:bg-gray-700 text-xs md:text-sm">
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Account</span>
              <span className="sm:hidden">Account</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="text-gray-300 data-[state=active]:text-cyan-400 data-[state=active]:bg-gray-700 text-xs md:text-sm">
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Msg</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="text-gray-300 data-[state=active]:text-cyan-400 data-[state=active]:bg-gray-700 text-xs md:text-sm">
              <Bell className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Referral</span>
              <span className="sm:hidden">Ref</span>
            </TabsTrigger>

          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <div>
              <h2 className="text-3xl font-bold mb-6">Your Orders</h2>

              {ordersQuery.isLoading ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="py-8">
                    <p className="text-center text-gray-200">Loading your orders...</p>
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
                            <p className="text-gray-200 text-sm mb-2">
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
                    <p className="text-center text-gray-200 mb-4">No orders yet. Start your first order!</p>
                    <Button onClick={() => setLocation("/order")} className="w-full bg-blue-600 hover:bg-blue-700">
                      Place an Order
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
                <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto my-4 md:my-0">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                    <CardTitle className="text-white">Order Details</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-200 hover:text-white"
                    >
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                    {/* Quote Approval Card */}
                    {selectedOrder.status === "quoted" && (
                      <QuoteApprovalCard
                        orderId={selectedOrder.id}
                        orderStatus={selectedOrder.status}
                        totalPrice={parseFloat(String(selectedOrder.totalPriceEstimate))}
                        depositAmount={parseFloat(String(selectedOrder.totalPriceEstimate)) * 0.5}
                        paymentMethod={selectedOrder.paymentMethod || "full_payment"}
                        onApproveSuccess={() => {
                          setSelectedOrder(null);
                          ordersQuery.refetch();
                        }}
                        onRejectSuccess={() => {
                          setSelectedOrder(null);
                          ordersQuery.refetch();
                        }}
                      />
                    )}

                    <div>
                      <p className="text-xs md:text-sm text-gray-200">Order ID</p>
                      <p className="font-medium text-base md:text-lg">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-200">Status</p>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {getStatusLabel(selectedOrder.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-gray-200">Order Date</p>
                        <p className="font-medium text-sm md:text-base">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-200">Total Price</p>
                        <p className="text-base md:text-lg font-semibold">{selectedOrder.totalPriceEstimate}</p>
                      </div>
                    </div>
                    {/* Mobile Order Timeline */}
                    <div className="border-t border-gray-700 pt-4 md:pt-6">
                      <MobileOrderTimeline
                        currentStatus={selectedOrder.status}
                        createdAt={selectedOrder.createdAt}
                        updatedAt={selectedOrder.updatedAt}
                        orderDetails={{
                          quantity: selectedOrder.quantity,
                          totalPrice: String(selectedOrder.totalPriceEstimate),
                          depositPaid: selectedOrder.status !== "quoted",
                        }}
                      />
                    </div>

                    <div>
                      <p className="text-xs md:text-sm text-gray-200 mb-2 md:mb-3">Uploaded Files</p>
                      <div className="space-y-2">
                        {selectedOrder.prints && selectedOrder.prints.length > 0 ? (
                          selectedOrder.prints.map((print, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-700 p-2 md:p-3 rounded gap-2">
                              <span className="text-xs md:text-sm truncate">{print.uploadedFileName}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadFile(print.uploadedFilePath, print.uploadedFileName)}
                                className="border-gray-600 text-gray-300 hover:text-white flex-shrink-0"
                              >
                                <Download className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-200 text-xs md:text-sm">No files uploaded yet</p>
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
                <CardContent className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">First Name</Label>
                      <p className="font-medium mt-1 md:mt-2 text-cyan-400 text-sm md:text-base">{user.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">Last Name</Label>
                      <p className="font-medium mt-1 md:mt-2 text-cyan-400 text-sm md:text-base">{user.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">Email</Label>
                      <p className="font-medium mt-1 md:mt-2 text-cyan-400 text-sm md:text-base break-all">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">Account Type</Label>
                      <p className="font-medium mt-1 md:mt-2 capitalize text-cyan-400 text-sm md:text-base">{user.role}</p>
                    </div>
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">Member Since</Label>
                      <p className="font-medium mt-1 md:mt-2 text-cyan-400 text-sm md:text-base">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-200 text-xs md:text-sm">Last Signed In</Label>
                      <p className="font-medium mt-1 md:mt-2 text-cyan-400 text-sm md:text-base">{formatDate(user.lastSignedIn)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={() => setLocation("/notification-settings")}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black gap-2"
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


        </Tabs>
      </div>
    </div>
  );
}

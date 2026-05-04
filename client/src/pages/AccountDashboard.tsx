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
import { Eye, LogOut, ArrowLeft, MessageSquare, Settings, Bell, Package, ChevronRight } from "lucide-react";
// Eye is used in the Orders tab trigger
import { ChatSection } from "@/components/ChatSection";
import { ReferralProgram } from "@/components/ReferralProgram";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { CustomerOrderDetailModal } from "@/components/CustomerOrderDetailModal";




export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

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
      pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-600",
      quoted: "bg-blue-500/20 text-blue-400 border border-blue-600",
      approved: "bg-purple-500/20 text-purple-400 border border-purple-600",
      "in-production": "bg-orange-500/20 text-orange-400 border border-orange-600",
      completed: "bg-green-500/20 text-green-400 border border-green-600",
      shipped: "bg-green-500/20 text-green-400 border border-green-600",
      cancelled: "bg-red-500/20 text-red-400 border border-red-600",
    };
    return statusColors[status] || "bg-gray-700 text-gray-300 border border-gray-600";
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
    return new Date(date).toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          <TabsList className={`grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-1 bg-gray-800 border border-gray-700 p-1`}>
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
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {ordersQuery.data.map((order) => (
                    <button
                      key={order.id}
                      className="w-full text-left bg-gray-800 border border-gray-700 hover:border-cyan-600 rounded-xl p-4 transition-all group"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm">Order #{order.id}</span>
                              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </Badge>
                              {(order.paymentStatus === 'unpaid' || !order.paymentStatus) &&
                                ['quoted', 'approved'].includes(order.status) && (
                                <Badge className="text-xs bg-orange-500/20 text-orange-400 border border-orange-600">
                                  Payment Due
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(order.createdAt)} · R{parseFloat(String(order.totalPriceEstimate)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-300 font-medium mb-1">No orders yet</p>
                    <p className="text-gray-500 text-sm mb-4">Start your first custom DTF print order</p>
                    <Button onClick={() => setLocation("/order")} className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                      Place an Order
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrderId && (
              <CustomerOrderDetailModal
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
              />
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

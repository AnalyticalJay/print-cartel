import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Eye, LogOut } from "lucide-react";
import { PaymentSection } from "@/components/PaymentSection";
import { DepositPaymentTracker } from "@/components/DepositPaymentTracker";

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Fetch user order history
  const { data: orders, isLoading, error } = trpc.orders.getUserOrderHistory.useQuery(
    user?.email ? { customerEmail: user.email, limit: 50, offset: 0 } : { customerEmail: '', limit: 50, offset: 0 },
    {
      enabled: !!user?.email,
    }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">Please log in to view your profile</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      quoted: "bg-blue-100 text-blue-800",
      approved: "bg-purple-100 text-purple-800",
      "in-production": "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      shipped: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <p className="text-muted-foreground mt-2">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="account">Account Details</TabsTrigger>
          </TabsList>

          {/* Order History Tab */}
          <TabsContent value="orders" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-red-600">Error loading orders</p>
                </CardContent>
              </Card>
            ) : !orders || orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No orders yet. Start your first order!</p>
                  <Button onClick={() => setLocation("/order")} className="w-full mt-4">
                    Place an Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(typeof order.totalPriceEstimate === 'string' ? parseFloat(order.totalPriceEstimate) : order.totalPriceEstimate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="text-lg font-semibold">
                            {order.quantity}
                          </p>
                        </div>
                      </div>



                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : !orders || orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No orders requiring payment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((order) => order.status === "approved" || order.status === "quoted")
                  .map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Amount Due: {formatCurrency(typeof order.totalPriceEstimate === 'string' ? parseFloat(order.totalPriceEstimate) : order.totalPriceEstimate)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("-", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <PaymentSection
                          orderId={order.id}
                          totalAmount={typeof order.totalPriceEstimate === 'string' ? parseFloat(order.totalPriceEstimate) : order.totalPriceEstimate}
                          depositAmount={order.depositAmount
                            ? parseFloat(String(order.depositAmount))
                            : undefined}
                          amountPaid={order.amountPaid
                            ? parseFloat(String(order.amountPaid))
                            : 0}
                          paymentStatus={order.paymentStatus || "unpaid"}
                          invoiceUrl={order.invoiceUrl || undefined}
                        />
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Account Details Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Detail Modal */}
        {selectedOrderId && orders && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrderId(null)}
                >
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {orders.find((o) => o.id === selectedOrderId) && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium text-lg">#{selectedOrderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(orders.find((o) => o.id === selectedOrderId)?.status || "")}>
                        {orders.find((o) => o.id === selectedOrderId)?.status?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {new Date(orders.find((o) => o.id === selectedOrderId)?.createdAt || "").toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(
                          parseFloat(
                            String(orders?.find((o) => o.id === selectedOrderId)?.totalPriceEstimate || "0")
                          )
                        )}
                      </p>
                    </div>

                    {/* Deposit Payment Tracker */}
                    {(() => {
                      const order = orders.find((o) => o.id === selectedOrderId);
                      const shouldShowPayment = order?.status === "approved" || order?.status === "quoted";
                      if (!shouldShowPayment) return null;
                      const totalPrice = parseFloat(String(order?.totalPriceEstimate || "0"));
                      const depositPaid = order?.amountPaid ? parseFloat(String(order.amountPaid)) : 0;
                      return (
                        <div className="border-t pt-6 mt-6">
                          <DepositPaymentTracker
                            orderId={selectedOrderId}
                            totalPrice={totalPrice}
                            depositPercentage={30}
                            depositPaid={depositPaid}
                            finalPaymentPaid={0}
                            orderStatus={order?.status as any}
                          />
                        </div>
                      );
                    })()}

                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

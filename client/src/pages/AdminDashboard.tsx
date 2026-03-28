"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, Eye, Edit2, TrendingUp, Trash2, Mail, Calendar, MessageSquare, MessageCircle, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { AdminChatPanel } from "@/components/AdminChatPanel";
import { ChatNotificationHandler } from "@/components/ChatNotificationHandler";
import { ProductionKanban } from "@/components/ProductionKanban";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { AdminInventoryManager } from "@/components/AdminInventoryManager";
import { PaymentStatusDisplay } from "@/components/PaymentStatusDisplay";
import { InvoicesPanel } from "@/components/InvoicesPanel";
import { OrderDetailTimeline } from "@/components/OrderDetailTimeline";
import { PaymentVerificationPanel } from "@/components/PaymentVerificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type OrderStatus = "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";

interface OrderWithDetails {
  id: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  totalPriceEstimate: number;
  status: OrderStatus;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product?: { name: string };
  paymentStatus?: any;
  amountPaid?: any;
  depositAmount?: any;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Notification handler for new chat messages
  if (user?.role === "admin") {
    return (
      <>
        <ChatNotificationHandler />
        <AdminDashboardContent />
      </>
    );
  }

  return null;
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'orders' | 'chat' | 'communications' | 'production' | 'inventory' | 'invoices' | 'payments'>('orders');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<OrderStatus | "">();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const ordersQuery = trpc.admin.getAllOrders.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const statsQuery = trpc.admin.getOrderStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const bulkUpdateMutation = trpc.admin.bulkUpdateOrderStatus.useMutation();
  const conversationsQuery = trpc.chat.getAllConversations.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Update unread count when conversations change
  useEffect(() => {
    if (conversationsQuery.data) {
      const total = conversationsQuery.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(total);
    }
  }, [conversationsQuery.data]);

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    if (!ordersQuery.data) return [];

    let filtered = ordersQuery.data;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.createdAt) <= toDate);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const fullName = `${order.customerFirstName} ${order.customerLastName}`.toLowerCase();
        const email = order.customerEmail?.toLowerCase() || "";
        const company = order.customerCompany?.toLowerCase() || "";
        const orderId = order.id.toString();

        return fullName.includes(query) || email.includes(query) || company.includes(query) || orderId.includes(query);
      });
    }

    return filtered;
  }, [ordersQuery.data, searchQuery, statusFilter, dateFrom, dateTo]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "quoted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-purple-100 text-purple-800";
      case "in-production":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectOrder = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatusUpdate || selectedOrders.size === 0) {
      toast.error("Select orders and a status to update");
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        orderIds: Array.from(selectedOrders),
        status: bulkStatusUpdate as OrderStatus,
      });

      toast.success(`Updated ${selectedOrders.size} orders`);
      setSelectedOrders(new Set());
      setBulkStatusUpdate("");
      ordersQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      toast.error("Failed to update orders");
      console.error(error);
    }
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
  };

  if (ordersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" id="admin-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage orders, update statuses, and adjust pricing</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter />
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs md:text-sm">
                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        <PushNotificationManager />

        {/* Tab Navigation */}
        {/* Tab Navigation - Mobile Responsive */}
        <div className="overflow-x-auto border-b border-gray-200">
          <div className="flex gap-1 md:gap-4 min-w-max md:min-w-full">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Orders</span>
              <span className="sm:hidden">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Msg</span>
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'production'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Production</span>
              <span className="sm:hidden">Prod</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Inventory</span>
              <span className="sm:hidden">Inv</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Invoices</span>
              <span className="sm:hidden">Inv</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-2 md:px-4 py-2 font-medium border-b-2 transition-colors text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </button>
          </div>
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && <AdminChatPanel />}

        {/* Production Tab */}
        {activeTab === 'production' && <ProductionKanban />}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && <AdminInventoryManager />}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && <InvoicesPanel />}

        {/* Payments Tab */}
        {activeTab === 'payments' && <PaymentVerificationPanel />}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
        {/* Statistics Cards */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsQuery.data.totalOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{statsQuery.data.pendingOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Quoted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{statsQuery.data.quotedOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{statsQuery.data.approvedOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">R{statsQuery.data.totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  placeholder="Name, email, order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in-production">In Production</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations */}
        {selectedOrders.size > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-gray-700">
                  {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""} selected
                </span>
                <Select value={bulkStatusUpdate || ""} onValueChange={(value) => setBulkStatusUpdate(value as OrderStatus)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in-production">In Production</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatusUpdate || bulkUpdateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {bulkUpdateMutation.isPending ? "Updating..." : "Update Selected"}
                </Button>
                <Button
                  onClick={() => setSelectedOrders(new Set())}
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            <CardDescription>View and manage all customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qty</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => handleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {order.customerFirstName} {order.customerLastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.customerEmail}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{order.quantity}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          R{order.totalPriceEstimate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            onClick={() => handleViewOrder(order.id)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

            {/* Order Detail Modal */}
            {selectedOrderId && (
              <OrderDetailModal
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
                onOrderUpdated={() => {
                  ordersQuery.refetch();
                  statsQuery.refetch();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
  onOrderUpdated: () => void;
}

function OrderDetailModal({ orderId, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | "">();
  const [newPrice, setNewPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');

  const orderQuery = trpc.admin.getOrderDetail.useQuery({ orderId });
  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation();
  const updatePriceMutation = trpc.admin.updateOrderPricing.useMutation();

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as OrderStatus,
      });

      toast.success("Order status updated");
      setNewStatus("");
      orderQuery.refetch();
      onOrderUpdated();
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newPrice) {
      toast.error("Please enter a price");
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsUpdatingPrice(true);
    try {
      await updatePriceMutation.mutateAsync({
        orderId,
        totalPriceEstimate: price,
      });

      toast.success("Order price updated");
      setNewPrice("");
      orderQuery.refetch();
      onOrderUpdated();
    } catch (error) {
      toast.error("Failed to update price");
      console.error(error);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  if (orderQuery.isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-8">
            <p className="text-center text-gray-600">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Order #{order.id}</CardTitle>
              <CardDescription>
                {order.customerFirstName} {order.customerLastName}
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'timeline' | 'notes')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes & Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              {order.customerCompany && (
                <div className="col-span-2">
                  <p className="text-gray-600">Company</p>
                  <p className="font-medium">{order.customerCompany}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-cyan-400">Garment & Customization</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div>
                <p className="text-gray-400">Product</p>
                <p className="font-medium text-cyan-400">{order.product?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Quantity</p>
                <p className="font-medium text-cyan-400">{order.quantity}</p>
              </div>
              <div>
                <p className="text-gray-400">Color</p>
                <div className="flex items-center gap-2">
                  {order.color?.colorHex && (
                    <div
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: order.color.colorHex }}
                    />
                  )}
                  <p className="font-medium text-cyan-400">{order.color?.colorName || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400">Size</p>
                <p className="font-medium text-cyan-400">{order.size?.sizeName || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Current Price</p>
                <p className="font-medium text-cyan-400">R{order.totalPriceEstimate.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <Badge className={order.status === "pending" ? "bg-yellow-100 text-yellow-800" : order.status === "quoted" ? "bg-blue-100 text-blue-800" : order.status === "approved" ? "bg-purple-100 text-purple-800" : order.status === "in-production" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Print Placements */}
          {order.prints && order.prints.length > 0 && (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-cyan-400">Print Placements</h3>
              <div className="space-y-2">
                {order.prints.map((print, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Placement Area</p>
                        <p className="font-medium text-cyan-400">{print.placement?.placementName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Print Size</p>
                        <p className="font-medium text-cyan-400">{print.printSize?.printSize || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status Display */}
          {order.paymentStatus && (
            <div className="border-t border-gray-700 pt-4">
              <PaymentStatusDisplay
                paymentStatus={order.paymentStatus as "unpaid" | "deposit_paid" | "paid"}
                totalAmount={typeof order.totalPriceEstimate === 'string' ? parseFloat(order.totalPriceEstimate) : order.totalPriceEstimate}
                amountPaid={typeof order.amountPaid === 'string' ? parseFloat(order.amountPaid) : (order.amountPaid || 0)}
                depositAmount={order.depositAmount ? (typeof order.depositAmount === 'string' ? parseFloat(order.depositAmount) : order.depositAmount) : undefined}
                showDetails={true}
              />
            </div>
          )}

          {/* Design Files Gallery */}
          {order.prints && order.prints.length > 0 && (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-cyan-400">Uploaded Designs</h3>
              <div className="space-y-2">
                {order.prints.map((print, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-cyan-500 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-cyan-400 text-sm">{print.uploadedFileName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {print.fileSize ? `${(print.fileSize / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
                          {print.mimeType && ` • ${print.mimeType}`}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          window.open(print.uploadedFilePath, "_blank");
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Admin Notes
            </h3>
            <Textarea
              placeholder="Add internal notes about this order..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="min-h-24"
            />
          </div>

          {/* Update Status */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Update Status</h3>
            <div className="flex gap-2">
              <Select value={newStatus || ""} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in-production">In Production</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus || !newStatus} className="bg-blue-600 hover:bg-blue-700">
                {isUpdatingStatus ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>

          {/* Update Price */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Adjust Price</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter new price"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1"
              />
              <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice || !newPrice} className="bg-green-600 hover:bg-green-700">
                {isUpdatingPrice ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
            </TabsContent>

            <TabsContent value="timeline">
              <OrderDetailTimeline order={order} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              {/* Admin Notes */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Admin Notes
                </h3>
                <Textarea
                  placeholder="Add internal notes about this order..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-24"
                />
              </div>

              {/* Update Status */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold text-gray-900">Update Status</h3>
                <div className="flex gap-2">
                  <Select value={newStatus || ""} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in-production">In Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus || !newStatus} className="bg-blue-600 hover:bg-blue-700">
                    {isUpdatingStatus ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              {/* Update Price */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold text-gray-900">Adjust Price</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter new price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1"
                  />
                  <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice || !newPrice} className="bg-green-600 hover:bg-green-700">
                    {isUpdatingPrice ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

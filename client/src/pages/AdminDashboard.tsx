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
import { Download, Eye, TrendingUp, Mail, MessageSquare, FileText, Users, Package, BarChart3, ShoppingCart } from "lucide-react";
import { AdminTableSkeleton } from "@/components/SkeletonLoaders";
import { AdminInventoryManager } from "@/components/AdminInventoryManager";
import { PaymentStatusDisplay } from "@/components/PaymentStatusDisplay";
import { OrderDetailTimeline } from "@/components/OrderDetailTimeline";
import { NotificationCenter } from "@/components/NotificationCenter";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { ChatNotificationHandler } from "@/components/ChatNotificationHandler";
import { OrderNotificationHandler } from "@/components/OrderNotificationHandler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OrderStatus = "pending" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
type AdminTab = "orders" | "customers" | "products" | "reports";

export default function AdminDashboard() {
  const { user } = useAuth();
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
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<OrderStatus | "">();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const ordersQuery = trpc.admin.getAllOrders.useQuery(undefined, { enabled: user?.role === "admin" });
  const statsQuery = trpc.admin.getOrderStats.useQuery(undefined, { enabled: user?.role === "admin" });
  const bulkUpdateMutation = trpc.admin.bulkUpdateOrderStatus.useMutation();

  const filteredOrders = useMemo(() => {
    if (!ordersQuery.data) return [];
    let filtered = ordersQuery.data;
    if (statusFilter !== "all") filtered = filtered.filter((o) => o.status === statusFilter);
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => new Date(o.createdAt) <= to);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        const name = `${o.customerFirstName} ${o.customerLastName}`.toLowerCase();
        return name.includes(q) || (o.customerEmail?.toLowerCase() || "").includes(q) || o.id.toString().includes(q);
      });
    }
    return filtered;
  }, [ordersQuery.data, searchQuery, statusFilter, dateFrom, dateTo]);

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      quoted: "bg-blue-100 text-blue-800",
      approved: "bg-purple-100 text-purple-800",
      "in-production": "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatusUpdate || selectedOrders.size === 0) {
      toast.error("Select orders and a status to update");
      return;
    }
    try {
      await bulkUpdateMutation.mutateAsync({ orderIds: Array.from(selectedOrders), status: bulkStatusUpdate as OrderStatus });
      toast.success(`Updated ${selectedOrders.size} orders`);
      setSelectedOrders(new Set());
      setBulkStatusUpdate("");
      ordersQuery.refetch();
      statsQuery.refetch();
    } catch {
      toast.error("Failed to update orders");
    }
  };

  if (ordersQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <AdminTableSkeleton />
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <OrderNotificationHandler />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage orders, customers, products and view reports</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </div>
        <PushNotificationManager />

        {/* Stats Bar (always visible) */}
        {statsQuery.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Orders", value: statsQuery.data.totalOrders, color: "text-gray-900" },
              { label: "Pending", value: statsQuery.data.pendingOrders, color: "text-yellow-600" },
              { label: "Quoted", value: (statsQuery.data as any).quotedOrders ?? 0, color: "text-blue-600" },
              { label: "Approved", value: statsQuery.data.approvedOrders, color: "text-green-600" },
              { label: "Revenue", value: `R${statsQuery.data.totalRevenue.toFixed(2)}`, color: "text-gray-900" },
            ].map((stat) => (
              <Card key={stat.label} className="py-3">
                <CardContent className="px-4 py-0">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Search name, email, order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in-production">In Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">{selectedOrders.size} selected</span>
                    <Select value={bulkStatusUpdate || ""} onValueChange={(v) => setBulkStatusUpdate(v as OrderStatus)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Set status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in-production">In Production</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkUpdate} disabled={!bulkStatusUpdate || bulkUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {bulkUpdateMutation.isPending ? "Updating..." : "Update Selected"}
                    </Button>
                    <Button onClick={() => setSelectedOrders(new Set())} variant="outline">Clear</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No orders found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <Checkbox
                              checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                              onCheckedChange={() => {
                                if (selectedOrders.size === filteredOrders.length) setSelectedOrders(new Set());
                                else setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Qty</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedOrders.has(order.id)}
                                onCheckedChange={() => {
                                  const s = new Set(selectedOrders);
                                  s.has(order.id) ? s.delete(order.id) : s.add(order.id);
                                  setSelectedOrders(s);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                            <td className="px-4 py-3 text-gray-700">{order.customerFirstName} {order.customerLastName}</td>
                            <td className="px-4 py-3 text-gray-600">{order.customerEmail}</td>
                            <td className="px-4 py-3 text-gray-700">{order.quantity}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">R{Number(order.totalPriceEstimate).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <Button onClick={() => setSelectedOrderId(order.id)} variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                                <Eye className="w-4 h-4 mr-1" /> View
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
                onOrderUpdated={() => { ordersQuery.refetch(); statsQuery.refetch(); }}
              />
            )}
          </>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === "customers" && <CustomersTab />}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && <AdminInventoryManager />}

        {/* ── REPORTS TAB ── */}
        {activeTab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersTab() {
  const [search, setSearch] = useState("");
  const customersQuery = trpc.admin.getCustomers.useQuery();

  const filtered = useMemo(() => {
    if (!customersQuery.data) return [];
    if (!search) return customersQuery.data;
    const q = search.toLowerCase();
    return customersQuery.data.filter(
      (c: any) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q)
    );
  }, [customersQuery.data, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Customers ({filtered.length})</CardTitle>
          <CardDescription>All registered customers and their order history</CardDescription>
        </CardHeader>
        <CardContent>
          {customersQuery.isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading customers...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No customers found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Orders</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Spent</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">First Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.firstName} {c.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.company || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{c.totalOrders}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">R{Number(c.totalSpent || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(c.firstOrderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(c.lastOrderDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const statsQuery = trpc.admin.getOrderStats.useQuery();
  const analyticsQuery = trpc.admin.getRevenueAnalytics.useQuery();

  if (statsQuery.isLoading || analyticsQuery.isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading reports...</p>;
  }

  const stats = statsQuery.data;
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: analytics?.totalOrders ?? stats?.totalOrders ?? 0, icon: <ShoppingCart className="w-5 h-5 text-blue-500" /> },
          { label: "Total Revenue", value: `R${Number(analytics?.totalRevenue ?? 0).toFixed(2)}`, icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
          { label: "Pending Revenue", value: `R${Number(analytics?.pendingRevenue ?? 0).toFixed(2)}`, icon: <FileText className="w-5 h-5 text-yellow-500" /> },
          { label: "Avg Order Value", value: `R${Number(analytics?.averageOrderValue ?? 0).toFixed(2)}`, icon: <BarChart3 className="w-5 h-5 text-purple-500" /> },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
                {item.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by Month */}
      {analytics?.monthlyBreakdown && analytics.monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue breakdown for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Month</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Orders</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Revenue</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.monthlyBreakdown.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.month}</td>
                      <td className="px-4 py-3 text-gray-700">{row.orders}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">R{Number(row.revenue).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        R{row.orders > 0 ? (Number(row.revenue) / row.orders).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders by Status */}
      {analytics?.statusBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Pending", count: analytics.statusBreakdown.pending, color: "bg-yellow-500" },
                { label: "Quoted", count: analytics.statusBreakdown.quoted, color: "bg-blue-500" },
                { label: "Approved", count: analytics.statusBreakdown.approved, color: "bg-purple-500" },
                { label: "In Production", count: analytics.statusBreakdown.inProduction, color: "bg-orange-500" },
                { label: "Completed", count: analytics.statusBreakdown.completed, color: "bg-green-500" },
              ].map((item) => {
                const total = analytics.totalOrders || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28">{item.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div className={`${item.color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{item.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
  onOrderUpdated: () => void;
}

function OrderDetailModal({ orderId, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [newPrice, setNewPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isResendingInvoice, setIsResendingInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "actions">("details");

  const orderQuery = trpc.admin.getOrderDetail.useQuery({ orderId });
  const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation();
  const updatePriceMutation = trpc.admin.updateOrderPricing.useMutation();
  const approveAndSendInvoiceMutation = trpc.admin.approveAndSendInvoice.useMutation();
  const createManualInvoiceMutation = trpc.admin.createManualInvoice.useMutation();

  const handleUpdateStatus = async () => {
    if (!newStatus) return toast.error("Please select a status");
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: newStatus as OrderStatus });
      toast.success("Order status updated");
      setNewStatus("");
      orderQuery.refetch();
      onOrderUpdated();
    } catch { toast.error("Failed to update status"); }
    finally { setIsUpdatingStatus(false); }
  };

  const handleUpdatePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");
    setIsUpdatingPrice(true);
    try {
      await updatePriceMutation.mutateAsync({ orderId, totalPriceEstimate: price });
      toast.success("Price updated");
      setNewPrice("");
      orderQuery.refetch();
      onOrderUpdated();
    } catch { toast.error("Failed to update price"); }
    finally { setIsUpdatingPrice(false); }
  };

  const handleSendInvoice = async () => {
    setIsSendingInvoice(true);
    try {
      await approveAndSendInvoiceMutation.mutateAsync({ orderId, adminNotes });
      toast.success("✅ Invoice sent & order approved!");
      orderQuery.refetch();
      onOrderUpdated();
    } catch { toast.error("Failed to send invoice"); }
    finally { setIsSendingInvoice(false); }
  };

  const handleResendInvoice = async () => {
    setIsResendingInvoice(true);
    try {
      await createManualInvoiceMutation.mutateAsync({ orderId });
      toast.success("✅ Invoice resent to customer!");
      orderQuery.refetch();
    } catch { toast.error("Failed to resend invoice"); }
    finally { setIsResendingInvoice(false); }
  };

  if (orderQuery.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-lg"><CardContent className="py-8 text-center text-gray-500">Loading order details...</CardContent></Card>
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader>
          <div className="flex justify-between items-start gap-3">
            <div>
              <CardTitle className="text-xl">Order #{order.id}</CardTitle>
              <CardDescription>{order.customerFirstName} {order.customerLastName} · {order.customerEmail}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(order.status === "pending" || order.status === "quoted") && (
                <Button
                  onClick={handleSendInvoice}
                  disabled={isSendingInvoice}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {isSendingInvoice ? "Sending..." : "Send Invoice"}
                </Button>
              )}
              {order.status !== "pending" && order.status !== "quoted" && order.status !== "cancelled" && (
                <Button
                  onClick={handleResendInvoice}
                  disabled={isResendingInvoice}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {isResendingInvoice ? "Sending..." : "Resend Invoice"}
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500">✕</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            {/* ── Details ── */}
            <TabsContent value="details" className="space-y-6">
              {/* Customer */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-gray-500">Email</p><p className="font-medium">{order.customerEmail}</p></div>
                  <div><p className="text-gray-500">Phone</p><p className="font-medium">{order.customerPhone || "—"}</p></div>
                  {order.customerCompany && (
                    <div className="col-span-2"><p className="text-gray-500">Company</p><p className="font-medium">{order.customerCompany}</p></div>
                  )}
                </div>
              </div>

              {/* Garment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Garment & Customization</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-gray-500">Product</p><p className="font-medium">{order.product?.name || "N/A"}</p></div>
                  <div><p className="text-gray-500">Quantity</p><p className="font-medium">{order.quantity}</p></div>
                  <div>
                    <p className="text-gray-500">Color</p>
                    <div className="flex items-center gap-2">
                      {order.color?.colorHex && <div className="w-4 h-4 rounded border" style={{ backgroundColor: order.color.colorHex }} />}
                      <p className="font-medium">{order.color?.colorName || "N/A"}</p>
                    </div>
                  </div>
                  <div><p className="text-gray-500">Size</p><p className="font-medium">{order.size?.sizeName || "N/A"}</p></div>
                  <div><p className="text-gray-500">Total Price</p><p className="font-semibold text-green-700">R{Number(order.totalPriceEstimate).toFixed(2)}</p></div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge className={order.status === "pending" ? "bg-yellow-100 text-yellow-800" : order.status === "approved" ? "bg-purple-100 text-purple-800" : order.status === "in-production" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Print Placements */}
              {order.prints && order.prints.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Print Placements</h3>
                  <div className="space-y-2">
                    {order.prints.map((print: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm grid grid-cols-2 gap-3">
                        <div><p className="text-gray-500">Placement</p><p className="font-medium">{print.placement?.placementName || "N/A"}</p></div>
                        <div><p className="text-gray-500">Print Size</p><p className="font-medium">{print.printSize?.printSize || "N/A"}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Status */}
              {order.paymentStatus && (
                <div className="border-t pt-4">
                  <PaymentStatusDisplay
                    paymentStatus={order.paymentStatus as "unpaid" | "paid"}
                    totalAmount={Number(order.totalPriceEstimate)}
                    amountPaid={Number(order.amountPaid || 0)}
                    showDetails={true}
                  />
                </div>
              )}

              {/* Uploaded Designs */}
              {order.prints && order.prints.filter((p: any) => p.uploadedFilePath).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Uploaded Designs</h3>
                  <div className="space-y-2">
                    {order.prints.filter((p: any) => p.uploadedFilePath).map((print: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{print.uploadedFileName || `Design ${i + 1}`}</p>
                          <p className="text-xs text-gray-500">{print.fileSize ? `${(print.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</p>
                        </div>
                        <Button onClick={() => window.open(print.uploadedFilePath, "_blank")} variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Timeline ── */}
            <TabsContent value="timeline">
              <OrderDetailTimeline order={order} />
            </TabsContent>

            {/* ── Actions ── */}
            <TabsContent value="actions" className="space-y-5">
              {/* Update Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Update Order Status</h3>
                <div className="flex gap-2">
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select new status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in-production">In Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus || !newStatus} className="bg-blue-600 hover:bg-blue-700">
                    {isUpdatingStatus ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              {/* Adjust Price */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Adjust Price</h3>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Enter new price (R)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} step="0.01" min="0" className="flex-1" />
                  <Button onClick={handleUpdatePrice} disabled={isUpdatingPrice || !newPrice} className="bg-green-600 hover:bg-green-700">
                    {isUpdatingPrice ? "Updating..." : "Update Price"}
                  </Button>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Admin Notes
                </h3>
                <Textarea placeholder="Add internal notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="min-h-24" />
              </div>

              {/* Send Invoice */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Invoice
                </h3>
                {(order.status === "pending" || order.status === "quoted") ? (
                  <>
                    <p className="text-sm text-gray-500 mb-3">Approve this order and send a payment invoice to the customer.</p>
                    <Button onClick={handleSendInvoice} disabled={isSendingInvoice} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      {isSendingInvoice ? "Sending..." : "Send Invoice & Approve Order"}
                    </Button>
                  </>
                ) : order.status !== "cancelled" ? (
                  <>
                    <p className="text-sm text-gray-500 mb-3">Regenerate and resend the invoice to the customer's email.</p>
                    <Button onClick={handleResendInvoice} disabled={isResendingInvoice} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      {isResendingInvoice ? "Sending..." : "Resend Invoice to Customer"}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Invoice cannot be sent for cancelled orders.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

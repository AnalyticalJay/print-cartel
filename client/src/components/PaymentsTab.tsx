import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Filter, Download, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface PaymentRecord {
  paymentId: number;
  orderId: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  paymentType: "deposit" | "final_payment";
  transactionId: string | null;
  orderStatus: string;
  totalPrice: number;
  paymentVerificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export function PaymentsTab() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed" | "refunded">("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<"all" | "deposit" | "final_payment">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const paymentRecordsQuery = trpc.admin.getPaymentRecords.useQuery({
    status: statusFilter,
    paymentType: paymentTypeFilter,
    limit: 1000,
  });

  const paymentStatsQuery = trpc.admin.getPaymentStats.useQuery();

  // Filter records based on search query
  const filteredRecords = useMemo(() => {
    if (!paymentRecordsQuery.data) return [];

    if (!searchQuery) return paymentRecordsQuery.data;

    const query = searchQuery.toLowerCase();
    return paymentRecordsQuery.data.filter((record) => {
      const fullName = `${record.customerFirstName} ${record.customerLastName}`.toLowerCase();
      const email = record.customerEmail.toLowerCase();
      const orderId = record.orderId.toString();

      return fullName.includes(query) || email.includes(query) || orderId.includes(query);
    });
  }, [paymentRecordsQuery.data, searchQuery]);

  const getStatusColor = (status: "pending" | "completed" | "failed" | "refunded"): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentTypeColor = (type: "deposit" | "final_payment"): string => {
    switch (type) {
      case "deposit":
        return "bg-purple-100 text-purple-800";
      case "final_payment":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = [
      "Payment ID",
      "Order ID",
      "Customer",
      "Email",
      "Amount (R)",
      "Payment Method",
      "Payment Status",
      "Payment Type",
      "Transaction ID",
      "Order Status",
      "Date",
    ];

    const rows = filteredRecords.map((record) => [
      record.paymentId,
      record.orderId,
      `${record.customerFirstName} ${record.customerLastName}`,
      record.customerEmail,
      record.amount.toFixed(2),
      record.paymentMethod,
      record.paymentStatus,
      record.paymentType,
      record.transactionId ?? "N/A",
      record.orderStatus,
      new Date(record.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Payment records exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {paymentStatsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{paymentStatsQuery.data.totalPayments}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{paymentStatsQuery.data.completedPayments}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{paymentStatsQuery.data.pendingPayments}</p>
                </div>
                <Filter className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">R{paymentStatsQuery.data.totalAmount.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search by customer, email, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <Select value={paymentTypeFilter} onValueChange={(value) => setPaymentTypeFilter(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="final_payment">Final Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            Showing {filteredRecords.length} of {paymentRecordsQuery.data?.length || 0} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentRecordsQuery.isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading payment records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((record) => (
                    <tr key={record.paymentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{record.paymentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">#{record.orderId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{record.customerFirstName} {record.customerLastName}</p>
                          <p className="text-xs text-gray-500">{record.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        R{record.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{record.paymentMethod}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={getStatusColor((record.paymentStatus || "pending") as "pending" | "completed" | "failed" | "refunded")}>
                          {record.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={getPaymentTypeColor((record.paymentType || "deposit") as "deposit" | "final_payment")}>
                          {record.paymentType === "deposit" ? "Deposit" : "Final Payment"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
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

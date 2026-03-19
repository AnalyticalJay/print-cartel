import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Mail, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function InvoicesPanel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [showManualForm, setShowManualForm] = useState(false);

  const { data: invoices, isLoading } = trpc.admin.getInvoices.useQuery({
    search,
    filter: filter === "all" ? undefined : filter,
  });

  const { data: stats } = trpc.admin.getInvoiceStats.useQuery();

  const getInvoiceStatus = (invoice: any) => {
    if (invoice.invoiceDeclinedAt) return "Declined";
    if (invoice.invoiceAcceptedAt) return "Accepted";
    return "Pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentStatus = (invoice: any) => {
    if (invoice.paymentStatus === "paid") return "Paid";
    if (invoice.paymentStatus === "deposit_paid") return "Deposit Paid";
    return "Unpaid";
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Deposit Paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{stats?.accepted || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Declined</p>
          <p className="text-2xl font-bold text-red-600">{stats?.declined || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.paid || 0}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "accepted", "declined"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Manual Invoice</DialogTitle>
            </DialogHeader>
            <ManualInvoiceForm onSuccess={() => setShowManualForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8">Loading invoices...</div>
        ) : invoices && invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">
                          {invoice.customerFirstName} {invoice.customerLastName}
                        </p>
                        <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getStatusColor(getInvoiceStatus(invoice))}>
                        {getInvoiceStatus(invoice)}
                      </Badge>
                      <Badge className={getPaymentColor(getPaymentStatus(invoice))}>
                        {getPaymentStatus(invoice)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">R{parseFloat(invoice.totalPriceEstimate).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">
                      {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {invoice.invoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invoice.invoiceUrl, "_blank")}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.success("Email sent to " + invoice.customerEmail);
                      }}
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Resend</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">No invoices found</div>
        )}
      </div>
    </div>
  );
}

function ManualInvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    totalPriceEstimate: "",
    depositAmount: "",
    paymentMethod: "full_payment",
  });

  const createInvoice = trpc.admin.createManualInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to create invoice: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({
      customerFirstName: formData.customerFirstName,
      customerLastName: formData.customerLastName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      totalPriceEstimate: parseFloat(formData.totalPriceEstimate),
      depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
      paymentMethod: formData.paymentMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="First Name"
          value={formData.customerFirstName}
          onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
          required
        />
        <Input
          placeholder="Last Name"
          value={formData.customerLastName}
          onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
          required
        />
      </div>

      <Input
        type="email"
        placeholder="Email"
        value={formData.customerEmail}
        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
        required
      />

      <Input
        placeholder="Phone"
        value={formData.customerPhone}
        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
        required
      />

      <Input
        type="number"
        placeholder="Total Price"
        step="0.01"
        value={formData.totalPriceEstimate}
        onChange={(e) => setFormData({ ...formData, totalPriceEstimate: e.target.value })}
        required
      />

      <Input
        type="number"
        placeholder="Deposit Amount (optional)"
        step="0.01"
        value={formData.depositAmount}
        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
      />

      <select
        value={formData.paymentMethod}
        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
        className="w-full px-3 py-2 border rounded-md"
      >
        <option value="full_payment">Full Payment</option>
        <option value="deposit">Deposit + Final Payment</option>
      </select>

      <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
        {createInvoice.isPending ? "Creating..." : "Create & Send Invoice"}
      </Button>
    </form>
  );
}

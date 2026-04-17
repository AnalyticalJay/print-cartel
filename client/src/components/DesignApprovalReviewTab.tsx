import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/Toast";
import { CheckCircle2, XCircle, AlertCircle, Download, Eye } from "lucide-react";
import { DesignApprovalQueueSkeleton } from "@/components/SkeletonLoaders";

interface DesignApprovalOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  designs: Array<{
    id: number;
    fileName: string;
    fileUrl: string;
    placementArea?: string;
    quantity?: number;
    uploadedAt: Date;
  }>;
}

export function DesignApprovalReviewTab() {
  const toast = useToast();
  const [selectedOrder, setSelectedOrder] = useState<DesignApprovalOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [changeRequests, setChangeRequests] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedDesignPreview, setSelectedDesignPreview] = useState<string | null>(null);

  // Fetch orders with pending designs
  const { data: ordersData, isLoading, refetch } = trpc.admin.getPendingDesignOrders.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  // Approval mutations
  const approveDesignsMutation = trpc.admin.approveDesigns.useMutation({
    onSuccess: () => {
      toast.success("Success", "Designs approved successfully. Customer notified.");
      setSelectedOrder(null);
      setApprovalNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to approve designs");
    },
  });

  const requestChangesMutation = trpc.admin.requestDesignChanges.useMutation({
    onSuccess: () => {
      toast.success("Success", "Change request sent to customer.");
      setSelectedOrder(null);
      setChangeRequests("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to send change request");
    },
  });

  const rejectDesignsMutation = trpc.admin.rejectDesigns.useMutation({
    onSuccess: () => {
      toast.success("Success", "Designs rejected. Customer notified.");
      setSelectedOrder(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to reject designs");
    },
  });

  // Filter and search orders
  const filteredOrders = (ordersData || []).filter((order: any) => {
    const matchesSearch =
      searchQuery === ""
      || order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      || order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      || order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Filter out orders with no designs
  const ordersWithDesigns = filteredOrders.filter((order: any) => order.designs && order.designs.length > 0);

  const handleApprove = async () => {
    if (!selectedOrder) return;

    await approveDesignsMutation.mutateAsync({
      orderId: selectedOrder.id,
      adminId: 1, // In real app, get from auth context
      approvalNotes: approvalNotes || undefined,
    });
  };

  const handleRequestChanges = async () => {
    if (!selectedOrder || !changeRequests.trim()) {
      toast.error("Error", "Please provide change requests");
      return;
    }

    await requestChangesMutation.mutateAsync({
      orderId: selectedOrder.id,
      adminId: 1,
      changeRequests,
    });
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast.error("Error", "Please provide a rejection reason");
      return;
    }

    await rejectDesignsMutation.mutateAsync({
      orderId: selectedOrder.id,
      adminId: 1,
      rejectionReason,
    });
  };

  if (isLoading) {
    return <DesignApprovalQueueSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Design Approval Queue</h2>
        <p className="text-gray-600 mt-1">Review and approve customer design uploads before production</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <Input
                placeholder="Search by customer name, email, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {ordersWithDesigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No design orders found</p>
            <p className="text-gray-500 text-sm mt-1">
              {filterStatus === "pending"
                ? "All pending designs have been reviewed!"
                : "No orders match your search criteria"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ordersWithDesigns.map((order: any) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {order.customerName}
                    </CardDescription>
                  </div>
                  <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Pending Review
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Design Thumbnails */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {order.designs.length} Design{order.designs.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {order.designs.length > 0 && order.designs.slice(0, 4).map((design: any) => (
                      <div
                        key={design.id}
                        className="relative aspect-square bg-muted rounded-md overflow-hidden group cursor-pointer"
                        onClick={() => setSelectedDesignPreview(design.fileUrl)}
                      >
                        {design.fileUrl && (
                          <img
                            src={design.fileUrl}
                            alt={design.fileName || "Design"}
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Info */}
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Designs:</span> {order.designs.length > 0 ? order.designs.length : "No designs yet"}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Submitted:</span>{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Customer:</span> {order.customerEmail}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Review Design - {order.orderNumber}</DialogTitle>
                        <DialogDescription>
                          {order.customerName} ({order.customerEmail})
                        </DialogDescription>
                      </DialogHeader>

                      {selectedOrder?.id === order.id && (
                        <Tabs defaultValue="preview" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                            <TabsTrigger value="actions">Actions</TabsTrigger>
                          </TabsList>

                          {/* Preview Tab */}
                          <TabsContent value="preview" className="space-y-4">
                            <div className="space-y-4">
                              {order.designs.length > 0 ? order.designs.map((design: any) => (
                                <Card key={design.id}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-sm">{design.fileName}</CardTitle>
                                        <CardDescription className="text-xs">
                                          Uploaded {new Date(design.uploadedAt).toLocaleDateString()}
                                        </CardDescription>
                                      </div>
                                      {design.fileUrl && (
                                        <a
                                          href={design.fileUrl}
                                          download
                                          className="text-blue-600 hover:text-blue-700"
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    {design.fileUrl && (
                                      <img
                                        src={design.fileUrl}
                                        alt={design.fileName}
                                        className="w-full max-h-64 object-contain rounded-md bg-muted"
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              )) : (
                                <Card>
                                  <CardContent className="pt-6 text-center text-muted-foreground">
                                    <p>No designs uploaded yet</p>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </TabsContent>

                          {/* Actions Tab */}
                          <TabsContent value="actions" className="space-y-4">
                            {/* Approve */}
                            <Card className="border-green-200 bg-green-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  Approve Designs
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Approval Notes (Optional)
                                  </label>
                                  <Textarea
                                    placeholder="Add any notes about the approved designs..."
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    className="text-sm"
                                    rows={2}
                                  />
                                </div>
                                <Button
                                  onClick={handleApprove}
                                  disabled={approveDesignsMutation.isPending}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {approveDesignsMutation.isPending ? "Approving..." : "Approve & Notify Customer"}
                                </Button>
                              </CardContent>
                            </Card>

                            {/* Request Changes */}
                            <Card className="border-yellow-200 bg-yellow-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  Request Changes
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Change Requests *
                                  </label>
                                  <Textarea
                                    placeholder="Describe what changes are needed..."
                                    value={changeRequests}
                                    onChange={(e) => setChangeRequests(e.target.value)}
                                    className="text-sm"
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={handleRequestChanges}
                                  disabled={requestChangesMutation.isPending || !changeRequests.trim()}
                                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                                >
                                  {requestChangesMutation.isPending ? "Sending..." : "Send Change Request"}
                                </Button>
                              </CardContent>
                            </Card>

                            {/* Reject */}
                            <Card className="border-red-200 bg-red-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  Reject Designs
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Rejection Reason *
                                  </label>
                                  <Textarea
                                    placeholder="Explain why the designs are being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="text-sm"
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={handleReject}
                                  disabled={rejectDesignsMutation.isPending || !rejectionReason.trim()}
                                  className="w-full bg-red-600 hover:bg-red-700"
                                >
                                  {rejectDesignsMutation.isPending ? "Rejecting..." : "Reject & Notify Customer"}
                                </Button>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Design Preview Modal */}
      {selectedDesignPreview && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDesignPreview(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Design Preview</h3>
              <button
                onClick={() => setSelectedDesignPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedDesignPreview}
                alt="Design preview"
                className="w-full max-h-96 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

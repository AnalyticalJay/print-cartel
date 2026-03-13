import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter, Mail, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

type SortField = "date" | "company" | "volume" | "status";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "new" | "contacted" | "qualified" | "rejected";

export default function ResellersManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseSubject, setResponseSubject] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  // Redirect non-admins
  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const inquiriesQuery = trpc.reseller.getAllInquiries.useQuery();
  const responsesQuery = trpc.reseller.getResponses.useQuery(
    { inquiryId: selectedInquiry?.id || 0 },
    { enabled: !!selectedInquiry }
  );
  const updateStatusMutation = trpc.reseller.updateInquiryStatus.useMutation();
  const sendResponseMutation = trpc.reseller.sendResponse.useMutation();

  // Filter and sort inquiries
  const filteredInquiries = useMemo(() => {
    let filtered = inquiriesQuery.data || [];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inquiry: any) =>
          inquiry.companyName.toLowerCase().includes(query) ||
          inquiry.contactName.toLowerCase().includes(query) ||
          inquiry.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inquiry: any) => inquiry.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let compareValue = 0;
      switch (sortField) {
        case "date":
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "company":
          compareValue = a.companyName.localeCompare(b.companyName);
          break;
        case "volume":
          const volumeOrder = ["10-50", "51-100", "101-500", "500+"];
          compareValue = volumeOrder.indexOf(a.estimatedMonthlyVolume) - volumeOrder.indexOf(b.estimatedMonthlyVolume);
          break;
        case "status":
          const statusOrder = ["new", "contacted", "qualified", "rejected"];
          compareValue = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [inquiriesQuery.data, searchQuery, statusFilter, sortField, sortOrder]);

  const handleStatusChange = async (inquiryId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: inquiryId,
        status: newStatus as "new" | "contacted" | "qualified" | "rejected",
      });
      inquiriesQuery.refetch();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseSubject || !responseMessage) return;

    setSendingResponse(true);
    try {
      await sendResponseMutation.mutateAsync({
        inquiryId: selectedInquiry.id,
        subject: responseSubject,
        message: responseMessage,
      });
      setResponseSubject("");
      setResponseMessage("");
      setResponseModalOpen(false);
      responsesQuery.refetch();
    } catch (error) {
      console.error("Failed to send response:", error);
    } finally {
      setSendingResponse(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-4 h-4" />;
      case "contacted":
        return <Clock className="w-4 h-4" />;
      case "qualified":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (inquiriesQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reseller Inquiries</h1>
          <p className="text-muted-foreground">Manage and respond to reseller business inquiries</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, contact, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="company">Company Name</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredInquiries.length} of {inquiriesQuery.data?.length || 0} inquiries
        </div>

        {/* Inquiries Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {filteredInquiries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No reseller inquiries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Volume</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inquiry: any) => (
                    <tr key={inquiry.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{inquiry.companyName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{inquiry.contactName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{inquiry.email}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{inquiry.estimatedMonthlyVolume}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={`${getStatusColor(inquiry.status)} flex items-center gap-1`}>
                              {getStatusIcon(inquiry.status)}
                              {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setResponseModalOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Mail className="w-4 h-4" />
                          Respond
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Response to {selectedInquiry?.companyName}</DialogTitle>
            <DialogDescription>
              Send a response email to {selectedInquiry?.contactName} at {selectedInquiry?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
              <Input
                placeholder="Email subject"
                value={responseSubject}
                onChange={(e) => setResponseSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
              <Textarea
                placeholder="Write your response message here..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setResponseModalOpen(false)}
                disabled={sendingResponse}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendResponse}
                disabled={sendingResponse || !responseSubject || !responseMessage}
                className="flex items-center gap-2"
              >
                {sendingResponse && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

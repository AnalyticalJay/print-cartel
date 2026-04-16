import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface QuoteHistoryItem {
  id: number;
  status: string;
  basePrice: string;
  adjustedPrice: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  expiresAt: Date | null;
  rejectionReason?: string;
}

interface QuoteHistoryTimelineProps {
  quotes: QuoteHistoryItem[];
  isLoading?: boolean;
}

export function QuoteHistoryTimeline({ quotes, isLoading }: QuoteHistoryTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote History</CardTitle>
          <CardDescription>Loading quote history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote History</CardTitle>
          <CardDescription>No quotes yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Quotes will appear here once they are sent to you.</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(num);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "expired":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "outline";
      case "expired":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote History</CardTitle>
        <CardDescription>Track all quotes sent to you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {quotes.map((quote, index) => (
            <div key={quote.id} className="relative">
              {/* Timeline line */}
              {index !== quotes.length - 1 && (
                <div className="absolute left-2.5 top-10 h-8 w-0.5 bg-gray-200" />
              )}

              {/* Timeline item */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-gray-200">
                    {getStatusIcon(quote.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Quote #{quote.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Sent on {quote.sentAt ? format(new Date(quote.sentAt), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(quote.status) as any}>
                      {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  {/* Price info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Base Price</p>
                      <p className="font-medium">{formatCurrency(quote.basePrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Price</p>
                      <p className="font-medium text-blue-600">{formatCurrency(quote.adjustedPrice)}</p>
                    </div>
                  </div>

                  {/* Expiration info */}
                  {quote.expiresAt && quote.status?.toLowerCase() === "pending" && (
                    <p className="text-xs text-amber-600">
                      Expires on {format(new Date(quote.expiresAt), "MMM dd, yyyy")}
                    </p>
                  )}

                  {/* Response info */}
                  {quote.respondedAt && (
                    <p className="text-xs text-gray-500">
                      Responded on {format(new Date(quote.respondedAt), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  )}

                  {/* Rejection reason */}
                  {quote.rejectionReason && (
                    <div className="mt-2 rounded-lg bg-red-50 p-2">
                      <p className="text-xs font-semibold text-red-900">Rejection Reason:</p>
                      <p className="text-xs text-red-800">{quote.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

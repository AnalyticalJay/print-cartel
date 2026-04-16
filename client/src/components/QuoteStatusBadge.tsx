import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

interface QuoteStatusBadgeProps {
  status?: string;
  expiresAt?: Date | null;
  className?: string;
}

export function QuoteStatusBadge({
  status = "pending",
  expiresAt,
  className,
}: QuoteStatusBadgeProps) {
  const now = new Date();
  const isExpired = expiresAt && new Date(expiresAt) < now;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isExpired) {
    return (
      <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
        <AlertCircle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  switch (status?.toLowerCase()) {
    case "pending":
      return (
        <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
          <Clock className="h-3 w-3" />
          Pending ({daysUntilExpiry}d)
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="default" className={`flex items-center gap-1 bg-green-600 ${className}`}>
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={className}>
          {status || "Unknown"}
        </Badge>
      );
  }
}

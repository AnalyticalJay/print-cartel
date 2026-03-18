import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface StatusChange {
  id: number;
  orderId: number;
  previousStatus?: string;
  newStatus: string;
  changedBy?: number;
  adminNotes?: string;
  createdAt: Date;
}

interface OrderStatusHistoryTimelineProps {
  statusHistory: StatusChange[];
  isLoading?: boolean;
}

export function OrderStatusHistoryTimeline({ statusHistory, isLoading }: OrderStatusHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No status changes yet</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "quoted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "approved":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "in-production":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "shipped":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "cancelled") {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Status Timeline
      </h3>

      <div className="space-y-3">
        {statusHistory.map((change, index) => (
          <div
            key={change.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition"
          >
            <div className="flex items-start gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full border ${getStatusColor(change.newStatus)}`}>
                  {getStatusIcon(change.newStatus)}
                </div>
                {index < statusHistory.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-700 my-1" />
                )}
              </div>

              {/* Status details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {change.previousStatus && (
                    <>
                      <span className="text-gray-400 text-sm">
                        {change.previousStatus}
                      </span>
                      <span className="text-gray-600">→</span>
                    </>
                  )}
                  <span className={`px-2 py-1 rounded text-sm font-medium border ${getStatusColor(change.newStatus)}`}>
                    {change.newStatus}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    {format(new Date(change.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {change.changedBy && (
                    <span className="text-gray-500">
                      Changed by Admin ID: {change.changedBy}
                    </span>
                  )}
                </div>

                {change.adminNotes && (
                  <div className="mt-3 p-2 bg-gray-700/50 rounded border border-gray-600 text-sm text-gray-300">
                    <p className="font-medium text-gray-400 mb-1">Notes:</p>
                    <p>{change.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

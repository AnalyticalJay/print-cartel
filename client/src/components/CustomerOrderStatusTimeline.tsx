import { CheckCircle2, Clock, AlertCircle, Truck, Package } from "lucide-react";
import { format } from "date-fns";

interface StatusChange {
  id: number;
  orderId: number;
  previousStatus?: string | null;
  newStatus: string;
  createdAt: Date;
}

interface CustomerOrderStatusTimelineProps {
  statusHistory: StatusChange[];
  isLoading?: boolean;
  estimatedDelivery?: Date;
}

export function CustomerOrderStatusTimeline({
  statusHistory,
  isLoading,
  estimatedDelivery,
}: CustomerOrderStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No status updates yet</p>
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
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "quoted":
        return <AlertCircle className="w-5 h-5" />;
      case "approved":
        return <CheckCircle2 className="w-5 h-5" />;
      case "in-production":
        return <Package className="w-5 h-5" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "shipped":
        return <Truck className="w-5 h-5" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Order Received",
      quoted: "Quote Ready",
      approved: "Approved",
      "in-production": "In Production",
      completed: "Ready to Ship",
      shipped: "Shipped",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      pending: "Your order has been received and is being reviewed",
      quoted: "We've prepared a quote for your order",
      approved: "Your order has been approved and queued for production",
      "in-production": "Your custom design is being printed",
      completed: "Your order is complete and ready to ship",
      shipped: "Your order is on its way to you",
      cancelled: "Your order has been cancelled",
    };
    return descriptions[status] || "";
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Order Status
      </h3>

      {/* Timeline */}
      <div className="space-y-3">
        {statusHistory.map((change, index) => {
          const isCompleted = index < statusHistory.length - 1;
          const isCurrent = index === statusHistory.length - 1;

          return (
            <div key={change.id} className="relative">
              {/* Connector line */}
              {!isCurrent && (
                <div className="absolute left-6 top-14 w-0.5 h-8 bg-gray-700" />
              )}

              {/* Status item */}
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isCompleted || isCurrent
                        ? "bg-gray-800 border-cyan-500"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <div
                      className={`${
                        isCompleted || isCurrent
                          ? "text-cyan-400"
                          : "text-gray-500"
                      }`}
                    >
                      {getStatusIcon(change.newStatus)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`font-semibold ${
                        isCurrent ? "text-cyan-400" : "text-gray-300"
                      }`}
                    >
                      {getStatusLabel(change.newStatus)}
                    </h4>
                    {isCurrent && (
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold text-white bg-cyan-500 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mt-1">
                    {getStatusDescription(change.newStatus)}
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(change.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery */}
      {estimatedDelivery && (
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <p className="text-sm text-cyan-400">
            <span className="font-semibold">Estimated Delivery:</span>{" "}
            {format(new Date(estimatedDelivery), "MMMM d, yyyy")}
          </p>
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-xs text-gray-400">
          💡 Your order status is updated automatically. You'll receive an email notification when your order status changes.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Check, Clock, ChevronDown } from "lucide-react";

interface TimelineEvent {
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  label: string;
  date: Date;
  completed: boolean;
  description?: string;
}

interface MobileOrderTimelineProps {
  currentStatus: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  orderDetails?: {
    quantity?: number;
    totalPrice?: string;
    depositPaid?: boolean;
  };
}

export function MobileOrderTimeline({ currentStatus, createdAt, updatedAt, orderDetails }: MobileOrderTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const events: TimelineEvent[] = [
    {
      status: "pending",
      label: "Order Submitted",
      date: createdAt,
      completed: true,
      description: `Order received for ${orderDetails?.quantity || "N/A"} units. Total: ${orderDetails?.totalPrice || "TBD"}`,
    },
    {
      status: "quoted",
      label: "Quote Sent",
      date: updatedAt,
      completed: ["quoted", "approved", "in-production", "completed", "shipped"].includes(currentStatus),
      description: "We've sent you a quote. Please review and approve to proceed.",
    },
    {
      status: "approved",
      label: "Quote Approved",
      date: updatedAt,
      completed: ["approved", "in-production", "completed", "shipped"].includes(currentStatus),
      description: "Quote approved. Ready for production.",
    },
    {
      status: "in-production",
      label: "In Production",
      date: updatedAt,
      completed: ["in-production", "completed", "shipped"].includes(currentStatus),
      description: "Your order is being printed and prepared.",
    },
    {
      status: "completed",
      label: "Completed",
      date: updatedAt,
      completed: ["completed", "shipped"].includes(currentStatus),
      description: "Production finished. Ready for shipment.",
    },
    {
      status: "shipped",
      label: "Shipped",
      date: updatedAt,
      completed: currentStatus === "shipped",
      description: "Your order has been shipped. Track your package.",
    },
  ];

  const getStatusColor = (status: string, completed: boolean) => {
    if (!completed) return "bg-gray-300";
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "quoted":
        return "bg-blue-500";
      case "approved":
        return "bg-purple-500";
      case "in-production":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      case "shipped":
        return "bg-green-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBgColor = (status: string, completed: boolean) => {
    if (!completed) return "bg-gray-50";
    switch (status) {
      case "pending":
        return "bg-yellow-50";
      case "quoted":
        return "bg-blue-50";
      case "approved":
        return "bg-purple-50";
      case "in-production":
        return "bg-orange-50";
      case "completed":
        return "bg-green-50";
      case "shipped":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  return (
    <div className="py-4 md:py-8">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-4 md:mb-6 p-3 md:p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Order Timeline</h3>
        <ChevronDown className={`w-5 h-5 md:w-6 md:h-6 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
      {!isCollapsed && (
      <div className="space-y-2 md:space-y-3">
        {events.map((event, index) => (
          <div key={event.status} className="relative">
            {/* Timeline line */}
            {index < events.length - 1 && (
              <div
                className={`absolute left-5 md:left-6 top-12 md:top-14 w-0.5 h-12 md:h-16 ${
                  event.completed ? "bg-gray-400" : "bg-gray-200"
                }`}
              />
            )}

            {/* Timeline item */}
            <div
              className={`relative flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-gray-200 cursor-pointer transition-all ${
                getStatusBgColor(event.status, event.completed)
              } ${expandedStatus === event.status ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => toggleExpand(event.status)}
            >
              {/* Timeline dot */}
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${getStatusColor(
                    event.status,
                    event.completed
                  )} shadow-md`}
                >
                  {event.completed ? (
                    <Check className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Timeline content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base text-gray-900">{event.label}</p>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      {formatDate(event.date)} at {formatTime(event.date)}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      expandedStatus === event.status ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Expandable content */}
                {expandedStatus === event.status && event.description && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Status legend */}
      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
        <p className="text-xs md:text-sm font-semibold text-gray-900 mb-3">Current Status</p>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${getStatusColor(currentStatus, true)}`}>
            <Check className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm md:text-base text-gray-900 capitalize">
              {events.find((e) => e.status === currentStatus)?.label || currentStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

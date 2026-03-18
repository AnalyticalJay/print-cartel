import { Check, Clock } from "lucide-react";

interface TimelineEvent {
  status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  label: string;
  date: Date;
  completed: boolean;
}

interface OrderTimelineProps {
  currentStatus: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export function OrderTimeline({ currentStatus, createdAt, updatedAt }: OrderTimelineProps) {
  const events: TimelineEvent[] = [
    {
      status: "pending",
      label: "Order Submitted",
      date: createdAt,
      completed: true,
    },
    {
      status: "quoted",
      label: "Quote Sent",
      date: updatedAt,
      completed: ["quoted", "approved", "in-production", "completed"].includes(currentStatus),
    },
    {
      status: "approved",
      label: "Approved",
      date: updatedAt,
      completed: ["approved", "in-production", "completed"].includes(currentStatus),
    },
    {
      status: "in-production",
      label: "In Production",
      date: updatedAt,
      completed: ["in-production", "completed"].includes(currentStatus),
    },
    {
      status: "completed",
      label: "Completed",
      date: updatedAt,
      completed: currentStatus === "completed",
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
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold mb-6">Order Timeline</h3>
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.status} className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(event.status, event.completed)}`}>
                {event.completed ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Clock className="w-5 h-5 text-white" />
                )}
              </div>
              {index < events.length - 1 && (
                <div className={`w-1 h-12 mt-2 ${event.completed ? "bg-gray-400" : "bg-gray-200"}`} />
              )}
            </div>

            {/* Timeline content */}
            <div className="pt-1">
              <p className="font-semibold text-gray-900">{event.label}</p>
              <p className="text-sm text-gray-300">{formatDate(event.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

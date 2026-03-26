import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, DollarSign, XCircle } from "lucide-react";

interface OrderDetailTimelineProps {
  order: {
    id: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
    quoteApprovedAt?: Date | null;
    quoteRejectedAt?: Date | null;
    quoteRejectionReason?: string | null;
    paymentVerifiedAt?: Date | null;
    paymentVerificationNotes?: string | null;
    invoiceAcceptedAt?: Date | null;
    invoiceDeclinedAt?: Date | null;
    invoiceDeclineReason?: string | null;
  };
}

export function OrderDetailTimeline({ order }: OrderDetailTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "quoted":
        return <AlertCircle className="w-5 h-5" />;
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "paid":
        return <DollarSign className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "quoted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Build timeline events
  const timelineEvents = [
    {
      status: "pending",
      timestamp: order.createdAt,
      label: "Order Submitted",
      description: "Order received and under review",
      icon: getStatusIcon("pending"),
      color: getStatusColor("pending"),
    },
    ...(order.quoteApprovedAt
      ? [
          {
            status: "approved",
            timestamp: order.quoteApprovedAt,
            label: "Quote Accepted",
            description: "Customer accepted the quote",
            icon: getStatusIcon("approved"),
            color: getStatusColor("approved"),
          },
        ]
      : []),
    ...(order.quoteRejectedAt
      ? [
          {
            status: "rejected",
            timestamp: order.quoteRejectedAt,
            label: "Quote Rejected",
            description: order.quoteRejectionReason || "Customer rejected the quote",
            icon: getStatusIcon("rejected"),
            color: getStatusColor("rejected"),
          },
        ]
      : []),
    ...(order.paymentVerifiedAt
      ? [
          {
            status: "paid",
            timestamp: order.paymentVerifiedAt,
            label: "Payment Verified",
            description: "Payment received and verified",
            icon: getStatusIcon("paid"),
            color: getStatusColor("paid"),
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
        <CardDescription>Order #{order.id} - Status: {order.status}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200"></div>

            {/* Timeline events */}
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={index} className="relative pl-16">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1 w-12 h-12 rounded-full flex items-center justify-center border-4 ${event.color}`}
                  >
                    {event.icon}
                  </div>

                  {/* Event content */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={event.color}>{event.label}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700">{event.description}</p>

                    {/* Additional notes */}
                    {event.status === "approved" && order.invoiceAcceptedAt && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-semibold text-green-900 mb-1">Invoice Accepted:</p>
                        <p className="text-xs text-green-800">
                          {new Date(order.invoiceAcceptedAt).toLocaleDateString("en-ZA")}
                        </p>
                      </div>
                    )}

                    {event.status === "rejected" && order.quoteRejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-xs text-red-800">{order.quoteRejectionReason}</p>
                      </div>
                    )}

                    {event.status === "paid" && order.paymentVerificationNotes && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-900 mb-1">Verification Notes:</p>
                        <p className="text-xs text-emerald-800">{order.paymentVerificationNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Order Submitted</p>
              <p className="text-sm font-semibold">
                {new Date(order.createdAt).toLocaleDateString("en-ZA")}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Quote Status</p>
              <p className="text-sm font-semibold">
                {order.quoteApprovedAt
                  ? "Accepted"
                  : order.quoteRejectedAt
                  ? "Rejected"
                  : "Pending"}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Payment Status</p>
              <p className="text-sm font-semibold">
                {order.paymentVerifiedAt ? "Verified" : "Pending"}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Current Status</p>
              <p className="text-sm font-semibold capitalize">{order.status}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface PaymentStatusDisplayProps {
  paymentStatus: "unpaid" | "deposit_paid" | "paid";
  totalAmount: number;
  amountPaid: number;
  depositAmount?: number;
  dueDate?: Date;
  showDetails?: boolean;
}

export function PaymentStatusDisplay({
  paymentStatus,
  totalAmount,
  amountPaid,
  depositAmount,
  dueDate,
  showDetails = true,
}: PaymentStatusDisplayProps) {
  const percentagePaid = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
  const amountDue = totalAmount - amountPaid;
  const isOverdue = dueDate && new Date() > dueDate;

  const getStatusColor = () => {
    switch (paymentStatus) {
      case "paid":
        return "text-green-400";
      case "deposit_paid":
        return "text-yellow-400";
      case "unpaid":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = () => {
    switch (paymentStatus) {
      case "paid":
        return "Fully Paid";
      case "deposit_paid":
        return "Deposit Paid";
      case "unpaid":
        return "Unpaid";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "paid":
        return <CheckCircle className="w-5 h-5" />;
      case "deposit_paid":
        return <Clock className="w-5 h-5" />;
      case "unpaid":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 bg-slate-900 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Payment Status</h3>
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusLabel()}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Payment Progress</span>
          <span className="text-sm font-medium text-cyan-400">
            {Math.round(percentagePaid)}%
          </span>
        </div>
        <Progress value={percentagePaid} className="h-2" />
      </div>

      {/* Payment Details */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total Amount:</span>
            <span className="font-medium text-cyan-400">
              R{totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-gray-300">
            <span>Amount Paid:</span>
            <span className="font-medium text-green-400">
              R{amountPaid.toFixed(2)}
            </span>
          </div>

          {amountDue > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Amount Due:</span>
              <span className="font-medium text-red-400">
                R{amountDue.toFixed(2)}
              </span>
            </div>
          )}

          {depositAmount && paymentStatus === "unpaid" && (
            <div className="flex justify-between text-gray-300 pt-2 border-t border-slate-700">
              <span>Deposit Required (50%):</span>
              <span className="font-medium text-yellow-400">
                R{depositAmount.toFixed(2)}
              </span>
            </div>
          )}

          {dueDate && (
            <div className="flex justify-between text-gray-300 pt-2 border-t border-slate-700">
              <span>Payment Due:</span>
              <span className={`font-medium ${isOverdue ? "text-red-400" : "text-cyan-400"}`}>
                {new Date(dueDate).toLocaleDateString()}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Message */}
      {paymentStatus === "unpaid" && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
          Payment is required to proceed with production. Please make payment as soon as possible.
        </div>
      )}

      {paymentStatus === "deposit_paid" && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-300 text-sm">
          Deposit received. Final payment of R{amountDue.toFixed(2)} is due before production starts.
        </div>
      )}

      {paymentStatus === "paid" && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded text-green-300 text-sm">
          Payment complete. Your order is ready for production.
        </div>
      )}
    </Card>
  );
}

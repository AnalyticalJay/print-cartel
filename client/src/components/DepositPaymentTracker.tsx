import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  CreditCard,
  DollarSign,
} from "lucide-react";

export interface DepositPaymentTrackerProps {
  orderId: number;
  totalPrice: number | string;
  depositPercentage?: number; // Default 30% deposit
  depositPaid?: number | string;
  finalPaymentPaid?: number | string;
  orderStatus?: "pending" | "quoted" | "approved" | "paid" | "production" | "shipped" | "delivered";
  onPayDeposit?: () => void;
  onPayFinal?: () => void;
}

/**
 * Deposit Payment Tracker Component
 * Displays visual progress indicators for deposit and final payment status
 * Shows clear next-step instructions based on payment progress
 */
export function DepositPaymentTracker({
  orderId,
  totalPrice,
  depositPercentage = 30,
  depositPaid = 0,
  finalPaymentPaid = 0,
  orderStatus = "pending",
  onPayDeposit,
  onPayFinal,
}: DepositPaymentTrackerProps) {
  const calculations = useMemo(() => {
    const total = typeof totalPrice === "string" ? parseFloat(totalPrice) : totalPrice;
    const deposit = typeof depositPaid === "string" ? parseFloat(depositPaid) : depositPaid;
    const final = typeof finalPaymentPaid === "string" ? parseFloat(finalPaymentPaid) : finalPaymentPaid;

    const depositDue = total * (depositPercentage / 100);
    const finalDue = total - depositDue;

    const depositProgress = Math.min((deposit / depositDue) * 100, 100);
    const finalProgress = Math.min((final / finalDue) * 100, 100);

    const isDepositPaid = deposit >= depositDue;
    const isFinalPaid = final >= finalDue;
    const isFullyPaid = isDepositPaid && isFinalPaid;

    return {
      total,
      depositDue,
      finalDue,
      depositPaid: deposit,
      finalPaymentPaid: final,
      depositProgress,
      finalProgress,
      isDepositPaid,
      isFinalPaid,
      isFullyPaid,
      remainingDeposit: Math.max(0, depositDue - deposit),
      remainingFinal: Math.max(0, finalDue - final),
    };
  }, [totalPrice, depositPaid, finalPaymentPaid, depositPercentage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentStatus = () => {
    if (calculations.isFullyPaid) {
      return {
        label: "FULLY PAID",
        color: "bg-green-600",
        icon: CheckCircle2,
        message: "All payments received. Order is ready for production.",
      };
    } else if (calculations.isDepositPaid) {
      return {
        label: "DEPOSIT PAID",
        color: "bg-blue-600",
        icon: Clock,
        message: "Deposit received. Final payment is due before production.",
      };
    } else {
      return {
        label: "AWAITING DEPOSIT",
        color: "bg-amber-600",
        icon: AlertCircle,
        message: "Deposit payment is required to proceed with your order.",
      };
    }
  };

  const status = getPaymentStatus();
  const StatusIcon = status.icon;

  const getNextSteps = () => {
    if (calculations.isFullyPaid) {
      return [
        {
          step: 1,
          title: "Order Confirmed",
          description: "Your payment is complete. Production will begin shortly.",
          completed: true,
        },
        {
          step: 2,
          title: "Production",
          description: "Your order is being printed and prepared for shipment.",
          completed: false,
        },
        {
          step: 3,
          title: "Shipping",
          description: "Your order will be shipped within 5-7 business days.",
          completed: false,
        },
      ];
    } else if (calculations.isDepositPaid) {
      return [
        {
          step: 1,
          title: "Deposit Received",
          description: "Thank you for your deposit payment.",
          completed: true,
        },
        {
          step: 2,
          title: "Final Payment Due",
          description: `Pay the remaining ${formatCurrency(calculations.remainingFinal)} to proceed.`,
          completed: false,
          action: true,
        },
        {
          step: 3,
          title: "Production Starts",
          description: "Once final payment is received, production begins immediately.",
          completed: false,
        },
      ];
    } else {
      return [
        {
          step: 1,
          title: "Deposit Payment Required",
          description: `Pay ${formatCurrency(calculations.depositDue)} (${depositPercentage}% of total) to secure your order.`,
          completed: false,
          action: true,
        },
        {
          step: 2,
          title: "Final Payment",
          description: `After deposit, pay the remaining ${formatCurrency(calculations.finalDue)} before production.`,
          completed: false,
        },
        {
          step: 3,
          title: "Production & Delivery",
          description: "Once fully paid, your order enters production queue.",
          completed: false,
        },
      ];
    }
  };

  const nextSteps = getNextSteps();

  return (
    <div className="space-y-6">
      {/* Payment Status Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${status.color} rounded-full p-2`}>
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Payment Status</CardTitle>
                <CardDescription>Order #{orderId}</CardDescription>
              </div>
            </div>
            <Badge className={`${status.color} text-white px-4 py-2 text-sm font-semibold`}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{status.message}</p>
        </CardContent>
      </Card>

      {/* Payment Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Breakdown</CardTitle>
          <CardDescription>Track your deposit and final payment progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Deposit Payment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${calculations.isDepositPaid ? "bg-green-100" : "bg-amber-100"}`}>
                  <CreditCard className={`h-4 w-4 ${calculations.isDepositPaid ? "text-green-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Deposit Payment</p>
                  <p className="text-xs text-gray-600">{depositPercentage}% of total order</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {formatCurrency(calculations.depositPaid)}/{formatCurrency(calculations.depositDue)}
                </p>
                {calculations.isDepositPaid && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 mt-1">
                    ✓ Paid
                  </Badge>
                )}
              </div>
            </div>

            {/* Deposit Progress Bar */}
            <div className="space-y-2">
              <Progress value={calculations.depositProgress} className="h-3" />
              {!calculations.isDepositPaid && (
                <p className="text-xs text-gray-600">
                  {formatCurrency(calculations.remainingDeposit)} remaining
                </p>
              )}
            </div>

            {/* Deposit Action Button */}
            {!calculations.isDepositPaid && onPayDeposit && (
              <Button
                onClick={onPayDeposit}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Deposit Now
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Final Payment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${calculations.isFinalPaid ? "bg-green-100" : calculations.isDepositPaid ? "bg-blue-100" : "bg-gray-100"}`}>
                  <DollarSign className={`h-4 w-4 ${calculations.isFinalPaid ? "text-green-600" : calculations.isDepositPaid ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Final Payment</p>
                  <p className="text-xs text-gray-600">{100 - depositPercentage}% of total order</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {formatCurrency(calculations.finalPaymentPaid)}/{formatCurrency(calculations.finalDue)}
                </p>
                {calculations.isFinalPaid && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 mt-1">
                    ✓ Paid
                  </Badge>
                )}
              </div>
            </div>

            {/* Final Payment Progress Bar */}
            <div className="space-y-2">
              <div className={!calculations.isDepositPaid ? "opacity-50" : ""}>
                <Progress
                  value={calculations.finalProgress}
                  className="h-3"
                />
              </div>
              {!calculations.isFinalPaid && calculations.isDepositPaid && (
                <p className="text-xs text-gray-600">
                  {formatCurrency(calculations.remainingFinal)} remaining
                </p>
              )}
              {!calculations.isDepositPaid && (
                <p className="text-xs text-gray-500 italic">
                  Available after deposit payment
                </p>
              )}
            </div>

            {/* Final Payment Action Button */}
            {calculations.isDepositPaid && !calculations.isFinalPaid && onPayFinal && (
              <Button
                onClick={onPayFinal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Final Amount
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculations.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(calculations.depositPaid + calculations.finalPaymentPaid)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextSteps.map((step, index) => (
            <div key={step.step} className="flex gap-4">
              {/* Step number */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold text-white ${
                    step.completed
                      ? "bg-green-600"
                      : step.action
                        ? "bg-blue-600"
                        : "bg-gray-300"
                  }`}
                >
                  {step.completed ? "✓" : step.step}
                </div>
                {index < nextSteps.length - 1 && (
                  <div className={`w-1 h-12 mt-2 ${step.completed ? "bg-green-300" : "bg-gray-200"}`}></div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-4">
                <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Important Notice */}
      {!calculations.isFullyPaid && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> Your order will not enter production until all payments are received.
            {calculations.isDepositPaid && (
              <>
                {" "}
                Please complete your final payment of{" "}
                <strong>{formatCurrency(calculations.remainingFinal)}</strong> to proceed.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {calculations.isFullyPaid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Thank you!</strong> Your payment is complete. Your order will begin production shortly.
            You'll receive an email with tracking information once it ships.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

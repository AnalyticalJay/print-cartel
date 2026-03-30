import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2, CreditCard, Landmark, Zap } from "lucide-react";

export type PaymentMethodType = "payfast" | "eft" | "bank_transfer";

interface PaymentMethodDetailsProps {
  method: PaymentMethodType;
  amount: number;
  isDeposit?: boolean;
  showInstructions?: boolean;
}

const paymentMethodInfo = {
  payfast: {
    name: "PayFast",
    displayName: "PayFast Online Payment",
    description: "Secure online payment gateway",
    processingTime: "Immediate",
    processingTimeDetail: "Payment processed instantly",
    icon: CreditCard,
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
    instructions: [
      "You will be redirected to PayFast's secure payment page",
      "Enter your card or bank account details",
      "Complete the payment process",
      "You'll receive an instant confirmation",
      "Your order will move to production immediately",
    ],
    benefits: [
      "Instant payment processing",
      "Secure encrypted connection",
      "Multiple payment options (card, bank account, etc.)",
      "Immediate order confirmation",
    ],
    fees: "May apply (typically 2-3%)",
  },
  eft: {
    name: "EFT",
    displayName: "Electronic Funds Transfer (EFT)",
    description: "Direct bank transfer via EFT",
    processingTime: "1-2 hours",
    processingTimeDetail: "Usually processed within 1-2 business hours",
    icon: Zap,
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-800",
    instructions: [
      "You will receive bank details via email",
      "Log into your online banking",
      "Create a new beneficiary with the provided details",
      "Transfer the payment amount",
      "Send proof of payment (screenshot) to confirm",
      "Your order will be confirmed once verified",
    ],
    benefits: [
      "Fast processing (1-2 hours)",
      "No transaction fees",
      "Direct bank-to-bank transfer",
      "Secure and traceable",
    ],
    fees: "None",
  },
  bank_transfer: {
    name: "Bank Transfer",
    displayName: "Bank Deposit",
    description: "Direct bank account deposit",
    processingTime: "1-3 business days",
    processingTimeDetail: "Processing time depends on your bank",
    icon: Landmark,
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-800",
    instructions: [
      "You will receive full bank details via email",
      "Visit your bank branch or use online banking",
      "Deposit the payment amount to the provided account",
      "Include your order number as reference",
      "Send proof of deposit (receipt/screenshot) to confirm",
      "Your order will be confirmed once verified",
    ],
    benefits: [
      "No online fees",
      "Works with any bank",
      "Flexible timing",
      "Complete control over payment",
    ],
    fees: "None (bank may charge deposit fee)",
  },
};

export function PaymentMethodDetails({
  method,
  amount,
  isDeposit = false,
  showInstructions = true,
}: PaymentMethodDetailsProps) {
  const info = paymentMethodInfo[method];
  const IconComponent = info.icon;

  return (
    <Card className={`border-2 ${info.color}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.badgeColor}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{info.displayName}</CardTitle>
              <CardDescription>{info.description}</CardDescription>
            </div>
          </div>
          <Badge className={info.badgeColor}>{info.name}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Amount */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="text-2xl font-bold text-gray-900">R{amount.toFixed(2)}</span>
          </div>
          {isDeposit && (
            <div className="text-sm text-amber-600 flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4" />
              This is a deposit payment. Final payment will be due upon completion.
            </div>
          )}
        </div>

        {/* Processing Time */}
        <div className="flex items-start gap-3 bg-white rounded-lg p-4 border">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Processing Time</h4>
            <p className="text-gray-600 text-sm">{info.processingTime}</p>
            <p className="text-gray-500 text-xs mt-1">{info.processingTimeDetail}</p>
          </div>
        </div>

        {/* Fees Information */}
        <div className="flex items-start gap-3 bg-white rounded-lg p-4 border">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Transaction Fees</h4>
            <p className="text-gray-600 text-sm">{info.fees}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
          <ul className="space-y-2">
            {info.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3">How to Complete Payment</h4>
            <ol className="space-y-2">
              {info.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 font-semibold text-gray-400 w-6">
                    {idx + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Important</p>
              <p>
                Please keep your payment proof/receipt. You may need to submit it as verification
                of payment.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for email display
 */
export function PaymentMethodDetailsEmail(method: PaymentMethodType, amount: number) {
  const info = paymentMethodInfo[method];

  return `
    <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333; font-size: 16px;">Payment Method: ${info.displayName}</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px 0; color: #666;"><strong>Amount:</strong></td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #28a745;">R${amount.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px 0; color: #666;"><strong>Processing Time:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${info.processingTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;"><strong>Transaction Fees:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${info.fees}</td>
        </tr>
      </table>

      <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 12px; border-radius: 4px; margin: 15px 0;">
        <p style="margin: 0; color: #155724; font-size: 14px;">
          <strong>Next Steps:</strong> Check your email for detailed payment instructions specific to your selected payment method.
        </p>
      </div>
    </div>
  `;
}

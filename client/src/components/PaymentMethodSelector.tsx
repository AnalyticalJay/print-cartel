import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Building2, AlertCircle, CheckCircle } from "lucide-react";

export type PaymentMethodType = "payfast" | "eft" | "bank_transfer";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  amount: number;
  orderAmount?: number;
}

const paymentMethods = [
  {
    id: "payfast" as PaymentMethodType,
    name: "PayFast",
    description: "Pay instantly with credit/debit card or online banking",
    icon: CreditCard,
    benefits: ["Instant confirmation", "Secure payment gateway", "Multiple card options"],
    processingTime: "Immediate",
    badge: "Fastest",
    color: "bg-blue-50 border-blue-200",
    selectedColor: "border-blue-500 bg-blue-50",
  },
  {
    id: "eft" as PaymentMethodType,
    name: "EFT (Electronic Funds Transfer)",
    description: "Transfer funds directly from your bank account",
    icon: Banknote,
    benefits: ["No transaction fees", "Secure bank transfer", "Proof of payment included"],
    processingTime: "1-2 hours",
    badge: "No Fees",
    color: "bg-green-50 border-green-200",
    selectedColor: "border-green-500 bg-green-50",
  },
  {
    id: "bank_transfer" as PaymentMethodType,
    name: "Bank Deposit",
    description: "Deposit cash or cheque at any bank branch",
    icon: Building2,
    benefits: ["Flexible timing", "No online fees", "Works with cash or cheque"],
    processingTime: "1-3 business days",
    badge: "Flexible",
    color: "bg-purple-50 border-purple-200",
    selectedColor: "border-purple-500 bg-purple-50",
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  amount,
  orderAmount,
}: PaymentMethodSelectorProps) {
  const selectedMethodData = paymentMethods.find((m) => m.id === selectedMethod);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Payment Method</h2>
        <p className="text-gray-600">
          Choose how you'd like to pay for your order of R{amount.toFixed(2)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? `${method.selectedColor} ring-2 ring-offset-2 ring-offset-white`
                  : `${method.color} hover:border-gray-400`
              }`}
              onClick={() => onMethodChange(method.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Icon className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {method.badge}
                      </Badge>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{method.description}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Benefits:</p>
                  <ul className="space-y-1">
                    {method.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Processing time:</span> {method.processingTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Details Card */}
      {selectedMethodData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              Payment Details for {selectedMethodData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-900">
            {selectedMethod === "payfast" && (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Click "Pay with PayFast" button</li>
                    <li>You'll be redirected to PayFast's secure payment page</li>
                    <li>Enter your card or banking details</li>
                    <li>Confirm the payment</li>
                    <li>You'll receive instant confirmation</li>
                  </ol>
                </div>
                <div className="bg-white rounded p-2 text-xs">
                  <p className="font-semibold mb-1">Amount to pay: R{amount.toFixed(2)}</p>
                  <p>Your payment will be processed immediately through PayFast's secure gateway.</p>
                </div>
              </div>
            )}

            {selectedMethod === "eft" && (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">Bank Details:</p>
                  <div className="bg-white rounded p-2 space-y-1 text-xs font-mono">
                    <p>
                      <span className="font-semibold">Bank:</span> Standard Bank
                    </p>
                    <p>
                      <span className="font-semibold">Account Holder:</span> Print Cartel
                    </p>
                    <p>
                      <span className="font-semibold">Account Number:</span> 123456789
                    </p>
                    <p>
                      <span className="font-semibold">Branch Code:</span> 050001
                    </p>
                    <p>
                      <span className="font-semibold">Reference:</span> Order #{/* orderId will be added */}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1">Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Log into your online banking</li>
                    <li>Select "Transfer" or "EFT"</li>
                    <li>Enter the bank details above</li>
                    <li>Enter amount: R{amount.toFixed(2)}</li>
                    <li>Use order number as reference</li>
                    <li>Submit and keep proof of payment</li>
                  </ol>
                </div>
              </div>
            )}

            {selectedMethod === "bank_transfer" && (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">Bank Details:</p>
                  <div className="bg-white rounded p-2 space-y-1 text-xs font-mono">
                    <p>
                      <span className="font-semibold">Bank:</span> Standard Bank
                    </p>
                    <p>
                      <span className="font-semibold">Account Holder:</span> Print Cartel
                    </p>
                    <p>
                      <span className="font-semibold">Account Number:</span> 123456789
                    </p>
                    <p>
                      <span className="font-semibold">Branch Code:</span> 050001
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1">Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Visit any Standard Bank branch</li>
                    <li>Request a deposit slip</li>
                    <li>Enter account details above</li>
                    <li>Deposit R{amount.toFixed(2)}</li>
                    <li>Keep the deposit receipt</li>
                    <li>Upload receipt as proof of payment</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="bg-white rounded p-2 text-xs">
              <p className="font-semibold mb-1">📋 Next Step:</p>
              <p>
                After making payment, you'll need to submit proof of payment (screenshot, receipt, or
                bank confirmation) in the payment proof section.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, ArrowLeft } from "lucide-react";
import { EFTTemplate, type EFTProofData } from "./EFTTemplate";
import { CreditCardTemplate, type CreditCardProofData } from "./CreditCardTemplate";

interface TemplateSelectorProps {
  orderId?: number;
  orderAmount?: number;
  customerName?: string;
  onTemplateSubmit?: (templateType: string, data: EFTProofData | CreditCardProofData) => void;
  onClose?: () => void;
}

export function TemplateSelector({
  orderId,
  orderAmount,
  customerName,
  onTemplateSubmit,
  onClose,
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<"eft" | "creditcard" | null>(null);

  if (selectedTemplate === "eft") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTemplate(null)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <EFTTemplate
          orderId={orderId}
          orderAmount={orderAmount}
          customerName={customerName}
          onSubmit={(data) => {
            if (onTemplateSubmit) onTemplateSubmit("eft", data);
          }}
        />
      </div>
    );
  }

  if (selectedTemplate === "creditcard") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTemplate(null)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <CreditCardTemplate
          orderId={orderId}
          orderAmount={orderAmount}
          customerName={customerName}
          onSubmit={(data) => {
            if (onTemplateSubmit) onTemplateSubmit("creditcard", data);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Proof Templates</h2>
        <p className="text-gray-600 mt-2">
          Select your payment method and fill in the details to create a payment proof
        </p>
      </div>

      {/* Order Summary */}
      {(orderId || orderAmount) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-lg font-semibold text-gray-900">#{orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount Due</p>
                <p className="text-lg font-semibold text-blue-600">R{orderAmount?.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EFT Template */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow hover:border-cyan-400"
          onClick={() => setSelectedTemplate("eft")}
        >
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <Banknote className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">EFT Transfer</CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Electronic Funds Transfer</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Use this template if you've made a bank transfer (EFT) to our account.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Required Information:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Payment date and time</li>
                  <li>✓ Your bank and account details</li>
                  <li>✓ Transaction reference number</li>
                  <li>✓ Receiver bank details</li>
                  <li>✓ Transaction status</li>
                </ul>
              </div>
              <Button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700">
                Use EFT Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Card Template */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow hover:border-purple-400"
          onClick={() => setSelectedTemplate("creditcard")}
        >
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Credit Card</CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Card Payment Receipt</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Use this template if you've paid with a credit card or debit card.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Required Information:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Payment date and time</li>
                  <li>✓ Card type and last 4 digits</li>
                  <li>✓ Authorization code</li>
                  <li>✓ Transaction ID</li>
                  <li>✓ Receipt number</li>
                </ul>
              </div>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                Use Credit Card Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-amber-900">How to Use These Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-800">
          <ol className="space-y-2">
            <li>
              <span className="font-semibold">1. Select Template:</span> Choose the template that matches your payment method
            </li>
            <li>
              <span className="font-semibold">2. Fill in Details:</span> Complete all required fields with information from your bank statement or receipt
            </li>
            <li>
              <span className="font-semibold">3. Review:</span> Double-check all information for accuracy
            </li>
            <li>
              <span className="font-semibold">4. Download/Print:</span> Save as HTML or print the template
            </li>
            <li>
              <span className="font-semibold">5. Upload:</span> Submit the completed proof with your order
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-green-900">Tips for Valid Payment Proof</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-800">
          <ul className="space-y-1">
            <li>• Ensure all amounts match your order total</li>
            <li>• Include transaction/reference numbers for tracking</li>
            <li>• Verify payment status shows as "Completed" or "Approved"</li>
            <li>• Keep personal information (full card numbers, PIN) private</li>
            <li>• Only include last 4 digits of account/card numbers</li>
            <li>• Save a copy for your records</li>
          </ul>
        </CardContent>
      </Card>

      {/* Close Button */}
      {onClose && (
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}

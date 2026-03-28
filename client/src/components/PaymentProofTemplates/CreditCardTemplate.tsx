import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface CreditCardTemplateProps {
  orderId?: number;
  orderAmount?: number;
  customerName?: string;
  onSubmit?: (data: CreditCardProofData) => void;
}

export interface CreditCardProofData {
  orderNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentTime: string;
  cardholderName: string;
  cardLastFourDigits: string;
  cardType: string;
  authorizationCode: string;
  transactionId: string;
  merchantName: string;
  merchantReference: string;
  paymentStatus: string;
  receiptNumber: string;
  notes: string;
}

export function CreditCardTemplate({ orderId, orderAmount, customerName, onSubmit }: CreditCardTemplateProps) {
  const [formData, setFormData] = useState<CreditCardProofData>({
    orderNumber: orderId?.toString() || "",
    paymentAmount: orderAmount?.toString() || "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentTime: new Date().toTimeString().slice(0, 5),
    cardholderName: customerName || "",
    cardLastFourDigits: "",
    cardType: "Visa",
    authorizationCode: "",
    transactionId: "",
    merchantName: "Print Cartel",
    merchantReference: "",
    paymentStatus: "Approved",
    receiptNumber: "",
    notes: "",
  });

  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const handleInputChange = (field: keyof CreditCardProofData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      setCompletedFields((prev) => new Set([...prev, field]));
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  const handleDownload = () => {
    const element = document.getElementById("cc-template-content");
    if (!element) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Proof - Credit Card</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
          .header h1 { color: #7c3aed; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { background: #faf5ff; border-left: 4px solid #7c3aed; padding: 12px 15px; font-weight: 600; color: #5b21b6; margin-bottom: 15px; }
          .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .field-group.full { grid-template-columns: 1fr; }
          .field { display: flex; flex-direction: column; }
          .field label { font-weight: 600; color: #5b21b6; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .field input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; }
          .field input:disabled { background: #f8fafc; color: #666; }
          .receipt-box { background: #faf5ff; border: 2px dashed #7c3aed; border-radius: 8px; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 13px; }
          .receipt-line { display: flex; justify-content: space-between; padding: 5px 0; }
          .verification { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; padding: 20px; margin-top: 20px; }
          .verification-title { color: #166534; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; }
          .verification-title svg { width: 20px; height: 20px; margin-right: 8px; }
          .verification ul { margin-left: 20px; color: #166534; font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { margin: 0; padding: 0; }
            .container { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Credit Card Payment Receipt</h1>
            <p>Payment Transaction Proof</p>
          </div>

          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="field-group">
              <div class="field">
                <label>Order Number</label>
                <input type="text" value="${formData.orderNumber}" disabled />
              </div>
              <div class="field">
                <label>Payment Amount (ZAR)</label>
                <input type="text" value="R ${parseFloat(formData.paymentAmount).toFixed(2)}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="field-group">
              <div class="field">
                <label>Payment Date</label>
                <input type="text" value="${formData.paymentDate}" disabled />
              </div>
              <div class="field">
                <label>Payment Time</label>
                <input type="text" value="${formData.paymentTime}" disabled />
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Authorization Code</label>
                <input type="text" value="${formData.authorizationCode}" disabled />
              </div>
              <div class="field">
                <label>Transaction ID</label>
                <input type="text" value="${formData.transactionId}" disabled />
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Receipt Number</label>
                <input type="text" value="${formData.receiptNumber}" disabled />
              </div>
              <div class="field">
                <label>Payment Status</label>
                <input type="text" value="${formData.paymentStatus}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Card Information</div>
            <div class="field-group">
              <div class="field">
                <label>Cardholder Name</label>
                <input type="text" value="${formData.cardholderName}" disabled />
              </div>
              <div class="field">
                <label>Card Type</label>
                <input type="text" value="${formData.cardType}" disabled />
              </div>
            </div>
            <div class="field-group full">
              <div class="field">
                <label>Card Number (Last 4 Digits)</label>
                <input type="text" value="****${formData.cardLastFourDigits}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Merchant Information</div>
            <div class="field-group">
              <div class="field">
                <label>Merchant Name</label>
                <input type="text" value="${formData.merchantName}" disabled />
              </div>
              <div class="field">
                <label>Merchant Reference</label>
                <input type="text" value="${formData.merchantReference}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Additional Notes</div>
            <div class="field-group full">
              <div class="field">
                <label>Any Additional Information</label>
                <input type="text" value="${formData.notes}" disabled />
              </div>
            </div>
          </div>

          <div class="verification">
            <div class="verification-title">✓ Verification Checklist</div>
            <ul>
              <li>Ensure all transaction details match your credit card statement</li>
              <li>Verify the payment amount matches your order total</li>
              <li>Include the authorization and transaction codes for reference</li>
              <li>Confirm the payment status shows as "Approved" or "Successful"</li>
              <li>Include the receipt number from your transaction</li>
              <li>Print or save this document as PDF for your records</li>
            </ul>
          </div>

          <div class="footer">
            <p>Print Cartel - Payment Receipt</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Please keep this document for your records</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Credit-Card-Payment-Receipt-${formData.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Payment receipt template downloaded!");
  };

  const allFieldsFilled = completedFields.size >= 8;

  return (
    <div className="space-y-6">
      <div id="cc-template-content" className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-purple-600 pb-4">
          <h2 className="text-2xl font-bold text-purple-600">💳 Credit Card Payment Receipt</h2>
          <p className="text-gray-600 text-sm mt-1">Payment Transaction Proof</p>
        </div>

        {/* Order Information */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-sm font-semibold text-purple-900">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Order Number</label>
                <Input
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange("orderNumber", e.target.value)}
                  placeholder="e.g., ORD-2026-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Payment Amount (ZAR)</label>
                <Input
                  value={formData.paymentAmount}
                  onChange={(e) => handleInputChange("paymentAmount", e.target.value)}
                  placeholder="e.g., 5000.00"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-sm font-semibold text-purple-900">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Payment Date</label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Payment Time</label>
                <Input
                  type="time"
                  value={formData.paymentTime}
                  onChange={(e) => handleInputChange("paymentTime", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Authorization Code</label>
                <Input
                  value={formData.authorizationCode}
                  onChange={(e) => handleInputChange("authorizationCode", e.target.value)}
                  placeholder="e.g., AUTH123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Transaction ID</label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange("transactionId", e.target.value)}
                  placeholder="e.g., TXN987654321"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Receipt Number</label>
                <Input
                  value={formData.receiptNumber}
                  onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
                  placeholder="e.g., RCP-2026-12345"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Payment Status</label>
                <Input
                  value={formData.paymentStatus}
                  onChange={(e) => handleInputChange("paymentStatus", e.target.value)}
                  placeholder="e.g., Approved, Successful"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Information */}
        <Card>
          <CardHeader className="bg-indigo-50">
            <CardTitle className="text-sm font-semibold text-indigo-900">Card Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Cardholder Name</label>
                <Input
                  value={formData.cardholderName}
                  onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Card Type</label>
                <Input
                  value={formData.cardType}
                  onChange={(e) => handleInputChange("cardType", e.target.value)}
                  placeholder="e.g., Visa, Mastercard, Amex"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Card Number (Last 4 Digits Only)</label>
              <Input
                value={formData.cardLastFourDigits}
                onChange={(e) => handleInputChange("cardLastFourDigits", e.target.value)}
                placeholder="e.g., 1234"
                maxLength={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Merchant Information */}
        <Card>
          <CardHeader className="bg-pink-50">
            <CardTitle className="text-sm font-semibold text-pink-900">Merchant Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Merchant Name</label>
                <Input
                  value={formData.merchantName}
                  onChange={(e) => handleInputChange("merchantName", e.target.value)}
                  placeholder="Print Cartel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Merchant Reference</label>
                <Input
                  value={formData.merchantReference}
                  onChange={(e) => handleInputChange("merchantReference", e.target.value)}
                  placeholder="Merchant reference number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader className="bg-amber-50">
            <CardTitle className="text-sm font-semibold text-amber-900">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Any Additional Information</label>
              <Input
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add any additional details..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Checklist */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-3">Verification Checklist</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>✓ Ensure all transaction details match your credit card statement</li>
                  <li>✓ Verify the payment amount matches your order total</li>
                  <li>✓ Include the authorization and transaction codes for reference</li>
                  <li>✓ Confirm the payment status shows as "Approved" or "Successful"</li>
                  <li>✓ Include the receipt number from your transaction</li>
                  <li>✓ Print or save this document as PDF for your records</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        <Button
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download as HTML
        </Button>
        {allFieldsFilled && (
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => {
              if (onSubmit) onSubmit(formData);
              toast.success("Payment receipt ready to upload!");
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Ready to Upload
          </Button>
        )}
      </div>
    </div>
  );
}

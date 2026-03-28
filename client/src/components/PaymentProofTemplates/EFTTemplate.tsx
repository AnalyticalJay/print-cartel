import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface EFTTemplateProps {
  orderId?: number;
  orderAmount?: number;
  customerName?: string;
  onSubmit?: (data: EFTProofData) => void;
}

export interface EFTProofData {
  orderNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentTime: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  referenceNumber: string;
  receiverBankName: string;
  receiverAccountName: string;
  receiverAccountNumber: string;
  transactionStatus: string;
  notes: string;
}

export function EFTTemplate({ orderId, orderAmount, customerName, onSubmit }: EFTTemplateProps) {
  const [formData, setFormData] = useState<EFTProofData>({
    orderNumber: orderId?.toString() || "",
    paymentAmount: orderAmount?.toString() || "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentTime: new Date().toTimeString().slice(0, 5),
    bankName: "",
    accountHolderName: customerName || "",
    accountNumber: "",
    referenceNumber: "",
    receiverBankName: "Print Cartel",
    receiverAccountName: "",
    receiverAccountNumber: "",
    transactionStatus: "Completed",
    notes: "",
  });

  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  const handleInputChange = (field: keyof EFTProofData, value: string) => {
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
    const element = document.getElementById("eft-template-content");
    if (!element) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Proof - EFT Transfer</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0891b2; padding-bottom: 20px; }
          .header h1 { color: #0891b2; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { background: #f0f9ff; border-left: 4px solid #0891b2; padding: 12px 15px; font-weight: 600; color: #0c4a6e; margin-bottom: 15px; }
          .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .field-group.full { grid-template-columns: 1fr; }
          .field { display: flex; flex-direction: column; }
          .field label { font-weight: 600; color: #0c4a6e; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .field input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; }
          .field input:disabled { background: #f8fafc; color: #666; }
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
            <h1>💳 EFT Payment Proof</h1>
            <p>Electronic Funds Transfer Documentation</p>
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
            <div class="section-title">Payment Details</div>
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
                <label>Reference/Transaction Number</label>
                <input type="text" value="${formData.referenceNumber}" disabled />
              </div>
              <div class="field">
                <label>Transaction Status</label>
                <input type="text" value="${formData.transactionStatus}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Sender Information (Your Bank)</div>
            <div class="field-group">
              <div class="field">
                <label>Your Bank Name</label>
                <input type="text" value="${formData.bankName}" disabled />
              </div>
              <div class="field">
                <label>Account Holder Name</label>
                <input type="text" value="${formData.accountHolderName}" disabled />
              </div>
            </div>
            <div class="field-group full">
              <div class="field">
                <label>Your Account Number (Last 4 digits)</label>
                <input type="text" value="${formData.accountNumber}" disabled />
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Receiver Information (Print Cartel)</div>
            <div class="field-group">
              <div class="field">
                <label>Receiver Bank</label>
                <input type="text" value="${formData.receiverBankName}" disabled />
              </div>
              <div class="field">
                <label>Account Name</label>
                <input type="text" value="${formData.receiverAccountName}" disabled />
              </div>
            </div>
            <div class="field-group full">
              <div class="field">
                <label>Account Number</label>
                <input type="text" value="${formData.receiverAccountNumber}" disabled />
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
              <li>Ensure all fields are accurately filled with information from your bank statement</li>
              <li>Verify the payment amount matches your order total</li>
              <li>Include the transaction/reference number for tracking</li>
              <li>Confirm the payment status shows as "Completed" or "Successful"</li>
              <li>Print or save this document as PDF for your records</li>
            </ul>
          </div>

          <div class="footer">
            <p>Print Cartel - Payment Proof Document</p>
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
    a.download = `EFT-Payment-Proof-${formData.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Payment proof template downloaded!");
  };

  const allFieldsFilled = completedFields.size >= 8;

  return (
    <div className="space-y-6">
      <div id="eft-template-content" className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-cyan-600 pb-4">
          <h2 className="text-2xl font-bold text-cyan-600">💳 EFT Payment Proof</h2>
          <p className="text-gray-600 text-sm mt-1">Electronic Funds Transfer Documentation</p>
        </div>

        {/* Order Information */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-sm font-semibold text-blue-900">Order Information</CardTitle>
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

        {/* Payment Details */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-sm font-semibold text-blue-900">Payment Details</CardTitle>
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
                <label className="text-xs font-semibold text-gray-700 uppercase">Reference/Transaction Number</label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                  placeholder="e.g., TXN123456789"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Transaction Status</label>
                <Input
                  value={formData.transactionStatus}
                  onChange={(e) => handleInputChange("transactionStatus", e.target.value)}
                  placeholder="e.g., Completed, Successful"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sender Information */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-sm font-semibold text-green-900">Sender Information (Your Bank)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Your Bank Name</label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  placeholder="e.g., FNB, Nedbank, ABSA"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Account Holder Name</label>
                <Input
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Your Account Number (Last 4 Digits)</label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                placeholder="e.g., ****1234"
                maxLength={8}
              />
            </div>
          </CardContent>
        </Card>

        {/* Receiver Information */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-sm font-semibold text-purple-900">Receiver Information (Print Cartel)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Receiver Bank</label>
                <Input
                  value={formData.receiverBankName}
                  onChange={(e) => handleInputChange("receiverBankName", e.target.value)}
                  placeholder="Print Cartel's bank"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">Account Name</label>
                <Input
                  value={formData.receiverAccountName}
                  onChange={(e) => handleInputChange("receiverAccountName", e.target.value)}
                  placeholder="Print Cartel account name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Account Number</label>
              <Input
                value={formData.receiverAccountNumber}
                onChange={(e) => handleInputChange("receiverAccountNumber", e.target.value)}
                placeholder="Print Cartel account number"
              />
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
                  <li>✓ Ensure all fields are accurately filled with information from your bank statement</li>
                  <li>✓ Verify the payment amount matches your order total</li>
                  <li>✓ Include the transaction/reference number for tracking</li>
                  <li>✓ Confirm the payment status shows as "Completed" or "Successful"</li>
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
          Print Template
        </Button>
        <Button
          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
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
              toast.success("Payment proof ready to upload!");
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

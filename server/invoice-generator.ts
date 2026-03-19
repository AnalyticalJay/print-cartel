import { jsPDF } from "jspdf";
import { getOrderById } from "./db";
import { storagePut } from "./storage";

export interface InvoiceData {
  orderId: number;
  invoiceNumber: string;
  totalPrice: number;
  depositAmount?: number;
  paymentMethod?: string;
}

/**
 * Generate PDF invoice and upload to S3
 */
export async function generateAndUploadInvoice(invoiceData: InvoiceData): Promise<string> {
  try {
    const order = await getOrderById(invoiceData.orderId);
    if (!order) {
      throw new Error(`Order ${invoiceData.orderId} not found`);
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("INVOICE", margin, margin + 10);

    // Invoice details
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, margin, margin + 25);
    doc.text(`Order ID: #${invoiceData.orderId}`, margin, margin + 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 39);

    // Company info
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Print Cartel", margin, margin + 55);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text("Custom DTF Printing", margin, margin + 61);
    doc.text("Email: info@printcartel.co.za", margin, margin + 67);
    doc.text("Phone: +27 (0) 123 456 7890", margin, margin + 73);

    // Bill to
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Bill To:", margin, margin + 90);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`${order.customerFirstName} ${order.customerLastName}`, margin, margin + 97);
    if (order.customerCompany) {
      doc.text(order.customerCompany, margin, margin + 103);
    }
    doc.text(order.customerEmail, margin, margin + 109);
    doc.text(order.customerPhone, margin, margin + 115);

    // Line items table
    let yPosition = margin + 135;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Description", margin, yPosition);
    doc.text("Quantity", margin + contentWidth * 0.5, yPosition);
    doc.text("Unit Price", margin + contentWidth * 0.7, yPosition);
    doc.text("Total", margin + contentWidth * 0.85, yPosition);

    yPosition += 8;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    // Order item
    const unitPrice = invoiceData.totalPrice / order.quantity;
    doc.text("Custom DTF Print Order", margin, yPosition);
    doc.text(order.quantity.toString(), margin + contentWidth * 0.5, yPosition);
    doc.text(`R${unitPrice.toFixed(2)}`, margin + contentWidth * 0.7, yPosition);
    doc.text(`R${invoiceData.totalPrice.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);

    yPosition += 10;

    // Delivery charge if applicable
    const delivery = order.deliveryCharge ? parseFloat(order.deliveryCharge) : 0;
    if (delivery > 0) {
      doc.text("Delivery Charge", margin, yPosition);
      doc.text("", margin + contentWidth * 0.5, yPosition);
      doc.text("", margin + contentWidth * 0.7, yPosition);
      doc.text(`R${delivery.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
      yPosition += 8;
    }

    // Totals section
    yPosition += 5;
    doc.setFont(undefined, "bold");
    const total = invoiceData.totalPrice + delivery;

    doc.text("Subtotal:", margin + contentWidth * 0.6, yPosition);
    doc.text(`R${invoiceData.totalPrice.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);

    if (delivery > 0) {
      yPosition += 7;
      doc.text("Delivery:", margin + contentWidth * 0.6, yPosition);
      doc.text(`R${delivery.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);
    }

    yPosition += 7;
    doc.setFontSize(11);
    doc.text("TOTAL:", margin + contentWidth * 0.6, yPosition);
    doc.text(`R${total.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);

    // Payment info
    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Payment Terms:", margin, yPosition);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    yPosition += 7;

    if (invoiceData.paymentMethod === "deposit" && invoiceData.depositAmount) {
      doc.text(`Deposit Required: R${invoiceData.depositAmount.toFixed(2)}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Final Payment: R${(total - invoiceData.depositAmount).toFixed(2)}`, margin, yPosition);
    } else {
      doc.text(`Full Payment Required: R${total.toFixed(2)}`, margin, yPosition);
    }

    yPosition += 15;
    doc.setFontSize(8);
    doc.text(
      "Please review this invoice carefully. If you have any questions, contact us at info@printcartel.co.za",
      margin,
      yPosition,
      { maxWidth: contentWidth }
    );

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Upload to S3
    const fileKey = `invoices/invoice-${invoiceData.orderId}-${Date.now()}.pdf`;
    const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

    return url;
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    throw error;
  }
}

/**
 * Generate invoice HTML email content
 */
export function generateInvoiceEmailHTML(
  orderId: number,
  customerName: string,
  totalPrice: number,
  depositAmount?: number,
  paymentMethod?: string
): string {
  const delivery = 0; // You can fetch this from order if needed
  const total = totalPrice + delivery;

  let paymentTermsHtml = "";
  if (paymentMethod === "deposit" && depositAmount) {
    paymentTermsHtml = `
      <p><strong>Payment Terms:</strong></p>
      <ul>
        <li>Deposit Required: <strong>R${depositAmount.toFixed(2)}</strong></li>
        <li>Final Payment: <strong>R${(total - depositAmount).toFixed(2)}</strong></li>
      </ul>
    `;
  } else {
    paymentTermsHtml = `
      <p><strong>Payment Terms:</strong></p>
      <p>Full Payment Required: <strong>R${total.toFixed(2)}</strong></p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; }
        .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .order-details p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
        table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .actions { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        .btn-primary { background: #00d4ff; color: black; }
        .btn-secondary { background: #999; color: white; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Invoice is Ready</h1>
          <p>Order #${orderId}</p>
        </div>

        <p>Hi ${customerName},</p>
        
        <p>Your custom DTF print order quote has been prepared. Please review the invoice details below and take action to proceed with your order.</p>

        <div class="highlight">
          <strong>⚠️ Action Required:</strong> Please review this invoice and accept or decline it from your account dashboard. You can also download the PDF attachment for your records.
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Custom DTF Print Order</td>
              <td>-</td>
              <td>-</td>
              <td>R${totalPrice.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">TOTAL:</td>
              <td>R${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${paymentTermsHtml}

        <div class="actions">
          <a href="https://printcartel.co.za/dashboard?orderId=${orderId}&action=invoice" class="btn btn-primary">View Invoice in Dashboard</a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Log in to your account to accept or decline this invoice: <a href="https://printcartel.co.za/dashboard">Print Cartel Dashboard</a>
        </p>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For inquiries, contact us at info@printcartel.co.za</p>
          <p>© Print Cartel - Custom DTF Printing Made Simple</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

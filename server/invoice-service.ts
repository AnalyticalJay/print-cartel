import { jsPDF } from "jspdf";
import { getOrderById } from "./db";

export async function generateInvoicePDF(orderId: number): Promise<Buffer> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Header
  doc.setFontSize(24);
  doc.text("INVOICE", margin, margin + 10);

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.invoiceNumber || `INV-${orderId}`}`, margin, margin + 25);
  doc.text(`Date: ${new Date(order.invoiceDate || new Date()).toLocaleDateString()}`, margin, margin + 32);
  doc.text(`Order ID: #${orderId}`, margin, margin + 39);

  // Company info
  doc.setFontSize(11);
  doc.text("Print Cartel", margin, margin + 55);
  doc.setFontSize(9);
  doc.text("Custom DTF Printing", margin, margin + 61);
  doc.text("Email: info@printcartel.co.za", margin, margin + 67);

  // Bill to
  doc.setFontSize(11);
  doc.text("Bill To:", margin, margin + 85);
  doc.setFontSize(10);
  doc.text(`${order.customerFirstName} ${order.customerLastName}`, margin, margin + 92);
  if (order.customerCompany) {
    doc.text(order.customerCompany, margin, margin + 98);
  }
  doc.text(order.customerEmail, margin, margin + 104);
  doc.text(order.customerPhone, margin, margin + 110);

  // Line items table
  let yPosition = margin + 130;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", margin, yPosition);
  doc.text("Quantity", margin + contentWidth * 0.5, yPosition);
  doc.text("Unit Price", margin + contentWidth * 0.7, yPosition);
  doc.text("Total", margin + contentWidth * 0.85, yPosition);

  yPosition += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Order item
  const unitPrice = parseFloat(order.totalPriceEstimate) / order.quantity;
  doc.text("Custom DTF Print Order", margin, yPosition);
  doc.text(order.quantity.toString(), margin + contentWidth * 0.5, yPosition);
  doc.text(`R${unitPrice.toFixed(2)}`, margin + contentWidth * 0.7, yPosition);
  doc.text(`R${order.totalPriceEstimate}`, margin + contentWidth * 0.85, yPosition);

  yPosition += 10;

  // Delivery charge if applicable
  if (order.deliveryCharge && parseFloat(order.deliveryCharge) > 0) {
    doc.text("Delivery Charge", margin, yPosition);
    doc.text("", margin + contentWidth * 0.5, yPosition);
    doc.text("", margin + contentWidth * 0.7, yPosition);
    doc.text(`R${order.deliveryCharge}`, margin + contentWidth * 0.85, yPosition);
    yPosition += 8;
  }

  // Totals section
  yPosition += 5;
  doc.setFont("helvetica", "bold");
  const subtotal = parseFloat(order.totalPriceEstimate);
  const delivery = order.deliveryCharge ? parseFloat(order.deliveryCharge) : 0;
  const total = subtotal + delivery;

  doc.text("Subtotal:", margin + contentWidth * 0.6, yPosition);
  doc.text(`R${subtotal.toFixed(2)}`, margin + contentWidth * 0.85, yPosition);

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
  doc.setFont("helvetica", "bold");
  doc.text("Payment Terms:", margin, yPosition);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  yPosition += 7;

  if (order.paymentMethod === "deposit") {
    const depositAmount = order.depositAmount ? parseFloat(order.depositAmount) : total * 0.5;
    doc.text(`Deposit Required: R${depositAmount.toFixed(2)}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Final Payment: R${(total - depositAmount).toFixed(2)}`, margin, yPosition);
  } else {
    doc.text(`Full Payment Required: R${total.toFixed(2)}`, margin, yPosition);
  }

  yPosition += 15;
  doc.setFontSize(9);
  doc.text("Please review this invoice carefully. If you have any questions, contact us at info@printcartel.co.za", margin, yPosition, {
    maxWidth: contentWidth,
  });

  // Footer
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.text("Thank you for your business!", margin, yPosition);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPosition + 5);

  return Buffer.from(doc.output("arraybuffer"));
}

export async function getInvoiceEmailContent(orderId: number): Promise<{ subject: string; html: string }> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const subtotal = parseFloat(order.totalPriceEstimate);
  const delivery = order.deliveryCharge ? parseFloat(order.deliveryCharge) : 0;
  const total = subtotal + delivery;

  let paymentTermsHtml = "";
  if (order.paymentMethod === "deposit") {
    const depositAmount = order.depositAmount ? parseFloat(order.depositAmount) : total * 0.5;
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00d4ff; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; }
        .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .order-details p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        table td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .actions { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        .btn-accept { background: #00d4ff; color: black; }
        .btn-decline { background: #999; color: white; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Invoice is Ready</h1>
          <p>Order #${orderId}</p>
        </div>

        <p>Hi ${order.customerFirstName},</p>
        
        <p>Your custom DTF print order quote has been prepared. Please review the details below and accept or decline the invoice.</p>

        <div class="order-details">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> #${orderId}</p>
          <p><strong>Customer:</strong> ${order.customerFirstName} ${order.customerLastName}</p>
          ${order.customerCompany ? `<p><strong>Company:</strong> ${order.customerCompany}</p>` : ""}
          <p><strong>Quantity:</strong> ${order.quantity} units</p>
          <p><strong>Delivery Method:</strong> ${order.deliveryMethod === "collection" ? "Collection" : "Delivery"}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Custom DTF Print Order</td>
              <td>${order.quantity}</td>
              <td>R${(subtotal / order.quantity).toFixed(2)}</td>
              <td>R${subtotal.toFixed(2)}</td>
            </tr>
            ${
              delivery > 0
                ? `
              <tr>
                <td>Delivery Charge</td>
                <td>-</td>
                <td>-</td>
                <td>R${delivery.toFixed(2)}</td>
              </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td colspan="3">TOTAL:</td>
              <td>R${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${paymentTermsHtml}

        <div class="actions">
          <a href="https://printcartel.co.za/dashboard?orderId=${orderId}&action=accept-invoice" class="btn btn-accept">Accept Invoice</a>
          <a href="https://printcartel.co.za/dashboard?orderId=${orderId}&action=decline-invoice" class="btn btn-decline">Decline Invoice</a>
        </div>

        <p style="color: #999; font-size: 12px;">
          Or log in to your account to manage your invoice: <a href="https://printcartel.co.za/dashboard">View Dashboard</a>
        </p>

        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For inquiries, contact us at info@printcartel.co.za</p>
          <p>© Print Cartel - Custom DTF Printing</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `Invoice Ready - Order #${orderId} - Print Cartel`,
    html,
  };
}

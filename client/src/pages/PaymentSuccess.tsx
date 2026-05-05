import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  Package,
  Download,
  Home,
  Mail,
  AlertCircle,
  Loader2,
  Printer,
  Truck,
  ShirtIcon,
} from "lucide-react";

/**
 * Payment Success Confirmation Page
 *
 * Displayed after PayFast redirects to /payment/success.
 * PayFast appends m_payment_id=order-{orderId} to the return URL.
 * We use the public `orders.getByPaymentId` procedure so the page works
 * even if the user's session cookie hasn't fully re-established yet.
 */
export function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [mPaymentId, setMPaymentId] = useState<string | null>(null);
  const [paramsParsed, setParamsParsed] = useState(false);

  // Parse m_payment_id from URL query string on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // PayFast sends m_payment_id; legacy pages may use orderId directly
    const pfId = params.get("m_payment_id");
    const legacyId = params.get("orderId");

    if (pfId) {
      setMPaymentId(pfId);
    } else if (legacyId) {
      // Support legacy redirect format: ?orderId=123
      setMPaymentId(`order-${legacyId}`);
    } else {
      setMPaymentId(null);
    }
    setParamsParsed(true);
  }, []);

  const { data, isLoading, error } = trpc.orders.getByPaymentId.useQuery(
    { mPaymentId: mPaymentId! },
    { enabled: !!mPaymentId && paramsParsed }
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!paramsParsed || (mPaymentId && isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
            <p className="text-muted-foreground font-medium">Loading your order confirmation…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── No payment ID in URL ─────────────────────────────────────────────────
  if (!mPaymentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Payment Reference Missing</h3>
                <p className="text-sm text-red-700 mb-6">
                  We couldn't find a payment reference in the URL. Please check your confirmation
                  email for your order details, or contact support.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  My Orders
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error fetching order ─────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Order Not Found</h3>
                <p className="text-sm text-red-700 mb-6">
                  We couldn't load your order details right now. Your payment was likely processed
                  successfully — please check your email for a confirmation, or contact support.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  My Orders
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, product, color, size, prints } = data;

  const estimatedProductionDays = 3;
  const estimatedDeliveryDays = order.deliveryMethod === "delivery" ? 7 : 3;
  const productionReadyDate = new Date();
  productionReadyDate.setDate(productionReadyDate.getDate() + estimatedProductionDays);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDeliveryDays);

  const isPaid = order.paymentStatus === "paid";
  const amountPaid = order.amountPaid ?? 0;
  const totalAmount = order.totalPriceEstimate;

  // ── Success Page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Hero: Animated Checkmark ── */}
        <div className="text-center py-6">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute h-24 w-24 rounded-full bg-green-100 animate-ping opacity-30" />
            <div className="relative h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Thank you for your order. A confirmation email has been sent to{" "}
            <span className="font-medium text-gray-700">{order.customerEmail}</span>.
          </p>
        </div>

        {/* ── Order Confirmation Card ── */}
        <Card className="border-green-200 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-xl">Order #{order.id}</CardTitle>
                <p className="text-green-100 text-sm mt-0.5">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <Badge className="bg-white text-green-700 hover:bg-green-50 font-semibold px-3 py-1">
                {isPaid ? "PAID IN FULL" : "PAYMENT RECEIVED"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Customer + Payment summary */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                  Customer Details
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">
                      {order.customerFirstName} {order.customerLastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900 truncate max-w-[180px]">
                      {order.customerEmail}
                    </span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-900">{order.customerPhone}</span>
                    </div>
                  )}
                  {order.customerCompany && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Company</span>
                      <span className="font-medium text-gray-900">{order.customerCompany}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                  Payment Summary
                </h3>
                <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Total</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">{formatCurrency(order.deliveryCharge)}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-base font-bold text-green-700">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(amountPaid > 0 ? amountPaid : totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment Method</span>
                    <span className="font-medium">PayFast</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <ShirtIcon className="h-4 w-4" />
                Order Items
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex items-start gap-4">
                  {/* Colour swatch */}
                  {color?.colorHex && (
                    <div
                      className="h-12 w-12 rounded-lg border border-gray-200 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  )}
                  <div className="flex-1 space-y-1.5">
                    <p className="font-semibold text-gray-900">
                      {product?.name ?? "Custom Garment"}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                      {color && (
                        <span>
                          Colour:{" "}
                          <span className="font-medium text-gray-800">{color.colorName}</span>
                        </span>
                      )}
                      {size && (
                        <span>
                          Size:{" "}
                          <span className="font-medium text-gray-800">{size.sizeName}</span>
                        </span>
                      )}
                      <span>
                        Qty:{" "}
                        <span className="font-medium text-gray-800">{order.quantity} units</span>
                      </span>
                      {product?.fabricType && (
                        <span>
                          Fabric:{" "}
                          <span className="font-medium text-gray-800">{product.fabricType}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prints / Placements */}
                {prints && prints.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Printer className="h-3 w-3" />
                        Print Placements
                      </p>
                      {prints.map((print, idx) => (
                        <div
                          key={print.id ?? idx}
                          className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-100"
                        >
                          <div>
                            <span className="font-medium text-gray-800">{print.placementName}</span>
                            <span className="text-gray-500 ml-2">— {print.printSize}</span>
                          </div>
                          {print.uploadedFilePath ? (
                            <a
                              href={print.uploadedFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              {print.uploadedFileName ?? "Download"}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No file uploaded</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Delivery / Collection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {order.deliveryMethod === "delivery" ? "Delivery" : "Collection"} Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
                {order.deliveryMethod === "delivery" ? (
                  <>
                    {order.deliveryAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Address</span>
                        <span className="font-medium text-gray-900 text-right max-w-[220px]">
                          {order.deliveryAddress}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Delivery</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(deliveryDate)} ({estimatedDeliveryDays} business days)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ready for Collection</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(productionReadyDate)} (approx.)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
              {order.invoiceUrl && (
                <Button
                  onClick={() => window.open(order.invoiceUrl!, "_blank")}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              )}
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="flex-1 text-gray-600"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Production Timeline ── */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-gray-50 py-4 px-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-blue-600" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ol className="space-y-0">
              {[
                {
                  icon: "📧",
                  title: "Confirmation Email",
                  desc: "A payment receipt and order summary have been sent to your email address.",
                  eta: "Now",
                  done: true,
                },
                {
                  icon: "🔍",
                  title: "Design Review",
                  desc: "Our team checks your uploaded artwork for print quality and sizing.",
                  eta: "Within 1–2 hours",
                  done: false,
                },
                {
                  icon: "🖨️",
                  title: "DTF Printing",
                  desc: "Your design is printed using our Direct-to-Film process for vibrant, durable results.",
                  eta: "1–2 business days",
                  done: false,
                },
                {
                  icon: "✅",
                  title: "Quality Check & Packaging",
                  desc: "Each garment is inspected for colour accuracy and carefully packaged.",
                  eta: "Same day as printing",
                  done: false,
                },
                {
                  icon: order.deliveryMethod === "delivery" ? "🚚" : "📦",
                  title: order.deliveryMethod === "delivery" ? "Courier Dispatch" : "Ready for Collection",
                  desc:
                    order.deliveryMethod === "delivery"
                      ? "Your order is handed to our courier partner. You'll receive a tracking number by email."
                      : "You'll receive an SMS/email when your order is ready to collect.",
                  eta:
                    order.deliveryMethod === "delivery"
                      ? `${estimatedDeliveryDays} business days total`
                      : `${estimatedProductionDays} business days`,
                  done: false,
                },
              ].map((step, i, arr) => (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-full text-lg flex-shrink-0 ${
                        step.done
                          ? "bg-green-100 ring-2 ring-green-400"
                          : "bg-blue-50 ring-1 ring-blue-200"
                      }`}
                    >
                      {step.icon}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-0.5 h-10 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{step.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${
                          step.done
                            ? "border-green-300 text-green-700 bg-green-50"
                            : "border-blue-200 text-blue-600 bg-blue-50"
                        }`}
                      >
                        {step.eta}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* ── Support ── */}
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardContent className="py-5 px-6">
            <div className="flex gap-4 items-start">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Questions about your order? Our team is ready to help — just reply to your
                  confirmation email or reach out below.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 hover:bg-blue-100 text-blue-700"
                    onClick={() => window.open("mailto:hello@printcartel.co.za", "_blank")}
                  >
                    Email Support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 hover:bg-blue-100 text-blue-700"
                    onClick={() => navigate("/dashboard")}
                  >
                    <Package className="h-3.5 w-3.5 mr-1.5" />
                    Track Order
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

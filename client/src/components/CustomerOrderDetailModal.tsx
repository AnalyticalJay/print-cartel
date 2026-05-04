import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X, Download, ExternalLink, CheckCircle, AlertCircle, Clock, Loader2,
  CreditCard, Package, Truck, Star, FileText, ChevronLeft, ChevronRight,
  Image as ImageIcon, AlertTriangle, Banknote,
} from "lucide-react";

interface CustomerOrderDetailModalProps {
  orderId: number;
  onClose: () => void;
}

// ─── Status timeline definition ───────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: "pending",       label: "Submitted",     icon: Clock },
  { key: "quoted",        label: "Quoted",        icon: FileText },
  { key: "approved",      label: "Approved",      icon: CheckCircle },
  { key: "payment",       label: "Payment",       icon: CreditCard },
  { key: "in-production", label: "In Production", icon: Package },
  { key: "shipped",       label: "Shipped",       icon: Truck },
  { key: "completed",     label: "Completed",     icon: Star },
];

function getTimelineIndex(status: string, paymentStatus: string): number {
  if (status === "completed") return 6;
  if (status === "shipped") return 5;
  if (status === "in-production") return 4;
  if (paymentStatus === "paid" || paymentStatus === "deposit_paid") return 3;
  if (status === "approved") return 2;
  if (status === "quoted") return 1;
  return 0;
}

// ─── Approval badge helper ─────────────────────────────────────────────────────
function ApprovalBadge({ status, notes }: { status: string; notes?: string | null }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-700">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  }
  if (status === "changes_requested") {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-700">
          <AlertCircle className="w-3 h-3" /> Changes Requested
        </span>
        {notes && (
          <p className="text-xs text-amber-300 bg-amber-900/20 border border-amber-800 rounded p-2 mt-1">
            <strong>Admin note:</strong> {notes}
          </p>
        )}
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600">
      <Clock className="w-3 h-3" /> Pending Review
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function CustomerOrderDetailModal({ orderId, onClose }: CustomerOrderDetailModalProps) {
  const orderQuery = trpc.orders.getMyOrderDetail.useQuery({ orderId });
  const initiatePaymentMutation = trpc.payment.initiatePayFastPayment.useMutation();
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const order = orderQuery.data;

  // Check scroll state for timeline
  const checkScroll = () => {
    const el = timelineRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [order]);

  // Scroll active step into view on load
  useEffect(() => {
    if (!order || !timelineRef.current) return;
    const activeIdx = getTimelineIndex(order.status, order.paymentStatus || "unpaid");
    const el = timelineRef.current;
    const stepWidth = el.scrollWidth / TIMELINE_STEPS.length;
    const targetScroll = Math.max(0, stepWidth * activeIdx - el.clientWidth / 2 + stepWidth / 2);
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  }, [order]);

  const scrollTimeline = (dir: "left" | "right") => {
    const el = timelineRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  const handlePayNow = async () => {
    if (!order) return;
    setIsInitiatingPayment(true);
    try {
      const amountDue = order.totalPriceEstimate - (order.amountPaid || 0);
      const origin = window.location.origin;
      const result = await initiatePaymentMutation.mutateAsync({
        orderId: order.id,
        amount: amountDue,
        returnUrl: `${origin}/payment/success?m_payment_id=order-${order.id}`,
        cancelUrl: `${origin}/account`,
        notifyUrl: `${origin}/api/payfast/notify`,
      });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error("Could not initiate payment. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Payment initiation failed");
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const formatCurrency = (v: number) => `R${v.toFixed(2)}`;
  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  const statusLabels: Record<string, string> = {
    pending: "Pending Review",
    quoted: "Quote Sent",
    approved: "Approved",
    "in-production": "In Production",
    completed: "Completed",
    shipped: "Shipped",
    cancelled: "Cancelled",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-600",
    quoted: "bg-blue-500/20 text-blue-400 border-blue-600",
    approved: "bg-purple-500/20 text-purple-400 border-purple-600",
    "in-production": "bg-orange-500/20 text-orange-400 border-orange-600",
    completed: "bg-green-500/20 text-green-400 border-green-600",
    shipped: "bg-green-500/20 text-green-400 border-green-600",
    cancelled: "bg-red-500/20 text-red-400 border-red-600",
  };

  // Determine if Pay Now should be shown
  const showPayNow = order &&
    ["quoted", "approved"].includes(order.status) &&
    order.paymentStatus !== "paid" &&
    order.totalPriceEstimate > 0;

  const amountDue = order ? Math.max(0, order.totalPriceEstimate - (order.amountPaid || 0)) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto my-4 shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Order #{orderId}</h2>
            {order && (
              <p className="text-xs text-gray-400 mt-0.5">Placed {formatDate(order.createdAt)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {order && (
              <Badge className={`text-xs border ${statusColors[order.status] || "bg-gray-700 text-gray-300 border-gray-600"}`}>
                {statusLabels[order.status] || order.status}
              </Badge>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-2 p-1 rounded-lg hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {orderQuery.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        )}

        {/* ── Error ── */}
        {orderQuery.isError && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-400 font-medium">Failed to load order details</p>
            <Button onClick={() => orderQuery.refetch()} variant="outline" size="sm" className="mt-3 border-gray-600 text-gray-300">
              Retry
            </Button>
          </div>
        )}

        {order && (
          <div className="p-5 space-y-6">

            {/* ── Horizontal Sliding Timeline ── */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Progress</p>
              <div className="relative">
                {/* Left scroll button */}
                {canScrollLeft && (
                  <button
                    onClick={() => scrollTimeline("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white shadow-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {/* Right scroll button */}
                {canScrollRight && (
                  <button
                    onClick={() => scrollTimeline("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white shadow-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Timeline scroll container */}
                <div
                  ref={timelineRef}
                  className="overflow-x-auto scrollbar-hide px-4"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="flex items-start min-w-max py-2">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const activeIdx = getTimelineIndex(order.status, order.paymentStatus || "unpaid");
                      const isDone = idx < activeIdx;
                      const isActive = idx === activeIdx;
                      const isFuture = idx > activeIdx;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex items-center">
                          {/* Step node */}
                          <div className="flex flex-col items-center w-20">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                isDone
                                  ? "bg-cyan-500 border-cyan-500 text-white"
                                  : isActive
                                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 ring-4 ring-cyan-500/20"
                                  : "bg-gray-800 border-gray-600 text-gray-500"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <p
                              className={`text-center text-xs mt-1.5 leading-tight w-16 ${
                                isActive ? "text-cyan-400 font-semibold" : isDone ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>

                          {/* Connector line */}
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div
                              className={`h-0.5 w-8 mx-1 rounded-full flex-shrink-0 ${
                                idx < activeIdx ? "bg-cyan-500" : "bg-gray-700"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Pay Now Banner ── */}
            {showPayNow && (
              <div className="bg-gradient-to-r from-orange-900/40 to-orange-800/20 border border-orange-600/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm">Payment Required</h3>
                    <p className="text-orange-300 text-xs mt-0.5">
                      Your order has been {order.status === "quoted" ? "quoted" : "approved"}. Complete payment to move to production.
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-400">Amount Due</p>
                        <p className="text-xl font-bold text-orange-400">{formatCurrency(amountDue)}</p>
                      </div>
                      {(order.amountPaid || 0) > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Already Paid</p>
                          <p className="text-sm font-semibold text-green-400">{formatCurrency(order.amountPaid)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handlePayNow}
                    disabled={isInitiatingPayment}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 flex-1"
                  >
                    {isInitiatingPayment ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay Now via PayFast</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-orange-600 text-orange-300 hover:bg-orange-900/30 gap-2"
                    onClick={() => {
                      toast.info("For EFT/Bank Transfer, please contact us at info@printcartel.co.za with your order number.");
                    }}
                  >
                    <Banknote className="w-4 h-4" />
                    EFT
                  </Button>
                </div>
              </div>
            )}

            {/* ── Payment Complete Banner ── */}
            {order.paymentStatus === "paid" && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-400 text-sm">Payment Complete</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(order.amountPaid)} paid · Your order is being processed
                  </p>
                </div>
              </div>
            )}

            {/* ── Order Summary ── */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Summary</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Order Total</p>
                  <p className="font-bold text-white text-base">{formatCurrency(order.totalPriceEstimate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Quantity</p>
                  <p className="font-semibold text-white">
                    {order.isMultiItemOrder
                      ? order.lineItems?.reduce((s: number, i: any) => s + i.quantity, 0) ?? order.quantity
                      : order.quantity}
                  </p>
                </div>
                {order.deliveryCharge > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs">Delivery</p>
                    <p className="font-semibold text-white">{formatCurrency(order.deliveryCharge)}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-xs">Delivery Method</p>
                  <p className="font-semibold text-white capitalize">{order.deliveryMethod || "Collection"}</p>
                </div>
              </div>

              {/* Line items for multi-item orders */}
              {order.isMultiItemOrder && order.lineItems && order.lineItems.length > 0 && (
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Items</p>
                  {order.lineItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.color?.hexCode && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-600 flex-shrink-0"
                            style={{ backgroundColor: item.color.hexCode }}
                          />
                        )}
                        <span className="text-gray-300 truncate">
                          {item.product?.name || "Product"} · {item.color?.colorName || ""} · {item.size?.sizeName || ""} × {item.quantity}
                        </span>
                      </div>
                      <span className="text-gray-300 flex-shrink-0 ml-2">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Single-item product details */}
              {!order.isMultiItemOrder && (order.product || order.color || order.size) && (
                <div className="border-t border-gray-700 pt-3 grid grid-cols-3 gap-2 text-sm">
                  {order.product && (
                    <div>
                      <p className="text-gray-400 text-xs">Product</p>
                      <p className="text-gray-200 text-xs font-medium">{order.product.name}</p>
                    </div>
                  )}
                  {order.color && (
                    <div>
                      <p className="text-gray-400 text-xs">Colour</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {order.color.hexCode && (
                          <span className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: order.color.hexCode }} />
                        )}
                        <p className="text-gray-200 text-xs font-medium">{order.color.colorName}</p>
                      </div>
                    </div>
                  )}
                  {order.size && (
                    <div>
                      <p className="text-gray-400 text-xs">Size</p>
                      <p className="text-gray-200 text-xs font-medium">{order.size.sizeName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Artwork / Design Files ── */}
            {order.prints && order.prints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Designs</p>
                <div className="space-y-3">
                  {order.prints.map((print: any, i: number) => {
                    const isImage = print.mimeType
                      ? print.mimeType.startsWith("image/")
                      : /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(print.uploadedFileName || "");
                    const approvalStatus = print.designApprovalStatus || "pending";

                    return (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                        {/* Thumbnail */}
                        {isImage && print.uploadedFilePath && (
                          <div
                            className="relative w-full bg-gray-700 cursor-zoom-in group"
                            style={{ height: "130px" }}
                            onClick={() => window.open(print.uploadedFilePath, "_blank")}
                          >
                            <img
                              src={print.uploadedFilePath}
                              alt={print.uploadedFileName || "design"}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                const p = e.currentTarget.parentElement;
                                if (p) {
                                  p.style.height = "36px";
                                  p.classList.add("flex", "items-center", "justify-center");
                                  p.innerHTML = '<span class="text-xs text-gray-500">Preview unavailable</span>';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View full size
                              </div>
                            </div>
                          </div>
                        )}

                        {/* File info */}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {!isImage && (
                                <div className="w-8 h-8 bg-orange-900/30 rounded flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-orange-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{print.uploadedFileName || `Design ${i + 1}`}</p>
                                <p className="text-xs text-gray-400">
                                  {print.placement?.placementName || ""}
                                  {print.printSize?.printSize ? ` · ${print.printSize.printSize}` : ""}
                                  {print.fileSize ? ` · ${(print.fileSize / 1024).toFixed(0)} KB` : ""}
                                </p>
                              </div>
                            </div>
                            {print.uploadedFilePath && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2 gap-1 border-gray-600 text-gray-300 hover:text-white flex-shrink-0"
                                onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = print.uploadedFilePath;
                                  a.download = print.uploadedFileName || "design";
                                  a.target = "_blank";
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  toast.success("Download started");
                                }}
                              >
                                <Download className="w-3 h-3" /> Download
                              </Button>
                            )}
                          </div>

                          {/* Approval status */}
                          <div className="mt-2">
                            <ApprovalBadge status={approvalStatus} notes={print.designApprovalNotes} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Additional Notes ── */}
            {order.additionalNotes && (
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Order Notes</p>
                <p className="text-sm text-gray-300">{order.additionalNotes}</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

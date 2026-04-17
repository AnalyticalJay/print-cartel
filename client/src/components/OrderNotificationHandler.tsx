import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShoppingCart, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * OrderNotificationHandler - Monitors for new orders and design submissions
 * Shows real-time toast notifications for admins and customers
 * Should be placed at the root level of dashboard/home pages
 */
export function OrderNotificationHandler() {
  const { user } = useAuth();
  const lastOrderCountRef = useRef<number>(0);
  const lastDesignCountRef = useRef<number>(0);

  // Fetch orders periodically
  const ordersQuery = trpc.admin.getAllOrders.useQuery(undefined, {
    refetchInterval: 5000, // Check every 5 seconds
    enabled: user?.role === "admin",
  });

  // Fetch pending design orders for design submission notifications
  const designOrdersQuery = trpc.admin.getPendingDesignOrders.useQuery(
    { status: "pending" },
    {
      refetchInterval: 5000,
      enabled: user?.role === "admin",
    }
  );

  // Check for new orders (admin only)
  useEffect(() => {
    if (user?.role !== "admin" || !ordersQuery.data) return;

    const currentOrderCount = ordersQuery.data.length;
    const lastOrderCount = lastOrderCountRef.current;

    // Notify if new orders arrived
    if (currentOrderCount > lastOrderCount && lastOrderCount > 0) {
      const newOrders = currentOrderCount - lastOrderCount;

      toast.success(
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          <div>
            <p className="font-semibold">New Order{newOrders !== 1 ? "s" : ""}</p>
            <p className="text-sm">
              {newOrders} new order{newOrders !== 1 ? "s" : ""} received
            </p>
          </div>
        </div>,
        {
          duration: 6000,
          action: {
            label: "View",
            onClick: () => {
              // Navigate to orders tab
              window.location.hash = "#orders";
            },
          },
        }
      );

      playNotificationSound();
    }

    lastOrderCountRef.current = currentOrderCount;
  }, [ordersQuery.data, user?.role]);

  // Check for new design submissions (admin only)
  useEffect(() => {
    if (user?.role !== "admin" || !designOrdersQuery.data) return;

    const currentDesignCount = designOrdersQuery.data.length;
    const lastDesignCount = lastDesignCountRef.current;

    // Notify if new designs were uploaded
    if (currentDesignCount > lastDesignCount && lastDesignCount > 0) {
      const newDesigns = currentDesignCount - lastDesignCount;

      toast.info(
        <div className="flex items-center gap-2">
          <FileUp className="w-4 h-4" />
          <div>
            <p className="font-semibold">Design Upload{newDesigns !== 1 ? "s" : ""}</p>
            <p className="text-sm">
              {newDesigns} design{newDesigns !== 1 ? "s" : ""} awaiting approval
            </p>
          </div>
        </div>,
        {
          duration: 6000,
          action: {
            label: "Review",
            onClick: () => {
              // Navigate to design approval tab
              window.location.hash = "#design-approval";
            },
          },
        }
      );

      playNotificationSound();
    }

    lastDesignCountRef.current = currentDesignCount;
  }, [designOrdersQuery.data, user?.role]);

  return null;
}

/**
 * CustomerOrderNotificationHandler - Monitors order status updates for customers
 * Shows notifications when their orders are approved, in production, etc.
 */
export function CustomerOrderNotificationHandler() {
  const { user } = useAuth();
  const lastStatusRef = useRef<Map<number, string>>(new Map());

  // Fetch user's orders - use admin getAllOrders and filter by user
  const ordersQuery = trpc.admin.getAllOrders.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!ordersQuery.data || !user?.id) return;

    ordersQuery.data.forEach((order: any) => {
      const lastStatus = lastStatusRef.current.get(order.id);
      const currentStatus = order.status;

      // Only notify if status changed
      if (lastStatus && lastStatus !== currentStatus) {
        const statusMessages: Record<string, { title: string; message: string; icon: any }> = {
          approved: {
            title: "Order Approved",
            message: `Your order #${order.id} has been approved and is ready for production.`,
            icon: CheckCircle,
          },
          "in-production": {
            title: "In Production",
            message: `Your order #${order.id} is now being produced.`,
            icon: ShoppingCart,
          },
          completed: {
            title: "Order Completed",
            message: `Your order #${order.id} is complete and ready for shipment.`,
            icon: CheckCircle,
          },
          shipped: {
            title: "Order Shipped",
            message: `Your order #${order.id} has been shipped!`,
            icon: ShoppingCart,
          },
          rejected: {
            title: "Order Rejected",
            message: `Your order #${order.id} was rejected. Please contact support.`,
            icon: AlertCircle,
          },
        };

        const statusInfo = statusMessages[currentStatus];
        if (statusInfo) {
          const Icon = statusInfo.icon;
          toast.info(
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <div>
                <p className="font-semibold">{statusInfo.title}</p>
                <p className="text-sm">{statusInfo.message}</p>
              </div>
            </div>,
            {
              duration: 6000,
              action: {
                label: "View Order",
                onClick: () => {
                  window.location.href = `/my-account`;
                },
              },
            }
          );

          playNotificationSound();
        }
      }

      // Update last known status
      lastStatusRef.current.set(order.id, currentStatus);
    });
  }, [ordersQuery.data, user?.id]);

  return null;
}

/**
 * DesignApprovalNotificationHandler - Notifies customers when their designs are reviewed
 */
export function DesignApprovalNotificationHandler() {
  const { user } = useAuth();
  const lastApprovalStatusRef = useRef<Map<number, string>>(new Map());

  // Fetch user's orders with design status
  const ordersQuery = trpc.admin.getAllOrders.useQuery(undefined, {
    refetchInterval: 5000,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!ordersQuery.data || !user?.id) return;

    ordersQuery.data.forEach((order: any) => {
      // Check if order has design approval status
      const designStatus = order.designApprovalStatus;
      if (!designStatus) return;

      const lastStatus = lastApprovalStatusRef.current.get(order.id);

      if (lastStatus && lastStatus !== designStatus) {
        const approvalMessages: Record<string, { title: string; message: string; type: "success" | "info" | "error" }> = {
          approved: {
            title: "Design Approved",
            message: `Your design for order #${order.id} has been approved and is ready for production.`,
            type: "success",
          },
          "changes-requested": {
            title: "Design Changes Requested",
            message: `Your design for order #${order.id} needs some changes. Please review the feedback.`,
            type: "info",
          },
          rejected: {
            title: "Design Rejected",
            message: `Your design for order #${order.id} was rejected. Please resubmit with corrections.`,
            type: "error",
          },
        };

        const approvalInfo = approvalMessages[designStatus];
        if (approvalInfo) {
          toast[approvalInfo.type](
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4" />
              <div>
                <p className="font-semibold">{approvalInfo.title}</p>
                <p className="text-sm">{approvalInfo.message}</p>
              </div>
            </div>,
            {
              duration: 6000,
              action: {
                label: "View",
                onClick: () => {
                  window.location.href = `/my-account`;
                },
              },
            }
          );

          playNotificationSound();
        }
      }

      lastApprovalStatusRef.current.set(order.id, designStatus);
    });
  }, [ordersQuery.data, user?.id]);

  return null;
}

/**
 * Play a subtle notification sound
 */
function playNotificationSound() {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency and duration for a pleasant notification sound
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (error) {
    // Silently fail if audio context is not available
    console.debug("Notification sound unavailable:", error);
  }
}

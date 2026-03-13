import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * ChatNotificationHandler - Monitors for new chat messages and shows notifications
 * Should be placed at the root level of the admin dashboard
 */
export function ChatNotificationHandler() {
  const { user } = useAuth();
  const lastCheckedRef = useRef<number>(0);

  // Only run for admin users
  if (user?.role !== "admin") {
    return null;
  }

  // Fetch conversations periodically
  const conversationsQuery = trpc.chat.getAllConversations.useQuery(undefined, {
    refetchInterval: 3000,
    enabled: user?.role === "admin",
  });

  // Check for new unread messages
  useEffect(() => {
    if (!conversationsQuery.data) return;

    const totalUnread = conversationsQuery.data.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );

    // Only notify if there are new unread messages since last check
    if (totalUnread > 0 && lastCheckedRef.current < totalUnread) {
      const newMessages = totalUnread - lastCheckedRef.current;

      // Show toast notification
      toast.info(
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <div>
            <p className="font-semibold">New Customer Message</p>
            <p className="text-sm">
              {newMessages} new message{newMessages !== 1 ? "s" : ""} from customers
            </p>
          </div>
        </div>,
        {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => {
              // Navigate to chat tab
              window.location.hash = "#chat";
            },
          },
        }
      );

      // Play notification sound if available
      playNotificationSound();
    }

    lastCheckedRef.current = totalUnread;
  }, [conversationsQuery.data]);

  return null;
}

/**
 * Play a subtle notification sound
 */
function playNotificationSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency and duration
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Silently fail if audio context is not available
    console.debug("Notification sound unavailable:", error);
  }
}

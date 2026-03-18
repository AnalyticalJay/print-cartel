import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook to fetch and monitor unread chat message count
 * Automatically refreshes every 3 seconds to stay up-to-date
 */
export function useUnreadChatCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // For customers: fetch customer communications
  const customerConversationsQuery = trpc.chat.getCustomerCommunications.useQuery(
    undefined,
    {
      enabled: !!user && user.role !== "admin",
      refetchInterval: 3000,
    }
  );

  // For admins: fetch all conversations
  const adminConversationsQuery = trpc.chat.getAllConversations.useQuery(
    undefined,
    {
      enabled: !!user && user.role === "admin",
      refetchInterval: 3000,
    }
  );

  // Calculate total unread count
  useEffect(() => {
    let total = 0;

    if (user?.role === "admin" && adminConversationsQuery.data) {
      // Sum unread counts from all conversations
      total = adminConversationsQuery.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
    } else if (user?.role !== "admin" && customerConversationsQuery.data) {
      // Sum unread counts from customer conversations
      total = customerConversationsQuery.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
    }

    setUnreadCount(total);
  }, [
    user?.role,
    adminConversationsQuery.data,
    customerConversationsQuery.data,
  ]);

  return unreadCount;
}

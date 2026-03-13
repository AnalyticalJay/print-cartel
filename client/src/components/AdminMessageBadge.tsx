import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Component that displays unread message count for admin
 * Updates in real-time using polling
 */
export function AdminMessageBadge() {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch all conversations (admin only)
  const { data: conversations, refetch } = trpc.chat.getAllConversations.useQuery(
    undefined,
    { enabled: true }
  );

  // Calculate total unread count
  const totalUnread = conversations?.reduce((sum, conv) => {
    const unreadCount = conv.unreadCount || 0;
    return sum + unreadCount;
  }, 0) || 0;

  // Set up polling for new messages
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [refetch]);

  if (totalUnread === 0) {
    return null;
  }

  return (
    <Badge className="bg-red-500 text-white flex items-center gap-1 animate-pulse">
      <Bell className="w-3 h-3" />
      {totalUnread}
    </Badge>
  );
}

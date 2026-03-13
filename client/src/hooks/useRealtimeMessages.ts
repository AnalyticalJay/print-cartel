import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook for real-time message polling
 * Polls for new messages at a specified interval
 */
export function useRealtimeMessages(conversationId: number | null, interval = 3000) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refetch } = trpc.chat.getMessages.useQuery(
    { conversationId: conversationId || 0 },
    { enabled: !!conversationId }
  );

  useEffect(() => {
    if (!conversationId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling for new messages
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversationId, interval, refetch]);

  return { refetch };
}

/**
 * Hook for polling all conversations
 * Polls for new conversations and unread counts
 */
export function useRealtimeConversations(interval = 5000) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refetch } = trpc.chat.getCustomerCommunications.useQuery();

  useEffect(() => {
    // Start polling for new conversations
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [interval, refetch]);

  return { refetch };
}

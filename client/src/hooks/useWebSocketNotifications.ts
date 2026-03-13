import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface WebSocketMessage {
  type: 'new_message' | 'status_update' | 'conversation_update';
  conversationId: number;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Hook for WebSocket-based real-time notifications
 * Connects to a WebSocket server for instant message updates
 */
export function useWebSocketNotifications(onMessage?: (msg: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Show toast notification for new messages
          if (message.type === 'new_message') {
            toast.info('New message received', {
              description: 'You have a new message in your conversation',
            });
          } else if (message.type === 'status_update') {
            toast.success('Order status updated', {
              description: 'Your order status has been updated',
            });
          }

          // Call the callback if provided
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message');
    }
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    send,
  };
}

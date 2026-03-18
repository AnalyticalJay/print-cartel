import { useNotification } from '@/contexts/NotificationContext';
import { useCallback } from 'react';
import { playNotificationSound } from '@/lib/notificationService';

export function useInAppNotification() {
  const { addNotification } = useNotification();

  const notify = useCallback(
    (
      title: string,
      message: string,
      options?: {
        type?: 'success' | 'error' | 'info' | 'warning' | 'order-status';
        duration?: number;
        sound?: boolean;
      }
    ) => {
      const {
        type = 'info',
        duration = 4000,
        sound = true,
      } = options || {};

      // Play sound if enabled
      if (sound) {
        const soundType = type === 'order-status' ? 'success' : type;
        playNotificationSound(soundType as 'success' | 'error' | 'info' | 'warning');
      }

      // Add notification to context
      return addNotification({
        title,
        message,
        type,
        duration,
        sound,
      });
    },
    [addNotification]
  );

  const notifySuccess = useCallback(
    (title: string, message: string, options?: { duration?: number; sound?: boolean }) => {
      notify(title, message, { type: 'success', ...options });
    },
    [notify]
  );

  const notifyError = useCallback(
    (title: string, message: string, options?: { duration?: number; sound?: boolean }) => {
      notify(title, message, { type: 'error', ...options });
    },
    [notify]
  );

  const notifyInfo = useCallback(
    (title: string, message: string, options?: { duration?: number; sound?: boolean }) => {
      notify(title, message, { type: 'info', ...options });
    },
    [notify]
  );

  const notifyWarning = useCallback(
    (title: string, message: string, options?: { duration?: number; sound?: boolean }) => {
      notify(title, message, { type: 'warning', ...options });
    },
    [notify]
  );

  const notifyOrderStatus = useCallback(
    (
      orderId: number,
      status: string,
      message: string,
      options?: { duration?: number; sound?: boolean }
    ) => {
      const statusLabels: Record<string, string> = {
        pending: 'Pending Review',
        quoted: 'Quote Sent',
        approved: 'Approved',
        'in-production': 'In Production',
        ready: 'Ready for Collection',
        completed: 'Completed',
        shipped: 'Shipped',
        cancelled: 'Cancelled',
      };

      notify(`Order #${orderId} - ${statusLabels[status] || status}`, message, {
        type: 'order-status',
        duration: 5000,
        ...options,
      });
    },
    [notify]
  );

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyOrderStatus,
  };
}

import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'order-status';
  timestamp: Date;
  duration?: number;
  sound?: boolean;
  read: boolean;
}

interface InAppNotificationDisplayProps {
  notification: InAppNotification;
  onDismiss: (id: string) => void;
  autoClose?: boolean;
}

export function InAppNotificationDisplay({
  notification,
  onDismiss,
  autoClose = true,
}: InAppNotificationDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;

    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, onDismiss, autoClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
      case 'order-status':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
      case 'order-status':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
      case 'order-status':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300 z-50',
        getBackgroundColor(),
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-sm', getTextColor())}>
            {notification.title}
          </h3>
          <p className={cn('text-sm mt-1', getTextColor())}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300);
          }}
          className={cn('flex-shrink-0 ml-2', getTextColor())}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface NotificationStackProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
}

export function NotificationStack({
  notifications,
  onDismiss,
}: NotificationStackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <InAppNotificationDisplay
            notification={notification}
            onDismiss={onDismiss}
            autoClose={true}
          />
        </div>
      ))}
    </div>
  );
}

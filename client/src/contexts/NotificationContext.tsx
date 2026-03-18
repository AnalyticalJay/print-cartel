import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationStack, type InAppNotification } from '@/components/InAppNotificationDisplay';
import { initializeNotificationService } from '@/lib/notificationService';

interface NotificationContextType {
  notifications: InAppNotification[];
  addNotification: (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Initialize notification service on mount
  React.useEffect(() => {
    initializeNotificationService();
  }, []);

  const addNotification = useCallback(
    (notification: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newNotification: InAppNotification = {
        ...notification,
        id,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
      <NotificationStack
        notifications={notifications}
        onDismiss={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

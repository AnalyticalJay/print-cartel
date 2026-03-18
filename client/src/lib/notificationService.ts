import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'order-status';

interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  sound?: boolean;
  icon?: string;
}

// Create audio context for sound notifications
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a notification sound
 * Creates a simple beep sound using Web Audio API
 */
export function playNotificationSound(type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
  try {
    const context = getAudioContext();
    const now = context.currentTime;
    
    // Create oscillator for the beep sound
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Set frequency based on notification type
    const frequencies: Record<string, number> = {
      success: 800,  // Higher pitch for success
      error: 400,    // Lower pitch for error
      info: 600,     // Medium pitch for info
      warning: 500,  // Medium-low pitch for warning
    };
    
    oscillator.frequency.value = frequencies[type] || 600;
    oscillator.type = 'sine';
    
    // Set volume
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Show an in-app notification with optional sound
 */
export function showNotification(options: NotificationOptions): void {
  const {
    title,
    message,
    type = 'info',
    duration = 4000,
    sound = true,
  } = options;

  // Play sound if enabled
  if (sound) {
    const soundType = type === 'order-status' ? 'success' : type;
    playNotificationSound(soundType as 'success' | 'error' | 'info' | 'warning');
  }

  // Show toast notification
  const toastMessage = `${title}\n${message}`;
  
  switch (type) {
    case 'success':
    case 'order-status':
      toast.success(toastMessage, { duration });
      break;
    case 'error':
      toast.error(toastMessage, { duration });
      break;
    case 'warning':
      toast.warning(toastMessage, { duration });
      break;
    case 'info':
    default:
      toast(toastMessage, { duration });
      break;
  }
}

/**
 * Show order status update notification
 */
export function showOrderStatusNotification(
  orderId: number,
  status: string,
  message: string,
  sound = true
): void {
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

  showNotification({
    title: `Order #${orderId} - ${statusLabels[status] || status}`,
    message,
    type: 'order-status',
    sound,
    duration: 5000,
  });
}

/**
 * Show admin notification for new order or status change
 */
export function showAdminNotification(
  title: string,
  message: string,
  sound = true
): void {
  showNotification({
    title,
    message,
    type: 'info',
    sound,
    duration: 6000,
  });
}

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Send a browser push notification
 */
export function sendPushNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.message || '',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'print-cartel-notification',
        requireInteraction: false,
      });

      // Play sound for push notification
      if (options?.sound !== false) {
        playNotificationSound(options?.type === 'order-status' ? 'success' : 'info');
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }
}

/**
 * Initialize notification service
 */
export function initializeNotificationService(): void {
  // Request notification permission on initialization
  if ('Notification' in window && Notification.permission === 'default') {
    requestNotificationPermission().catch(console.error);
  }

  // Resume audio context on user interaction
  if (typeof window !== 'undefined') {
    const resumeAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error);
      }
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
    };

    document.addEventListener('click', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
  }
}

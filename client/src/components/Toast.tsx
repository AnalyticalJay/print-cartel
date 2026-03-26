import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (message.duration === 0) return; // Don't auto-close if duration is 0
    
    const timer = setTimeout(() => {
      onClose(message.id);
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const textColors = {
    success: "text-green-900",
    error: "text-red-900",
    info: "text-blue-900",
    warning: "text-yellow-900",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors[message.type]} ${textColors[message.type]} shadow-md animate-in fade-in slide-in-from-top-2 duration-200`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[message.type]}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{message.title}</h3>
        {message.message && <p className="text-sm mt-1 opacity-90">{message.message}</p>}
      </div>
      <button
        onClick={() => onClose(message.id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ messages, onClose }: { messages: ToastMessage[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {messages.map((message) => (
        <Toast key={message.id} message={message} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newMessage: ToastMessage = { id, type, title, message, duration };
    setMessages((prev) => [...prev, newMessage]);
    return id;
  };

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const success = (title: string, message?: string) => addToast("success", title, message);
  const error = (title: string, message?: string) => addToast("error", title, message);
  const info = (title: string, message?: string) => addToast("info", title, message);
  const warning = (title: string, message?: string) => addToast("warning", title, message);

  return {
    messages,
    removeToast,
    addToast,
    success,
    error,
    info,
    warning,
  };
}

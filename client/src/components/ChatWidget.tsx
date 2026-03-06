import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatBox } from './ChatBox';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close chat when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleToggle}
          className="relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-accent hover:bg-accent/90"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-24px)]">
          <div className="bg-white rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col h-96">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/80 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Print Cartel Support</h3>
                <p className="text-xs text-accent-foreground/80">We typically reply within minutes</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent/20 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <ChatBox
              conversationId={conversationId}
              onConversationCreated={setConversationId}
              onUnreadCountChange={setUnreadCount}
            />
          </div>
        </div>
      )}
    </>
  );
}

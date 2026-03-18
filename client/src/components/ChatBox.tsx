import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface ChatBoxProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  onUnreadCountChange: (count: number) => void;
}

export function ChatBox({ conversationId, onConversationCreated, onUnreadCountChange }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [showForm, setShowForm] = useState(!conversationId);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const markAsReadMutation = trpc.chat.markAsRead.useMutation();
  const utils = trpc.useUtils();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      // Fetch messages using the utils
      const msgs = await utils.chat.getMessages.fetch({ conversationId });
      setMessages(msgs);
      
      // Mark messages as read
      await markAsReadMutation.mutateAsync({ conversationId });
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.trim() || !subject.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const { conversationId: newId } = await createConversationMutation.mutateAsync({
        visitorName,
        visitorEmail,
        subject,
      });
      if (!newId) throw new Error('Failed to create conversation');
      onConversationCreated(newId);
      setShowForm(false);
      
      // Send initial message
      await sendMessageMutation.mutateAsync({
        conversationId: newId || 0,
        message: `Hi! I'm ${visitorName} and I have a question about: ${subject}`,
        senderType: 'visitor',
      });
      
      // Reload messages after sending
      setTimeout(() => loadMessages(), 500);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !conversationId) return;

    const messageToSend = inputValue;
    setInputValue('');

    try {
      // Optimistic update
      const newMessage = {
        id: Date.now(),
        conversationId,
        senderId: user?.id || null,
        senderType: user ? 'user' : 'visitor',
        message: messageToSend,
        isRead: 1,
        createdAt: new Date(),
      };
      setMessages([...messages, newMessage]);

      // Send message via mutation
      await sendMessageMutation.mutateAsync({
        conversationId,
        message: messageToSend,
        senderType: user ? 'user' : 'visitor',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(messages.slice(0, -1));
      setInputValue(messageToSend);
    }
  };

  if (showForm && !conversationId) {
    return (
      <form onSubmit={handleStartConversation} className="p-4 space-y-3 flex flex-col h-full">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-foreground">Your Name</label>
          <Input
            type="text"
            placeholder="John Doe"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            required
            className="text-sm"
          />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={visitorEmail}
            onChange={(e) => setVisitorEmail(e.target.value)}
            required
            className="text-sm"
          />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-foreground">Subject</label>
          <Input
            type="text"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full mt-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Chat'
          )}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.senderType === 'visitor'
                    ? 'bg-accent text-accent-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-border p-3 bg-background">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!conversationId || isLoading}
            className="text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || !conversationId || isLoading}
            className="px-3"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

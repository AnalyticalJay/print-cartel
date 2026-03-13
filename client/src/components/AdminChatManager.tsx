import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { MessageCircle, Send, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SelectedConversation {
  id: number;
  visitorName: string | null;
  visitorEmail: string | null;
  subject: string | null;
  status: string;
  orderId: number | null;
  unreadCount: number;
}

export function AdminChatManager() {
  const [selectedConversation, setSelectedConversation] = useState<SelectedConversation | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoadingReply, setIsLoadingReply] = useState(false);

  // Fetch all conversations
  const { data: conversations, isLoading, refetch } = trpc.chat.getAllConversations.useQuery();

  // Fetch conversation history
  const { data: conversationHistory, refetch: refetchHistory } = trpc.chat.getConversationHistory.useQuery(
    { conversationId: selectedConversation?.id || 0 },
    { enabled: !!selectedConversation }
  );

  // Send admin reply mutation
  const sendReplyMutation = trpc.chat.sendAdminReply.useMutation({
    onSuccess: () => {
      setReplyMessage('');
      toast.success('Reply sent successfully');
      refetchHistory();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });

  // Update conversation status mutation
  const updateStatusMutation = trpc.chat.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    setIsLoadingReply(true);
    try {
      await sendReplyMutation.mutateAsync({
        conversationId: selectedConversation.id,
        message: replyMessage,
      });
    } finally {
      setIsLoadingReply(false);
    }
  };

  const handleStatusChange = (conversationId: number, newStatus: 'active' | 'closed' | 'archived') => {
    updateStatusMutation.mutate({ conversationId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen max-h-screen">
      {/* Conversations List */}
      <div className="lg:col-span-1 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversations ({conversations?.length || 0})
          </h2>
        </div>

        <div className="space-y-2 p-4">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv as SelectedConversation)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedConversation?.id === conv.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="font-medium text-sm truncate">{conv.visitorName || 'Anonymous'}</div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">{conv.unreadCount}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{conv.visitorEmail}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">{conv.subject}</div>
                <Badge className={`text-xs mt-2 ${getStatusColor(conv.status)}`}>{conv.status}</Badge>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Details */}
      <div className="lg:col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="border-b border-border p-4 bg-background">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{selectedConversation.visitorName || 'Anonymous'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConversation.visitorEmail}</p>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge className={getStatusColor(selectedConversation.status)}>
                  {selectedConversation.status}
                </Badge>
                {selectedConversation.orderId && (
                  <Badge variant="outline">Order #{selectedConversation.orderId}</Badge>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                {selectedConversation.status !== 'closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedConversation.id, 'closed')}
                  >
                    Close
                  </Button>
                )}
                {selectedConversation.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedConversation.id, 'archived')}
                  >
                    Archive
                  </Button>
                )}
                {selectedConversation.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedConversation.id, 'active')}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationHistory?.messages && conversationHistory.messages.length > 0 ? (
                conversationHistory.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderType === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="border-t border-border p-4 bg-background">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || isLoadingReply}
                  className="h-auto"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a conversation to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

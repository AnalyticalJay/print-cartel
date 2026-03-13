import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export function CommunicationHistory() {
  const [expandedConversation, setExpandedConversation] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  // Fetch customer communications
  const { data: communications, isLoading, refetch } = trpc.chat.getCustomerCommunications.useQuery();

  // Fetch conversation messages
  const { data: conversationData, refetch: refetchConversation } = trpc.chat.getMessages.useQuery(
    { conversationId: expandedConversation || 0 },
    { enabled: !!expandedConversation }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setReplyMessage('');
      setReplyingTo(null);
      toast.success('Message sent');
      refetchConversation();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleSendMessage = async (conversationId: number) => {
    if (!replyMessage.trim()) return;

    await sendMessageMutation.mutateAsync({
      conversationId,
      message: replyMessage,
      senderType: 'user',
    });
  };

  const toggleConversation = (conversationId: number) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
      setReplyingTo(null);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading communication history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Communication History</h2>
      </div>

      {communications && communications.length > 0 ? (
        communications.map((conversation) => (
          <Card key={conversation.id} className="overflow-hidden">
            <button
              onClick={() => toggleConversation(conversation.id)}
              className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{conversation.subject}</h3>
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">{conversation.unreadCount} new</Badge>
                  )}
                  <Badge variant="outline">{conversation.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {conversation.visitorName && `Started by ${conversation.visitorName}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-2">
                {expandedConversation === conversation.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {expandedConversation === conversation.id && (
              <>
                <div className="border-t border-border p-4 bg-muted/30">
                  {/* Messages */}
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {conversationData && conversationData.length > 0 ? (
                      conversationData.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              msg.senderType === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : msg.senderType === 'admin'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Input */}
                  {replyingTo === conversation.id ? (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <Textarea
                        placeholder="Type your message..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendMessage(conversation.id)}
                          disabled={!replyMessage.trim()}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyMessage('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(conversation.id)}
                      className="w-full"
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No communications yet. Start a conversation with us!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

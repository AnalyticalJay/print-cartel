import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, X } from "lucide-react";

export function AdminChatPanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all conversations with unread counts
  const conversationsQuery = trpc.chat.getAllConversations.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Get messages for selected conversation
  const messagesQuery = trpc.chat.getConversationHistory.useQuery(
    { conversationId: selectedConversationId || 0 },
    { enabled: !!selectedConversationId, refetchInterval: 2000 }
  );

  // Send reply mutation
  const sendReplyMutation = trpc.chat.sendAdminReply.useMutation();

  // Update conversation status mutation
  const updateStatusMutation = trpc.chat.updateStatus.useMutation();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !selectedConversationId) {
      toast.error("Please enter a message");
      return;
    }

    setIsLoading(true);
    try {
      await sendReplyMutation.mutateAsync({
        conversationId: selectedConversationId,
        message: message.trim(),
      });

      setMessage("");
      await messagesQuery.refetch();
      await conversationsQuery.refetch();
      toast.success("Reply sent");
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversationId) return;

    try {
      await updateStatusMutation.mutateAsync({
        conversationId: selectedConversationId,
        status: "closed",
      });

      setSelectedConversationId(null);
      await conversationsQuery.refetch();
      toast.success("Conversation closed");
    } catch (error) {
      console.error("Failed to close conversation:", error);
      toast.error("Failed to close conversation");
    }
  };

  const selectedConversation = conversationsQuery.data?.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="bg-gray-900 border-gray-800 lg:col-span-1 overflow-hidden flex flex-col">
        <CardHeader className="border-b border-gray-800 pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {conversationsQuery.isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : conversationsQuery.data && conversationsQuery.data.length > 0 ? (
            <div className="space-y-2 p-4">
              {conversationsQuery.data.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedConversationId === conversation.id
                      ? "bg-accent/20 border-accent"
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {conversation.visitorName || "Anonymous"}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {conversation.visitorEmail}
                      </p>
                      {conversation.subject && (
                        <p className="text-gray-400 text-xs truncate mt-1">
                          {conversation.subject}
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white shrink-0">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        conversation.status === "active"
                          ? "border-green-500 text-green-500"
                          : "border-gray-500 text-gray-500"
                      }`}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat View */}
      {selectedConversation ? (
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-gray-800 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white">
                  {selectedConversation.visitorName || "Anonymous"}
                </CardTitle>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedConversation.visitorEmail}
                </p>
                {selectedConversation.subject && (
                  <p className="text-gray-400 text-sm mt-1">
                    Subject: {selectedConversation.subject}
                  </p>
                )}
              </div>
              <Button
                onClick={handleCloseConversation}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesQuery.isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : messagesQuery.data?.messages && messagesQuery.data.messages.length > 0 ? (
              <>
                {messagesQuery.data.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderType === "admin" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderType === "admin"
                          ? "bg-accent text-accent-foreground"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {msg.senderType === "admin" ? "You" : selectedConversation.visitorName || "Customer"}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No messages yet</p>
              </div>
            )}
          </CardContent>

          <form
            onSubmit={handleSendReply}
            className="border-t border-gray-800 p-4 flex gap-2"
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a conversation to view messages</p>
          </div>
        </Card>
      )}
    </div>
  );
}

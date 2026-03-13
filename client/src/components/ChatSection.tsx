import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Paperclip, Download, X, FileIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function ChatSection() {
  const { user } = useAuth();
  const [expandedConversationId, setExpandedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch conversations for current user
  const conversationsQuery = trpc.chat.getCustomerCommunications.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Get messages for expanded conversation
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { conversationId: expandedConversationId || 0 },
    { enabled: !!expandedConversationId, refetchInterval: 2000 }
  );

  // Get attachments for expanded conversation
  const attachmentsQuery = trpc.chat.getConversationAttachments.useQuery(
    { conversationId: expandedConversationId || 0 },
    { enabled: !!expandedConversationId, refetchInterval: 3000 }
  );

  // Mutations
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const uploadFileMutation = trpc.chat.uploadFileAttachment.useMutation();
  const markAsReadMutation = trpc.chat.markAsRead.useMutation();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file");
      return;
    }

    if (!expandedConversationId) {
      toast.error("No conversation selected");
      return;
    }

    setIsLoading(true);
    try {
      // Send text message first
      let messageId: number | null = null;
      if (message.trim()) {
        const msgResult = await sendMessageMutation.mutateAsync({
          conversationId: expandedConversationId,
          message: message.trim(),
          senderType: "user",
        });
        messageId = msgResult.messageId;
      }

      // Upload file if selected
      if (selectedFile && messageId) {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const fileData = (event.target?.result as string).split(",")[1];
            await uploadFileMutation.mutateAsync({
              conversationId: expandedConversationId,
              messageId,
              fileName: selectedFile.name,
              fileData,
              mimeType: selectedFile.type,
              uploadedByType: "user",
            });
            toast.success("File uploaded successfully");
          } catch (error) {
            console.error("File upload failed:", error);
            toast.error("Failed to upload file");
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(selectedFile);
      }

      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await messagesQuery.refetch();
      await attachmentsQuery.refetch();
      await conversationsQuery.refetch();
      toast.success("Message sent");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandConversation = async (conversationId: number) => {
    setExpandedConversationId(conversationId);
    // Mark as read when expanding
    try {
      await markAsReadMutation.mutateAsync({ conversationId });
      await conversationsQuery.refetch();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    return "📎";
  };

  const selectedConversation = conversationsQuery.data?.find(
    (c) => c.id === expandedConversationId
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat with Admin
        </h3>

        {conversationsQuery.isLoading ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ) : conversationsQuery.data && conversationsQuery.data.length > 0 ? (
          <div className="space-y-3">
            {conversationsQuery.data.map((conversation) => (
              <Card
                key={conversation.id}
                className="bg-gray-900 border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => handleExpandConversation(conversation.id)}
                  className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold truncate">
                        {conversation.subject || "General Chat"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs shrink-0">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(conversation.updatedAt).toLocaleDateString()} at{" "}
                      {new Date(conversation.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="ml-2">
                    {expandedConversationId === conversation.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Conversation */}
                {expandedConversationId === conversation.id && (
                  <div className="border-t border-gray-800">
                    {/* Messages */}
                    <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-gray-800/30">
                      {messagesQuery.isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                        <>
                          {messagesQuery.data.map((msg) => {
                            const msgAttachments = attachmentsQuery.data?.filter(
                              (att) => att.messageId === msg.id
                            ) || [];
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${
                                  msg.senderType === "user" ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                    msg.senderType === "user"
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-gray-700 text-white"
                                  }`}
                                >
                                  <p>{msg.message}</p>
                                  {msgAttachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {msgAttachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs underline hover:opacity-80"
                                        >
                                          <span>{getFileIcon(att.mimeType)}</span>
                                          <span className="truncate">{att.fileName}</span>
                                          <Download className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-xs opacity-70 mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <p className="text-center text-gray-400 text-sm py-4">
                          No messages yet
                        </p>
                      )}
                    </div>

                    {/* File Preview */}
                    {selectedFile && (
                      <div className="border-t border-gray-700 px-4 py-2 bg-gray-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <FileIcon className="w-4 h-4" />
                          <span className="truncate">{selectedFile.name}</span>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Message Input */}
                    <form
                      onSubmit={handleSendMessage}
                      className="border-t border-gray-800 p-3 flex gap-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isLoading || isUploading}
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        disabled={isLoading || isUploading}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-sm"
                        disabled={isLoading || isUploading}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || isUploading || (!message.trim() && !selectedFile)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        size="sm"
                      >
                        {isLoading || isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-8">
              <p className="text-center text-gray-400">
                No active conversations yet. Use the chat widget to start a conversation with our admin team.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

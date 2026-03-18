import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, X, Paperclip, Download, FileIcon, Trash2 } from "lucide-react";

export function AdminChatPanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch all conversations with unread counts
  const conversationsQuery = trpc.chat.getAllConversations.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Get messages for selected conversation
  const messagesQuery = trpc.chat.getConversationHistory.useQuery(
    { conversationId: selectedConversationId || 0 },
    { enabled: !!selectedConversationId, refetchInterval: 2000 }
  );

  // Get attachments for selected conversation
  const attachmentsQuery = trpc.chat.getConversationAttachments.useQuery(
    { conversationId: selectedConversationId || 0 },
    { enabled: !!selectedConversationId, refetchInterval: 3000 }
  );

  // Send reply mutation
  const sendReplyMutation = trpc.chat.sendAdminReply.useMutation();
  const updateStatusMutation = trpc.chat.updateStatus.useMutation();
  const uploadFileMutation = trpc.chat.uploadFileAttachment.useMutation();
  const deleteFileMutation = trpc.chat.deleteFileAttachment.useMutation();

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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file");
      return;
    }

    if (!selectedConversationId) return;

    setIsLoading(true);
    try {
      // Send text message first
      let messageId: number | null = null;
      if (message.trim()) {
        const result = await sendReplyMutation.mutateAsync({
          conversationId: selectedConversationId,
          message: message.trim(),
        });
        messageId = result.messageId;
      }

      // Upload file if selected
      if (selectedFile && messageId) {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const fileData = (event.target?.result as string).split(",")[1];
            await uploadFileMutation.mutateAsync({
              conversationId: selectedConversationId,
              messageId,
              fileName: selectedFile.name,
              fileData,
              mimeType: selectedFile.type,
              uploadedByType: "admin",
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
      await conversationsQuery.refetch();
      await attachmentsQuery.refetch();
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

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteFileMutation.mutateAsync({ attachmentId });
      await attachmentsQuery.refetch();
      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error("Failed to delete attachment");
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
              {[...conversationsQuery.data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((conversation) => (
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
            ) : (messagesQuery.data as any)?.messages && (messagesQuery.data as any).messages.length > 0 ? (
              <>
                {(messagesQuery.data as any).messages.map((msg: any) => {
                  const msgAttachments = attachmentsQuery.data?.filter(
                    (att: any) => att.messageId === msg.id
                  ) || [];
                  return (
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
                        {msgAttachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msgAttachments.map((att: any) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-2 text-xs bg-black/20 p-1 rounded"
                              >
                                <a
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 flex-1 hover:opacity-80 underline"
                                >
                                  <span>{getFileIcon(att.mimeType)}</span>
                                  <span className="truncate">{att.fileName}</span>
                                  <Download className="w-3 h-3 shrink-0" />
                                </a>
                                {msg.senderType === "admin" && (
                                  <Button
                                    onClick={() => handleDeleteAttachment(att.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 text-gray-300 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
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
              <div className="flex items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No messages yet</p>
              </div>
            )}
          </CardContent>

          {selectedFile && (
            <div className="border-t border-gray-800 px-4 py-2 bg-gray-800/50 flex items-center justify-between">
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

          <form
            onSubmit={handleSendReply}
            className="border-t border-gray-800 p-4 flex gap-2"
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
              size="icon"
              className="text-gray-400 hover:text-white"
              disabled={isLoading || isUploading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              disabled={isLoading || isUploading}
            />
            <Button
              type="submit"
              disabled={isLoading || isUploading || (!message.trim() && !selectedFile)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              size="icon"
            >
              {isLoading || isUploading ? (
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

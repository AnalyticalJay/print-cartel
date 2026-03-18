import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Paperclip, Download, X, FileIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface CustomerChatBoxProps {
  orderId: number;
  customerEmail: string;
  customerName: string;
}

export function CustomerChatBox({
  orderId,
  customerEmail,
  customerName,
}: CustomerChatBoxProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch or create conversation for this order
  const conversationsQuery = trpc.chat.getByOrder.useQuery(
    { orderId },
    { enabled: !!orderId && user?.role === "admin" }
  );

  // Get messages for conversation
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { conversationId: conversationId || 0 },
    { enabled: !!conversationId, refetchInterval: 2000 }
  );

  // Get attachments for conversation
  const attachmentsQuery = trpc.chat.getConversationAttachments.useQuery(
    { conversationId: conversationId || 0 },
    { enabled: !!conversationId, refetchInterval: 3000 }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const uploadFileMutation = trpc.chat.uploadFileAttachment.useMutation();

  // Create conversation if doesn't exist
  useEffect(() => {
    const initializeChat = async () => {
      if (!conversationId && orderId) {
        try {
          // Check if conversation exists for this order
          const existing = await conversationsQuery.refetch();
          if (existing.data && existing.data.length > 0) {
            setConversationId(existing.data[0].id);
          } else {
            // Create new conversation
            const result = await createConversationMutation.mutateAsync({
              visitorName: customerName,
              visitorEmail: customerEmail,
              subject: `Order #${orderId} - Customer Support`,
            });
            setConversationId(result.conversationId);
          }
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        }
      }
    };

    initializeChat();
  }, [orderId, customerName, customerEmail, conversationId, createConversationMutation, conversationsQuery]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (50MB max)
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

    if (!conversationId) {
      toast.error("Chat not initialized");
      return;
    }

    setIsLoading(true);
    try {
      // Send text message first
      let messageId: number | null = null;
      if (message.trim()) {
        const msgResult = await sendMessageMutation.mutateAsync({
          conversationId,
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
            const fileData = (event.target?.result as string).split(",")[1]; // Get base64 part
            await uploadFileMutation.mutateAsync({
              conversationId,
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
      toast.success("Message sent");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    return "📎";
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-4 md:right-6 rounded-full w-14 h-14 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg z-40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-4 md:right-6 w-96 max-h-[600px] bg-gray-800 border-gray-700 shadow-xl flex flex-col z-40">
      <CardHeader className="border-b border-gray-700 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white text-lg">Chat with Admin</CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>
        <p className="text-gray-400 text-sm mt-1">Order #{orderId}</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesQuery.isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
          <>
            {messagesQuery.data.map((msg: any) => {
              const msgAttachments = attachmentsQuery.data?.filter(
                (att: any) => att.messageId === msg.id
              ) || [];
              return (
                <div key={msg.id} className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderType === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    {msgAttachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msgAttachments.map((att: any) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs underline hover:opacity-80"
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
          <div className="flex items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        )}
      </CardContent>

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

      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-700 p-4 flex gap-2"
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
          placeholder="Type your message..."
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
  );
}

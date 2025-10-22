"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Paperclip, Send, X } from "lucide-react";

export default function SignalSendPage() {
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: session } = useSession();
  const token = session?.accessToken || "";
  const role = session?.user?.role;
  const isAdmin = role === "admin";

  const queryClient = useQueryClient();

  // -----------------------
  // FETCH MESSAGES
  // -----------------------
  const { data: messages = [], isLoading: fetchingMessages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/chat/messages/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!chatId,
    refetchInterval: 8000,
  });

  // -----------------------
  // CREATE CHAT MUTATION
  // -----------------------
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signal: true }),
      });
      if (!res.ok) throw new Error("Failed to create chat");
      const data = await res.json();
      const newChatId = data.data?._id || data.data?.chatId;
      if (!newChatId) throw new Error("No chat ID returned");
      return newChatId;
    },
    onSuccess: (newId) => {
      setChatId(newId);
      setSuccess("Signal chat created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => setError(err.message),
  });

  // -----------------------
  // SEND MESSAGE MUTATION
  // -----------------------
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!chatId) throw new Error("Please create a chat first");
      if (!isAdmin) throw new Error("Only admins can send signals");

      const formData = new FormData();
      formData.append("chatId", chatId);
      if (message.trim()) formData.append("content", message);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/chat/send-message`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      setSuccess("Message sent successfully!");
      setTimeout(() => setSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (err: any) => setError(err.message),
  });

  // -----------------------
  // FILE UPLOAD HANDLER
  // -----------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <div className="min-h-screen bg-slate-100 p-6 pt-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Signal Send</h1>
            <p className="text-sm text-slate-600 mt-1">Dashboard &gt; Signal Send</p>
          </div>
        </div>

        <div className="bg-[#B8C3D4] p-6 rounded-lg shadow-sm">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}
          {!isAdmin && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-blue-800 text-sm">
                Only admins can send signals. Current role: {role || "guest"}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {fetchingMessages ? (
              <p className="text-slate-600 text-center">Loading messages...</p>
            ) : messages.length > 0 ? (
              messages.map((msg: any) => (
                <div
                  key={msg._id}
                  className="max-w-2xl bg-slate-50 rounded-lg overflow-hidden p-4"
                >
                  {msg.contentType === "file" ? (
                    msg.content.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={msg.content}
                        alt="Uploaded"
                        className="w-full rounded-lg mb-2"
                      />
                    ) : msg.content.match(/\.(mp4|mov)$/i) ? (
                      <video controls className="w-full rounded-lg mb-2">
                        <source src={msg.content} type="video/mp4" />
                      </video>
                    ) : (
                      <a
                        href={msg.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        📎 Download File
                      </a>
                    )
                  ) : (
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {msg.content}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-center">No messages yet.</p>
            )}
          </div>

          {/* Input */}
          {chatId && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 px-3 py-3 shadow-sm flex flex-col gap-2">
              {/* File Preview */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-slate-100 rounded-lg p-2 px-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-500 hover:text-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => document.getElementById("fileUpload")?.click()}
                >
                  <Paperclip className="h-5 w-5" />
                  <input
                    id="fileUpload"
                    type="file"
                    accept="image/*,video/*,.pdf,.docx,.xlsx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </Button>

                <Textarea
                  placeholder={
                    isAdmin ? "Type a message..." : "Only admins can send messages"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!isAdmin}
                  className="flex-1 border-none focus-visible:ring-0 focus:outline-none resize-none text-sm text-slate-700 bg-transparent"
                  rows={1}
                />

                <Button
                  size="icon"
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={
                    (!message.trim() && !selectedFile) ||
                    !isAdmin ||
                    sendMessageMutation.isPending
                  }
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-full disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Create Chat */}
          {!chatId && (
            <div className="mt-6 p-6 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-center">
              <p className="text-slate-600 mb-4">
                Create a signal chat to start sending messages
              </p>
              <Button
                onClick={() => createChatMutation.mutate()}
                disabled={createChatMutation.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {createChatMutation.isPending ? "Creating..." : "Create Signal Chat"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const { data: messages = [], isLoading: fetchingMessages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load messages");

      const data = await res.json();
      return data.data || [];
    },
    enabled: !!chatId,
    refetchInterval: 8000,
  });

  const hasMessages = messages.length > 0;

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
      setError(null);
      setSuccess("Signal chat created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setSuccess(null);
      setError(err.message);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!chatId) throw new Error("Please create a chat first");
      if (!isAdmin) throw new Error("Only admins can send signals");

      const formData = new FormData();
      formData.append("chatId", chatId);

      if (message.trim()) formData.append("content", message);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/send-message`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send message");

      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      setError(null);
      setSuccess("Message sent successfully!");
      setTimeout(() => setSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (err: any) => {
      setSuccess(null);
      setError(err.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 pt-12">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Signal Send</h1>
            <p className="mt-1 text-sm text-slate-600">Dashboard &gt; Signal Send</p>
          </div>
        </div>

        <div className="flex h-[700px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-[#B8C3D4] p-5 shadow-sm">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {!isAdmin && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Only admins can send signals. Current role: {role || "guest"}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {fetchingMessages ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-600">Loading messages...</p>
              </div>
            ) : hasMessages ? (
              <div className="space-y-5">
                {messages.map((msg: any) => (
                  <div
                    key={msg._id}
                    className="w-full max-w-[42rem] rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-sm"
                  >
                    {msg.contentType === "file" ? (
                      msg.content.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={msg.content} alt="Uploaded" className="mb-2 w-full rounded-xl" />
                      ) : msg.content.match(/\.(mp4|mov)$/i) ? (
                        <video controls className="mb-2 w-full rounded-xl">
                          <source src={msg.content} type="video/mp4" />
                        </video>
                      ) : (
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 underline"
                        >
                          Download File
                        </a>
                      )
                    ) : (
                      <p className="whitespace-pre-line text-sm text-slate-700">{msg.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-start justify-center pt-6">
                <p className="text-sm font-medium text-slate-700/90">No messages yet.</p>
              </div>
            )}
          </div>

          {chatId ? (
            <div className="mt-6 rounded-[28px] border border-white/70 bg-white px-4 py-4 shadow-sm">
              {selectedFile && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <span className="max-w-[220px] truncate">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-500 transition hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                <Textarea
                  placeholder={isAdmin ? "Type a message..." : "Only admins can send messages"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!isAdmin}
                  className="min-h-[84px] resize-none border-0 bg-transparent px-1 pb-12 pt-1 text-sm text-slate-700 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={3}
                />

                <div className="absolute bottom-0 left-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
                </div>

                <Button
                  size="icon"
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={
                    (!message.trim() && !selectedFile) || !isAdmin || sendMessageMutation.isPending
                  }
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-[#FFD966] text-black shadow-sm hover:bg-[#FACC15] disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border-2 border-dashed border-white/70 bg-white/80 px-6 py-10 text-center shadow-inner">
              <p className="mb-5 text-lg font-medium text-slate-700">
                Create a signal chat to start sending messages
              </p>
              <Button
                onClick={() => createChatMutation.mutate()}
                disabled={createChatMutation.isPending}
                className="rounded-xl bg-[#FFC107] px-6 font-semibold text-black shadow-sm hover:bg-[#FFB300]"
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

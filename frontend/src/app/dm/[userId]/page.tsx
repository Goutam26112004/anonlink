"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatStore } from "../../../store/chatStore";
import { useWebRTC } from "../../../hooks/useWebRTC";
import { useVisualViewportLock } from "../../../hooks/useVisualViewportLock";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Phone, Smile, Plus, Lock, Video, X, ChevronDown, MessageCircle } from "lucide-react";
import { ViewOnceImage } from "../../../components/chat/ViewOnceImage";
import { MessageStatus, mapMessageStatus } from "../../../components/chat/MessageStatus";
import { IncomingCallOverlay, CallingOverlay, ActiveCallUI } from "../../../components/chat/CallOverlay";
import EmojiPicker from "emoji-picker-react";
import type { PrivateChatMessage } from "@anon-chat/types";

// ── Helpers ──
type MessageGroup = {
  sender: "self" | "peer";
  messages: PrivateChatMessage[];
};

function groupMessages(msgs: PrivateChatMessage[], peerId: string): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of msgs) {
    const sender: "self" | "peer" = msg.senderId !== peerId ? "self" : "peer";
    const last = groups[groups.length - 1];
    if (last && last.sender === sender) {
      last.messages.push(msg);
    } else {
      groups.push({ sender, messages: [msg] });
    }
  }
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatLastSeen(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DmPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const token = useChatStore((s) => s.token);
  const { friends, privateMessages, addPrivateChatRoom, socket, canVoice, canVideo, setFeatureAccess } = useChatStore();
  useWebRTC(); // Mount WebRTC hook for call functionality

  // Auth guard
  useEffect(() => {
    if (!token) router.replace("/");
  }, [token, router]);

  const [text, setText] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [viewOnceToggle, setViewOnceToggle] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  useVisualViewportLock(shellRef);

  const peer = friends.find((f) => f.userId === userId);

  // ── Data Fetching ──
  useEffect(() => {
    if (friends.length === 0) {
      import("../../../lib/api").then(({ apiFetch }) => {
        apiFetch("/api/v1/friends").then((data: any) => {
          if (data?.friends) {
            useChatStore.setState({ friends: data.friends });
          }
        }).catch(() => {});
      });
    }
  }, [friends.length]);

  useEffect(() => {
    import("../../../lib/api").then(({ apiFetch }) => {
      apiFetch("/api/v1/subscriptions/features").then((data: any) => {
        if (data) {
          setFeatureAccess(!!data.canVoice, !!data.canVideo, !!data.canGenderFilter);
          if (data.subscriptionActive !== undefined) {
            useChatStore.setState({ subscriptionActive: data.subscriptionActive });
          }
        }
      }).catch(() => {});
    });
  }, [setFeatureAccess]);

  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("private:get_or_create_room", { peerUserId: userId }, (res: { roomId?: string; error?: string }) => {
      if (res.roomId) {
        setRoomId(res.roomId);
        if (peer) {
          addPrivateChatRoom({ roomId: res.roomId, peerUser: peer, lastMessage: null });
        }
      }
      setLoading(false);
    });
  }, [socket, userId, peer, addPrivateChatRoom]);

  // Fetch message history when room is ready
  useEffect(() => {
    if (!roomId) return;
    const existingMessages = (useChatStore.getState().privateMessages as Record<string, any[]>)[roomId];
    if (existingMessages && existingMessages.length > 0) return; // Already loaded
    import("../../../lib/api").then(({ apiFetch }) => {
      apiFetch(`/api/v1/messages/rooms/${roomId}`).then((data: any) => {
        if (data?.messages && data.messages.length > 0) {
          useChatStore.setState((state: any) => ({
            privateMessages: {
              ...state.privateMessages,
              [roomId]: data.messages.map((msg: any) => ({
                ...msg,
                createdAt: msg.createdAt || new Date().toISOString(),
              })),
            },
          }));
        }
      }).catch(() => {});
    });
  }, [roomId]);

  // Mark messages as read on open/room change.
  // Real-time delivered/seen tick updates are handled centrally in
  // useSocket.ts (private:delivered / private:status_update / private:seen)
  // via the store's updateMessageStatus/markRoomSeenBySender actions, so
  // this page doesn't need its own duplicate listeners.
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("private:read", { roomId });
  }, [socket, roomId, userId]);

  // ── Scroll ──
  // ── Scroll & auto-mark messages as read ──
  useEffect(() => {
    if (!showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // Auto-emit read receipt when new messages arrive and page is visible
    if (socket && roomId) {
      socket.emit("private:read", { roomId });
    }
  }, [privateMessages, roomId, showScrollBtn, socket]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

  // ── Emoji picker outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Typing events ──
  useEffect(() => {
    if (!socket || !roomId) return;
    const handleTyping = (payload: { userId: string; isTyping: boolean }) => {
      if (payload.userId === userId) {
        setPeerTyping(payload.isTyping);
        if (payload.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 4000);
        }
      }
    };
    socket.on("private:typing", handleTyping);
    return () => { socket.off("private:typing", handleTyping); };
  }, [socket, roomId, userId]);

  const emitTyping = () => {
    if (socket && roomId) {
      socket.emit("private:typing", { roomId, isTyping: true });
    }
  };

  // ── Actions ──
  const send = () => {
    if (!text.trim() || !roomId || !socket) return;
    socket.emit("private:send", { roomId, text: text.trim() });
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji || emojiData;
    const start = inputRef.current?.selectionStart || text.length;
    setText(text.slice(0, start) + emoji + text.slice(start));
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || !socket) return;
    e.target.value = "";
    setPendingImage(file);
    setViewOnceToggle(true);
  };

  const confirmImageSend = async () => {
    if (!pendingImage || !roomId || !socket) return;
    const formData = new FormData();
    formData.append("image", pendingImage);
    formData.append("roomId", roomId);
    formData.append("viewOnce", viewOnceToggle ? "true" : "false");
    try {
      const token = sessionStorage.getItem("token");
      const { getApiBase } = await import("../../../lib/api");
      const res = await fetch(`${getApiBase()}/api/v1/media/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) return;
      const data = await res.json();
      socket.emit("private:send", { roomId, text: "", imageUrl: data.url, viewOnce: viewOnceToggle });
    } catch {}
    setPendingImage(null);
  };

  // ── Message data ──
  const messages = roomId ? (privateMessages as Record<string, PrivateChatMessage[]>)[roomId] || [] : [];
  const groups = groupMessages(messages, userId);

  return (
    <div ref={shellRef} className="h-dvh vv-lock bg-[var(--color-void)] flex flex-col chat-bg-pattern overflow-hidden" style={{ height: '100dvh' }}>
      {/* ── Header ── */}
      <header className="chat-header-premium shrink-0 z-30">
        <div className="flex items-center justify-between px-3 sm:px-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onMouseEnter={() => router.prefetch("/friends")}
              onClick={() => router.push("/friends")}
              className="icon-btn p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {peer?.avatarUrl ? (
              <img
                src={peer.avatarUrl.startsWith("http") ? peer.avatarUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}${peer.avatarUrl}`}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-[var(--color-border)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-signal-violet)]/20 to-[var(--color-signal-violet)]/5 border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[var(--color-signal-violet)]">
                  {(peer?.displayName || "U")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {peer?.displayName || "User"}
                </p>
                <span className="private-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {peerTyping ? (
                  <span className="text-xs text-cyan-400 animate-pulse">typing...</span>
                ) : (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${peer?.status === "ONLINE" ? "bg-green-500" : "bg-neutral-600"}`} />
                    <span className={`text-xs ${peer?.status === "ONLINE" ? "text-green-500" : "text-[var(--color-text-secondary)]"}`}>
                      {peer?.status === "ONLINE" ? "Online" : peer?.lastSeen ? `Last seen ${formatLastSeen(peer.lastSeen)}` : "Offline"}
                    </span>
                  </>
                )}
                {(peer as any)?.username && (
                  <span className="text-[10px] text-[var(--color-text-secondary)] ml-1">@{(peer as any).username}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowCallModal(true)}
              className="icon-btn p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
              aria-label="Call"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Call Components ── */}
      <IncomingCallOverlay />
      <CallingOverlay />
      <ActiveCallUI />

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
      <div className="max-w-3xl mx-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <div className="w-4 h-4 border-2 border-[var(--color-signal-violet)] border-t-transparent rounded-full animate-spin" />
              Loading messages...
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[var(--color-text-secondary)] opacity-50" />
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                No messages yet
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Say hello to start the conversation!
              </p>
            </div>
          </div>
        ) : (
          groups.map((group, gi) => {
            const isSelf = group.sender === "self";
            const firstMsg = group.messages[0];
            const showDateHeader =
              gi === 0 ||
              new Date(firstMsg.createdAt).toDateString() !==
                new Date(groups[gi - 1].messages[0].createdAt).toDateString();

            return (
              <div key={gi} className="msg-group">
                {showDateHeader && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)] font-medium">
                      {formatDate(firstMsg.createdAt)}
                    </span>
                  </div>
                )}
                {group.messages.map((msg, mi) => {
                  const isFirst = mi === 0;
                  const bubbleClass = isSelf
                    ? isFirst ? "bubble-self" : "bubble-self-cont"
                    : isFirst ? "bubble-peer" : "bubble-peer-cont";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"} ${mi > 0 ? "mt-0.5" : "mt-1"}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-[65%] lg:max-w-[480px] px-3 py-1.5 text-[13.5px] leading-snug ${bubbleClass} ${
                          !isFirst ? (isSelf ? "rounded-tr-md" : "rounded-tl-md") : ""
                        }`}
                      >
                        {(msg as any).imageUrl && (
                          <ViewOnceImage
                            url={(msg as any).imageUrl}
                            viewOnce={(msg as any).viewOnce === true}
                            isMine={isSelf}
                          />
                        )}
                        {msg.text && (
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 float-right ml-2 mt-0.5 ${isSelf ? "text-white/60" : "text-[#8696a0]"}`}>
                          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                          {isSelf && (
                            <MessageStatus status={mapMessageStatus((msg as any).status)} className={isSelf ? "text-[#53bdeb]" : ""} />
                          )}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })
        )}
        {/* Typing indicator */}
        {peerTyping && (
          <div className="flex justify-start mt-2">
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* ── Scroll to bottom FAB ── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setShowScrollBtn(false);
              messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
            }}
            className="absolute left-1/2 -translate-x-1/2 bottom-20 z-20 w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] shadow-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className="chat-input-bar p-2 sm:p-3 relative shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 max-w-3xl mx-auto">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] transition-all shrink-0 cursor-pointer"
            aria-label="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); emitTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none text-sm focus:ring-1 focus:ring-[var(--color-signal-violet)]/50 transition-all"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] transition-all shrink-0 cursor-pointer"
            aria-label="Send image"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              send();
              inputRef.current?.focus();
            }}
            disabled={!text.trim() || loading || !roomId}
            className="btn-send-glow p-2.5 rounded-full text-white shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {showEmojiPicker && (
          <div ref={pickerRef} className="absolute bottom-16 left-2 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSend}
      />

      {/* ── Image Send Modal ── */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-void)]/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Send Image</h3>
              <div className="rounded-xl overflow-hidden mb-4 bg-[var(--color-surface-2)] max-h-48 flex items-center justify-center">
                <img src={URL.createObjectURL(pendingImage)} alt="Preview" className="max-h-48 max-w-full object-contain rounded-xl" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">View Once</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Disappears after viewing (60s)</p>
                </div>
                <button
                  onClick={() => setViewOnceToggle(!viewOnceToggle)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${viewOnceToggle ? "bg-[var(--color-signal-violet)]" : "bg-[var(--color-border)]"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${viewOnceToggle ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPendingImage(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={confirmImageSend} className="flex-1 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-bold hover:brightness-110 transition-all cursor-pointer">
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Call Modal ── */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-void)]/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Start a Call</h3>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="icon-btn p-1.5 text-[var(--color-text-secondary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    if (canVoice && roomId) {
                      setShowCallModal(false);
                      socket?.emit("call:initiate", { roomId, type: "voice" });
                    }
                  }}
                  disabled={!canVoice}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 transition-all ${canVoice ? "hover:bg-[var(--color-surface-2)] cursor-pointer" : "opacity-70 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-3">
                    <Phone className={`w-5 h-5 ${canVoice ? "text-green-400" : "text-[var(--color-text-secondary)]"}`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Voice Call</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Call with voice only</p>
                    </div>
                  </div>
                  {!canVoice && <Lock className="w-4 h-4 text-[var(--color-accent)]" />}
                </button>

                <button
                  onClick={() => {
                    if (canVideo && roomId) {
                      setShowCallModal(false);
                      socket?.emit("call:initiate", { roomId, type: "video" });
                    }
                  }}
                  disabled={!canVideo}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 transition-all ${canVideo ? "hover:bg-[var(--color-surface-2)] cursor-pointer" : "opacity-70 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-3">
                    <Video className={`w-5 h-5 ${canVideo ? "text-blue-400" : "text-[var(--color-text-secondary)]"}`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Video Call</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Call with video and voice</p>
                    </div>
                  </div>
                  {!canVideo && <Lock className="w-4 h-4 text-[var(--color-accent)]" />}
                </button>
              </div>

              {!canVoice && !canVideo && (
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    router.push("/subscription");
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-signal-violet)] to-[var(--color-primary-deep)] text-white font-semibold text-sm hover:brightness-110 shadow-lg shadow-[var(--color-signal-violet)]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Upgrade to Premium
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

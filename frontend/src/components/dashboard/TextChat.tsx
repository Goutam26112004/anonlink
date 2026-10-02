"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Smile, Plus, Send, ChevronDown, MessageCircle,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../../store/chatStore";
import { ViewOnceImage } from "../chat/ViewOnceImage";
import { MessageStatus, mapMessageStatus } from "../chat/MessageStatus";

interface TextChatProps {
  peerName: string | null;
  messages: any[];
  isTyping: boolean;
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onReport: () => void;
  onBlock: () => void;
  onEnd: () => void;
  onSkip: () => void;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onDeclineFriendRequest: (requestId: string) => void;
  onImageSend: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConvertToCall: () => void;
  canCall: boolean;
  isPremium: boolean;
  peerStatus: 'online' | 'offline' | 'typing';
  sessionCode: string | null;
  peerLastSeen: string | null;
}

type MessageGroup = {
  sender: 'self' | 'peer';
  messages: any[];
};

function groupMessages(msgs: any[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of msgs) {
    const sender: 'self' | 'peer' =
      msg.isMine || msg.sender === "self" || msg.senderId === "self" ? "self" : "peer";
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
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}


export function TextChat({
  peerName, messages, isTyping, inputText,
  onInputChange, onSend, onTyping, onReport, onBlock,
  onEnd, onSkip, onSendFriendRequest, onAcceptFriendRequest, onDeclineFriendRequest, onImageSend,
  onConvertToCall, canCall, isPremium, peerStatus,
  sessionCode, peerLastSeen,
}: TextChatProps) {
  const setSessionCode = useChatStore((s) => s.setSessionCode);
  const user = useChatStore((s) => s.user);
  const isPrivateChat = useChatStore((s) => s.isPrivateChat);
  const socket = useChatStore((s) => s.socket);
  const moderationWarning = useChatStore((s) => s.moderationWarning);
  const setModerationWarning = useChatStore((s) => s.setModerationWarning);
  const [showCopied, setShowCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [imageSentOnce, setImageSentOnce] = useState(false);
  const [showImageError, setShowImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    if (force || !showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "instant" : "smooth" });
    }
  }, [showScrollBtn]);

  useEffect(() => {
    if (!showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollBtn]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const friends = useChatStore((s) => s.friends);
  const friendInfo = isPrivateChat ? friends.find(f => f.userId === peerName || f.displayName === peerName) : null;
  const peerLabel = isPrivateChat && friendInfo
    ? friendInfo.displayName || friendInfo.username || "Friend"
    : peerName
      ? `Stranger #${peerName.slice(0, 4).toUpperCase()}`
      : "Stranger";

  const statusDot = peerStatus === 'typing'
    ? 'bg-cyan-400 animate-pulse'
    : peerStatus === 'online'
      ? 'bg-green-500'
      : 'bg-neutral-600';

  let timeAgo = '';
  if (peerLastSeen) {
    const diff = Math.floor((now - new Date(peerLastSeen).getTime()) / 1000);
    if (diff < 10) timeAgo = 'Just now';
    else if (diff < 60) timeAgo = `${diff}s ago`;
    else if (diff < 3600) timeAgo = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) timeAgo = `${Math.floor(diff / 3600)}h ago`;
    else timeAgo = `${Math.floor(diff / 86400)}d ago`;
  }

  const statusText = peerStatus === 'typing'
    ? 'Typing…'
    : peerStatus === 'online'
      ? 'Online'
      : peerLastSeen
        ? `Last seen ${timeAgo}`
        : 'Offline';

  const statusColor = peerStatus === 'typing'
    ? 'text-cyan-400'
    : peerStatus === 'online'
      ? 'text-green-500'
      : 'text-neutral-500';

  const handleCopyCode = useCallback(() => {
    let code = sessionCode;
    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setSessionCode(code);
      setTimeout(() => setSessionCode(null), 60_000);
    }
    navigator.clipboard.writeText(code);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [sessionCode, setSessionCode]);

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji || emojiData;
    const start = inputRef.current?.selectionStart || inputText.length;
    onInputChange(inputText.slice(0, start) + emoji + inputText.slice(start));
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const groups = groupMessages(messages);

  return (
    <div className="flex-1 flex flex-col relative chat-bg-pattern overflow-hidden">

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
      <div className="max-w-3xl mx-auto space-y-1">
        {groups.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[var(--color-text-secondary)]" />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Say hello to start the conversation!
              </p>
            </div>
          </div>
        )}

        {groups.map((group, gi) => {
          const isSelf = group.sender === 'self';
          const firstMsg = group.messages[0];
          const showDateHeader = gi === 0 || (
            new Date(group.messages[0].sentAt).toDateString() !==
            new Date(groups[gi - 1].messages[0].sentAt).toDateString()
          );

          return (
            <div key={gi} className="msg-group">
              {showDateHeader && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)] font-medium">
                    {formatDate(firstMsg.sentAt)}
                  </span>
                </div>
              )}
              {group.messages.map((msg, mi) => {
                const isFirst = mi === 0;

                if (msg.type === 'friend_request') {
                  return (
                    <motion.div
                      key={msg.id || `${gi}-${mi}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex justify-center mt-3"
                    >
                      <div className="w-full max-w-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-signal-violet)]/20 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-[var(--color-signal-violet)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {msg.username || 'Stranger'}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              User since {(() => {
                                if (!msg.senderCreatedAt) return 0;
                                const diffTime = Math.abs(Date.now() - new Date(msg.senderCreatedAt).getTime());
                                return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                              })()} days
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAcceptFriendRequest(msg.requestId)}
                            className="flex-1 py-2 rounded-lg bg-[var(--color-signal-violet)] hover:bg-[var(--color-signal-violet-deep)] text-white text-sm font-semibold transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onDeclineFriendRequest(msg.requestId)}
                            className="flex-1 py-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-danger)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] text-sm font-semibold transition-all border border-[var(--color-border)]"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (msg.type === 'friend_request_sent') {
                  return (
                    <motion.div
                      key={msg.id || `${gi}-${mi}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex justify-center mt-3"
                    >
                      <div className="w-full max-w-xs bg-[var(--color-surface)] border border-[var(--color-warning)]/30 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-warning)]/20 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-[var(--color-warning)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              Friend Request Sent
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              Waiting for response...
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (msg.type === 'friend_request_accepted') {
                  return (
                    <motion.div
                      key={msg.id || `${gi}-${mi}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex justify-center mt-3"
                    >
                      <div className="w-full max-w-xs bg-[var(--color-surface)] border border-[var(--color-success)]/30 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-[var(--color-success)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              Friend Request Accepted
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              {msg.friendName || 'Stranger'} is now your friend!
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (msg.type === 'friend_request_declined') {
                  return (
                    <motion.div
                      key={msg.id || `${gi}-${mi}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex justify-center mt-3"
                    >
                      <div className="w-full max-w-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              Friend Request Declined
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              {msg.friendName || 'Stranger'} declined your request
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                const bubbleClass = isSelf
                  ? isFirst ? 'bubble-self' : 'bubble-self-cont'
                  : isFirst ? 'bubble-peer' : 'bubble-peer-cont';

                return (
                  <motion.div
                    key={msg.id || `${gi}-${mi}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                    className={`flex ${isSelf ? "justify-end" : "justify-start"} ${
                      mi > 0 ? "mt-0.5" : "mt-1"
                    }`}
                  >
                    <div
                      className={`max-w-[78%] sm:max-w-[65%] lg:max-w-[480px] px-3 py-1.5 text-[13.5px] leading-snug ${bubbleClass} ${
                        isFirst ? "" : (isSelf ? "rounded-tr-md" : "rounded-tl-md")
                      }`}
                    >
                      {msg.imageUrl && (
                        <ViewOnceImage
                          url={msg.imageUrl}
                          viewOnce={msg.viewOnce === true}
                          isMine={isSelf}
                        />
                      )}
                      {(msg.text || msg.content) && (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.text || msg.content}
                        </p>
                      )}
                      {mi === group.messages.length - 1 && (
                        <span className={`inline-flex items-center gap-1 mt-0.5 ${
                          isSelf ? "text-white/70" : "text-[var(--color-text-secondary)]"
                        }`}>
                          <span className="text-[10px]">{formatTime(msg.sentAt)}</span>
                          {isSelf && (
                            <MessageStatus status={mapMessageStatus(msg.status)} className="text-[#53bdeb]" />
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start mt-2">
            <div className="bg-[var(--bg-tertiary)] rounded-[18px] rounded-bl-md px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] typing-dot" />
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] typing-dot" />
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] typing-dot" />
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
            onClick={() => { setShowScrollBtn(false); messagesEndRef.current?.scrollIntoView({ behavior: "instant" }); }}
            className="absolute left-1/2 -translate-x-1/2 bottom-20 z-20 w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] shadow-lg"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className="chat-input-bar p-1.5 sm:p-3 shrink-0 relative">
        <div className="flex items-center gap-1 sm:gap-2 max-w-3xl mx-auto">
          {!isPrivateChat && (
            <>
              <button
                onClick={onSkip}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-warning)]/40 hover:bg-[var(--color-warning)]/10 text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-warning)] transition-all shrink-0 cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={onEnd}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10 text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-all shrink-0 cursor-pointer"
              >
                End
              </button>
            </>
          )}

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] transition-all shrink-0 cursor-pointer"
            aria-label="Emoji"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => {
              onInputChange(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none text-sm focus:ring-1 focus:ring-[var(--color-signal-violet)]/50 transition-all"
          />

          <button
            onClick={() => {
              if (!isPrivateChat && user?.registrationType?.toLowerCase() === 'guest') {
                setShowImageError(true);
                setTimeout(() => setShowImageError(false), 3000);
                return;
              }
              if (isPrivateChat) {
                fileInputRef.current?.click();
              } else if (!imageSentOnce) {
                setImageSentOnce(true);
                fileInputRef.current?.click();
              }
            }}
            className={`p-1.5 sm:p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
              !isPrivateChat && imageSentOnce
                ? 'text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)]'
            }`}
            aria-label="Send photo"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onSend();
              inputRef.current?.focus();
            }}
            disabled={!inputText.trim()}
            className="btn-send-glow p-2 sm:p-2.5 rounded-full text-white shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
        onChange={onImageSend}
      />

      <AnimatePresence>
        {showCopied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2 shadow-lg"
          >
            <p className="text-sm text-[var(--color-signal-violet)] font-medium">Session code copied!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moderationWarning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-[var(--color-danger)]/95 backdrop-blur-sm border border-[var(--color-danger)]/30 rounded-2xl px-5 py-3.5 shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white mb-0.5">Message Blocked</p>
                <p className="text-[11px] text-white/80 leading-relaxed">{moderationWarning}</p>
              </div>
              <button onClick={() => setModerationWarning(null)} className="text-white/60 hover:text-white p-1 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-[var(--color-surface)] border border-[var(--color-danger)]/40 rounded-xl px-4 py-2.5 shadow-lg"
          >
            <p className="text-sm text-[var(--color-danger)] font-medium">Only friends can share images.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

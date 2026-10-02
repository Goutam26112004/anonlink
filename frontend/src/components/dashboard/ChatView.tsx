"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, Mic, Video, WifiOff, RefreshCw, Phone, Lock, ArrowRight, UserPlus, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/chatStore";
import { useVisualViewportLock } from "../../hooks/useVisualViewportLock";
import { ModeSelect } from "./ModeSelect";
import { MatchingScreen } from "./MatchingScreen";
import { TextChat } from "./TextChat";
import { MediaChat } from "./MediaChat";
import { PostChat } from "./PostChat";
import { ReportModal } from "./ReportModal";
import { RegisterPopup } from "./RegisterPopup";
import { Button } from "../ui/Button";

interface ChatViewProps {
  joinQueue: (interests: string[], language: string, mediaType: "text" | "voice" | "video", genderPreference?: string, ageRange?: string) => void;
  leaveQueue: (mediaType?: "text" | "voice" | "video") => void;
  sendMessage: (roomId: string, text: string, imageUrl?: string, viewOnce?: boolean) => void;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  skip: () => void;
  endChat: () => void;
  report: (reason: string) => void;
  block: () => void;
  sendFriendRequestInChat: (peerId: string) => void;
  acceptFriendRequestInChat: (requestId: string) => void;
  convertToCall: (roomId: string, mediaType: 'voice' | 'video') => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreenShare: () => void;
  isMicMuted: boolean;
  isCamOff: boolean;
  isSharingScreen: boolean;
  onBack: () => void;
}

export function ChatView({
  joinQueue, leaveQueue, sendMessage, sendTyping, skip, endChat, report, block, sendFriendRequestInChat, acceptFriendRequestInChat, convertToCall,
  toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen, onBack,
}: ChatViewProps) {
  const store = useChatStore();
  const {
    user, matchStatus, roomId, peerName, messages, isTyping, socket,
    activeCount, estimatedWaitSec, chatMode, localStream, remoteStream, connectionQuality,
    canVoice, canVideo, canGenderFilter, elapsedSec, showReportModal, socketDisconnected,
    peerStatus, sessionCode, subscriptionActive, peerLastSeen, isPrivateChat, addNotification,
    setChatMode, addMessage, setElapsedSec, setShowReportModal, setPendingFriendRequestOnReconnect, setPendingAcceptRequestId, setSocketDisconnected, setSessionCode, setPeerStatus,
    callDuration, setCallDuration,
  } = store;

  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [inputText, setInputText] = useState("");
  const [genderPreference, setGenderPreference] = useState<"MALE" | "FEMALE" | "NO_PREFERENCE">("NO_PREFERENCE");
  const [ageRange, setAgeRange] = useState("");
  const [showPreferences, setShowPreferences] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [viewOnceToggle, setViewOnceToggle] = useState(true);
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  useVisualViewportLock(shellRef);

  useEffect(() => {
    if (matchStatus === "searching") {
      const start = Date.now() / 1000;
      timerRef.current = setInterval(() => {
        setElapsedSec(Date.now() / 1000 - start);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchStatus, setElapsedSec]);

  useEffect(() => {
    if (matchStatus === "chat" && (chatMode === "voice" || chatMode === "video")) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(Date.now());
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = null;
      if (matchStatus !== "chat") setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [matchStatus, chatMode, setCallDuration]);

  // Track peer offline and show popup after 30s
  useEffect(() => {
    if (matchStatus === 'chat' && peerStatus === 'offline' && !isPrivateChat) {
      offlineTimerRef.current = setTimeout(() => {
        setShowOfflinePopup(true);
      }, 30000);
    } else {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      setShowOfflinePopup(false);
    }
    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [peerStatus, matchStatus, isPrivateChat]);

  const handleFindMatch = () => {
    joinQueue(interests, language, chatMode, genderPreference, ageRange);
    setElapsedSec(0);
  };

  const handleSelectMode = (mode: "text" | "voice" | "video") => {
    setChatMode(mode);
  };

  const handleCancel = () => {
    leaveQueue(chatMode);
    setElapsedSec(0);
  };

  const handleSend = () => {
    if (!inputText.trim() || !roomId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(roomId, false);
    sendMessage(roomId, inputText.trim());
    addMessage({
      id: Math.random().toString(),
      sender: "self",
      text: inputText.trim(),
      sentAt: new Date().toISOString(),
      isMine: true,
    } as any);
    setInputText("");
  };

  const handleTyping = () => {
    if (!roomId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(roomId, true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(roomId, false);
    }, 2000);
  };

  const handleReportSubmit = (reason: string, details: string, alsoBlock: boolean) => {
    report(reason);
    if (alsoBlock) block();
  };

  const handleBlock = () => {
    block();
    setShowReportModal(false);
  };

  const handleEndChat = () => {
    endChat();
    setElapsedSec(0);
  };

  const handleSendFriendRequest = () => {
    // If user is null (still loading), check if token exists (means they're logged in)
    const isRegistered = user ? (user.registrationType && user.registrationType.toLowerCase() !== 'guest') : !!sessionStorage.getItem('token');
    if (isRegistered) {
      sendFriendRequestInChat(peerName || '');
    } else {
      setPendingRequestId(null);
      setShowRegisterPopup(true);
    }
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    const isRegistered = user ? (user.registrationType && user.registrationType.toLowerCase() !== 'guest') : !!sessionStorage.getItem('token');
    if (isRegistered) {
      acceptFriendRequestInChat(requestId);
    } else {
      setPendingRequestId(requestId);
      setShowRegisterPopup(true);
    }
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    socket?.emit('friend:decline_in_chat', { requestId });
  };

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;
    e.target.value = "";
    setPendingImage(file);
    setViewOnceToggle(true);
  };

  const confirmImageSend = async () => {
    if (!pendingImage || !roomId) return;
    const formData = new FormData();
    formData.append('image', pendingImage);
    formData.append('roomId', roomId);
    formData.append('viewOnce', viewOnceToggle ? 'true' : 'false');

    try {
      const token = sessionStorage.getItem('token');
      const { getApiBase } = await import('../../lib/api');
      const res = await fetch(`${getApiBase()}/api/v1/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) return;
      const data = await res.json();
      sendMessage(roomId, '', data.url, viewOnceToggle);
      addMessage({
        id: Math.random().toString(),
        sender: "self",
        text: '',
        imageUrl: data.url,
        sentAt: new Date().toISOString(),
        isMine: true,
        viewOnce: viewOnceToggle,
      } as any);
    } catch {}
    setPendingImage(null);
  };

  const handleConvertToCall = () => {
    if (!isPrivateChat) {
      // Public chat - only friends can call - show visible toast
      import('../ui/Toast').then(({ toast }) => {
        toast('error', 'Friends Only', 'Voice and video calls are only available between friends. Send a friend request first!');
      }).catch(() => {});
      return;
    }
    setShowCallModal(true);
  };

  const handleStartMedia = async () => {};

  const matchModeIcon = chatMode === "text"
    ? MessageCircle
    : chatMode === "voice"
      ? Mic
      : Video;

  const headerTitle = matchStatus === "searching"
    ? `Searching...`
    : matchStatus === "chat"
      ? `Chatting with ${peerName || "Stranger"}`
      : matchStatus === "partner_left"
        ? "Chat ended"
        : `${chatMode === "text" ? "Text" : chatMode === "voice" ? "Voice" : "Video"} Chat`;

  return (
    <div ref={shellRef} className="h-full vv-lock flex flex-col bg-[var(--color-void)] relative overflow-hidden">
      <header className="chat-header-premium shrink-0 z-30" style={{ minHeight: '64px' }}>
        <div className="flex items-center justify-between px-3 sm:px-4 pl-16 lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {matchStatus === "chat" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-signal-violet)]/20 to-[var(--color-signal-violet)]/5 border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[var(--color-signal-violet)]">
                  {peerName ? peerName.slice(0, 2).toUpperCase() : '??'}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {matchStatus === "chat"
                  ? (isPrivateChat ? peerName || "Friend" : `Stranger #${(peerName || '').slice(0, 4).toUpperCase()}`)
                  : headerTitle}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {matchStatus === "chat" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    peerStatus === 'typing' ? 'bg-cyan-400 animate-pulse' :
                    peerStatus === 'online' ? 'bg-green-500' : 'bg-neutral-600'
                  }`} />
                )}
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
                  {matchStatus === "searching"
                    ? `${Math.floor(elapsedSec)}s elapsed`
                    : matchStatus === "chat"
                      ? peerStatus === "typing" ? "Typing..." : peerStatus === "online" ? "Online" : "Connecting..."
                      : matchStatus === "partner_left"
                        ? "Looking for next?"
                        : `${activeCount} online`}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons - only show during active chat */}
          {matchStatus === "chat" && (
            <div className="flex items-center shrink-0 ml-1">
              {!isPrivateChat && (
                <button
                  onClick={handleSendFriendRequest}
                  className="p-1.5 sm:p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] hover:bg-[var(--color-signal-violet)]/8 cursor-pointer transition-all"
                  aria-label="Add friend"
                  title="Send friend request"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleConvertToCall}
                className="p-1.5 sm:p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-all"
                aria-label="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-1.5 sm:p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/8 cursor-pointer transition-all"
                aria-label="Report"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {matchStatus === "idle" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ModeSelect
            chatMode={chatMode}
            onSelectMode={handleSelectMode}
            onFindMatch={handleFindMatch}
            interests={interests}
            onToggleInterest={(tag) =>
              setInterests((prev) =>
                prev.includes(tag)
                  ? prev.filter((t) => t !== tag)
                  : [...prev, tag]
              )
            }
            canVoice={canVoice}
            canVideo={canVideo}
            activeCount={activeCount}
            estimatedWaitSec={estimatedWaitSec}
            genderPreference={genderPreference}
            onGenderPreferenceChange={setGenderPreference}
            ageRange={ageRange}
            onAgeRangeChange={setAgeRange}
            canGenderFilter={canGenderFilter}
            showPreferences={showPreferences}
            onTogglePreferences={() => setShowPreferences(!showPreferences)}
          />
        </div>
      )}

      {matchStatus === "searching" && (
        <MatchingScreen
          activeCount={activeCount}
          elapsedSec={Math.floor(elapsedSec)}
          onCancel={handleCancel}
        />
      )}

      {(matchStatus === "chat" || matchStatus === "connecting" || matchStatus === "reconnecting") && (
        <>
          {chatMode === "text" ? (
            <TextChat
              peerName={peerName}
              messages={messages}
              isTyping={isTyping}
              inputText={inputText}
              onInputChange={setInputText}
              onSend={handleSend}
              onTyping={handleTyping}
              onReport={() => setShowReportModal(true)}
              onBlock={handleBlock}
              onEnd={handleEndChat}
              onSkip={skip}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onDeclineFriendRequest={handleDeclineFriendRequest}
              onImageSend={handleImageSend}
              onConvertToCall={handleConvertToCall}
              canCall={canVoice || canVideo}
              isPremium={subscriptionActive}
              peerStatus={peerStatus}
              sessionCode={sessionCode}
              peerLastSeen={peerLastSeen}
            />
          ) : (
            <MediaChat
              chatMode={chatMode}
              localStream={localStream}
              remoteStream={remoteStream}
              isMicMuted={isMicMuted}
              isCamOff={isCamOff}
              connectionQuality={connectionQuality}
              onToggleMic={toggleMic}
              onToggleCam={toggleCam}
              onReport={() => setShowReportModal(true)}
              onEnd={handleEndChat}
              onSkip={isPrivateChat ? undefined : skip}
              onStartMedia={handleStartMedia}
              callDuration={callDuration}
            />
          )}
        </>
      )}

      {matchStatus === "partner_left" && (
        <PostChat
          onFindAnother={handleFindMatch}
          onBack={() => useChatStore.getState().setMatchStatus('idle')}
        />
      )}

      {socketDisconnected && (matchStatus === "chat" || matchStatus === "connecting" || matchStatus === "reconnecting") && (
        <div className="absolute inset-0 z-[90] bg-[var(--color-void)]/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-[var(--color-warning)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
              Connection lost
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              We&apos;re trying to reconnect.
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <RefreshCw className="w-4 h-4 text-[var(--color-signal-violet)] animate-spin" />
              <span className="text-sm text-[var(--color-signal-violet)]">Reconnecting...</span>
            </div>
            <Button variant="ghost" size="md" onClick={handleEndChat} className="w-full">
              Leave chat
            </Button>
          </div>
        </div>
      )}

      <RegisterPopup
        open={showRegisterPopup}
        onClose={() => setShowRegisterPopup(false)}
      onSuccess={() => {
        setShowRegisterPopup(false);
        if (pendingRequestId) {
          acceptFriendRequestInChat(pendingRequestId);
        } else {
          sendFriendRequestInChat(peerName || '');
        }
      }}
      />

      {/* ── Peer Offline Popup ── */}
      <AnimatePresence>
        {showOfflinePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] bg-[var(--color-void)]/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center mb-4">
                  <WifiOff className="w-7 h-7 text-[var(--color-warning)]" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1.5">
                  Stranger went offline
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-5 leading-relaxed">
                  They&apos;ve been offline for a while. You can skip to find someone new, or send a friend request to continue later.
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setShowOfflinePopup(false);
                      skip();
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setShowOfflinePopup(false);
                      handleSendFriendRequest();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                    Add Friend
                  </button>
                </div>
                <button
                  onClick={() => setShowOfflinePopup(false)}
                  className="mt-3 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  Keep waiting
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        onBlock={handleBlock}
      />

      {/* ── Image Send Modal with View-Once Toggle ── */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-void)]/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Send Image</h3>
              
              {/* Preview */}
              <div className="rounded-xl overflow-hidden mb-4 bg-[var(--color-surface-2)] max-h-48 flex items-center justify-center">
                <img src={URL.createObjectURL(pendingImage)} alt="Preview" className="max-h-48 max-w-full object-contain rounded-xl" />
              </div>

              {/* View Once Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">View Once</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Image disappears after viewing (60s)</p>
                </div>
                <button
                  onClick={() => setViewOnceToggle(!viewOnceToggle)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${viewOnceToggle ? 'bg-[var(--color-signal-violet)]' : 'bg-[var(--color-border)]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${viewOnceToggle ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingImage(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImageSend}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-bold hover:brightness-110 transition-all"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Call Modal (Locked Options with Premium Upsell) ── */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-void)]/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Start a Call
                </h3>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="p-1 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors"
                >
                  {/* We can use standard X icon or simple text if X not imported, let's use standard text 'X' or dynamic SVG */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Voice Call */}
                <button
                  onClick={() => { if (canVoice && roomId) { convertToCall(roomId, 'voice'); setShowCallModal(false); } }}
                  disabled={!canVoice}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    canVoice
                      ? 'border-[var(--color-signal-violet)]/30 bg-[var(--color-signal-violet)]/5 hover:bg-[var(--color-signal-violet)]/10 cursor-pointer'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/40 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Voice Call</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Call with voice only</p>
                    </div>
                  </div>
                  {!canVoice && <Lock className="w-4 h-4 text-[var(--color-accent)]" />}
                  {canVoice && <ArrowRight className="w-4 h-4 text-[var(--color-signal-violet)]" />}
                </button>

                {/* Video Call */}
                <button
                  onClick={() => { if (canVideo && roomId) { convertToCall(roomId, 'video'); setShowCallModal(false); } }}
                  disabled={!canVideo}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    canVideo
                      ? 'border-[var(--color-signal-violet)]/30 bg-[var(--color-signal-violet)]/5 hover:bg-[var(--color-signal-violet)]/10 cursor-pointer'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/40 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Video Call</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Call with video and voice</p>
                    </div>
                  </div>
                  {!canVideo && <Lock className="w-4 h-4 text-[var(--color-accent)]" />}
                  {canVideo && <ArrowRight className="w-4 h-4 text-[var(--color-signal-violet)]" />}
                </button>
              </div>

              {/* Show upgrade only for free users */}
              {!canVoice && !canVideo && (
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    router.push("/subscription");
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-signal-violet)] to-[var(--color-primary-deep)] text-white font-semibold text-sm hover:brightness-110 shadow-lg shadow-[var(--color-signal-violet)]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Upgrade to Premium</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

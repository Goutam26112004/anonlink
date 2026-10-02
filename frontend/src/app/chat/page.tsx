"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { useSocketActions } from "../../components/SocketProvider";
import { useWebRTC } from "../../hooks/useWebRTC";
import { ChatView } from "../../components/dashboard/ChatView";
import { apiFetch } from "@/lib/api";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function ChatPage() {
  const router = useRouter();
  const { token, setFeatureAccess } = useChatStore();
  const { joinQueue, leaveQueue, sendMessage, sendTyping, skip, endChat, report, block, sendFriendRequestInChat, acceptFriendRequestInChat, convertToCall } = useSocketActions();
  const { toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen } = useWebRTC();

  useEffect(() => {
    if (!token) router.push("/");
    const currentStatus = useChatStore.getState().matchStatus;
    
    // If already in active chat, no need to restore
    if (currentStatus === 'chat') return;
    
    // Reset partner_left to idle
    if (currentStatus === 'partner_left') {
      useChatStore.getState().setMatchStatus('idle');
      return;
    }

    // Try to restore active chat from sessionStorage
    try {
      const saved = sessionStorage.getItem('activeChat');
      if (saved) {
        const { roomId, peerName, messages, matchStatus } = JSON.parse(saved);
        if (roomId && matchStatus === 'chat') {
          useChatStore.setState({
            roomId,
            peerName,
            messages: messages || [],
            matchStatus: 'reconnecting',
          });
        }
      }
    } catch {}
  }, [token, router]);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await apiFetch("/api/v1/subscriptions/features");
        if (data) {
          setFeatureAccess(data.canVoice, data.canVideo, data.canGenderFilter);
          useChatStore.getState().setSubscriptionStatus(!!data.subscriptionActive, null);
        }
      } catch {}
    };
    if (token) fetchFeatures();
  }, [token, setFeatureAccess]);

  // Persist active chat state to sessionStorage
  useEffect(() => {
    const unsub = useChatStore.subscribe((state) => {
      if (state.matchStatus === 'chat' && state.roomId) {
        try {
          sessionStorage.setItem('activeChat', JSON.stringify({
            roomId: state.roomId,
            peerName: state.peerName,
            matchStatus: 'chat',
            messages: state.messages.slice(-100),
          }));
        } catch {}
      }
    });
    return unsub;
  }, []);

  return (
    <AuthenticatedLayout>
      <ChatView
        joinQueue={joinQueue}
        leaveQueue={leaveQueue}
        sendMessage={sendMessage}
        sendTyping={sendTyping}
        skip={skip}
        endChat={endChat}
        report={report}
        block={block}
        sendFriendRequestInChat={sendFriendRequestInChat}
        acceptFriendRequestInChat={acceptFriendRequestInChat}
        convertToCall={convertToCall}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        toggleScreenShare={toggleScreenShare}
        isMicMuted={isMicMuted}
        isCamOff={isCamOff}
        isSharingScreen={isSharingScreen}
        onBack={() => router.push("/dashboard")}
      />
    </AuthenticatedLayout>
  );
}

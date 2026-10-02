import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { ChatMessage, UserSession, GenderPreference, SubscriptionPlanType, PrivateChatMessage, FriendRequestData, FriendData, MessageStatusType } from '@anon-chat/types';

export interface Friend {
  id: string;
  email: string;
}

interface ChatState {
  token: string | null;
  user: UserSession | null;
  matchStatus: 'idle' | 'searching' | 'connecting' | 'chat' | 'partner_left' | 'reconnecting';
  roomId: string | null;
  peerName: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  theme: 'dark' | 'light';
  friends: FriendData[];
  friendRequests: FriendRequestData[];
  showFriendRequestPopup: boolean;
  pendingFriendRequest: FriendRequestData | null;
  setShowFriendRequestPopup: (show: boolean) => void;
  setPendingFriendRequest: (data: FriendRequestData | null) => void;
  pendingFriendRequestOnReconnect: boolean;
  setPendingFriendRequestOnReconnect: (v: boolean) => void;
  pendingAcceptRequestId: string | null;
  setPendingAcceptRequestId: (id: string | null) => void;
  notifications: Array<{ id: string; title: string; message: string; isRead: boolean }>;
  showReportModal: boolean;
  elapsedSec: number;
  consentGiven: boolean;
  blockedUsers: string[];
  socketDisconnected: boolean;
  peerStatus: 'online' | 'offline' | 'typing';
  sessionCode: string | null;
  socket: Socket | null;
  isPrivateChat: boolean;
  setIsPrivateChat: (isPrivate: boolean) => void;

  // Chat mode
  chatMode: 'text' | 'voice' | 'video';
  isCallOfferer: boolean;
  
  // Call state
  incomingCall: { roomId: string; type: 'voice' | 'video'; initiatedBy: string; initiatorName: string } | null;
  activeCall: { roomId: string; type: 'voice' | 'video'; peerName: string } | null;
  isCallFullscreen: boolean;

  // Private messages
  privateChatRooms: Array<{ roomId: string; peerUser: FriendData; lastMessage: PrivateChatMessage | null }>;
  privateMessages: Record<string, PrivateChatMessage[]>;
  activePrivateRoom: string | null;

  // Media streams states
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  pc: RTCPeerConnection | null;
  isMicMuted: boolean;
  isCamOff: boolean;
  connectionQuality: 'excellent' | 'fair' | 'poor' | 'searching';

  // Matchmaking Queue Stats
  activeCount: number;
  estimatedWaitSec: number;
  queuePosition: number;

  // Call duration
  callDuration: number;

  // Subscription & Feature Access
  onboardingComplete: boolean;
  subscriptionActive: boolean;
  subscriptionPlan: SubscriptionPlanType | null;
  canVoice: boolean;
  canVideo: boolean;
  canGenderFilter: boolean;
  genderPreference: GenderPreference;

  setToken: (token: string | null) => void;
  setUser: (user: UserSession | null) => void;
  setMatchStatus: (status: 'idle' | 'searching' | 'connecting' | 'chat' | 'partner_left' | 'reconnecting') => void;
  setRoomId: (roomId: string | null) => void;
  setPeerName: (name: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  removeMessageById: (id: string) => void;
  clearMessages: () => void;
  setIsTyping: (typing: boolean) => void;
  toggleTheme: () => void;
  setFriends: (friends: FriendData[]) => void;
  addFriend: (friend: FriendData) => void;
  setFriendRequests: (requests: FriendRequestData[]) => void;
  addFriendRequest: (req: FriendRequestData) => void;
  removeFriendRequest: (id: string) => void;
  addNotification: (notif: { title: string; message: string }) => void;
  setChatMode: (mode: 'text' | 'voice' | 'video') => void;

  // Private chat
  setPrivateChatRooms: (rooms: Array<{ roomId: string; peerUser: FriendData; lastMessage: PrivateChatMessage | null }>) => void;
  addPrivateChatRoom: (room: { roomId: string; peerUser: FriendData; lastMessage: PrivateChatMessage | null }) => void;
  setPrivateMessages: (roomId: string, messages: PrivateChatMessage[]) => void;
  addPrivateMessage: (roomId: string, msg: PrivateChatMessage) => void;
  updateMessageStatus: (roomId: string, messageId: string, status: MessageStatusType) => void;
  markRoomSeenBySender: (roomId: string, senderId: string) => void;
  setActivePrivateRoom: (roomId: string | null) => void;

  // Media stream setters
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setPc: (pc: RTCPeerConnection | null) => void;
  setMicMuted: (muted: boolean) => void;
  setCamOff: (off: boolean) => void;
  setConnectionQuality: (quality: 'excellent' | 'fair' | 'poor' | 'searching') => void;

  // Queue stats setters
  setQueueStats: (count: number, wait: number) => void;
  setQueuePosition: (pos: number) => void;
  setCallDuration: (dur: number) => void;

  // Subscription setters
  setOnboardingComplete: (v: boolean) => void;
  setSubscriptionStatus: (active: boolean, plan: SubscriptionPlanType | null) => void;
  setFeatureAccess: (canVoice: boolean, canVideo: boolean, canGenderFilter: boolean) => void;
  setGenderPreference: (pref: GenderPreference) => void;
  setShowReportModal: (show: boolean) => void;
  setElapsedSec: (sec: number) => void;
  setConsentGiven: (v: boolean) => void;
  addBlockedUser: (peerId: string) => void;
  setSocketDisconnected: (v: boolean) => void;
  setPeerStatus: (status: 'online' | 'offline' | 'typing') => void;
  setSessionCode: (code: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  peerLastSeen: string | null;
  setPeerLastSeen: (time: string | null) => void;
  moderationWarning: string | null;
  setModerationWarning: (msg: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  token: typeof window !== 'undefined' ? sessionStorage.getItem('token') : null,
  user: null,
  matchStatus: 'idle',
  roomId: null,
  peerName: null,
  messages: [],
  isTyping: false,
  theme: 'dark',
  friends: [],
  friendRequests: [],
  showFriendRequestPopup: false,
  isPrivateChat: false,
  pendingFriendRequest: null,
  pendingFriendRequestOnReconnect: false,
  pendingAcceptRequestId: null,
  notifications: [],
  chatMode: 'text',
  isCallOfferer: false,
  incomingCall: null,
  activeCall: null,
  isCallFullscreen: false,
  privateChatRooms: [],
  privateMessages: {},
  activePrivateRoom: null,

  localStream: null,
  remoteStream: null,
  screenStream: null,
  pc: null,
  isMicMuted: false,
  isCamOff: false,
  connectionQuality: 'searching',

  activeCount: 0,
  estimatedWaitSec: 0,
  queuePosition: 0,
  callDuration: 0,

  onboardingComplete: false,
  subscriptionActive: false,
  subscriptionPlan: null,
  canVoice: false,
  canVideo: false,
  canGenderFilter: false,
  genderPreference: 'NO_PREFERENCE',
  showReportModal: false,
  elapsedSec: 0,
  consentGiven: false,
  blockedUsers: [],
  socketDisconnected: false,
  peerStatus: 'offline',
  sessionCode: null,
  socket: null,
  peerLastSeen: null,
  moderationWarning: null,

  setToken: (token) => {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setMatchStatus: (matchStatus) => set((state) => {
    if (matchStatus !== 'chat') {
      return { matchStatus, isPrivateChat: false };
    }
    return { matchStatus };
  }),
  setIsPrivateChat: (isPrivateChat) => set({ isPrivateChat }),
  setRoomId: (roomId) => set({ roomId }),
  setPeerName: (peerName) => set({ peerName }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  removeMessageById: (id) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== id)
  })),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (isTyping) => set({ isTyping }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) => set((state) => ({
    friends: state.friends.some((f) => f.id === friend.id)
      ? state.friends
      : [...state.friends, friend]
  })),
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  addFriendRequest: (req) => set((state) => ({ friendRequests: [...state.friendRequests.filter(r => r.id !== req.id), req] })),
  removeFriendRequest: (id) => set((state) => ({ friendRequests: state.friendRequests.filter(r => r.id !== id) })),
  setShowFriendRequestPopup: (showFriendRequestPopup) => set({ showFriendRequestPopup }),
  setPendingFriendRequest: (pendingFriendRequest) => set({ pendingFriendRequest }),
  setPendingFriendRequestOnReconnect: (pendingFriendRequestOnReconnect) => set({ pendingFriendRequestOnReconnect }),
  setPendingAcceptRequestId: (pendingAcceptRequestId) => set({ pendingAcceptRequestId }),
  addNotification: (notif) => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Math.random().toString(), isRead: false, ...notif }
    ]
  })),
  setChatMode: (chatMode) => set({ chatMode }),

  setPrivateChatRooms: (privateChatRooms) => set({ privateChatRooms }),
  addPrivateChatRoom: (room) => set((state) => {
    const exists = state.privateChatRooms.find(r => r.roomId === room.roomId);
    if (exists) return state;
    return { privateChatRooms: [...state.privateChatRooms, room] };
  }),
  setPrivateMessages: (roomId, messages) => set((state) => ({
    privateMessages: { ...state.privateMessages, [roomId]: messages }
  })),
  addPrivateMessage: (roomId, msg) => set((state) => {
    const currentMsgs = state.privateMessages[roomId] || [];
    if (currentMsgs.some((m) => m.id === msg.id)) {
      return state;
    }
    return {
      privateMessages: {
        ...state.privateMessages,
        [roomId]: [...currentMsgs, msg]
      }
    };
  }),
  updateMessageStatus: (roomId, messageId, status) => set((state) => {
    const msgs = state.privateMessages[roomId];
    if (!msgs) return state;
    return {
      privateMessages: {
        ...state.privateMessages,
        [roomId]: msgs.map((m) => m.id === messageId ? { ...m, status } : m),
      }
    };
  }),
  markRoomSeenBySender: (roomId, senderId) => set((state) => {
    const msgs = state.privateMessages[roomId];
    if (!msgs) return state;
    return {
      privateMessages: {
        ...state.privateMessages,
        [roomId]: msgs.map((m) => m.senderId === senderId ? { ...m, status: 'SEEN' as MessageStatusType } : m),
      }
    };
  }),
  setActivePrivateRoom: (activePrivateRoom) => set({ activePrivateRoom }),

  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setPc: (pc) => set({ pc }),
  setMicMuted: (isMicMuted) => set({ isMicMuted }),
  setCamOff: (isCamOff) => set({ isCamOff }),
  setConnectionQuality: (connectionQuality) => set({ connectionQuality }),

  setQueueStats: (activeCount, estimatedWaitSec) => set({ activeCount, estimatedWaitSec }),
  setQueuePosition: (queuePosition) => set({ queuePosition }),
  setCallDuration: (callDuration) => set({ callDuration }),

  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  setSubscriptionStatus: (subscriptionActive, subscriptionPlan) => set({ subscriptionActive, subscriptionPlan }),
  setFeatureAccess: (canVoice, canVideo, canGenderFilter) => set({ canVoice, canVideo, canGenderFilter }),
  setGenderPreference: (genderPreference) => set({ genderPreference }),
  setShowReportModal: (showReportModal) => set({ showReportModal }),
  setElapsedSec: (elapsedSec) => set({ elapsedSec }),
  setConsentGiven: (consentGiven) => set({ consentGiven }),
  addBlockedUser: (peerId) => set((state) => ({
    blockedUsers: state.blockedUsers.includes(peerId) ? state.blockedUsers : [...state.blockedUsers, peerId],
  })),
  setSocketDisconnected: (socketDisconnected) => set({ socketDisconnected }),
  setPeerStatus: (peerStatus) => set({ peerStatus }),
  setSessionCode: (sessionCode) => set({ sessionCode }),
  setSocket: (socket) => set({ socket }),
  setPeerLastSeen: (peerLastSeen) => set({ peerLastSeen }),
  setModerationWarning: (moderationWarning) => set({ moderationWarning }),
}));

import { create } from 'zustand';
import { ChatMessage, UserSession, GenderPreference, SubscriptionPlanType } from '@anon-chat/types';

export interface Friend {
  id: string;
  email: string;
  level: number;
  reputationScore: number;
}

interface ChatState {
  token: string | null;
  user: UserSession | null;
  matchStatus: 'idle' | 'searching' | 'connecting' | 'chat';
  roomId: string | null;
  peerName: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  theme: 'dark' | 'light';
  friends: Friend[];
  notifications: Array<{ id: string; title: string; message: string; isRead: boolean }>;
  
  // Media streams states for Phase 4
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  pc: RTCPeerConnection | null;
  isMicMuted: boolean;
  isCamOff: boolean;
  connectionQuality: 'excellent' | 'fair' | 'poor' | 'searching';

  // Matchmaking Queue Stats for Phase 5
  activeCount: number;
  estimatedWaitSec: number;

  // Subscription & Feature Access (Phase 13)
  onboardingComplete: boolean;
  subscriptionActive: boolean;
  subscriptionPlan: SubscriptionPlanType | null;
  canVoice: boolean;
  canVideo: boolean;
  canGenderFilter: boolean;
  genderPreference: GenderPreference;
  
  setToken: (token: string | null) => void;
  setUser: (user: UserSession | null) => void;
  setMatchStatus: (status: 'idle' | 'searching' | 'connecting' | 'chat') => void;
  setRoomId: (roomId: string | null) => void;
  setPeerName: (name: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  setIsTyping: (typing: boolean) => void;
  toggleTheme: () => void;
  setFriends: (friends: Friend[]) => void;
  addNotification: (notif: { title: string; message: string }) => void;
  
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

  // Subscription setters
  setOnboardingComplete: (v: boolean) => void;
  setSubscriptionStatus: (active: boolean, plan: SubscriptionPlanType | null) => void;
  setFeatureAccess: (canVoice: boolean, canVideo: boolean, canGenderFilter: boolean) => void;
  setGenderPreference: (pref: GenderPreference) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  matchStatus: 'idle',
  roomId: null,
  peerName: null,
  messages: [],
  isTyping: false,
  theme: 'dark',
  friends: [],
  notifications: [],
  
  localStream: null,
  remoteStream: null,
  screenStream: null,
  pc: null,
  isMicMuted: false,
  isCamOff: false,
  connectionQuality: 'searching',

  activeCount: 0,
  estimatedWaitSec: 0,

  // Subscription & onboarding state
  onboardingComplete: false,
  subscriptionActive: false,
  subscriptionPlan: null,
  canVoice: false,
  canVideo: false,
  canGenderFilter: false,
  genderPreference: 'NO_PREFERENCE',

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setMatchStatus: (matchStatus) => set({ matchStatus }),
  setRoomId: (roomId) => set({ roomId }),
  setPeerName: (peerName) => set({ peerName }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (isTyping) => set({ isTyping }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setFriends: (friends) => set({ friends }),
  addNotification: (notif) => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Math.random().toString(), isRead: false, ...notif }
    ]
  })),
  
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  setPc: (pc) => set({ pc }),
  setMicMuted: (isMicMuted) => set({ isMicMuted }),
  setCamOff: (isCamOff) => set({ isCamOff }),
  setConnectionQuality: (connectionQuality) => set({ connectionQuality }),

  setQueueStats: (activeCount, estimatedWaitSec) => set({ activeCount, estimatedWaitSec }),

  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
  setSubscriptionStatus: (subscriptionActive, subscriptionPlan) => set({ subscriptionActive, subscriptionPlan }),
  setFeatureAccess: (canVoice, canVideo, canGenderFilter) => set({ canVoice, canVideo, canGenderFilter }),
  setGenderPreference: (genderPreference) => set({ genderPreference }),
}));

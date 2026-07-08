export type MediaType = 'text' | 'voice' | 'video';

export type UserType = 'GUEST' | 'FREE' | 'PAID';
export type AgeRange = 'UNDER_18' | 'AGE_18_24' | 'AGE_25_34' | 'AGE_35_44' | 'AGE_45_PLUS';
export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
export type GenderPreference = 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
export type SubscriptionPlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type FriendRequestStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type MessageStatusType = 'SENDING' | 'SENT' | 'DELIVERED' | 'SEEN';
export type UserStatusType = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';

export interface UserSettings {
  theme: 'light' | 'dark';
  languagePref: string;
  soundEnabled: boolean;
  defaultVideoEnabled: boolean;
  discoverable: boolean;
  notificationsEnabled: boolean;
  showLastSeen: boolean;
  showOnlineStatus: boolean;
}

export interface UserSession {
  userId: string;
  email: string | null;
  registrationType: 'GUEST' | 'OAUTH' | 'EMAIL' | 'guest' | 'oauth' | 'email';
  userType: UserType;
  emailVerified?: boolean;
  reputationScore: number;
  experiencePoints?: number;
  level: number;
  isShadowBanned?: boolean;
  avatarUrl?: string | null;
  displayName?: string | null;
  bio?: string | null;
  status?: UserStatusType;
  lastSeen?: string;
  onboardingComplete: boolean;
  subscriptionActive?: boolean;
  subscriptionPlan?: SubscriptionPlanType | null;
  genderPreference?: GenderPreference;
}

export interface SubscriptionPlan {
  id: string;
  type: SubscriptionPlanType;
  priceInr: number;
  validityDays: number;
  isActive: boolean;
  isVoiceEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface UserSubscription {
  id: string;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  purchasedAt: string;
  expiresAt: string;
  grantedByAdmin: boolean;
  transactionRef: string | null;
}

export interface MatchFilters {
  interests: string[];
  mediaType: MediaType;
  language: string;
  genderPreference?: GenderPreference;
}

export interface MatchFoundPayload {
  roomId: string;
  peerName: string;
  isVideoCapable: boolean;
  isAi: boolean;
  e2eePublicKey?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'stranger';
  text: string;
  sentAt: string;
  encrypted: boolean;
}

export interface PrivateChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string | null;
  status: MessageStatusType;
  replyToId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface TemporaryMediaMessage {
  mediaId: string;
  expiresAt: string;
  ttlSeconds: number;
  url: string;
}

export interface WebRTCSignal {
  candidate?: any;
  sdp?: any;
}

export interface FriendRequestData {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatusType;
  sender?: {
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    level: number;
    status: UserStatusType;
  };
  receiver?: {
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    level: number;
    status: UserStatusType;
  };
  createdAt: string;
}

export interface FriendData {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  reputationScore: number;
  status: UserStatusType;
  lastSeen: string;
  friendSince: string;
  isFavorite: boolean;
  note: string | null;
}

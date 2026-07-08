export type MediaType = 'text' | 'voice' | 'video';

export type UserType = 'GUEST' | 'FREE' | 'PAID';
export type AgeRange = 'UNDER_18' | 'AGE_18_24' | 'AGE_25_34' | 'AGE_35_44' | 'AGE_45_PLUS';
export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
export type GenderPreference = 'MALE' | 'FEMALE' | 'NO_PREFERENCE';
export type SubscriptionPlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface UserSettings {
  theme: 'light' | 'dark';
  languagePref: string;
  soundEnabled: boolean;
  defaultVideoEnabled: boolean;
  discoverable: boolean;
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
  country: string;
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


export interface UserSettings {
  theme: 'light' | 'dark';
  languagePref: string;
  soundEnabled: boolean;
  defaultVideoEnabled: boolean;
  discoverable: boolean;
}

export interface UserSession {
  userId: string;
  email: string | null;
  registrationType: 'GUEST' | 'OAUTH' | 'EMAIL' | 'guest' | 'oauth' | 'email';
  emailVerified: boolean;
  reputationScore: number;
  experiencePoints: number;
  level: number;
  isShadowBanned: boolean;
}

export interface MatchFilters {
  interests: string[];
  mediaType: MediaType;
  language: string;
  country: string;
}

export interface MatchFoundPayload {
  roomId: string;
  peerName: string;
  isVideoCapable: boolean;
  isAi: boolean;
  e2eePublicKey?: string; // Client DH public key for E2EE text chats
}

export interface ChatMessage {
  id: string;
  sender: 'self' | 'stranger';
  text: string;
  sentAt: string;
  encrypted: boolean;
}

export interface WebRTCSignal {
  candidate?: any;
  sdp?: any;
}

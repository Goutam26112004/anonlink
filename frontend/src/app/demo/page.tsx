"use client";

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Mic, MicOff, Video, VideoOff, Users, Bell, Settings,
  Search, MessageSquare, Crown, ChevronLeft, Menu,
  Zap, Activity, Globe, Heart, UserCheck, X, Lock,
  Clock, ChevronRight, Filter, Check, AlertCircle,
  LayoutDashboard, Award, User, HelpCircle, Shield, FileText, LogOut,
  LayoutGrid, List, RefreshCw, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLogo } from '../../components/AnimatedLogo';
import { NetworkGraph } from '../../components/illustrations/NetworkGraph';
import { ConnectionLines } from '../../components/illustrations/ConnectionLines';

type ViewMode = 'hub' | 'chat' | 'subscription';
type MatchStatus = 'idle' | 'searching' | 'chat' | 'connecting';
type ChatMode = 'text' | 'voice' | 'video';

interface ChatMessage {
  id: string;
  sender: 'self' | 'stranger';
  text: string;
  sentAt: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', sender: 'self', text: 'Hey there!', sentAt: new Date().toISOString() },
  { id: '2', sender: 'stranger', text: 'Hi! How are you?', sentAt: new Date(Date.now() + 2000).toISOString() },
  { id: '3', sender: 'self', text: "I'm good, you?", sentAt: new Date(Date.now() + 4000).toISOString() },
  { id: '4', sender: 'stranger', text: 'Doing great!', sentAt: new Date(Date.now() + 6000).toISOString() },
];

const PLAN_META: Record<string, { label: string; badge: string; gradient: string }> = {
  DAILY:   { label: 'Daily',   badge: 'Try it out',  gradient: 'from-slate-500 to-slate-600' },
  WEEKLY:  { label: 'Weekly',  badge: 'Most Popular', gradient: 'from-cyan-500 to-violet-500' },
  MONTHLY: { label: 'Monthly', badge: 'Best Value',  gradient: 'from-violet-500 to-fuchsia-500' },
};

const ALL_FEATURES = [
  { label: 'Text Chat', ok: true },
  { label: 'Image Sharing (60s)', ok: true },
  { label: 'Report & Block', ok: true },
  { label: 'Voice Chat', ok: true },
  { label: 'Video Chat', ok: true },
  { label: 'Gender Filter', ok: true },
];

const MOCK_PLANS = [
  { id: 'daily', type: 'DAILY', priceInr: 29, validityDays: 1, isActive: true, isVoiceEnabled: true, isVideoEnabled: true },
  { id: 'weekly', type: 'WEEKLY', priceInr: 149, validityDays: 7, isActive: true, isVoiceEnabled: true, isVideoEnabled: true },
  { id: 'monthly', type: 'MONTHLY', priceInr: 399, validityDays: 30, isActive: true, isVoiceEnabled: true, isVideoEnabled: true },
];

function formatCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Random Chat', icon: MessageCircle },
  { label: 'Friends', icon: Users },
  { label: 'Notifications', icon: Bell },
  { label: 'Subscription', icon: Crown },
  { label: 'Achievements', icon: Award },
  { label: 'Profile', icon: User },
  { label: 'Settings', icon: Settings },
];

const bottomItems = [
  { label: 'Help', icon: HelpCircle },
  { label: 'Privacy Policy', icon: Shield },
  { label: 'Terms of Service', icon: FileText },
  { label: 'Community Guidelines', icon: FileText },
];

export default function DemoPage() {
  const [view, setView] = useState<ViewMode>('hub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'notifications' | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [genderPreference, setGenderPreference] = useState<'MALE' | 'FEMALE' | 'NO_PREFERENCE'>('NO_PREFERENCE');
  const [ageRange, setAgeRange] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'fair' | 'poor' | 'searching'>('excellent');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeCount = 1337;
  const friendsOnline = 12;
  const messagesToday = activeCount * 12;
  const activeChats = Math.floor(activeCount * 0.3);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoReplyRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({});
  }, [messages]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (autoReplyRef.current) clearTimeout(autoReplyRef.current);
    };
  }, []);

  const handleStartChat = (mode: ChatMode) => {
    setChatMode(mode);
    setMatchStatus('idle');
    setRoomId(null);
    setPeerName(null);
    setMessages([]);
    setView('chat');
  };

  const handleJoinQueue = () => {
    setMatchStatus('searching');
    searchTimerRef.current = setTimeout(() => {
      setRoomId('demo-room-123');
      setPeerName('Demo Stranger');
      setMatchStatus('chat');
      setMessages(MOCK_MESSAGES);
    }, 3000);
  };

  const handleLeaveQueue = () => {
    setMatchStatus('idle');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  };

  const handleEndChat = () => {
    setMatchStatus('idle');
    setRoomId(null);
    setPeerName(null);
    setMessages([]);
  };

  const handleSkip = () => {
    setMatchStatus('idle');
    setRoomId(null);
    setPeerName(null);
    setMessages([]);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'self',
      text: inputText.trim(),
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    if (autoReplyRef.current) clearTimeout(autoReplyRef.current);
    autoReplyRef.current = setTimeout(() => {
      const replies = ['lol nice', 'haha agreed', 'for real!', 'tell me about it', 'interesting...'];
      const reply: ChatMessage = {
        id: Math.random().toString(),
        sender: 'stranger',
        text: replies[Math.floor(Math.random() * replies.length)],
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const handleSendFriendRequest = () => {
    // demo only
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col ${sidebarCollapsed ? 'items-center' : ''} bg-[var(--color-surface)]`}>
      <div className={`p-3 border-b border-[var(--color-border)] ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        <AnimatedLogo size={28} showText={!sidebarCollapsed} />
      </div>
      <nav className="flex-1 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.label === 'Subscription') setView('subscription');
              else if (item.label === 'Dashboard') setView('hub');
              setSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              sidebarCollapsed ? 'justify-center mx-auto w-12' : ''
            } ${
              item.label === 'Dashboard' && view === 'hub'
                ? 'bg-[var(--brand-subtle)] text-[var(--color-signal-violet)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
            }`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border)] py-2 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              sidebarCollapsed ? 'justify-center mx-auto w-12' : ''
            } text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
            sidebarCollapsed ? 'justify-center mx-auto w-12' : ''
          } text-[var(--danger)] hover:bg-[var(--danger-subtle)]`}
          title={sidebarCollapsed ? 'Exit Demo' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Exit Demo</span>}
        </button>
      </div>
    </div>
  );

  const renderHub = () => (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="px-2.5 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--color-signal-violet)]/30 text-xs font-semibold text-[var(--color-signal-violet)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Demo Mode
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, Demo User</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Choose how you want to connect</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid sm:grid-cols-3 gap-4 mb-8"
          >
            {([
              { mode: 'text' as const, icon: MessageCircle, title: 'Text Chat', desc: 'Start a random text conversation.', gradient: 'from-indigo-500 to-blue-500' },
              { mode: 'voice' as const, icon: Mic, title: 'Voice Chat', desc: 'Talk in real-time voice calls.', gradient: 'from-emerald-500 to-teal-500' },
              { mode: 'video' as const, icon: Video, title: 'Video Chat', desc: 'Face-to-face video calls.', gradient: 'from-purple-500 to-pink-500' },
            ]).map((card) => (
              <motion.button
                key={card.mode}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartChat(card.mode)}
                className="glass-card rounded-2xl p-5 sm:p-6 text-left transition-all cursor-pointer hover:shadow-[var(--shadow-glass-hover)] group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">{card.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">{card.desc}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {activeCount} live</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~5s wait</span>
                </div>
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="glass-card rounded-2xl p-5 sm:p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Live Statistics</h3>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { icon: Users, label: 'Users Online', value: activeCount },
                { icon: Search, label: 'Users Searching', value: Math.max(0, activeCount - Math.floor(activeCount * 0.6)) },
                { icon: MessageCircle, label: 'Chats Active', value: activeChats },
                { icon: UserCheck, label: 'Friends Online', value: friendsOnline },
                { icon: Heart, label: 'Messages Today', value: messagesToday },
                { icon: Globe, label: 'Server Status', value: 'Operational', isText: true },
              ].map((stat, i) => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden">
                  <stat.icon className="w-5 h-5 mx-auto mb-1.5 text-[var(--color-signal-violet)]" />
                  <p className="text-lg font-extrabold">{stat.isText ? stat.value : stat.value.toLocaleString()}</p>
                  <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="glass-card rounded-2xl p-5 sm:p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Quick Actions</h3>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Zap className="w-3 h-3" /> Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { icon: Zap, label: 'Random Chat', onClick: () => handleStartChat('text'), gradient: 'from-indigo-500 to-purple-500' },
                { icon: Users, label: 'Friends', onClick: () => setActiveTab('friends'), gradient: 'from-emerald-500 to-teal-500' },
                { icon: Bell, label: 'Notifications', onClick: () => setActiveTab('notifications'), gradient: 'from-amber-500 to-orange-500' },
                { icon: Settings, label: 'Settings', gradient: 'from-slate-500 to-slate-600' },
                { icon: Crown, label: 'Premium', onClick: () => setView('subscription'), gradient: 'from-rose-500 to-pink-500' },
                { icon: MessageSquare, label: 'Safety', gradient: 'from-blue-500 to-cyan-500' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:bg-[var(--bg-elevated)] transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium truncate">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">Activity Feed</h3>
            <div className="space-y-3">
              {[
                { icon: Users, text: `${friendsOnline} friends online`, time: 'Now', color: 'var(--color-signal-coral)' },
                { icon: Heart, text: `${messagesToday.toLocaleString()} messages today`, time: 'Live', color: 'var(--lavender)' },
                { icon: Activity, text: `${activeChats} active chats`, time: 'Live', color: 'var(--cyan)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center" style={{ color: item.color }}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm flex-1">{item.text}</p>
                  <span className="text-xs text-[var(--text-muted)]">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );

  const renderChat = () => (
    <div className="flex-1 flex flex-col">
      <header className="glass-heavy border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('hub')} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] capitalize">{chatMode} Chat</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {matchStatus === 'searching' ? 'Searching...' :
               matchStatus === 'chat' ? `Chatting with ${peerName || 'Stranger'}` :
               `${activeCount} online · ~5s wait`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {matchStatus === 'idle' && (
            <button
              onClick={handleJoinQueue}
              className="px-4 py-2 rounded-xl bg-[var(--color-signal-violet)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold transition-all"
            >
              Find Match
            </button>
          )}
          {matchStatus === 'searching' && (
            <button onClick={handleLeaveQueue} className="px-4 py-2 rounded-xl bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-bold hover:bg-[var(--danger)]/30 transition-all">
              Cancel
            </button>
          )}
          {(matchStatus === 'chat' || matchStatus === 'connecting') && (
            <>
              <button onClick={handleSkip} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]" title="Skip">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
              <button onClick={handleEndChat} className="p-2 rounded-lg hover:bg-[var(--danger-subtle)] text-[var(--danger)]" title="End Chat">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          )}
        </div>
      </header>

      {matchStatus === 'idle' && (
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center mx-auto mb-6">
              {chatMode === 'text' ? <MessageCircle className="w-10 h-10 text-[var(--color-signal-violet)]" /> :
               chatMode === 'voice' ? <Mic className="w-10 h-10 text-[var(--color-signal-violet)]" /> :
               <Video className="w-10 h-10 text-[var(--color-signal-violet)]" />}
            </div>
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-2 capitalize">Ready to {chatMode} chat?</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Add some interests to find better matches, or just hit Find Match to start immediately.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['Music', 'Gaming', 'Tech', 'Travel', 'Sports', 'Movies', 'Art', 'Food'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    interests.includes(tag)
                      ? 'bg-[var(--color-signal-violet)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm mb-6"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
            </select>

            <div className="p-3 rounded-xl bg-[var(--color-surface)]/50 backdrop-blur-sm border border-[var(--color-border)] mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Filter Preferences</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[var(--color-text-secondary)] w-14 shrink-0">Gender</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: 'NO_PREFERENCE' as const, label: 'Any' },
                    { value: 'MALE' as const, label: 'Male' },
                    { value: 'FEMALE' as const, label: 'Female' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGenderPreference(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        genderPreference === opt.value
                          ? 'bg-[var(--color-signal-violet)] text-white'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)] w-14 shrink-0">Age</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: '', label: 'Any' },
                    { value: 'AGE_18_24', label: '18-24' },
                    { value: 'AGE_25_34', label: '25-34' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAgeRange(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        ageRange === opt.value
                          ? 'bg-[var(--color-signal-violet)] text-white'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinQueue}
              className="px-8 py-3 rounded-xl bg-[var(--color-signal-violet)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm transition-all shadow-[var(--shadow-glow)]"
            >
              Find Match
            </button>
          </div>
        </div>
      )}

      {matchStatus === 'searching' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-surface-2)]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-signal-violet)] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-8 h-8 text-[var(--color-signal-violet)]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Finding a Match</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{activeCount} users online</p>
          </div>
        </div>
      )}

      {(matchStatus === 'chat' || matchStatus === 'connecting') && (
        <div className="flex-1 flex flex-col">
          {(chatMode === 'voice' || chatMode === 'video') && (
            <div className="flex-1 relative bg-black/40 flex items-center justify-center">
              <div className="text-center text-[var(--text-muted)]">
                <div className="w-24 h-24 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[var(--color-signal-violet)]/20 to-[var(--lavender)]/20 flex items-center justify-center border border-[var(--color-border)]">
                  {chatMode === 'video' ? (
                    <Video className="w-10 h-10 text-[var(--color-signal-violet)]" />
                  ) : (
                    <Mic className="w-10 h-10 text-[var(--color-signal-violet)]" />
                  )}
                </div>
                <p className="text-sm font-semibold">Demo Mode</p>
                <p className="text-xs mt-1">{chatMode === 'video' ? 'Video preview placeholder' : 'Voice preview placeholder'}</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-3 rounded-full transition-all ${isMicMuted ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                {chatMode === 'video' && (
                  <button
                    onClick={() => setIsCamOff(!isCamOff)}
                    className={`p-3 rounded-full transition-all ${isCamOff ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
                  >
                    {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-center mb-4">
                <div className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-xs text-[var(--text-muted)]">
                  Connected with {peerName || 'Stranger'}
                </div>
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'self'
                      ? 'bg-[var(--color-signal-violet)] text-white rounded-br-md'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-signal-violet)] transition-colors"
                />
                <button onClick={handleSend} disabled={!inputText.trim()} className="px-4 py-2.5 rounded-xl bg-[var(--color-signal-violet)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold transition-all disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubscription = () => {
    const active = {
      id: 'premium-grant',
      status: 'ACTIVE',
      plan: { id: 'monthly', type: 'MONTHLY', priceInr: 399, validityDays: 30, isActive: true, isVoiceEnabled: true, isVideoEnabled: true },
      purchasedAt: new Date('2026-07-12').toISOString(),
      expiresAt: new Date('2027-01-01').toISOString(),
      grantedByAdmin: true,
      transactionRef: null,
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => setView('hub')}
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl font-extrabold mb-2">Subscription Plans</h1>
            <p className="text-[var(--color-text-secondary)]">Unlock voice chat, video chat, and gender preference matching.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-10 border border-[var(--color-signal-violet)]/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-subtle)] to-[var(--lavender-subtle)] opacity-60" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-signal-violet)] to-[var(--lavender)] flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">{PLAN_META[active.plan.type]?.label} Plan – Active</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{active.grantedByAdmin ? 'Granted by Admin' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[var(--color-signal-violet)]">{formatCountdown(active.expiresAt)}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Expires: {new Date(active.expiresAt).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {MOCK_PLANS.map((plan) => {
              const meta = PLAN_META[plan.type] || { label: plan.type, badge: '', gradient: 'from-slate-500 to-slate-600' };
              const isCurrentPlan = active.plan.type === plan.type;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`glass-card rounded-2xl p-6 flex flex-col relative ${isCurrentPlan ? 'border-[var(--color-signal-violet)]/40' : ''}`}>
                  {meta.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${meta.gradient} text-white shadow-lg z-10`}>
                      {meta.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${meta.gradient} flex items-center justify-center mb-4`}>
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{meta.label}</h3>
                  <p className="text-3xl font-extrabold mb-1">₹{plan.priceInr}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">{plan.validityDays} day{plan.validityDays > 1 ? 's' : ''} access</p>
                  <div className="space-y-2 mb-6 flex-1">
                    {ALL_FEATURES.map((feat) => {
                      const enabled = feat.label === 'Voice Chat' ? plan.isVoiceEnabled :
                        feat.label === 'Video Chat' ? plan.isVideoEnabled : feat.ok;
                      return (
                        <div key={feat.label} className={`flex items-center gap-2 text-sm ${enabled ? '' : 'text-[var(--text-muted)]'}`}>
                          {enabled ? <Check className="w-4 h-4 text-[var(--color-signal-coral)] shrink-0" /> : <X className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
                          {feat.label}
                        </div>
                      );
                    })}
                  </div>
                  <button disabled={isCurrentPlan} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isCurrentPlan ? 'bg-[var(--brand-subtle)] text-[var(--color-signal-violet)] cursor-default' : `bg-gradient-to-r ${meta.gradient} text-white hover:brightness-110 cursor-pointer`
                  }`}>
                    {isCurrentPlan ? '✓ Current Plan' : 'Upgrade'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-bold">Feature Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-2)]">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Guest</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold text-[var(--color-signal-violet)]">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {[
                    { feature: 'Anonymous Text Chat', guest: true, free: true, paid: true },
                    { feature: 'Temporary Image Sharing', guest: true, free: true, paid: true },
                    { feature: 'Report & Block Users', guest: true, free: true, paid: true },
                    { feature: 'Friend Requests', guest: false, free: true, paid: true },
                    { feature: 'Voice Chat', guest: false, free: false, paid: true },
                    { feature: 'Video Chat', guest: false, free: false, paid: true },
                    { feature: 'Gender Preference Filter', guest: false, free: false, paid: true },
                    { feature: 'Advanced Matching', guest: false, free: false, paid: true },
                  ].map((row) => (
                    <tr key={row.feature} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="p-4 font-medium">{row.feature}</td>
                      {[row.guest, row.free, row.paid].map((v, i) => (
                        <td key={i} className="p-4 text-center">
                          {v ? <Check className="w-4 h-4 text-[var(--color-signal-coral)] mx-auto" /> : <X className="w-4 h-4 text-[var(--text-muted)] mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-[var(--color-border)] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-56 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden glass-heavy border-b border-[var(--color-border)] flex items-center justify-between h-14 px-4">
          <button onClick={() => setSidebarMobileOpen(true)} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <AnimatedLogo size={24} showText={false} />
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--brand-subtle)] text-[var(--color-signal-violet)] font-semibold">DEMO</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--color-signal-violet)]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-coral)] animate-pulse" />
              <span className="text-[10px] font-medium text-[var(--color-signal-violet)]">{activeCount}</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4 px-0.5 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">3</span>
            </button>
          </div>
        </header>

        {/* View content */}
        {view === 'hub' && renderHub()}
        {view === 'chat' && renderChat()}
        {view === 'subscription' && renderSubscription()}
      </div>
    </div>
  );
}

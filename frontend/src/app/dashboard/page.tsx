"use client";

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useRouter } from 'next/navigation';
import {
  MessageCircle, Mic, Video, Users, LogOut, Bell, Settings,
  Search, MessageSquare, Crown, ChevronLeft, Menu,
  Zap, Activity, Globe, Heart, UserCheck, X, MicOff, VideoOff,
  Clock, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import { ConnectionLines } from '../../components/illustrations/ConnectionLines';
import { NetworkGraph } from '../../components/illustrations/NetworkGraph';
import { AnimatedProgressRing } from '../../components/AnimatedProgressRing';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

type ViewMode = 'hub' | 'chat';

export default function Dashboard() {
  const router = useRouter();
  const store = useChatStore();
  const {
    token, user, setToken, matchStatus, messages, isTyping,
    friends, friendRequests, notifications,
    activeCount, estimatedWaitSec,
    canVoice, canVideo, subscriptionActive, chatMode, setChatMode,
  } = store;

  const { joinQueue, leaveQueue, sendMessage, sendTyping, skip, endChat, report, block, sendFriendRequestInChat } = useSocket();
  const { toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen } = useWebRTC();

  const [view, setView] = useState<ViewMode>('hub');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'notifications' | null>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!token) router.push('/');
  }, [token, router]);

  const handleStartChat = (mode: 'text' | 'voice' | 'video') => {
    setChatMode(mode);
    setView('chat');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...({ credentials: 'include' } as any),
      });
    } catch {}
    setToken(null);
    router.push('/');
  };

  const quickActions = [
    { icon: Zap, label: 'Random Chat', onClick: () => handleStartChat('text'), gradient: 'from-indigo-500 to-purple-500' },
    { icon: Users, label: 'Friends', onClick: () => setActiveTab('friends'), gradient: 'from-emerald-500 to-teal-500' },
    { icon: Bell, label: 'Notifications', onClick: () => setActiveTab('notifications'), gradient: 'from-amber-500 to-orange-500' },
    { icon: Settings, label: 'Settings', onClick: () => router.push('/profile'), gradient: 'from-slate-500 to-slate-600' },
    { icon: Crown, label: 'Premium', onClick: () => router.push('/subscription'), gradient: 'from-rose-500 to-pink-500' },
    { icon: MessageSquare, label: 'Safety', onClick: () => router.push('/safety'), gradient: 'from-blue-500 to-cyan-500' },
  ];

  const activityFeed = [
    { icon: Users, text: `${friends.length} friends online`, time: 'Now', color: 'var(--accent)' },
    { icon: Heart, text: `${Math.floor(activeCount * 12)} messages today`, time: 'Live', color: 'var(--lavender)' },
    { icon: Activity, text: `${Math.floor(activeCount * 0.3)} active chats`, time: 'Live', color: 'var(--cyan)' },
  ];

  if (view === 'chat') {
    return <ChatView
      store={store}
      joinQueue={joinQueue}
      leaveQueue={leaveQueue}
      sendMessage={sendMessage}
      sendTyping={sendTyping}
      skip={skip}
      endChat={endChat}
      report={report}
      block={block}
      sendFriendRequestInChat={sendFriendRequestInChat}
      toggleMic={toggleMic}
      toggleCam={toggleCam}
      toggleScreenShare={toggleScreenShare}
      isMicMuted={isMicMuted}
      isCamOff={isCamOff}
      isSharingScreen={isSharingScreen}
      onBack={() => setView('hub')}
    />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 glass-heavy border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-extrabold text-[var(--text-primary)]">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand)]/20">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--brand)]">{activeCount} online</span>
              </div>
              <button
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="heading-display text-2xl sm:text-3xl">
                        Welcome{user?.displayName ? `, ${user.displayName}` : ''}
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Choose how you want to connect</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="grid sm:grid-cols-3 gap-4"
                >
                  {([
                    { mode: 'text' as const, icon: MessageCircle, title: 'Text Chat', desc: 'Start a random text conversation.', gradient: 'from-indigo-500 to-blue-500', locked: false },
                    { mode: 'voice' as const, icon: Mic, title: 'Voice Chat', desc: 'Talk in real-time voice calls.', gradient: 'from-emerald-500 to-teal-500', locked: !canVoice },
                    { mode: 'video' as const, icon: Video, title: 'Video Chat', desc: 'Face-to-face video calls.', gradient: 'from-purple-500 to-pink-500', locked: !canVideo },
                  ]).map((card) => (
                    <motion.button
                      key={card.mode}
                      whileHover={!card.locked ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!card.locked ? { scale: 0.98 } : {}}
                      onClick={() => !card.locked && handleStartChat(card.mode)}
                      className={`glass-card rounded-2xl p-5 sm:p-6 text-left transition-all ${
                        card.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-[var(--shadow-glass-hover)] group'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                        {card.title}
                        {card.locked && <span className="ml-2 text-xs font-medium text-[var(--warning)]">Premium</span>}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">{card.desc}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {activeCount} live</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{estimatedWaitSec || 5}s wait</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="glass-card rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Live Statistics</h3>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { icon: Users, label: 'Users Online', value: activeCount },
                      { icon: Search, label: 'Users Searching', value: Math.max(0, activeCount - Math.floor(activeCount * 0.6)) },
                      { icon: MessageCircle, label: 'Chats Active', value: Math.floor(activeCount * 0.3) },
                      { icon: UserCheck, label: 'Friends Online', value: friends.length },
                      { icon: Heart, label: 'Messages Today', value: Math.floor(activeCount * 12) },
                      { icon: Globe, label: 'Server Status', value: 'Operational', isText: true },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.3 }}
                        className="text-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                      >
                        <stat.icon className="w-4 h-4 text-[var(--brand)] mx-auto mb-1.5" />
                        <p className="text-lg font-extrabold text-[var(--text-primary)]">
                          {stat.isText ? <span className="text-xs text-[var(--accent)]">{stat.value}</span> : stat.value}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="glass-card rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Activity Feed</h3>
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Sparkles className="w-3 h-3" /> Live</span>
                  </div>
                  <div className="space-y-2">
                    {activityFeed.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${item.color} 15%, transparent)` }}>
                          <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{item.text}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.time}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="w-full lg:w-72 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="glass-card rounded-2xl p-5 text-center relative overflow-hidden"
                >
                  <ConnectionLines className="absolute inset-0 opacity-20 pointer-events-none" width={288} height={40} count={1} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand)] to-purple-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-[var(--shadow-glow)]">
                      {(user?.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)]">{user?.displayName || 'User'}</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">@{user?.userId?.slice(0, 8)}</p>
                    {subscriptionActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs">Free User</span>
                    )}
                    <hr className="border-[var(--border-primary)] my-4" />
                    <div className="space-y-2 text-left text-xs">
                      <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Level</span><span className="font-bold text-[var(--text-primary)]">{user?.level || 1}</span></div>
                      <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Reputation</span><span className="font-bold text-[var(--text-primary)]">{user?.reputationScore || 100}</span></div>
                      <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Friends</span><span className="font-bold text-[var(--text-primary)]">{friends.length}</span></div>
                    </div>
                    <button onClick={() => router.push('/profile')} className="w-full mt-4 py-2 rounded-xl border border-[var(--border-secondary)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">Edit Profile</button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-4 uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-all active:scale-95 group">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)] text-center leading-tight">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeTab && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setActiveTab(null)} />
              <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm glass-heavy border-l border-[var(--border-primary)]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                  <h3 className="font-bold text-[var(--text-primary)] capitalize">{activeTab}</h3>
                  <button onClick={() => setActiveTab(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  {activeTab === 'friends' && (
                    friends.length === 0
                      ? <p className="text-center py-8">No friends yet. Start chatting to make connections!</p>
                      : friends.map((f: any) => (
                        <div key={f.id || f.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-tertiary)]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-purple-500 flex items-center justify-center text-white text-xs font-bold">{f.displayName?.[0] || 'U'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{f.displayName || 'User'}</p>
                            <p className="text-xs text-[var(--text-muted)]">Online</p>
                          </div>
                        </div>
                      ))
                  )}
                  {activeTab === 'notifications' && (
                    notifications.length === 0
                      ? <p className="text-center py-8">No notifications</p>
                      : notifications.map((n) => (
                        <div key={n.id} className="p-3 rounded-xl bg-[var(--bg-tertiary)]">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{n.message}</p>
                        </div>
                      ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatView({
  store, joinQueue, leaveQueue, sendMessage, sendTyping, skip, endChat, report, block, sendFriendRequestInChat,
  toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen, onBack,
}: {
  store: any; joinQueue: any; leaveQueue: any; sendMessage: any; sendTyping: any;
  skip: any; endChat: any; report: any; block: any; sendFriendRequestInChat: any;
  toggleMic: any; toggleCam: any; toggleScreenShare: any;
  isMicMuted: boolean; isCamOff: boolean; isSharingScreen: boolean; onBack: () => void;
}) {
  const {
    token, user, matchStatus, roomId, peerName, messages, isTyping,
    activeCount, estimatedWaitSec, chatMode, localStream, remoteStream, connectionQuality,
    addNotification,
  } = store;

  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [inputText, setInputText] = useState('');
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="glass-heavy border-b border-[var(--border-primary)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] capitalize">{chatMode} Chat</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {matchStatus === 'searching' ? 'Searching...' :
               matchStatus === 'chat' ? `Chatting with ${peerName || 'Stranger'}` :
               `${activeCount} online · ~${estimatedWaitSec || 5}s wait`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {matchStatus === 'idle' && (
            <button
              onClick={() => joinQueue(chatMode, interests, language)}
              className="px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold transition-all"
            >
              Find Match
            </button>
          )}
          {matchStatus === 'searching' && (
            <button onClick={leaveQueue} className="px-4 py-2 rounded-xl bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-bold hover:bg-[var(--danger)]/30 transition-all">
              Cancel
            </button>
          )}
          {(matchStatus === 'chat' || matchStatus === 'connecting') && (
            <>
              <button onClick={skip} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" title="Skip">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
              <button onClick={endChat} className="p-2 rounded-lg hover:bg-[var(--danger-subtle)] text-[var(--danger)]" title="End Chat">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          )}
        </div>
      </header>

      {matchStatus === 'idle' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center mx-auto mb-6">
              {chatMode === 'text' ? <MessageCircle className="w-10 h-10 text-[var(--brand)]" /> :
               chatMode === 'voice' ? <Mic className="w-10 h-10 text-[var(--brand)]" /> :
               <Video className="w-10 h-10 text-[var(--brand)]" />}
            </div>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2 capitalize">Ready to {chatMode} chat?</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Add some interests to find better matches, or just hit Find Match to start immediately.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['Music', 'Gaming', 'Tech', 'Travel', 'Sports', 'Movies', 'Art', 'Food'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    interests.includes(tag)
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm mb-6"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
            </select>
            <br />
            <button
              onClick={() => joinQueue(chatMode, interests, language)}
              className="px-8 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm transition-all shadow-[var(--shadow-glow)]"
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
              <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-tertiary)]" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--brand)] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-8 h-8 text-[var(--brand)]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Finding a Match</h3>
            <p className="text-sm text-[var(--text-secondary)]">{activeCount} users online</p>
          </div>
        </div>
      )}

      {(matchStatus === 'chat' || matchStatus === 'connecting') && (
        <div className="flex-1 flex flex-col">
          {(chatMode === 'voice' || chatMode === 'video') && (
            <div className="flex-1 relative bg-black/40 flex items-center justify-center">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
                    <Users className="w-10 h-10" />
                  </div>
                  <p className="text-sm">Waiting for peer to connect...</p>
                </div>
              )}
              {localStream && chatMode === 'video' && (
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-24 rounded-xl object-cover border-2 border-[var(--border-accent)] shadow-lg" />
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button onClick={toggleMic} className={`p-3 rounded-full transition-all ${isMicMuted ? 'bg-[var(--danger)] text-white' : 'bg-[var(--bg-glass-heavy)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}>
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                {chatMode === 'video' && (
                  <button onClick={toggleCam} className={`p-3 rounded-full transition-all ${isCamOff ? 'bg-[var(--danger)] text-white' : 'bg-[var(--bg-glass-heavy)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}>
                    {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}
                <button onClick={endChat} className="p-3 rounded-full bg-[var(--danger)] text-white hover:bg-rose-600 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          {chatMode === 'text' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                    Say hello to start the conversation!
                  </div>
                )}
                {messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.isMine
                        ? 'bg-[var(--brand)] text-white rounded-br-md'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md'
                    }`}>
                      {msg.text}
                      {msg.imageUrl && <img src={msg.imageUrl} alt="Shared" className="mt-2 rounded-lg max-w-full" />}
                    </div>
                  </div>
                ))}
                {isTyping && <p className="text-xs text-[var(--text-muted)] italic animate-pulse-soft">Stranger is typing...</p>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-[var(--border-primary)]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); sendTyping(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
                    placeholder="Type a message..."
                  />
                  <button onClick={handleSend} className="p-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

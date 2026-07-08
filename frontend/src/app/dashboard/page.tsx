"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useRouter } from 'next/navigation';
import {
  LogOut, Send, SkipForward, Ban, AlertOctagon, UserPlus, Users, MessageSquare,
  Settings, Award, RefreshCw, VolumeX, Volume2, Video, VideoOff, Mic, MicOff, MonitorUp,
  Crown, ImageIcon, X, MessageCircle, UserCheck, UserX, StopCircle, Bell, Menu, ChevronLeft
} from 'lucide-react';
import { FriendData, FriendRequestData, PrivateChatMessage } from '@anon-chat/types';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

type SidebarTab = 'friends' | 'messages' | 'notifications' | null;

export default function Dashboard() {
  const router = useRouter();
  const {
    token, setToken, user, setUser, matchStatus, roomId, peerName, messages, isTyping, theme, toggleTheme,
    friends, setFriends, friendRequests, setFriendRequests, notifications, addNotification,
    localStream, remoteStream, connectionQuality,
    activeCount, estimatedWaitSec,
    canVoice, canVideo, setFeatureAccess, subscriptionActive, chatMode, setChatMode,
    privateChatRooms, setPrivateChatRooms, privateMessages, setPrivateMessages, activePrivateRoom, setActivePrivateRoom,
    addPrivateMessage, addPrivateChatRoom
  } = useChatStore();

  const { joinQueue, leaveQueue, sendMessage, sendTyping, skip, endChat, report, block, sendFriendRequestInChat, privateSend, privateSendTyping, privateMarkRead } = useSocket();
  const { toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen } = useWebRTC();

  const [matchMediaType, setMatchMediaType] = useState<'text' | 'voice' | 'video'>('text');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [inputText, setInputText] = useState('');
  const [privateInputText, setPrivateInputText] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [friendRequestsList, setFriendRequestsList] = useState<FriendRequestData[]>([]);
  const [selectedFriendChat, setSelectedFriendChat] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const privateMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const isRegistered = user?.registrationType?.toLowerCase() !== 'guest';
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!token) router.push('/');
  }, [token, router]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    privateMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages]);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({
            userId: data.userId, email: data.email, registrationType: data.registrationType,
            userType: data.userType || 'FREE', emailVerified: false,
            reputationScore: data.reputationScore, experiencePoints: data.experiencePoints,
            level: data.level, isShadowBanned: false,
            onboardingComplete: data.onboardingComplete ?? false,
            displayName: data.displayName, bio: data.bio, status: data.status,
            lastSeen: data.lastSeen, avatarUrl: data.avatarUrl
          });
        }
      } catch (error) { console.error('Failed to fetch profile', error); }
    };

    const fetchFeatureAccess = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions/features`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFeatureAccess(data.canVoice, data.canVideo, data.canGenderFilter);
        }
      } catch (e) {}
    };

    const fetchFriends = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFriends(data.friends || []);
        }
      } catch (error) { console.error('Failed to fetch friends', error); }
    };

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/friends/requests/incoming`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFriendRequestsList(data.requests || []);
        }
      } catch (error) { console.error('Failed to fetch friend requests', error); }
    };

    const fetchChatRooms = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/messages/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPrivateChatRooms(data.rooms || []);
        }
      } catch (error) { console.error('Failed to fetch chat rooms', error); }
    };

    fetchProfile();
    fetchFriends();
    fetchFriendRequests();
    fetchFeatureAccess();
    if (isRegistered) fetchChatRooms();
  }, [token, setUser, setFriends, setFeatureAccess, isRegistered]);

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        ...({ credentials: 'include' } as any)
      });
    } catch (e) { console.error('Logout error:', e); }
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const addInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = interestInput.trim().toLowerCase();
    if (tag && !interests.includes(tag)) setInterests([...interests, tag]);
    setInterestInput('');
  };

  const removeInterest = (index: number) => setInterests(interests.filter((_, i) => i !== index));

  const handleMatchTrigger = () => {
    if (matchStatus === 'searching') {
      leaveQueue(matchMediaType);
    } else {
      setChatMode(matchMediaType);
      joinQueue(interests, language, matchMediaType);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomId) return;
    sendMessage(roomId, inputText);
    setInputText('');
  };

  const handleSendPrivateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateInputText.trim() || !activePrivateRoom) return;
    privateSend(activePrivateRoom, privateInputText);
    setPrivateInputText('');
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || !token) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('roomId', roomId);
      const res = await fetch(`${BACKEND_URL}/api/v1/media/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        ...({ credentials: 'include' } as any)
      });
      if (!res.ok) { alert((await res.json()).error || 'Upload failed.'); return; }
      const media = await res.json();
      sendMessage(roomId, `[IMAGE:${media.mediaId}:${media.expiresAt}]`);
    } catch { alert('Upload failed.'); }
    finally { setImageUploading(false); if (imageInputRef.current) imageInputRef.current.value = ''; }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send request');
      addNotification({ title: 'Success', message: 'Friend request sent!' });
      setFriendEmail('');
    } catch (err: any) { alert(err.message || 'Request failed.'); }
  };

  const handleFriendRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/friends/requests/${requestId}/${action}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} request`);
      setFriendRequestsList(prev => prev.filter(r => r.id !== requestId));
      addNotification({ title: 'Success', message: `Friend request ${action}ed.` });
      const friendsRes = await fetch(`${BACKEND_URL}/api/v1/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (friendsRes.ok) setFriends((await friendsRes.json()).friends || []);
    } catch (error: any) { console.error(error); alert(error.message || `Failed to ${action} request.`); }
  };

  const openPrivateChat = async (friend: FriendData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/messages/room/${friend.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivePrivateRoom(data.roomId);
        setSelectedFriendChat(friend.userId);
        setSidebarTab(null);
        if (data.messages) setPrivateMessages(data.roomId, data.messages);
        const peer = { userId: friend.userId, displayName: friend.displayName || friend.email, email: friend.email, avatarUrl: friend.avatarUrl, level: friend.level, status: friend.status, reputationScore: friend.reputationScore, lastSeen: friend.lastSeen, friendSince: friend.friendSince, isFavorite: friend.isFavorite, note: friend.note } as FriendData;
        addPrivateChatRoom({ roomId: data.roomId, peerUser: peer, lastMessage: null });
        privateMarkRead(data.roomId);
      }
    } catch (error) { console.error('Failed to open private chat', error); }
  };

  const getPeerUser = (roomId: string): FriendData | null => {
    const room = privateChatRooms.find(r => r.roomId === roomId);
    return room?.peerUser || null;
  };

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const card = isDark ? 'bg-[#1E293B]/60 border-white/5' : 'bg-white border-slate-200';
  const input = isDark ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500/50' : 'bg-slate-50 border-slate-200 focus:border-indigo-500';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  const sidebarContent = (
    <div className="flex-1 flex flex-col overflow-hidden">
      {sidebarTab === 'friends' && (
        <>
          <div className="p-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
            <h2 className="text-xs font-bold flex items-center gap-2"><Users className="w-3.5 h-3.5 text-indigo-500" /> Friends</h2>
          </div>
          {friendRequestsList.length > 0 && (
            <div className="p-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Requests ({friendRequestsList.length})</p>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {friendRequestsList.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-xs truncate font-medium">{req.sender?.displayName || req.sender?.email || 'Unknown'}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleFriendRequestAction(req.id, 'accept')} className="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs cursor-pointer"><UserCheck className="w-3 h-3" /></button>
                      <button onClick={() => handleFriendRequestAction(req.id, 'reject')} className="p-1 rounded bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs cursor-pointer"><UserX className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input type="email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)}
                className={`flex-1 px-2.5 py-1.5 rounded-xl border outline-none text-xs ${input}`}
                placeholder="friend@domain.com" />
              <button type="submit" className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs cursor-pointer">
                <UserPlus className="w-3 h-3" />
              </button>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {friends.map((friend) => (
              <div key={friend.id || friend.userId} className="flex items-center justify-between p-2 rounded-xl bg-slate-500/5 border border-slate-500/10 hover:bg-slate-500/10 transition-all">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${friend.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block">{friend.displayName || friend.email || 'Unknown'}</span>
                    <span className="text-[9px] text-slate-500">Lv.{friend.level}</span>
                  </div>
                </div>
                <button onClick={() => openPrivateChat(friend)}
                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs cursor-pointer shrink-0"
                  title="Chat privately"><MessageSquare className="w-3 h-3" /></button>
              </div>
            ))}
            {friends.length === 0 && <span className="text-xs text-slate-500 italic block text-center py-4">No friends yet.</span>}
          </div>
        </>
      )}
      {sidebarTab === 'messages' && (
        <>
          <div className="p-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
            <h2 className="text-xs font-bold flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-indigo-500" /> Messages</h2>
            <button onClick={() => setSidebarTab(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {privateChatRooms.map((room) => (
              <button key={room.roomId}
                onClick={() => { setActivePrivateRoom(room.roomId); setSelectedFriendChat(room.peerUser?.userId || null); }}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                  activePrivateRoom === room.roomId ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-slate-500/5 border border-slate-500/10 hover:bg-slate-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${room.peerUser?.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block">{room.peerUser?.displayName || room.peerUser?.email || 'Unknown'}</span>
                    {room.lastMessage && <span className="text-[10px] text-slate-500 truncate block">{room.lastMessage.text}</span>}
                  </div>
                </div>
              </button>
            ))}
            {privateChatRooms.length === 0 && <span className="text-xs text-slate-500 italic block text-center py-4">No conversations yet.</span>}
          </div>
        </>
      )}
      {sidebarTab === 'notifications' && (
        <>
          <div className="p-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
            <h2 className="text-xs font-bold flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-indigo-500" /> Notifications</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {notifications.slice(-20).reverse().map((n) => (
              <div key={n.id} className={`p-2.5 rounded-xl border text-xs ${isDark ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                <p className="font-bold text-indigo-400">{n.title}</p>
                <p className="text-slate-400 mt-0.5">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && <span className="text-xs text-slate-500 italic block text-center py-4">No notifications.</span>}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${text} transition-colors duration-300`}>
      {isDark && (
        <div className="fixed inset-0 -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/[0.04] rounded-full blur-3xl"></div>
        </div>
      )}

      <header className={`px-4 sm:px-6 py-3 flex justify-between items-center border-b backdrop-blur-xl shrink-0 ${
        isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AnonChat</span>
          {user && (
            <button onClick={() => router.push('/profile')}
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 cursor-pointer">
              Lv.{user.level}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isRegistered && (
            <>
              <button onClick={() => setSidebarTab(sidebarTab === 'friends' ? null : 'friends')}
                className={`relative p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${sidebarTab === 'friends' ? 'bg-indigo-600 text-white' : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400'}`}
                title="Friends">
                <Users className="w-4 h-4" />
              </button>
              <button onClick={() => setSidebarTab(sidebarTab === 'messages' ? null : 'messages')}
                className={`relative p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${sidebarTab === 'messages' ? 'bg-indigo-600 text-white' : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400'}`}
                title="Messages">
                <MessageCircle className="w-4 h-4" />
                {privateChatRooms.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] flex items-center justify-center font-bold">{privateChatRooms.length}</span>}
              </button>
            </>
          )}
          <button onClick={() => setSidebarTab(sidebarTab === 'notifications' ? null : 'notifications')}
            className={`relative p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${sidebarTab === 'notifications' ? 'bg-indigo-600 text-white' : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400'}`}
            title="Notifications">
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] flex items-center justify-center font-bold">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-sm cursor-pointer">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => router.push('/safety')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer">
            🛡️ Safety
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {(sidebarTab) && isRegistered && (
          <aside className={`hidden md:flex w-72 flex-col shrink-0 border-r ${isDark ? 'border-white/5 bg-[#1E293B]/30' : 'border-slate-200 bg-slate-50/50'}`}>
            {sidebarContent}
          </aside>
        )}

        <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-500/[0.02]">
          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {sidebarTab && isRegistered && (
              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`md:hidden absolute inset-y-0 left-0 w-72 z-20 flex flex-col border-r ${isDark ? 'border-white/5 bg-[#0B0F19]' : 'border-slate-200 bg-white'}`}
              >
                <div className="p-2 border-b shrink-0 flex justify-end" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
                  <button onClick={() => setSidebarTab(null)} className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                {sidebarContent}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Mobile sidebar backdrop */}
          {sidebarTab && isRegistered && (
            <div className="md:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarTab(null)} />
          )}

          {/* Match Lobby State */}
          {matchStatus !== 'chat' && !activePrivateRoom && (
            <div className="flex-1 flex flex-col md:flex-row">
              <aside className={`w-full md:w-72 p-4 md:p-5 border-r flex flex-col gap-4 overflow-y-auto shrink-0 ${
                isDark ? 'border-white/5 bg-[#1E293B]/20' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div>
                  <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" /> Filters
                  </h2>
                  <form onSubmit={addInterest} className="mb-3">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Interests</label>
                    <div className="flex gap-1.5">
                      <input type="text" value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                        className={`flex-1 px-2.5 py-1.5 rounded-xl border outline-none text-xs ${input}`}
                        placeholder="anime, sports, music" />
                      <button type="submit" className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-[10px] cursor-pointer">Add</button>
                    </div>
                  </form>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {interests.map((tag, idx) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeInterest(idx)} className="hover:text-rose-400 font-bold">x</button>
                      </span>
                    ))}
                    {interests.length === 0 && <span className="text-[10px] text-slate-500 italic">No interests.</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-xl border outline-none text-xs ${input}`}>
                      <option value="en">English</option>
                      <option value="es">Espanol</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                </div>
              </aside>

              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                {matchStatus === 'searching' ? (
                  <>
                    <div className="relative w-20 h-20 mb-4">
                      <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"></div>
                      <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse"></div>
                      <div className="absolute inset-5 rounded-full bg-indigo-600/40"></div>
                    </div>
                    <h3 className="text-lg font-black mb-1 animate-pulse">Searching...</h3>
                    <p className="text-xs text-slate-400 mb-1">Matching interests, language, reputation.</p>
                    <p className="text-[10px] font-semibold text-indigo-400 mb-4">Queue: {activeCount} active · Est. {estimatedWaitSec}s</p>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-12 h-12 text-indigo-600/30 mb-3" />
                    <h3 className="text-lg font-black mb-1">Ready to Chat?</h3>
                    <p className="text-xs text-slate-400 mb-4">Select a mode and start connecting.</p>
                    <div className="flex gap-1 p-1 rounded-xl bg-slate-500/10 mb-4 border border-slate-500/5">
                      {(['text', 'voice', 'video'] as const).map((mode) => {
                        const isLocked = (mode === 'voice' && !canVoice) || (mode === 'video' && !canVideo);
                        return (
                          <button key={mode} onClick={() => { if (isLocked) { router.push('/subscription'); return; } setMatchMediaType(mode); }}
                            className={`relative px-3 sm:px-4 py-1 rounded-lg text-[10px] font-bold transition-all uppercase ${
                              matchMediaType === mode && !isLocked ? 'bg-indigo-600 text-white shadow-md' : isLocked ? 'text-slate-600' : 'text-slate-400 hover:text-white'
                            }`}>
                            {mode}{isLocked && <LockIcon />}
                          </button>
                        );
                      })}
                    </div>
                    {!subscriptionActive && (
                      <button onClick={() => router.push('/subscription')}
                        className="flex items-center gap-1.5 text-[10px] text-amber-400 hover:text-amber-300 mb-4">
                        <Crown className="w-3 h-3" /> Upgrade for Voice & Video
                      </button>
                    )}
                  </>
                )}
                <button onClick={handleMatchTrigger}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
                    matchStatus === 'searching' ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}>
                  {matchStatus === 'searching' ? 'Cancel Search' : `Find ${matchMediaType.toUpperCase()} Match`}
                </button>
              </div>
            </div>
          )}

          {/* Private Chat View */}
          {activePrivateRoom && (
            <div className="flex-1 flex flex-col h-full">
              <div className={`px-4 py-2.5 flex justify-between items-center border-b shrink-0 ${isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getPeerUser(activePrivateRoom)?.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                  <span className="text-sm font-bold">{getPeerUser(activePrivateRoom)?.displayName || getPeerUser(activePrivateRoom)?.email || 'Friend'}</span>
                  <span className="text-[10px] text-slate-500">Lv.{getPeerUser(activePrivateRoom)?.level}</span>
                </div>
                <button onClick={() => { setActivePrivateRoom(null); setSelectedFriendChat(null); }} className="text-slate-400 hover:text-white text-xs cursor-pointer p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {(privateMessages[activePrivateRoom] || []).map((msg) => (
                  <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.senderId === user?.userId ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      msg.senderId === user?.userId
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : isDark ? 'bg-[#1E293B] text-slate-100 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}>{msg.text}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.senderId === user?.userId && (
                        <span className={`text-[9px] ${msg.status === 'SEEN' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {msg.status === 'SEEN' ? 'Seen' : msg.status === 'DELIVERED' ? 'Delivered' : msg.status === 'SENT' ? 'Sent' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={privateMessagesEndRef}></div>
              </div>
              <form onSubmit={handleSendPrivateMessage} className={`p-3 border-t shrink-0 ${isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex gap-2">
                  <input type="text" value={privateInputText}
                    onChange={(e) => { setPrivateInputText(e.target.value); if (activePrivateRoom) privateSendTyping(activePrivateRoom, e.target.value.length > 0); }}
                    onBlur={() => { if (activePrivateRoom) privateSendTyping(activePrivateRoom, false); }}
                    className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${input}`}
                    placeholder="Type a message..." />
                  <button type="submit" className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95 cursor-pointer">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Chat View */}
          {matchStatus === 'chat' && (
            <>
              <div className={`w-full md:w-1/2 h-[200px] md:h-full flex flex-col border-b md:border-b-0 md:border-r relative ${isDark ? 'border-white/5 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}>
                <div className="absolute top-3 left-3 z-10 text-[9px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur text-white flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${connectionQuality === 'excellent' ? 'bg-emerald-500' : connectionQuality === 'fair' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                  {connectionQuality.toUpperCase()}
                </div>
                {chatMode === 'text' ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] italic">Text chat active</div>
                ) : remoteStream ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] italic">Connecting...</div>
                )}
                {chatMode !== 'text' && (
                  <>
                    <div className="absolute bottom-14 right-3 w-24 h-18 md:w-32 md:h-20 rounded-lg overflow-hidden border border-white/10 shadow-lg bg-black">
                      {localStream && !isCamOff ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">Camera Off</div>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur">
                      <button onClick={toggleMic} className={`p-1.5 rounded-full ${isMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'}`} title={isMicMuted ? 'Unmute' : 'Mute'}>
                        {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={toggleCam} className={`p-1.5 rounded-full ${isCamOff ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'}`} title={isCamOff ? 'Camera On' : 'Camera Off'}>
                        {isCamOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={toggleScreenShare} className={`p-1.5 rounded-full ${isSharingScreen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`} title="Share Screen">
                        <MonitorUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className={`px-4 py-2.5 flex justify-between items-center border-b shrink-0 ${isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold">{peerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isRegistered && (
                      <button onClick={sendFriendRequestInChat} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-indigo-400 cursor-pointer" title="Send friend request">
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 cursor-pointer" title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={skip} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-amber-400 cursor-pointer" title="Skip"><SkipForward className="w-3.5 h-3.5" /></button>
                    <button onClick={endChat} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-rose-400 cursor-pointer" title="End"><StopCircle className="w-3.5 h-3.5" /></button>
                    <button onClick={block} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-rose-400 cursor-pointer" title="Block"><Ban className="w-3.5 h-3.5" /></button>
                    <button onClick={() => report('inappropriate')} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-rose-400 cursor-pointer" title="Report"><AlertOctagon className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.sender === 'self' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      {msg.text.startsWith('[IMAGE:') ? (() => {
                        const parts = msg.text.slice(7, -1).split(':');
                        const mediaId = parts[0], expiresAt = parts[1];
                        const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
                        return (
                          <div className="relative">
                            <img src={`${BACKEND_URL}/api/v1/media/${mediaId}`} alt="Shared" onContextMenu={(e) => e.preventDefault()}
                              className="max-w-[180px] max-h-[180px] rounded-xl object-cover select-none" draggable={false} />
                            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur px-1 py-0.5 rounded text-[8px] text-white font-bold">⏱ {remaining}s</div>
                          </div>
                        );
                      })() : (
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          msg.sender === 'self' ? 'bg-indigo-600 text-white rounded-tr-none' : isDark ? 'bg-[#1E293B] text-slate-100 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                        }`}>{msg.text}</div>
                      )}
                      <span className="text-[9px] text-slate-500 mt-0.5">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-1 mr-auto text-slate-500 text-[10px] italic">
                      Stranger is typing
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                  <div ref={messagesEndRef}></div>
                </div>

                <form onSubmit={handleSendMessage} className={`p-3 border-t shrink-0 ${isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'}`}>
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleSendImage} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={imageUploading || !roomId}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${imageUploading ? 'opacity-50' : 'hover:bg-slate-500/10'} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {imageUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </button>
                    <input type="text" value={inputText}
                      onChange={(e) => { setInputText(e.target.value); if (roomId) sendTyping(roomId, e.target.value.length > 0); }}
                      onBlur={() => { if (roomId) sendTyping(roomId, false); }}
                      className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${input}`}
                      placeholder="Type message..." />
                    <button type="submit" className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95 cursor-pointer">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 text-[8px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-bold">
      <Crown className="w-2 h-2" />PRO
    </span>
  );
}

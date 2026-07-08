"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Send, SkipForward, Ban, AlertOctagon, UserPlus, Users, MessageSquare, 
  Settings, Award, RefreshCw, VolumeX, Volume2, Video, VideoOff, Mic, MicOff, MonitorUp,
  Crown, ImageIcon, X, Lock
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Dashboard() {
  const router = useRouter();
  const {
    token, setToken, user, setUser, matchStatus, roomId, peerName, messages, isTyping, theme, toggleTheme,
    friends, setFriends, notifications, addNotification,
    localStream, remoteStream, connectionQuality,
    activeCount, estimatedWaitSec,
    canVoice, canVideo, setFeatureAccess, subscriptionActive
  } = useChatStore();

  const { joinQueue, leaveQueue, sendMessage, sendTyping, skip, report, block } = useSocket();
  const { toggleMic, toggleCam, toggleScreenShare, isMicMuted, isCamOff, isSharingScreen } = useWebRTC();

  const [matchMediaType, setMatchMediaType] = useState<'text' | 'voice' | 'video'>('text');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Settings states
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [country, setCountry] = useState('US');

  // Input message state
  const [inputText, setInputText] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Image sharing state
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Redirect to landing if token is missing
  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [token, router]);

  // Load profile on load
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
            userId: data.userId,
            email: data.email,
            registrationType: data.registrationType,
            userType: data.userType || 'FREE',
            emailVerified: false,
            reputationScore: data.reputationScore,
            experiencePoints: data.experiencePoints,
            level: data.level,
            isShadowBanned: false,
            onboardingComplete: true
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
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
      } catch (error) {
        console.error('Failed to fetch friends', error);
      }
    };

    fetchProfile();
    fetchFriends();
    fetchFeatureAccess();
  }, [token, setUser, setFriends, setFeatureAccess]);

  // Bind video tracks
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        ...({ credentials: 'include' } as any)
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const addInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = interestInput.trim().toLowerCase();
    if (tag && !interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
    setInterestInput('');
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleMatchTrigger = () => {
    if (matchStatus === 'searching') {
      leaveQueue(matchMediaType);
    } else {
      joinQueue(interests, language, country, matchMediaType);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !roomId) return;
    sendMessage(roomId, inputText);
    setInputText('');
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
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        ...({ credentials: 'include' } as any)
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Image upload failed.');
        return;
      }

      const media = await res.json();
      // Emit the media share event through the existing socket
      sendMessage(roomId, `[IMAGE:${media.mediaId}:${media.expiresAt}]`);
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };



  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send request');
      
      addNotification({ title: 'Success', message: 'Friend request sent!' });
      setFriendEmail('');
    } catch (err: any) {
      alert(err.message || 'Request failed.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Top Header */}
      <header className={`px-6 py-4 flex justify-between items-center border-b ${
        theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            AnonChat
          </span>
          {user && (
            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-xs font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 active:scale-95 transition-all cursor-pointer"
              title="View my gamer profile and settings"
            >
              Lv. {user.level} | Rep: {user.reputationScore}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-sm"
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => router.push('/safety')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            🛡️ Safety
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Control Panel / Match Lobby */}
        <aside className={`w-full md:w-[350px] p-6 border-r flex flex-col gap-6 overflow-y-auto ${
          theme === 'dark' ? 'border-white/5 bg-[#1E293B]/20' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Match Filters
            </h2>
            
            {/* Interests tags input */}
            <form onSubmit={addInterest} className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interests (Keywords)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm ${
                    theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500/50' : 'bg-white border-slate-200 focus:border-indigo-500'
                  }`}
                  placeholder="anime, sports, music"
                />
                <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs cursor-pointer">
                  Add
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {interests.map((tag, idx) => (
                <span 
                  key={tag}
                  className="px-2 py-1 rounded-lg text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5"
                >
                  #{tag}
                  <button onClick={() => removeInterest(idx)} className="hover:text-rose-400 font-bold">×</button>
                </span>
              ))}
              {interests.length === 0 && (
                <span className="text-xs text-slate-500 italic">No interests selected. Worldwide match active.</span>
              )}
            </div>

            {/* Language & Country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                    theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-white border-slate-200'
                  }`}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Country</label>
                <select 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                    theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-white border-slate-200'
                  }`}
                >
                  <option value="US">United States</option>
                  <option value="JP">Japan</option>
                  <option value="ES">Spain</option>
                </select>
              </div>
            </div>
          </div>

          <hr className={theme === 'dark' ? 'border-white/5' : 'border-slate-200'} />

          {/* Social (Friends list) - Registered only */}
          {user?.registrationType?.toLowerCase() !== 'guest' && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Friends
              </h2>
              
              <form onSubmit={handleAddFriend} className="mb-4">
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-white border-slate-200'
                    }`}
                    placeholder="friend@domain.com"
                  />
                  <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs cursor-pointer">
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                    <span className="text-xs truncate font-medium text-slate-400">{friend.email}</span>
                    <span className="text-[10px] font-bold text-indigo-400">Lv.{friend.level}</span>
                  </div>
                ))}
                {friends.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No friends added yet.</span>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Center / Chat Window */}
        <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-slate-500/[0.02]">
          {/* Waiting/Searching view */}
          {matchStatus !== 'chat' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {matchStatus === 'searching' ? (
                <>
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse"></div>
                    <div className="absolute inset-6 rounded-full bg-indigo-600/40"></div>
                  </div>
                  <h3 className="text-xl font-black mb-2 animate-pulse">Searching for a Stranger...</h3>
                  <p className="text-sm text-slate-400 mb-2">Matching interests, language, and reputation score.</p>
                  <div className="flex gap-4 text-xs font-semibold text-indigo-400 mb-6">
                    <span>Queue: {activeCount} active</span>
                    <span>•</span>
                    <span>Est. Wait: {estimatedWaitSec}s</span>
                  </div>
                </>
              ) : (
                <>
                  <MessageSquare className="w-16 h-16 text-indigo-600/30 mb-4" />
                  <h3 className="text-xl font-black mb-2">Ready to Chat?</h3>
                  <p className="text-sm text-slate-400 mb-6">Select a communication mode and start connecting.</p>
                  
                  {/* Mode Selector Tabs */}
                  <div className="flex gap-1 p-1 rounded-xl bg-slate-500/10 mb-6 border border-slate-500/5">
                    {(['text', 'voice', 'video'] as const).map((mode) => {
                      const isLocked = (mode === 'voice' && !canVoice) || (mode === 'video' && !canVideo);
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            if (isLocked) { router.push('/subscription'); return; }
                            setMatchMediaType(mode);
                          }}
                          className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                            matchMediaType === mode && !isLocked
                              ? 'bg-indigo-600 text-white shadow-md'
                              : isLocked
                              ? 'text-slate-600 cursor-pointer hover:text-slate-400'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {mode}
                          {isLocked && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-bold">
                              <Lock className="w-2 h-2" />PRO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Subscription Prompt if not paid */}
                  {!subscriptionActive && (
                    <button
                      onClick={() => router.push('/subscription')}
                      className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors mb-4"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Upgrade to unlock Voice, Video &amp; Gender Filter →
                    </button>
                  )}
                </>
              )}

              <button 
                onClick={handleMatchTrigger}
                className={`px-8 py-3 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
                  matchStatus === 'searching' 
                    ? 'bg-rose-600 text-white hover:bg-rose-500' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {matchStatus === 'searching' ? 'Cancel Search' : `Find ${matchMediaType.toUpperCase()} Match`}
              </button>
            </div>
          )}

          {/* Active Chat view (Split Screen Layout for WebRTC) */}
          {matchStatus === 'chat' && (
            <>
              {/* WebRTC Video Split Panel */}
              <div className={`w-full md:w-1/2 h-[300px] md:h-full flex flex-col border-b md:border-b-0 md:border-r relative ${
                theme === 'dark' ? 'border-white/5 bg-slate-950' : 'border-slate-200 bg-slate-100'
              }`}>
                {/* Connection Quality / Stats overlay */}
                <div className="absolute top-4 left-4 z-10 text-[10px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur text-white flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    connectionQuality === 'excellent' ? 'bg-emerald-500' : connectionQuality === 'fair' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></span>
                  Quality: {connectionQuality.toUpperCase()}
                </div>

                {/* Remote Video Stream */}
                {remoteStream ? (
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs italic">
                    Connecting media feed...
                  </div>
                )}

                {/* Local Video Preview Overlay */}
                <div className="absolute bottom-16 right-4 w-28 h-20 md:w-36 md:h-24 rounded-lg overflow-hidden border border-white/10 shadow-lg bg-black">
                  {localStream && !isCamOff ? (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                      Camera Off
                    </div>
                  )}
                </div>

                {/* Media Control Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur">
                  <button 
                    onClick={toggleMic}
                    className={`p-2 rounded-full hover:brightness-110 active:scale-90 transition-all ${
                      isMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                    title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={toggleCam}
                    className={`p-2 rounded-full hover:brightness-110 active:scale-90 transition-all ${
                      isCamOff ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                    title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-full hover:brightness-110 active:scale-90 transition-all ${
                      isSharingScreen ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                    title={isSharingScreen ? 'Stop Screen Share' : 'Share Screen'}
                  >
                    <MonitorUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Split Panel */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Chat Header Control Panel */}
                <div className={`px-6 py-3 flex justify-between items-center border-b ${
                  theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold">{peerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="p-2 rounded-lg hover:bg-slate-500/10 text-slate-400"
                      title={isMuted ? "Unmute conversation" : "Mute conversation"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={skip} className="p-2 rounded-lg hover:bg-slate-500/10 text-slate-400" title="Skip to next stranger">
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button onClick={block} className="p-2 rounded-lg hover:bg-slate-500/10 text-rose-400" title="Block stranger">
                      <Ban className="w-4 h-4" />
                    </button>
                    <button onClick={() => report('inappropriate')} className="p-2 rounded-lg hover:bg-slate-500/10 text-rose-400" title="Report stranger">
                      <AlertOctagon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chat Thread */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[70%] ${
                        msg.sender === 'self' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      {msg.text.startsWith('[IMAGE:') ? (() => {
                        const parts = msg.text.slice(7, -1).split(':');
                        const mediaId = parts[0];
                        const expiresAt = parts[1];
                        const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
                        return (
                          <div className="relative">
                            <img
                              src={`${BACKEND_URL}/api/v1/media/${mediaId}`}
                              alt="Shared image"
                              onContextMenu={(e) => e.preventDefault()}
                              className="max-w-[200px] max-h-[200px] rounded-xl object-cover select-none"
                              draggable={false}
                            />
                            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] text-white font-bold">
                              ⏱ {remaining}s
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1 text-center">Screenshot protected · Expires in {remaining}s</div>
                          </div>
                        );
                      })() : (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender === 'self'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : theme === 'dark' 
                              ? 'bg-[#1E293B] text-slate-100 rounded-tl-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-center gap-1.5 mr-auto text-slate-500 text-xs italic">
                      <span>Stranger is typing</span>
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Chat Form Input */}
                <form onSubmit={handleSendMessage} className={`p-4 border-t ${
                  theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
                }`}>
                  {/* Hidden image input */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleSendImage}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imageUploading || !roomId}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        imageUploading ? 'opacity-50' : 'hover:bg-slate-500/10'
                      } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                      title="Share image (60s expiry)"
                    >
                      {imageUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </button>
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        if (roomId) sendTyping(roomId, e.target.value.length > 0);
                      }}
                      onBlur={() => {
                        if (roomId) sendTyping(roomId, false);
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl border outline-none text-sm transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500/50 focus:bg-slate-950'
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'
                      }`}
                      placeholder="Type message..."
                    />
                    <button type="submit" className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95 cursor-pointer">
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

"use client";

import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useSocket } from '../hooks/useSocket';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, UserCheck, ShieldAlert, Sparkles, Languages, Globe } from 'lucide-react';
import ReCaptcha from '../components/ReCaptcha';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Home() {
  const router = useRouter();
  const { token, setToken, setUser, theme, toggleTheme } = useChatStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Check for Google OAuth errors in the query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'google_auth_failed') {
        setError('Google authentication failed. Please try again.');
      }
    }
  }, []);

  // Redirect to dashboard if token exists or restore session from cookie
  useEffect(() => {
    if (token) {
      router.push('/dashboard');
      return;
    }

    const checkSession = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/session`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          ...({ credentials: 'include' } as any)
        });
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            setToken(data.token);
            setUser(data.user);
            if (data.user.onboardingComplete === false) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          }
        }
      } catch (err) {
        // Ignored, user is just guest or not logged in yet
      }
    };
    checkSession();
  }, [token, router, setToken, setUser]);

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Guest login failed');

      setToken(data.token);
      setUser(data.user);
      // Guests always need onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register' && !captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      setLoading(false);
      return;
    }

    const url = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      setToken(data.token);
      setUser(data.user);
      if (data.user?.onboardingComplete === false) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col md:flex-row items-center justify-center p-6 relative overflow-hidden ${
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Glassmorphism background effects */}
      {theme === 'dark' && (
        <>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl"></div>
        </>
      )}

      {/* Accessibility Skip Link */}
      <a href="#auth-card" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white p-3 rounded z-50">
        Skip to Login Form
      </a>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full md:w-1/2 flex flex-col justify-center items-start pr-0 md:pr-12 mb-8 md:mb-0 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 mb-4 bg-indigo-600/10 text-indigo-500 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide backdrop-blur-sm border border-indigo-500/10"
        >
          <Sparkles className="w-4 h-4" /> 100% Free & Self-Hosted
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-none"
        >
          Connect with Strangers Worldwide.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-slate-400 mb-8 max-w-md"
        >
          Chat anonymously, filter by matching interests and language, all without trackers, subscription plans, or intrusive ads.
        </motion.p>

        {/* Feature Icons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500 backdrop-blur-sm border border-indigo-500/10">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-400">Global Match</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500 backdrop-blur-sm border border-indigo-500/10">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-400">Language Lock</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Glassmorphic Form Card */}
      <motion.div
        id="auth-card"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className={`w-full md:w-[450px] p-8 rounded-3xl border transition-all duration-300 relative z-10 ${
          theme === 'dark' 
            ? 'bg-[#1E293B]/60 backdrop-blur-xl border-white/10 shadow-2xl shadow-indigo-500/5'
            : 'bg-white/80 backdrop-blur-xl border-slate-200/80 shadow-xl'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button 
            onClick={toggleTheme}
            className="text-xs px-3 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20"
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl outline-none border transition-all text-sm ${
                theme === 'dark' 
                  ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500/50 focus:bg-slate-950'
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'
              }`}
              placeholder="name@domain.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl outline-none border transition-all text-sm ${
                theme === 'dark' 
                  ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500/50 focus:bg-slate-950'
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'
              }`}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === 'register' && (
            <ReCaptcha
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken('')}
            />
          )}

          <button 
            type="submit" 
            disabled={loading || (mode === 'register' && !captchaToken)}
            className={`w-full py-3 rounded-xl text-white font-bold hover:brightness-110 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
              loading || (mode === 'register' && !captchaToken)
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600'
            }`}
          >
            {loading ? 'Processing...' : mode === 'login' ? <><LogIn className="w-4 h-4" /> Log In</> : <><UserPlus className="w-4 h-4" /> Sign Up</>}
          </button>
        </form>

        <button
          onClick={() => {
            setLoading(true);
            window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
          }}
          disabled={loading}
          className={`w-full mt-3 py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            theme === 'dark'
              ? 'border-white/10 hover:bg-white/5 text-white bg-slate-900'
              : 'border-slate-200 hover:bg-slate-50 text-slate-900 bg-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-500/10"></div></div>
          <span className={`relative px-3 text-xs font-bold ${theme === 'dark' ? 'bg-[#1E293B] text-slate-500' : 'bg-white text-slate-400'}`}>OR</span>
        </div>

        <button 
          onClick={handleGuestLogin}
          disabled={loading}
          className={`w-full py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            theme === 'dark' 
              ? 'border-white/10 hover:bg-white/5 text-white'
              : 'border-slate-200 hover:bg-slate-50 text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Continue as Guest
        </button>

        <p className="text-center text-xs text-slate-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-indigo-500 font-bold hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

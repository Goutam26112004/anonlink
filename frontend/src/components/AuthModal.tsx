"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, UserCheck, ShieldAlert, X } from 'lucide-react';
import Turnstile from './Turnstile';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
}: {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}) {
  const router = useRouter();
  const { setToken, setUser } = useChatStore();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setCaptchaToken('');
      setRememberMe(false);
    }
  }, [isOpen]);

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Guest login failed');
      setToken(data.token);
      setUser(data.user);
      onClose();
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
      setError('Please complete the verification.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}${mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, captchaToken }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');
      setToken(data.token);
      setUser(data.user);
      onClose();
      router.push(data.user?.onboardingComplete === false ? '/onboarding' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div className="glass-heavy w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-[var(--shadow-glass)]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[var(--danger-subtle)] border border-[var(--danger)]/20 text-[var(--danger)] text-xs font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl outline-none border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)]/50 transition-all text-sm"
                  placeholder="name@domain.com"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl outline-none border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)]/50 transition-all text-sm"
                  placeholder="Password"
                  required
                />

                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[var(--border-secondary)] text-[var(--brand)] accent-[var(--brand)]"
                      />
                      <span className="text-xs text-[var(--text-muted)]">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs text-[var(--brand)] font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'register' && (
                  <Turnstile onVerify={(token) => setCaptchaToken(token)} onExpire={() => setCaptchaToken('')} />
                )}

                <button
                  type="submit"
                  disabled={loading || (mode === 'register' && !captchaToken)}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-[var(--brand)] hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? 'Processing...' : mode === 'login' ? (
                    <><LogIn className="w-4 h-4" /> Log In</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Sign Up</>
                  )}
                </button>
              </form>

              <button
                onClick={() => {
                  setLoading(true);
                  window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
                }}
                disabled={loading}
                className="w-full mt-2.5 py-2.5 rounded-xl border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-primary)]"></div>
                </div>
                <span className="relative px-3 text-xs font-bold bg-[var(--bg-card)] text-[var(--text-muted)]">
                  OR
                </span>
              </div>

              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" /> Continue as Guest
              </button>

              <p className="text-center text-xs text-[var(--text-muted)] mt-4">
                {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                {mode === 'login' ? (
                  <a href="/signup" className="text-[var(--brand)] font-bold hover:underline">
                    Sign Up
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[var(--brand)] font-bold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                )}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

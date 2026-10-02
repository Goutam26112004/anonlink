'use client';

import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useChatStore } from '../store/chatStore';
import { useRouter } from 'next/navigation';
import { Nav } from '../components/ui/Nav';
import { Footer } from '../components/ui/Footer';
import { StructuredData } from '../components/StructuredData';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import TrustSafetySection from '../components/TrustSafetySection';
import FAQSection from '../components/FAQSection';

export default function Home() {
  const router = useRouter();
  const { token, setToken, setUser } = useChatStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiFetch('/api/v1/auth/session', { skipAuth: true }).catch(() => null);
        if (data?.token && data?.user) {
          setToken(data.token);
          setUser(data.user);
          router.push(data.user.onboardingComplete === false ? '/onboarding' : '/dashboard');
        } else if (token) {
          sessionStorage.removeItem('token');
          setToken(null);
        }
      } catch {
        if (token) {
          sessionStorage.removeItem('token');
          setToken(null);
        }
      }
    };
    checkSession();
  }, [router, setToken, setUser]);

  return (
    <main>
      <StructuredData />
      <Nav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TrustSafetySection />
      <FAQSection />
      <Footer />
    </main>
  );
}

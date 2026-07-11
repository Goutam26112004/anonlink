"use client";

import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import StatsSection from '../components/StatsSection';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Home() {
  const router = useRouter();
  const { token, setToken, setUser } = useChatStore();

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
          ...({ credentials: 'include' } as any),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            setToken(data.token);
            setUser(data.user);
            router.push(data.user.onboardingComplete === false ? '/onboarding' : '/dashboard');
          }
        }
      } catch (err) {}
    };
    checkSession();
  }, [token, router, setToken, setUser]);

  return (
    <main>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <WhyChooseUs />
      <Testimonials />
      <FAQSection />
      <Footer />
    </main>
  );
}

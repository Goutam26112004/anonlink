"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageCircle, Users, Bell, Crown, Award,
  User, Settings, HelpCircle, Shield, FileText, LogOut,
  ChevronLeft, Menu, X
} from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Random Chat', icon: MessageCircle, href: '/dashboard' },
  { label: 'Friends', icon: Users, href: '#' },
  { label: 'Notifications', icon: Bell, href: '#' },
  { label: 'Subscription', icon: Crown, href: '/subscription' },
  { label: 'Achievements', icon: Award, href: '/profile' },
  { label: 'Profile', icon: User, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/profile' },
];

const bottomItems = [
  { label: 'Help', icon: HelpCircle, href: '/safety' },
  { label: 'Privacy Policy', icon: Shield, href: '#' },
  { label: 'Terms of Service', icon: FileText, href: '#' },
  { label: 'Community Guidelines', icon: FileText, href: '/safety' },
];

export default function Sidebar({
  collapsed,
  onToggle,
  onLogout,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname === href;
  };

  const handleNav = (href: string) => {
    if (href === '#') return;
    router.push(href);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col ${collapsed ? 'items-center' : ''}`}>
      <div className={`p-3 border-b border-[var(--border-primary)] ${collapsed ? 'flex justify-center' : ''}`}>
        <AnimatedLogo size={28} showText={!collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNav(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              collapsed ? 'justify-center' : ''
            } ${
              isActive(item.href)
                ? 'bg-[var(--brand-subtle)] text-[var(--brand)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </div>

      <div className="border-t border-[var(--border-primary)] py-3 px-2 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNav(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              collapsed ? 'justify-center' : ''
            } text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            collapsed ? 'justify-center' : ''
          } text-[var(--text-secondary)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)]`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center p-3 border-t border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[var(--bg-glass-heavy)] backdrop-blur-sm border border-[var(--border-primary)] text-[var(--text-secondary)]"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={`hidden lg:flex flex-col ${
          collapsed ? 'w-16' : 'w-60'
        } h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-200 shrink-0`}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] shadow-[var(--shadow-glass)]"
            >
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="-mt-2">{sidebarContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

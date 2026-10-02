"use client";

import { useState, useEffect } from "react";
import { RegisterPopup } from "../dashboard/RegisterPopup";
import { useRouter, usePathname } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Bell,
  Crown,
  Award,
  User,
  Settings,
  HelpCircle,
  Shield,
  FileText,
  LogOut,
  ChevronLeft,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Chat", icon: MessageCircle, href: "/chat" },
  { label: "Friends", icon: Users, href: "/friends" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  { label: "Subscription", icon: Crown, href: "/subscription" },
  { label: "Profile", icon: User, href: "/profile" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const bottomItems = [
  { label: "Help", icon: HelpCircle, href: "/help" },
  { label: "Privacy Policy", icon: Shield, href: "/privacy" },
  { label: "Terms of Service", icon: FileText, href: "/terms" },
  { label: "Refund Policy", icon: FileText, href: "/refund-policy" },
  { label: "Community Guidelines", icon: FileText, href: "/guidelines" },
];

const tabItems = [
  { label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { label: "Chat", icon: MessageCircle, id: "chat" },
  { label: "Friends", icon: Users, id: "friends" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Profile", icon: User, id: "profile" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ collapsed, onToggle, onLogout, activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const subscriptionActive = useChatStore((s) => s.subscriptionActive);
  const user = useChatStore((s) => s.user);
  const token = useChatStore((s) => s.token);
  // Only treat as guest if we have user data AND it says guest, or if no token at all
  const isGuest = !token || (user !== null && (!user.registrationType || user.registrationType.toLowerCase() === 'guest'));
  const [showGuestPopup, setShowGuestPopup] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!token) return;
    import("@/lib/api").then(({ apiFetch }) => {
      apiFetch("/api/v1/profile/me").then((data: any) => {
        if (data?.role && ['SUPER ADMIN', 'ADMIN', 'SENIOR MODERATOR', 'MODERATOR'].includes(data.role.toUpperCase())) {
          setIsAdminUser(true);
        }
      }).catch(() => {});
    });
  }, [token]);

  const isActive = (href: string, label?: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const restrictedForGuests = ["/friends", "/notifications", "/profile", "/settings"];
  
  const handleNav = (href: string, label?: string) => {
    if (href === "#") return;
    if (isGuest && restrictedForGuests.includes(href)) {
      setShowGuestPopup(true);
      setMobileOpen(false);
      return;
    }
    router.push(href);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col ${collapsed ? "items-center" : ""}`}>
      <div className={`p-3 border-b border-[var(--color-border)] ${collapsed ? "flex justify-center" : ""}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-display font-bold text-[var(--color-text-primary)]">AnonLink</span>
              {subscriptionActive && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30">PRO</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNav(item.href, item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)] ${
              collapsed ? "justify-center" : ""
            } ${
              isActive(item.href, item.label)
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
            }`}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
        {/* Admin Console - only for admin roles */}
        {isAdminUser && (
          <button
            onClick={() => handleNav("/admin")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              collapsed ? "justify-center" : ""
            } ${
              isActive("/admin")
                ? "bg-red-500/10 text-red-400"
                : "text-amber-400 hover:bg-amber-500/10"
            }`}
            title={collapsed ? "Admin Console" : undefined}
          >
            <Shield className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">Admin Console</span>}
          </button>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] py-3 px-2 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            onMouseEnter={() => item.href !== '#' && router.prefetch(item.href)}
            onClick={() => handleNav(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)] ${
              collapsed ? "justify-center" : ""
            } text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]`}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
        {/* Theme Toggle */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2`}>
          <ThemeToggle />
          {!collapsed && <span className="text-xs text-[var(--color-text-secondary)]">Theme</span>}
        </div>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)] ${
            collapsed ? "justify-center" : ""
          } text-[var(--color-text-secondary)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]`}
          title={collapsed ? "Logout" : undefined}
          aria-label={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center p-3 border-t border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </div>
  );

  const handleTabClick = (tabId: string) => {
    if (tabId === "profile") {
      router.push("/profile");
      return;
    }
    if (tabId === "dashboard") {
      router.push("/dashboard");
      return;
    }
    onTabChange?.(tabId);
  };

  const isTabActive = (tabId: string) => {
    if (tabId === "profile") return pathname === "/profile";
    if (tabId === "dashboard") return pathname === "/dashboard" && activeTab === undefined;
    return activeTab === tabId;
  };

  return (
    <>
      <aside className={`hidden lg:flex flex-col ${
        collapsed ? "w-16" : "w-56"
      } h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-200 shrink-0`}>
        {sidebarContent}
      </aside>

      {onTabChange && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 pb-1 safe-area-bottom">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onMouseEnter={() => {
                if (tab.id === 'profile') router.prefetch('/profile');
                else if (tab.id === 'dashboard') router.prefetch('/dashboard');
              }}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)] ${
                isTabActive(tab.id)
                  ? "text-[var(--color-signal-violet)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate w-full text-center">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {!onTabChange && (
        <>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed top-3 left-3 z-[45] p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)]"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="fixed left-0 top-0 bottom-0 z-[56] w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl"
                >
                  <div className="flex justify-end p-2">
                    <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)]" aria-label="Close sidebar menu">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="-mt-2">{sidebarContent}</div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
      <RegisterPopup
        open={showGuestPopup}
        onClose={() => setShowGuestPopup(false)}
        onSuccess={() => { setShowGuestPopup(false); }}
      />
    </>
  );
}

function Menu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Search, UserPlus, UserCheck, Clock, X, Send, Loader2 } from "lucide-react";
import { AnonAvatar } from "../../components/ui/AnonAvatar";
import { apiFetch, getApiBase } from "@/lib/api";
import { ReportModal } from "../../components/dashboard/ReportModal";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";
import type { FriendData, FriendRequestData } from "@anon-chat/types";

export default function FriendsPage() {
  const router = useRouter();
  const { friends, friendRequests, socket } = useChatStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "requests" | "send">("all");
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [reportingFriendId, setReportingFriendId] = useState<string | null>(null);

  // Fetch friends list from API on mount
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await apiFetch("/api/v1/friends");
        if (data?.friends) {
          useChatStore.setState({ friends: data.friends });
        }
      } catch {}
    };
    fetchFriends();

    // Also fetch friend requests
    const fetchRequests = async () => {
      try {
        const data = await apiFetch("/api/v1/friends/requests");
        if (data?.received) {
          useChatStore.setState({ friendRequests: data.received });
        }
      } catch {}
    };
    fetchRequests();
  }, []);

  const handleBlockFriend = async (friendId: string) => {
    const confirm = window.confirm("Are you sure you want to block this user? You will no longer be friends.");
    if (!confirm) return;
    try {
      await apiFetch("/api/v1/moderation/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: friendId })
      });
      // Remove from local friends list in store
      useChatStore.setState((s) => ({
        friends: s.friends.filter((f) => f.userId !== friendId)
      }));
      alert("User blocked successfully.");
    } catch (e: any) {
      alert(e.message || "Failed to block user.");
    }
  };

  const handleReportSubmit = async (reason: string, details: string, alsoBlock: boolean) => {
    if (!reportingFriendId) return;
    try {
      await apiFetch("/api/v1/moderation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: reportingFriendId,
          reason: `${reason}: ${details}`,
        })
      });
      if (alsoBlock) {
        await apiFetch("/api/v1/moderation/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockedId: reportingFriendId })
        });
        // Remove from local friends list in store
        useChatStore.setState((s) => ({
          friends: s.friends.filter((f) => f.userId !== reportingFriendId)
        }));
      }
      alert("Report submitted successfully.");
    } catch (e: any) {
      alert(e.message || "Failed to submit report.");
    } finally {
      setReportingFriendId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return friends;
    const q = search.toLowerCase();
    const f = friends as (FriendData & { displayName?: string })[];
    return f.filter(
      (fr) =>
        (fr.displayName || "").toLowerCase().includes(q) ||
        (fr.userId || "").toLowerCase().includes(q)
    );
  }, [friends, search]);

  const incomingRequests = (friendRequests || []).filter(
    (r: FriendRequestData) => r.status === "PENDING"
  );

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Friends</h1>
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {friends.length} friend{friends.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-signal-violet)]/50 outline-none text-sm transition-colors"
          />
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setTab("all")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              tab === "all"
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Users className="w-4 h-4" /> All Friends
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              tab === "requests"
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <UserPlus className="w-4 h-4" /> Requests
            {incomingRequests.length > 0 && (
              <span className="min-w-[18px] h-4 px-0.5 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("send")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              tab === "send"
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Send className="w-4 h-4" /> Send Request
          </button>
        </div>

        <motion.div layout className="space-y-2">
          {tab === "all" && (
            filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[var(--color-text-secondary)]" />
                </div>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {search ? "No friends match your search" : "No friends yet"}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {search ? "Try a different name" : "Start chatting to make connections!"}
                </p>
              </div>
            ) : (
              filtered.map((fr: FriendData, i: number) => (
                <motion.div
                  key={fr.userId || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {(fr as any).avatarUrl ? (
                    <img src={(fr as any).avatarUrl.startsWith('http') ? (fr as any).avatarUrl : `${getApiBase()}${(fr as any).avatarUrl}`} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[var(--color-border)]" />
                  ) : (
                    <AnonAvatar sessionId={fr.userId || fr.email || undefined} size={36} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {fr.displayName || "User"}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      @{(fr as any).username || (fr.userId || "").slice(0, 8)}
                    </p>
                  </div>
                  <div className={`hidden sm:flex items-center gap-1 text-xs mr-2 ${fr.status === 'ONLINE' ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${fr.status === 'ONLINE' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-secondary)]'}`} />
                    {fr.status === 'ONLINE' ? 'Online' : 'Offline'}
                  </div>
                  {/* Mobile: show status dot inline with name */}
                  <span className={`sm:hidden w-2 h-2 rounded-full shrink-0 ${fr.status === 'ONLINE' ? 'bg-[var(--color-success)]' : 'bg-neutral-600'}`} />
                  <button
                    onClick={() => fr.userId && router.push(`/dm/${fr.userId}`)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-signal-violet)] text-white text-xs font-medium hover:brightness-110 transition-all cursor-pointer shrink-0"
                  >
                    Chat
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === fr.userId ? null : fr.userId)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                    {activeDropdown === fr.userId && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveDropdown(null)}
                        />
                        <div className="absolute right-0 mt-1 w-32 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 py-1">
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              setReportingFriendId(fr.userId);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => {
                              setActiveDropdown(null);
                              handleBlockFriend(fr.userId);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                          >
                            Block
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )
          )}

          {tab === "requests" && (
            incomingRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-[var(--color-text-secondary)]" />
                </div>
                <p className="text-[var(--color-text-primary)] font-medium">No pending requests</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Friend requests will appear here
                </p>
              </div>
            ) : (
              incomingRequests.map((r: FriendRequestData, i: number) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
                >
                  <AnonAvatar sessionId={r.sender?.userId || r.senderId} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {r.sender?.displayName || "User"}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      User since {(() => {
                        const created = (r.sender as any)?.createdAt || r.createdAt;
                        if (!created) return '0';
                        const diffTime = Math.abs(Date.now() - new Date(created).getTime());
                        return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                      })()} days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => socket?.emit('friend:accept_request', { requestId: r.id })}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-signal-violet)] text-white text-xs font-medium hover:brightness-110 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => socket?.emit('friend:decline_request', { requestId: r.id })}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-[var(--color-danger)] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))
            )
          )}

          {tab === "send" && (
            <div className="space-y-4">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Send Friend Request</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-4">Enter a username to find and add a friend.</p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      value={searchUsername}
                      onChange={(e) => { setSearchUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setSearchResult(null); setSendStatus(""); }}
                      placeholder="Enter username..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-signal-violet)]/50 outline-none text-sm transition-colors"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (searchUsername.length < 3) return;
                      setSearching(true);
                      setSearchResult(null);
                      setSendStatus("");
                      try {
                        const data = await apiFetch(`/api/v1/friends/search/${searchUsername}`);
                        setSearchResult(data);
                      } catch (e: any) { setSendStatus(e.message || "Error searching"); }
                      setSearching(false);
                    }}
                    disabled={searchUsername.length < 3 || searching}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {/* Search Result */}
                {searchResult && searchResult.found && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AnonAvatar sessionId={searchResult.user.id} size={40} />
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">{searchResult.user.displayName || searchResult.user.username}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">@{searchResult.user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setSendStatus("");
                        try {
                          await apiFetch("/api/v1/friends/request-by-username", { method: "POST", body: JSON.stringify({ username: searchResult.user.username }) });
                          setSendStatus("Friend request sent!");
                          setSearchResult(null);
                          setSearchUsername("");
                        } catch (e: any) { setSendStatus(e.message || "Failed to send"); }
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--color-signal-violet)] text-white text-xs font-bold hover:brightness-110 transition-all"
                    >
                      Send Request
                    </button>
                  </motion.div>
                )}

                {searchResult && !searchResult.found && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl bg-[var(--color-surface-2)] text-center">
                    <p className="text-xs text-[var(--color-text-secondary)]">No user found with username &ldquo;{searchUsername}&rdquo;</p>
                  </motion.div>
                )}

                {sendStatus && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-3 text-xs font-medium ${sendStatus.includes("sent") ? "text-emerald-400" : "text-red-400"}`}>
                    {sendStatus}
                  </motion.p>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </div>

      <ReportModal
        open={reportingFriendId !== null}
        onClose={() => setReportingFriendId(null)}
        onSubmit={handleReportSubmit}
        onBlock={() => {
          if (reportingFriendId) {
            handleBlockFriend(reportingFriendId);
            setReportingFriendId(null);
          }
        }}
      />
    </div></div>
    </AuthenticatedLayout>
  );
}

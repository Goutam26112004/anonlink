# AnonLink — Project Context for AI Assistants

This file captures the full state of the project so that when a new session starts, the AI has complete context of what was built, what changed, what's pending, and how everything works.

---

## Project Overview

AnonLink is an anonymous chat platform (text/voice/video) with:
- **Frontend**: Next.js 16.2 (App Router, Turbopack) + Tailwind + Zustand + Framer Motion + Socket.IO client
- **Backend**: Express + Prisma + Socket.IO + Redis + PostgreSQL + WebRTC (coturn TURN server)
- **Deployment**: Docker on single VM (`132.226.190.112`), nginx reverse proxy, certbot SSL

**Live URL**: `https://anonlink.online`

---

## Recent Changes (Jul 14-15, 2026)

### 1. Nginx Cache Fix
- **File**: `nginx/nginx.prod.conf` (VM: `/home/ubuntu/anon-chat-platform/nginx/nginx.conf`)
- Added `location /_next/static/` block that proxies to `frontend:3000` with `proxy_hide_header Cache-Control` + `add_header Cache-Control "public, max-age=31536000"` (strips `immutable` from Next.js JS chunks).

### 2. Mobile "Start Chatting" Button Fix
- **File**: `frontend/src/components/ui/Nav.tsx`
- Changed mobile drawer `<Link>` to `<button>` with `router.push("/auth")` to avoid `a { color: var(--brand); }` CSS from `globals.css` overriding `text-white`.

### 3. Gamification System Removed
**Deleted files:**
- `backend/src/services/gamification.ts` + compiled `.js`
- `backend/src/routes/gamification.ts`
- `frontend/src/app/achievements/` (page + layout)

**Backend changes:**
- `backend/src/index.ts`: Removed gamification import/route
- `backend/prisma/schema.prisma`: Removed `reputationScore`, `experiencePoints`, `level`, `totalChats`, `voiceChats`, `videoChats` from `User` model. Removed `Achievement`, `UserAchievement`, `Badge`, `UserBadge` models.
- `backend/src/services/matchmaker.ts`: Removed `REPUTATION_GAP_PENALTY`, reputation gap scoring in `scoreTickets()`, `adjustReputation()` method, `reputationScore` from `MatchTicket` interface.
- `backend/src/sockets/handlers.ts`: Removed `reputationScore` from ticket construction, `adjustReputation` from report handler, `level` from friend request select.
- `backend/src/sockets/middleware.ts`: Removed `reputationScore`/`level` from `AuthenticatedSocket`.
- `backend/src/middleware/auth.ts`: Removed `reputationScore`/`level` from `RequestWithUser`.
- `backend/src/routes/auth.ts`: Removed `reputationScore`/`level` from ALL `generateToken()` calls, JWT payloads, responses.
- `backend/src/routes/profile.ts`: Removed `achievements`/`badges` includes, `reputationScore` from response.
- `backend/src/routes/friends.ts`: Removed `level` from ALL 6 select queries, `reputationScore` from response.
- `backend/src/routes/moderation.ts`: Replaced `adjustReputation` with report-count-based auto-mute (3+ reports in 24h). Removed `reputationScore` from moderation status.
- `backend/src/routes/admin.ts`: Removed `reputationPoints` from ban, `reputationScore` from reports/appeals.
- `backend/src/routes/messages.ts`: Removed `level` from user select.

**Types package (`packages/types/src/index.ts`):**
- Removed `reputationScore`, `experiencePoints`, `level` from `UserSession`
- Removed `level` from `FriendRequestData` sender/receiver
- Removed `level`, `reputationScore` from `FriendData`
- Added `imageUrl`, `viewOnce`, `viewed`, `isMine` to `ChatMessage`

**Frontend changes:**
- `frontend/src/store/chatStore.ts`: Removed `postChatRating` state/setter, `Friend.level`/`Friend.reputationScore`.
- `frontend/src/components/dashboard/PostChat.tsx`: Removed rating emoji buttons, kept only "partner left" + "Find another".
- `frontend/src/components/dashboard/ChatView.tsx`: Removed `setPostChatRating`, `handleRate`.
- `frontend/src/components/ui/Sidebar.tsx`: Removed "Achievements" nav item.
- `frontend/src/app/dashboard/page.tsx`: Removed Level/Rep from sidebar card.
- `frontend/src/app/profile/page.tsx`: Removed gamification fetch, Level/Rep badges.
- `frontend/src/app/safety/page.tsx`: Removed reputation score display/explanation cards.
- `frontend/src/app/admin/page.tsx`: Removed "Rep" column from user table.
- `frontend/src/components/FAQSection.tsx`: Removed "reputation score adjustment" text.
- `frontend/src/components/TrustSafetySection.tsx`: Removed "adjusts reputation scores" text.
- `frontend/src/app/friends/page.tsx`: Fixed `fromUserId` → `senderId`, `fromUser` → `sender`.
- `frontend/src/app/demo/page.tsx`: Added `MicOff`, `VideoOff` imports.

### 4. Chat UI Redesign
**Files created/changed:**

**`frontend/src/components/dashboard/TextChat.tsx`** — Full rewrite:
- **Header**: `[dot] Stranger #XXXX` + status text below | `#SESSID [copy]` centered | `[phone] [flag] [X]` right
- **Status text**: "Online · Just now" (green) / "Typing…" (cyan pulse) / "Offline" (gray). `peerLastSeen` drives timeago, re-calculated every 15s via `setInterval`.
- **Session code**: Clicking generates + copies a random 6-char uppercase code. Auto-expires after 60s. Shows "Session code copied!" toast.
- **Action bar** (new, above typing bar): `[Skip]` → `chat:skip` (re-queues), `[Leave]` → `chat:end`, `[Add Friend]` → `friend:request_in_chat`. All wired to working socket events.
- **Typing bar**: `[😊 emoji]` popover via `emoji-picker-react` v4, `[input]`, `[+ photo]` file upload, `[➤ send]` Lucide icon.
- **Emoji picker**: Opens on `Smile` button click, closes on outside click. Inserts emoji at cursor position. Import: `import EmojiPicker from 'emoji-picker-react'`.
- **Image upload flow**: File picker → `POST /api/v1/media/upload` (multer, Bearer token auth) → `data.url` → `sendMessage(roomId, '', data.url)` → socket broadcasts `imageUrl` in `chat:receive`. 60s TTL via TempMediaService.

**`frontend/src/components/dashboard/ChatControls.tsx`** — Created, toolbar with Image, Session Code, Friend Request, Skip, Call buttons. Currently used only implicitly (the new TextChat doesn't use this component anymore). Can be deleted in future cleanup.

**`frontend/src/hooks/useSocket.ts`**:
- Added `setPeerStatus`: set on `match:found` ('online'), `chat:typing` ('typing'/'online'), `chat:peer_left`/'chat:ended'/'disconnect' ('offline').
- Added `setPeerLastSeen`: set on `match:found` and `chat:typing`.
- Added `setChatMode` listener in `chat:convert_to_call` handler.
- Added `convertToCall(roomId, mediaType)` function.
- Extended `chat:send` to accept `imageUrl` param.
- Updated `chat:receive` handler to pass `msg.imageUrl` to `addMessage`.
- Extended `sendMessage(roomId, text, imageUrl?)` with optional third arg.

**`frontend/src/store/chatStore.ts`**:
- Added `peerLastSeen: string | null`
- Added `setPeerLastSeen: (time: string | null) => void`

**`frontend/src/components/dashboard/ChatView.tsx`**:
- Added `peerLastSeen` to store destructuring and TextChat props.
- Added `convertToCall` to props interface, destructuring, and Dashboard passthrough.
- Implemented `handleImageSend`: FormData upload to `/api/v1/media/upload`, emits sendMessage with URL.
- `handleConvertToCall`: checks canVoice/canVideo, redirects non-premium to `/pricing`.
- Updated `sendMessage` type to include `imageUrl`.
- Removed unused `generateSessionCode` function (moved to TextChat's `handleCopyCode`).
- Removed `useCallback` import.

**`frontend/src/app/dashboard/page.tsx`**:
- Destructured `convertToCall` from `useSocket()`, passed to ChatView.

### 5. Call Conversion (Backend)
**File**: `backend/src/sockets/handlers.ts`
- Added `chat:convert_to_call` handler: checks active `UserSubscription` (model: `prisma.userSubscription`), emits `chat:convert_to_call { mediaType, initiatedBy }` to both peers in the room.

**File**: `backend/src/routes/media.ts` (pre-existing, used by image upload)
- `POST /api/v1/media/upload` — multer memory storage, validates image MIME types (JPEG/PNG/GIF/WebP), saves via `TempMediaService.saveTemporaryImage()` with 60s TTL.
- `GET /api/v1/media/:mediaId` — serves file with `Cache-Control: no-store, no-cache, must-revalidate`.
- Registered at `app.use('/api/v1/media', mediaRouter)`.

**File**: `frontend/src/hooks/useSocket.ts`
- Returns `convertToCall` in the hook's API object.

---

## Deployment

### Script: `scripts/deploy.sh`
- Builds Docker images, saves to tarball, SCPs to VM, loads, restarts frontend container.
- **Known issue**: `nginx -s reload` step fails consistently (hangs). Use manual reload:
  ```bash
  sudo docker exec -w /etc/nginx anon-chat-nginx nginx -s reload
  # or
  sudo docker kill -s HUP anon-chat-nginx
  ```
- Frontend: `./scripts/deploy.sh --service frontend`
- Backend: The script builds + loads the backend Docker image but does NOT restart the backend container. Manual restart needed.

### Backend Container Management
- Backend runs as a standalone Docker container (not via compose on the new image).
- Two networks needed:
  ```bash
  docker run -d --name anon-chat-platform-backend-1 --restart unless-stopped \
    --network anon-chat-platform_app-network --network-alias backend \
    -p 4000:4000 \
    -e DATABASE_URL="..." -e REDIS_URL="..." -e PORT="4000" \
    -e JWT_SECRET="..." -e COTURN_SHARED_SECRET="..." \
    -e GOOGLE_CLIENT_ID="..." -e GOOGLE_CLIENT_SECRET="..." \
    -e RECAPTCHA_SECRET_KEY="..." \
    -e FRONTEND_URL="https://anonlink.online" \
    -e REFRESH_TOKEN_SECRET="..." \
    -e GOOGLE_CALLBACK_URL="https://anonlink.online/api/v1/auth/google/callback" \
    anonlink-backend:latest

  docker network connect --alias backend anon-chat-platform_default anon-chat-platform-backend-1
  ```
- **IMPORTANT**: The second network (`anon-chat-platform_default` with `--alias backend`) is NOT persisted across container restarts. If the container restarts, you must re-run `docker network connect`.
- Env vars are sourced from `/home/ubuntu/anon-chat-platform/.env` on the VM.

### Verification
```bash
curl https://anonlink.online/auth         # → 200
curl https://anonlink.online/             # → 200
curl https://anonlink.online/api/health   # → {"status":"ok","timestamp":"..."}
curl -s -o /dev/null -w "%{http_code}" https://anonlink.online/api/v1/auth/google  # → 302
```

### VM Access
```bash
ssh -i ~/.ssh/anonlink.key ubuntu@132.226.190.112
```

---

## Architecture

### Frontend (`frontend/`)
- **State**: Zustand store at `frontend/src/store/chatStore.ts` — manages chat state (matchStatus, messages, peer info, media states, subscription status).
- **Socket**: `frontend/src/hooks/useSocket.ts` — connects to backend Socket.IO, handles matchmaking, messaging, friend requests, private chat, typing, status.
- **Routing**: Next.js App Router. Key routes: `/auth`, `/dashboard`, `/profile`, `/friends`, `/settings`, `/admin`, `/safety`, `/pricing`.
- **Components**:
  - `ChatView` — main orchestrator, renders ModeSelect/FilterScreen/MatchingScreen/TextChat/MediaChat/PostChat based on matchStatus
  - `TextChat` — chat UI with header, messages, action bar, typing bar (see redesign above)
  - `MediaChat` — voice/video call UI
  - `PostChat` — shown when partner leaves (simplified to just "Find another" button)
  - `Dashboard` — hub view with stats, sidebar, activities

### Backend (`backend/`)
- **Express** on port 4000
- **Prisma** ORM with PostgreSQL (model `User`, `UserSubscription`, `SubscriptionPlan`, `Friend`, `FriendRequest`, `Block`, `Report`, `Appeal`, `TemporaryMedia`, `AuditLog`, etc.)
- **Socket.IO** at `/socket.io/` — handles matchmaking, text chat, WebRTC signaling, friend requests, moderation
- **Redis** — matchmaking queues, rate limiting, mute state, temp media metadata
- **Scheduler** — every 30s cleans expired temp media files; every 5min checks subscription expiry

### Packages (`packages/types/`)
- Shared TypeScript types consumed by both frontend and backend: `ChatMessage`, `PrivateChatMessage`, `UserSession`, `FriendData`, `FriendRequestData`, enums for status/subscription/chat mode.

---

## Pending / Notes

### Prisma Migration
The database still has stale columns from the removed gamification system (`reputationScore`, `level`, `experiencePoints`, `totalChats`, `voiceChats`, `videoChats` in `users` table; `Achievement`, `UserAchievement`, `Badge`, `UserBadge` tables). The app works without a migration (Prisma ignores extra columns). To clean up:
```bash
cd backend && npx prisma db push
```

### View-Once Image Enforcement
Images have 60s TTL via TempMediaService + anti-cache headers, but there's no server-side `viewed` tracking yet. A follow-up could add `viewOnce: true` flag + view count tracking.

### Pre-existing Build-Time TS Errors (not blocking, existed before changes)
1. `frontend/src/app/friends/page.tsx:114` — `displayName: string | null` not assignable to `string | undefined` (AnonAvatar `sessionId` prop)
2. `frontend/src/components/Skeleton.tsx:40` — `style` prop doesn't exist on component
3. `frontend/src/components/ui/Card.tsx:27` — `ForwardedRef<HTMLDivElement>` mismatch with button ref type

### Known Deploy Script Issues
- `nginx -s reload` hangs in deploy script — use manual `docker exec` or `docker kill -s HUP`
- Backend container restart is NOT automated — must be done manually after `deploy.sh --service backend`

### Dependencies Added
- `emoji-picker-react@^4.19.1` (frontend)
- `multer` + `@types/multer` (backend, pre-existing)

### Cleanup Opportunities
- `ChatControls.tsx` is no longer used by TextChat (features redistributed into header + action bar + typing bar). Safe to delete.
- The old `backend/src/services/matchmaker.js` compiled JS file may still exist. Verify and clean up.

# AI Context: Instructions for AI Coding Assistants

This document guides LLMs, AI agents, and code generation assistants working on the AnonLink repository. Adhering to these specifications guarantees code consistency, type safety, and backward compatibility.

---

## 1. Project Goals
* Ensure anonymous user connectivity with maximum security and privacy.
* Maintain microsecond-level low latency for WebRTC signaling and text routing.
* Minimize database footprints: clean up stale, expired, and temporary media assets automatically.

---

## 2. Current Implementation Status
* **Authentication**: Complete (Guest JWT, Google OAuth cookies/tokens, session auto-recovery).
* **Onboarding**: Complete (Compulsory age/gender selection stored privately).
* **Matchmaking**: Complete (Queue routing based on interests, language, reputation, and gender preference).
* **Communication**: Complete (Socket.IO text chats, WebRTC P2P voice/video signaling, screen sharing).
* **Media Sharing**: Complete (60-second expiring images with screenshot-deterrent CSS/JS).
* **Subscriptions**: Complete (Mock payment integration factory, route and socket feature guards).
* **Admin Dashboard**: Complete (Overview statistics, manual subscription grants, global feature toggles).

---

## 3. Coding Conventions & Standards

### ES Modules (ESM)
* The backend runs on Native ESM. All local relative imports **MUST** end with `.js` extensions.
* **Incorrect**: `import { prisma } from './db';`
* **Correct**: `import { prisma } from './db.js';`

### Type Definitions
* Do not use `any` unless absolutely necessary (e.g., library type bypasses). Define descriptive interfaces.
* Keep shared types in `packages/types/src/index.ts` so that both `backend` and `frontend` remain in sync.

### Error Handling
* REST handlers must catch errors in a try-catch block and return uniform responses:
  `res.status(500).json({ error: 'Descriptive message here' });`
* Socket events should emit error states:
  `socket.emit('error', { message: 'Failed action' });`

---

## 4. Architecture Rules
* **Decoupled Billing**: Never hardcode Razorpay, Stripe, or any payment gateway inside routes or services. Use the `IPaymentProvider` factory pattern defined in `paymentProvider.ts`.
* **State Management**: Use Zustand store properties inside `chatStore.ts` for all state updates. Never mutate global window properties.
* **Cleanups**: Always verify background schedulers (`scheduler.ts`) when adding expiring models. Do not block main event loops; delete records in batch.

---

## 5. UI Guidelines
* **Theme**: The platform defaults to a vibrant, dark-mode-first slate design (`bg-[#0B0F19]`). Ensure light-mode fallbacks are styled properly (`bg-[#F8FAFC]`).
* **Icons**: Use Lucide icons for UI controls.
* **Alerts**: Highlight status indicators with HSL-balanced borders (e.g. green for active, amber for warning, rose for locked/error).

---

## 6. Things AI Should NEVER Change Without Explicit Approval
1. **Google OAuth Callback Routes**: The callback redirects, state cookie CSRF verifications, and parameter transfers are delicate.
2. **WebRTC Hooks & Signaling**: Avoid modifying `useWebRTC.ts` and socket signal transfers (`webrtc:signal`) to prevent peer-connection breakages.
3. **Reputation Penalty Weights**: Do not alter `MATCH_CONFIG` coefficients without testing starvation impacts.

---

## 7. Known Limitations & Roadmap
* **Turn/Stun Limits**: Current Coturn bandwidth is non-metered. High-traffic requires load balancers.
* **File Size limits**: Images are capped at 5MB. Large attachments must be rejected at endpoint level.
* **Live Notifications**: Native browser push notifications (`serviceWorker`) are stubbed and require FCM configuration in a future phase.

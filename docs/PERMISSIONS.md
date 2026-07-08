# Permissions & Feature Gating Model

This document outlines the user permissions mapping and gating controls introduced in Phase 13.

## User Classification matrix

| User Type | Onboarding Required | Voice Chat Matching | Video Chat Matching | Gender Preference Filtering | Image Sharing (60s Expiry) |
|---|---|---|---|---|---|
| **Guest** | Yes | ❌ | ❌ | ❌ | Yes |
| **Free** | Yes | ❌ | ❌ | ❌ | Yes |
| **Paid** | Yes | Yes | Yes | Yes | Yes |

---

## Enforcement mechanisms

### 1. Backend REST Endpoints (Feature Guard Middleware)
- Applied using the `requireFeature(featureName)` middleware.
- Example: `router.get('/voice/token', requireFeature('voice'), ...)`
- Responds with `403 Forbidden` and `requiredPlan: 'PAID'` if unauthorized.

### 2. Socket.io Handlers
- Checked during `match:join` events.
- Emits `feature:locked` socket event containing details and upgrade links.
- Checks global admin flag overrides in Redis first (`feature:voice_enabled` & `feature:video_enabled`).

### 3. Frontend Gating
- Gated using state flags from `useChatStore` (`canVoice`, `canVideo`, `canGenderFilter`).
- Non-accessible media modes show a padlock badge and link to `/subscription`.

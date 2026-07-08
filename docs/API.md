# Phase 13 API Specifications

This document catalogs the newly introduced endpoints for user onboarding, subscriptions, and temporary media.

## Onboarding Routes

### 1. GET /api/v1/onboarding/status
Returns whether onboarding has been completed for the current authenticated session.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200)**:
```json
{
  "completed": true,
  "data": {
    "ageRange": "AGE_18_24",
    "gender": "MALE"
  }
}
```

### 2. POST /api/v1/onboarding/complete
Saves user's age range and gender preferences.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "ageRange": "AGE_25_34",
  "gender": "FEMALE"
}
```
- **Response (200)**:
```json
{
  "success": true,
  "onboarding": {
    "userId": "uuid-here",
    "ageRange": "AGE_25_34",
    "gender": "FEMALE"
  }
}
```

---

## Subscription Routes

### 1. GET /api/v1/subscriptions/plans
Returns all active plans available for purchase.
- **Response (200)**:
```json
{
  "plans": [
    { "id": "uuid-1", "type": "DAILY", "priceInr": 29.00, "validityDays": 1 },
    { "id": "uuid-2", "type": "WEEKLY", "priceInr": 149.00, "validityDays": 7 }
  ]
}
```

### 2. GET /api/v1/subscriptions/my
Returns current active subscription status and transaction history.
- **Response (200)**:
```json
{
  "active": {
    "id": "sub-uuid",
    "planId": "plan-uuid",
    "status": "ACTIVE",
    "expiresAt": "2026-07-09T22:00:00.000Z",
    "plan": { "type": "DAILY", "isVoiceEnabled": true, "isVideoEnabled": true }
  },
  "remainingSeconds": 86400,
  "history": []
}
```

### 3. GET /api/v1/subscriptions/features
Returns user feature gating flags.
- **Response (200)**:
```json
{
  "canVoice": true,
  "canVideo": true,
  "canGenderFilter": true
}
```

---

## Temporary Media Routes

### 1. POST /api/v1/media/upload
Uploads a media asset with 60-second validity.
- **Request**: `multipart/form-data` (field: `image`, field: `roomId`)
- **Response (200)**:
```json
{
  "mediaId": "media-uuid",
  "expiresAt": "2026-07-08T04:15:30.000Z",
  "ttlSeconds": 60,
  "url": "/api/v1/media/media-uuid"
}
```

### 2. GET /api/v1/media/:mediaId
Serves the raw image file.
- **Headers Returned**:
  - `Cache-Control: no-store, no-cache`
- **Response (410 Gone)**: If expired or deleted.

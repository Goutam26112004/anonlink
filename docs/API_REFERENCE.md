# API Reference: REST Endpoints

This document catalogs every REST endpoint available on the AnonLink Express server.

---

## Base URL
* Local development: `http://localhost:4000/api/v1`
* Live production: `https://anonlink.online/api/v1`

---

## 1. Authentication Endpoints

### Guest Login
Generates a new anonymous guest user session.
* **Method**: `POST`
* **Route**: `/auth/guest`
* **Auth Required**: No
* **Response (200 OK)**:
```json
{
  "token": "jwt-token-string",
  "user": {
    "userId": "uuid-here",
    "registrationType": "guest",
    "onboardingComplete": false
  }
}
```

### Google OAuth Redirect
Initiates the secure Google OAuth login.
* **Method**: `GET`
* **Route**: `/auth/google`
* **Auth Required**: No
* **Behavior**: Redirects to the Google consent screen.

### Google OAuth Callback
Exchanges authorization code for tokens.
* **Method**: `GET`
* **Route**: `/auth/google/callback`
* **Parameters**: `code` (Google auth code), `state` (CSRF state verification)
* **Auth Required**: No
* **Behavior**: Sets HttpOnly session cookies and redirects to `/onboarding` or `/dashboard`.

### Session Verification
Restores login state using secure cookies.
* **Method**: `GET`
* **Route**: `/auth/session`
* **Auth Required**: No (Evaluates cookies)
* **Response (200 OK)**:
```json
{
  "token": "jwt-token-string",
  "user": {
    "userId": "uuid-here",
    "email": "user@domain.com",
    "onboardingComplete": true,
    "userType": "FREE"
  }
}
```

### Logout
Revokes the session token and clears auth cookies.
* **Method**: `POST`
* **Route**: `/auth/logout`
* **Auth Required**: Yes

---

## 2. Onboarding Endpoints

### Fetch Onboarding Status
* **Method**: `GET`
* **Route**: `/onboarding/status`
* **Auth Required**: Yes
* **Response (200 OK)**:
```json
{
  "completed": true,
  "data": {
    "ageRange": "AGE_18_24",
    "gender": "MALE"
  }
}
```

### Complete Onboarding
Submits onboarding details.
* **Method**: `POST`
* **Route**: `/onboarding/complete`
* **Auth Required**: Yes
* **Body**:
```json
{
  "ageRange": "AGE_18_24",
  "gender": "MALE"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "onboarding": {
    "userId": "uuid-here",
    "ageRange": "AGE_18_24",
    "gender": "MALE"
  }
}
```

---

## 3. Subscription Endpoints

### List Plans
* **Method**: `GET`
* **Route**: `/subscriptions/plans`
* **Auth Required**: No
* **Response (200 OK)**:
```json
{
  "plans": [
    {
      "id": "plan-uuid-1",
      "type": "DAILY",
      "priceInr": 29.00,
      "validityDays": 1,
      "isVoiceEnabled": true,
      "isVideoEnabled": true
    }
  ]
}
```

### Fetch My Subscription
* **Method**: `GET`
* **Route**: `/subscriptions/my`
* **Auth Required**: Yes
* **Response (200 OK)**:
```json
{
  "active": {
    "id": "sub-uuid-1",
    "status": "ACTIVE",
    "expiresAt": "2026-07-09T22:00:00.000Z",
    "plan": { "type": "DAILY", "isVoiceEnabled": true, "isVideoEnabled": true }
  },
  "remainingSeconds": 86400,
  "history": []
}
```

---

## 4. Ephemeral Media Endpoints

### Upload Ephemeral Image
Uploads a file to temporary storage.
* **Method**: `POST`
* **Route**: `/media/upload`
* **Auth Required**: Yes
* **Body**: `multipart/form-data` containing `image` (file) and `roomId` (string)
* **Response (200 OK)**:
```json
{
  "mediaId": "media-uuid-1",
  "expiresAt": "2026-07-08T04:15:30.000Z",
  "ttlSeconds": 60,
  "url": "/api/v1/media/media-uuid-1"
}
```

### Serves Image Data
Serves the raw binary file.
* **Method**: `GET`
* **Route**: `/media/:mediaId`
* **Auth Required**: No (Token validated via ID path checks)
* **Response**: Binary data stream.
* **Error Response (410 Gone)**: Returned if the media has expired or was deleted.
```json
{ "error": "Media has expired or does not exist" }
```

---

## 5. Admin Console Endpoints

### Toggle Feature Flags
* **Method**: `POST`
* **Route**: `/admin/feature-flags`
* **Auth Required**: Yes (Admin role check)
* **Body**:
```json
{
  "voiceEnabled": true,
  "videoEnabled": false
}
```

### Grant Manual Subscription
* **Method**: `POST`
* **Route**: `/admin/subscriptions/:userId/grant`
* **Auth Required**: Yes (Admin role check)
* **Body**:
```json
{
  "planId": "plan-uuid-1",
  "transactionRef": "TXN9992334"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub-uuid-here",
    "status": "ACTIVE"
  }
}
```

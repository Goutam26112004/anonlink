# AnonLink: Secure Anonymous Chat Platform

AnonLink is a production-ready, secure, and privacy-first anonymous stranger communication platform (Text, Voice, and Video) designed to run containerized on Docker Compose.

---

## 1. Overview
AnonLink facilitates instant connection matching based on interests, languages, and reputation scores, with WebRTC-driven peer-to-peer audio and video calling. By incorporating strict ephemeral media retention and screenshot deterrent controls, user data is kept secure and private.

---

## 2. Key Features
* **Privacy-First Onboarding**: Age and gender collection matching profiles without linking personal email or identifiers.
* **Google OAuth 2.0 & Session Recovery**: Safe authentication, link/unlink identities, and auto-login cookies.
* **Reputation Engine**: Matchmaking starvation prevention routing and bad behavior blocks.
* **Feature Gating**: Subscriptions unlock Voice, Video, and Gender Filtering.
* **Ephemeral Media Sharing**: 60-second expiring images with screenshot-deterrent CSS/JS, no-cache headers, and automatic file system deletion.
* **Admin Control Console**: Live stats overview, global feature toggles, and manual subscription granting.

---

## 3. Screenshots (Placeholders)
* **Onboarding Wizard**: `/docs/screenshots/onboarding.png`
* **Chat Room & Ephemeral Sharing**: `/docs/screenshots/chat_ephemeral.png`
* **Admin Subscription Controller**: `/docs/screenshots/admin_console.png`

---

## 4. Setup & Installation

### Local Setup
Ensure Docker and Node.js v20 are installed locally.

```bash
# Clone the repository
git clone https://github.com/yourusername/anon-chat-platform.git
cd anon-chat-platform

# Install monorepo dependencies
npm install

# Run Docker services
docker-compose up --build
```

Access the application:
* Frontend Client: `http://localhost:3000`
* Backend API: `http://localhost:4000`

---

## 5. Development & Testing
Run automated integration test suites to check code correctness:
```bash
# Compile and check TypeScript
cd backend
npx tsc --noEmit

# Run unit tests
cd ..
npx tsx tests/onboarding.test.ts
npx tsx tests/permissions.test.ts
npx tsx tests/tempMedia.test.ts
npx tsx tests/subscription.test.ts
```

---

## 6. Handover Documentation
Complete developer guides are available in the `/docs` directory:
* **[PROJECT_CONTEXT.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/PROJECT_CONTEXT.md)**: System design and technology choices.
* **[AI_CONTEXT.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/AI_CONTEXT.md)**: Standard conventions and guidelines for AI coding assistants.
* **[DEVELOPER_GUIDE.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/DEVELOPER_GUIDE.md)**: Local configuration and setup steps.
* **[ARCHITECTURE.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/ARCHITECTURE.md)**: Mermaid charts and connection mappings.
* **[API_REFERENCE.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/API_REFERENCE.md)**: Express REST api specifications.
* **[SOCKET_EVENTS.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/SOCKET_EVENTS.md)**: Socket.IO event reference.
* **[DATABASE_SCHEMA.md](file:///C:/Users/Gouta/.gemini/antigravity-ide/scratch/anon-chat-platform/docs/DATABASE_SCHEMA.md)**: Prisma PostgreSQL tables and indexes.

---

## 7. FAQ

### How are temporary images deleted?
Shared images are written to `backend/tmp/media/`. A background scheduler runs every 30 seconds to automatically delete expired files from disk and update their database state.

### How do I manually grant subscriptions as Admin?
Admins can grant subscriptions via the Admin Dashboard's "Subscriptions & Features" tab, or via the `POST /api/v1/admin/subscriptions/:userId/grant` route.

# Roadmap & Todo List

A prioritized collection of tasks, enhancements, and technical debt.

---

## 1. Critical Tasks (Immediate Action)
- [ ] Connect Razorpay / Stripe to the payment factory (`paymentProvider.ts`).
- [ ] Monitor CoTURN server bandwidth usage.

---

## 2. High Priority
- [ ] Implement FCM Web Push Notifications for incoming matching alerts when the page is unfocused.
- [ ] Add rate limiting (`express-rate-limit`) to the media upload endpoint (`/api/v1/media/upload`).
- [ ] Refactor the image upload component to support dragging and dropping files.

---

## 3. Medium Priority
- [ ] Implement user settings to customize matching tags (auto-populate from active search tags).
- [ ] Add more comprehensive audit logging for admin actions (toggling feature flags, manual grants).

---

## 4. Technical Debt & Enhancements
- [ ] Set up end-to-end integration tests using Playwright/Cypress.
- [ ] Replace standard disk-based temporary storage (`tmp/media/`) with an in-memory Redis buffer or S3 Object Storage for easier multi-instance deployment.
- [ ] Optimize next.js bundle chunks by lazy-loading heavy modules (WebRTC, widgets).

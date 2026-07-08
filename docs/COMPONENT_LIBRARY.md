# Reusable Component Library: Frontend

This catalog documents the core frontend widgets, props, and layout components.

---

## 1. OnboardingWizard
Step-by-step modal/view to gather age range and gender preferences.
* **File Location**: `frontend/src/app/onboarding/page.tsx`
* **Props**: None (Renders as a standalone page using Zustand state hooks)
* **Design Systems**: Dynamic step indicators, translucent blur backdrops (`backdrop-blur-xl`), and active gradients (`from-indigo-600 to-purple-600`).
* **Dependencies**: Zustand (`useChatStore`), Lucide icons (`User`, `Calendar`, `ArrowRight`, `CheckCircle`).

---

## 2. SubscriptionDetailsCard
Visual card showing available subscription plans (DAILY, WEEKLY, MONTHLY).
* **File Location**: `frontend/src/app/subscription/page.tsx`
* **Props**:
  * `plan`: `Plan` object (containing price, validity, feature flags)
  * `isCurrentPlan`: `boolean` (adds check badge and disables upgrades)
  * `onUpgrade`: `(plan: Plan) => void` (triggers order modal)
* **Usage**:
```tsx
<SubscriptionDetailsCard 
  plan={plan}
  isCurrentPlan={active?.plan?.type === plan.type}
  onUpgrade={handleUpgrade}
/>
```
* **Dependencies**: Lucide icons (`Crown`, `Check`, `X`).

---

## 3. EphemeralImagePreview
Renders an expiring image preview inside the message list.
* **File Location**: Inline in `frontend/src/app/dashboard/page.tsx`
* **Props**:
  * `mediaId`: `string` (UUID for serving endpoint)
  * `expiresAt`: `string` (UTC timestamp)
* **Security Constraints**:
  * Overrides `onContextMenu` calling `e.preventDefault()` to block right-clicking.
  * Adds `select-none` and `draggable={false}` class attributes to prevent dragging and selection.
  * Embeds screenshot warning message below the image.
* **Usage**:
```tsx
<div className="relative">
  <img 
    src={`${BACKEND_URL}/api/v1/media/${mediaId}`} 
    onContextMenu={(e) => e.preventDefault()}
    className="max-w-[200px] rounded-xl select-none"
    draggable={false}
  />
  <div className="absolute top-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white">
    ⏱ {remainingSeconds}s
  </div>
</div>
```

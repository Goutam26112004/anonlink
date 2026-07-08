# Admin Subscription Guide

This console console allows Super Admins and Admins to manage subscriptions and features.

## 1. Global Feature Toggling (Feature Flags)
Admins can toggle the global availability of Voice or Video chats.
- Disabling a flag blocks voice/video matchmaking even for Paid subscribers.
- Useful for database maintenance or bandwidth control.

## 2. Manual Subscription Granting
Since billing is mock-based, admins can manually provision paid subscriptions to users:
- **Endpoint**: `POST /api/v1/admin/subscriptions/:userId/grant`
- **Fields**: `planId` (DAILY/WEEKLY/MONTHLY plan uuid), `transactionRef` (optional).

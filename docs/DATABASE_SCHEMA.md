# Database Schema & Relations

This document specifies the PostgreSQL tables, attributes, types, constraints, and relationships implemented in the AnonLink workspace.

---

## 1. Core Authentication & Identity Tables

### `users`
Represents both registered members (email/oauth) and transient guests.
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `email`: `VARCHAR` (Unique, Nullable)
  * `phone`: `VARCHAR` (Unique, Nullable)
  * `password_hash`: `VARCHAR` (Nullable)
  * `registration_type`: `RegistrationType` (Enum: `GUEST`, `EMAIL`, `OAUTH`)
  * `user_type`: `UserType` (Enum: `GUEST`, `FREE`, `PAID`)
  * `email_verified` / `phone_verified`: `BOOLEAN`
  * `google_id`: `VARCHAR` (Unique, Nullable)
  * `auth_provider`: `VARCHAR` (Default: "email")
  * `linked_providers`: `VARCHAR[]` (Array)
  * `avatar_url`: `VARCHAR` (Nullable)
  * `gender_preference`: `GenderPreference` (Enum: `MALE`, `FEMALE`, `NO_PREFERENCE`)
  * `reputation_score`: `INT` (Default: 100)
  * `experience_points`: `INT` (Default: 0)
  * `level`: `INT` (Default: 1)
  * `created_at` / `updated_at`: `TIMESTAMP`
* **Indexes**:
  * `users_email_idx`
  * `users_phone_idx`
  * `users_user_type_idx`

### `roles`
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `name`: `VARCHAR` (Unique: `USER`, `MODERATOR`, `SENIOR MODERATOR`, `ADMIN`, `SUPER ADMIN`)

### `permissions`
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `name`: `VARCHAR` (Unique)

---

## 2. Onboarding Table

### `user_onboarding`
Stores private user demographics.
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `user_id`: `UUID` (Unique, Foreign Key referencing `users(id)` ON DELETE CASCADE)
  * `age_range`: `AgeRange` (Enum: `UNDER_18`, `AGE_18_24`, `AGE_25_34`, `AGE_35_44`, `AGE_45_PLUS`)
  * `gender`: `Gender` (Enum: `MALE`, `FEMALE`, `PREFER_NOT_TO_SAY`)
  * `completed_at`: `TIMESTAMP` (Default: `now()`)

---

## 3. Subscription & Billing Tables

### `subscription_plans`
Stores active pricing models and feature access.
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `type`: `SubscriptionPlanType` (Unique Enum: `DAILY`, `WEEKLY`, `MONTHLY`)
  * `price_inr`: `DECIMAL(10,2)`
  * `validity_days`: `INT`
  * `is_active`: `BOOLEAN` (Default: true)
  * `is_voice_enabled`: `BOOLEAN` (Default: true)
  * `is_video_enabled`: `BOOLEAN` (Default: true)
  * `created_at` / `updated_at`: `TIMESTAMP`

### `user_subscriptions`
Stores active purchased or provisioned user plans.
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `user_id`: `UUID` (Foreign Key referencing `users(id)` ON DELETE CASCADE)
  * `plan_id`: `UUID` (Foreign Key referencing `subscription_plans(id)`)
  * `status`: `SubscriptionStatus` (Enum: `ACTIVE`, `EXPIRED`, `CANCELLED`)
  * `purchased_at`: `TIMESTAMP` (Default: `now()`)
  * `expires_at`: `TIMESTAMP`
  * `renewal_enabled`: `BOOLEAN` (Default: false)
  * `transaction_ref`: `VARCHAR` (Nullable)
  * `granted_by_admin`: `BOOLEAN` (Default: false)
  * `created_at` / `updated_at`: `TIMESTAMP`
* **Indexes**:
  * `user_subscriptions_user_id_status_idx`
  * `user_subscriptions_expires_at_idx`

---

## 4. Ephemeral Media Table

### `temporary_media`
Tracks shared files that disappear after 60 seconds.
* **Columns**:
  * `id`: `UUID` (Primary Key)
  * `uploader_user_id`: `UUID` (Foreign Key referencing `users(id)` ON DELETE CASCADE)
  * `room_id`: `VARCHAR`
  * `storage_path`: `VARCHAR`
  * `mime_type`: `VARCHAR`
  * `size_bytes`: `INT`
  * `expires_at`: `TIMESTAMP`
  * `is_deleted`: `BOOLEAN` (Default: false)
  * `created_at`: `TIMESTAMP` (Default: `now()`)
* **Indexes**:
  * `temporary_media_expires_at_is_deleted_idx`
  * `temporary_media_room_id_idx`

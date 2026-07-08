# Database Schema Modifications

Database additions for Onboarding, Subscriptions, and Temporary Media.

## New Enums

- **AgeRange**: `UNDER_18`, `AGE_18_24`, `AGE_25_34`, `AGE_35_44`, `AGE_45_PLUS`
- **Gender**: `MALE`, `FEMALE`, `PREFER_NOT_TO_SAY`
- **GenderPreference**: `MALE`, `FEMALE`, `NO_PREFERENCE`
- **UserType**: `GUEST`, `FREE`, `PAID`
- **SubscriptionPlanType**: `DAILY`, `WEEKLY`, `MONTHLY`
- **SubscriptionStatus**: `ACTIVE`, `EXPIRED`, `CANCELLED`

## New Models

- **UserOnboarding**: Stores privacy-compliant age range & gender data.
- **SubscriptionPlan**: Stores duration, price, and active features of plans.
- **UserSubscription**: Links users with purchased plans and records validity.
- **SubscriptionHistory**: Historical tracking of all subscriptions.
- **TemporaryMedia**: Records uploaded temporary chat images with expiry tracking.

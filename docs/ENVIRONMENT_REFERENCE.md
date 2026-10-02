# Environment Configuration Reference

AnonLink relies on environment variables for system boundaries, third-party credentials, database details, and port bindings.

---

## 1. Backend Service Environment Variables (`backend/.env`)

### `DATABASE_URL`
* **Purpose**: Database connection URL for PostgreSQL.
* **Format**: `postgresql://<user>:<password>@<host>:<port>/<dbname>?schema=public`
* **Default Value**: `postgresql://anonuser:anonpassword@db:5432/anondb`
* **Required**: Yes

### `REDIS_URL`
* **Purpose**: Connection string for the Redis client.
* **Format**: `redis://<host>:<port>`
* **Default Value**: `redis://redis:6379`
* **Required**: Yes

### `JWT_SECRET`
* **Purpose**: Cryptographic signature key for signing session tokens.
* **Required**: Yes

### `CLIENT_URL`
* **Purpose**: Allowed origin for Cross-Origin Resource Sharing (CORS).
* **Example**: `https://anonlink.online`
* **Required**: Yes

### `COTURN_SHARED_SECRET`
* **Purpose**: Shared password for generating ephemeral credentials for CoTURN.
* **Required**: Yes

### `GOOGLE_CLIENT_ID`
* **Purpose**: Client identifier for Google OAuth 2.0.
* **Required**: Yes

### `GOOGLE_CLIENT_SECRET`
* **Purpose**: Secret key for exchanging OAuth tokens with Google.
* **Required**: Yes

### `GOOGLE_CALLBACK_URL`
* **Purpose**: Redirect target URL for Google OAuth flow.
* **Example**: `https://anonlink.online/api/v1/auth/google/callback`
* **Required**: Yes

---

## 2. Frontend Client Environment Variables (`frontend/.env`)

### `NEXT_PUBLIC_BACKEND_URL`
* **Purpose**: Root URL for REST API endpoints.
* **Example**: `https://anonlink.online`
* **Required**: Yes

### `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
* **Purpose**: Public client identifier for Google Sign-In SDK button.
* **Required**: Yes

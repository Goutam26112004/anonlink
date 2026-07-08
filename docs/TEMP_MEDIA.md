# Temporary Media Storage and Screenshot Protection

Images shared in chat are highly ephemeral. They disappear permanently after 60 seconds.

## Ephemeral Storage Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Disk (tmp/)
    participant DB
    participant Scheduler

    Client->>API: POST /api/v1/media/upload (File + RoomID)
    API->>Disk (tmp/): Write binary file to tmp/media/
    API->>DB: Create TemporaryMedia record (expiresAt = now + 60s)
    API-->>Client: Returns mediaId, url, expiresAt
    Client->>API: GET /api/v1/media/:mediaId
    API->>DB: Check if valid (not expired, not deleted)
    DB-->>API: Valid record
    API-->>Client: Serves image (no-cache headers)
    
    Note over Scheduler: Every 30 seconds
    Scheduler->>DB: Query records where expiresAt <= now & isDeleted = false
    Scheduler->>Disk (tmp/): Delete files from disk
    Scheduler->>DB: Mark records isDeleted = true
```

## Deterring Image Saving
To discourage screenshotting and unauthorized image saving:
1. **Right-Click Deterrence**: Right-click is explicitly intercepted on the img element.
2. **Select & Drag Disabled**: Text/image selection and dragging properties are disabled.
3. **No Caching**: Server sends strict headers:
   `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
4. **Watermark / Overlay**: Overlays the remaining timer directly on top of the image.

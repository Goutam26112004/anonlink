# Socket.IO Event Reference

Real-time interactions, matchmaking queues, and WebRTC signaling flows are driven by Socket.IO events. This document catalog outlines each socket event.

---

## 1. Matchmaking Queue Events

### `match:join`
Sent by the client to join the matchmaking queue.
* **Direction**: Client -> Server
* **Payload**:
```json
{
  "interests": ["anime", "gaming"],
  "language": "en",
  "country": "US",
  "mediaType": "text", // "text" | "voice" | "video"
  "genderPreference": "NO_PREFERENCE" // "MALE" | "FEMALE" | "NO_PREFERENCE"
}
```
* **Success Responses**:
  * Emits `match:searching` to client.
  * Emits `match:found` to both matched clients when compatible peers are found.
* **Error States**:
  * Emits `system:warning` if the user is currently muted/blocked.
  * Emits `feature:locked` if a non-subscriber requests voice or video.

### `match:leave`
Sent by the client to cancel queue searches.
* **Direction**: Client -> Server
* **Payload**:
```json
{
  "mediaType": "text"
}
```

### `match:searching`
Sent by the server to report queue waiting metrics.
* **Direction**: Server -> Client
* **Payload**:
```json
{
  "message": "Looking for a stranger...",
  "activeCount": 14,
  "estimatedWaitSec": 5
}
```

### `match:found`
Sent by the server to initiate room creation.
* **Direction**: Server -> Client (Both matched users)
* **Payload**:
```json
{
  "roomId": "room-uuid-1",
  "peerName": "Stranger (Lv. 3)"
}
```

---

## 2. Conversation Messaging Events

### `chat:message`
Sends a text message or shares an ephemeral media token.
* **Direction**: Bidirectional (Client -> Server -> Peer)
* **Payload**:
```json
{
  "roomId": "room-uuid-1",
  "text": "Hello, how are you?" // Or image token: "[IMAGE:media-uuid:expires-timestamp]"
}
```
* **Client Handler**: Renders incoming text as a standard message. If the message starts with `[IMAGE:`, it renders an expiring image block with a live countdown timer.

### `chat:typing`
Reports active typing state.
* **Direction**: Bidirectional (Client -> Server -> Peer)
* **Payload**:
```json
{
  "roomId": "room-uuid-1",
  "isTyping": true
}
```

### `match:skip`
Leaves the current chat room and immediately triggers a new matchmaking search.
* **Direction**: Client -> Server
* **Payload**: None (Server determines context from socket room state)

---

## 3. WebRTC Call Events

### `webrtc:signal`
Relays WebRTC session description protocol (SDP) offers, answers, and ICE candidate details.
* **Direction**: Bidirectional (Client -> Server -> Peer)
* **Payload**:
```json
{
  "roomId": "room-uuid-1",
  "signal": {
    "type": "offer", // "offer" | "answer" | "candidate"
    "sdp": "...sdp-content..."
  }
}
```

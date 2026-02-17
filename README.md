# chat-api (prototype)

Prototype 1:1 **conversation chat** (client ↔ therapist) with **files**.

- Node.js + Express
- MongoDB (local)
- Socket.IO realtime
- Uploads stored locally in `uploads/`

## Folder structure

```
chat-api/
  src/
    config/
      env.js
      db.js
    routes/
      conversations.js
      chat.js
    services/
      conversationService.js
      chatService.js
    sockets/
      index.js
    utils/
      actor.js
    app.js
    server.js
  uploads/
  .env.example
  package.json
```

## 1) Setup DB (MongoDB local)

1. Install MongoDB Community (Homebrew):
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   brew services start mongodb-community@7.0
   ```
2. Default DB name used: `chat_db` (see `MONGO_URI` in `.env`)

> Note: conversations store `clientName` and `therapistName` for fast sidebar display in this prototype.

## 2) Configure env

```bash
cp .env.example .env
```

## 3) Run

```bash
npm run dev
```

Seed demo data (optional):

```bash
npm run seed:mongo
# or wipe then seed
npm run seed:mongo -- --wipe
```

Health:
- `GET http://localhost:4000/health`

## 4) REST endpoints (prototype)

Because this is a prototype (no auth middleware yet), we pass `role` and `actorId` in query/body.

> Note: `conversationId` is the thread id (string) and is used to link messages. `actorId` is also a string.
> The therapist sidebar should use **List conversations** (below) to show all chats.

### Schema

**conversations**
```json
{
  "_id": "ObjectId",
  "clientId": "string",
  "clientName": "string",
  "therapistId": "string",
  "therapistName": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**messages**
```json
{
  "_id": "ObjectId",
  "conversationId": "string",
  "senderRole": "patient|therapist",
  "senderId": "string",
  "body": "string|null",
  "fileUrl": "string|null",
  "fileName": "string|null",
  "fileType": "string|null",
  "seenAt": "Date|null",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

> Note → In real implementation, **remove** `clientName` and `therapistName` from `conversations` and connect the `clientId` and `therapistId` to your current database.


### Endpoints table (with samples)

| Method | Path | Required params | Sample request | Sample response |
| --- | --- | --- | --- | --- |
| GET | `/health` | none | `GET /health` | `{ "ok": true }` |
| GET | `/api/conversations` | **query:** `role`, `actorId` | `GET /api/conversations?role=therapist&actorId=therapist_10` | `{ "conversations": [ { "conversationId": "65c1e6...", "clientId": "patient_1", "clientName": "John Cruz", "therapistId": "therapist_10", "therapistName": "Dr. Reyes", "lastMessage": "Hi doc", "lastMessageAt": "2026-02-12 12:10:00", "unreadCount": 2 } ] }` |
| POST | `/api/conversations` | **body:** `clientId`, `clientName`, `therapistId`, `therapistName` | `{ "clientId": "patient_1", "clientName": "John Cruz", "therapistId": "therapist_10", "therapistName": "Dr. Reyes" }` | `{ "ok": true, "id": "65c1e6...", "existing": false }` |
| GET | `/api/chat/messages` | **query:** `conversationId`, `role`, `actorId` | `GET /api/chat/messages?conversationId=65c1e6...&role=therapist&actorId=therapist_10` | `{ "messages": [ { "id": "66a1...", "conversationId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "body": "Hello doc", "fileUrl": null, "fileName": null, "fileType": null, "createdAt": "2026-02-12 12:07:10", "seenAt": null } ] }` |
| POST | `/api/chat/message` | **body:** `conversationId`, `role`, `actorId`, `body` | `{ "conversationId": "65c1e6...", "role": "patient", "actorId": "patient_1", "body": "Hello doc" }` | `{ "message": { "id": "66a1...", "conversationId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "body": "Hello doc", "createdAt": "2026-02-12 12:07:10", "seenAt": null } }` |
| POST | `/api/chat/upload` | **form:** `conversationId`, `role`, `actorId`, `file` | `multipart/form-data` | `{ "message": { "id": "66a2...", "conversationId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "fileUrl": "/uploads/1700000000-abc.jpg", "fileName": "scan.jpg", "fileType": "image/jpeg", "createdAt": "2026-02-12 12:08:00", "seenAt": null }, "publicUrl": "http://localhost:4000/uploads/1700000000-abc.jpg" }` |
| POST | `/api/chat/read` | **body:** `conversationId`, `role`, `actorId` | `{ "conversationId": "65c1e6...", "role": "therapist", "actorId": "therapist_10", "lastReadMessageId": "66a1..." }` | `{ "ok": true, "reads": { "conversationId": "65c1e6...", "unreadCount": 0, "lastSeenAt": "2026-02-12 12:09:00", "updatedCount": 2 } }` |
| GET | `/api/chat/read` | **query:** `conversationId`, `role`, `actorId` | `GET /api/chat/read?conversationId=65c1e6...&role=therapist&actorId=therapist_10` | `{ "reads": { "conversationId": "65c1e6...", "unreadCount": 1, "lastSeenAt": "2026-02-12 12:09:00" } }` |

### Examples

#### List conversations (sidebar)

Therapist:

```bash
curl "http://localhost:4000/api/conversations?role=therapist&actorId=therapist_10"
```

Patient:

```bash
curl "http://localhost:4000/api/conversations?role=patient&actorId=patient_1"
```

#### Create conversation

```bash
curl -X POST http://localhost:4000/api/conversations \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId":"patient_1",
    "clientName":"John Cruz",
    "therapistId":"therapist_10",
    "therapistName":"Dr. Reyes"
  }'
```

#### Load messages

```bash
curl "http://localhost:4000/api/chat/messages?conversationId=<conversationId>&role=therapist&actorId=therapist_10"
```

#### Send message

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"conversationId":"<conversationId>","role":"patient","actorId":"patient_1","body":"Hello doc"}'
```

#### Upload file

```bash
curl -X POST http://localhost:4000/api/chat/upload \
  -F conversationId=<conversationId> \
  -F role=patient \
  -F actorId=patient_1 \
  -F file=@/path/to/image.jpg
```

#### Mark messages as read

```bash
curl -X POST http://localhost:4000/api/chat/read \
  -H 'Content-Type: application/json' \
  -d '{"conversationId":"<conversationId>","role":"therapist","actorId":"therapist_10","lastReadMessageId":"<messageId>"}'
```

#### Get read summary

```bash
curl "http://localhost:4000/api/chat/read?conversationId=<conversationId>&role=therapist&actorId=therapist_10"
```

## 5) Socket.IO events

Client emits:
- `join` `{ conversationId, role, actorId }`
- `join:actor` `{ role, actorId }`

Server emits:
- `joined` `{ conversationId }`
- `actor:joined` `{ role, actorId }`
- `message:new` `{ message }`
- `read:updated` `{ conversationId, reads }`
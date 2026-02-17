# chat-api (prototype)

Prototype 1:1 **appointment chat** (patient ↔ therapist) with **files**.

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
      appointments.js
      chat.js
    services/
      appointmentService.js
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

> Note: appointments store `patientName` and `therapistName` for fast sidebar display in this prototype.

## 2) Configure env

```bash
cp .env.example .env
```

## 3) Run

```bash
npm run dev
```

Health:
- `GET http://localhost:4000/health`

## 4) REST endpoints (prototype)

Because this is a prototype (no auth middleware yet), we pass `role` and `actorId` in query/body.

> Note: `appointmentId` is an external ID (string) and is used to link messages. `actorId` is also a string.
> The therapist sidebar should use **List appointments** (below) to show all chats.

### Endpoints table (with samples)

| Method | Path | Required params | Sample request | Sample response |
| --- | --- | --- | --- | --- |
| GET | `/health` | none | `GET /health` | `{ "ok": true }` |
| GET | `/api/appointments` | **query:** `role`, `actorId` | `GET /api/appointments?role=therapist&actorId=therapist_10` | `{ "appointments": [ { "appointmentId": "65c1e6...", "patientId": "patient_1", "patientName": "John Cruz", "therapistId": "therapist_10", "therapistName": "Dr. Reyes", "startsAt": "2026-02-12 12:06:42", "appointmentDateTime": "2026-02-12T12:06:42.879Z", "status": "booked", "lastMessage": "Hi doc", "lastMessageAt": "2026-02-12 12:10:00", "unreadCount": 2 } ] }` |
| POST | `/api/appointments` | **body:** `patientId`, `patientName`, `therapistId`, `therapistName`, `startsAt` | `{ "appointmentId": "65c1e6...", "patientId": "patient_1", "patientName": "John Cruz", "therapistId": "therapist_10", "therapistName": "Dr. Reyes", "startsAt": "2026-02-12 12:06:42", "appointmentDateTime": "2026-02-12T12:06:42.879Z" }` | `{ "ok": true, "insertId": "65c1e6..." }` |
| PATCH | `/api/appointments/status` | **body:** `appointmentId`, `status` | `{ "appointmentId": "65c1e6...", "status": "completed" }` | `{ "ok": true }` |
| GET | `/api/chat/messages` | **query:** `appointmentId`, `role`, `actorId` | `GET /api/chat/messages?appointmentId=65c1e6...&role=therapist&actorId=therapist_10` | `{ "messages": [ { "id": "66a1...", "appointmentId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "body": "Hello doc", "fileUrl": null, "fileName": null, "fileType": null, "createdAt": "2026-02-12 12:07:10", "seenAt": null } ] }` |
| POST | `/api/chat/message` | **body:** `appointmentId`, `role`, `actorId`, `body` | `{ "appointmentId": "65c1e6...", "role": "patient", "actorId": "patient_1", "body": "Hello doc" }` | `{ "message": { "id": "66a1...", "appointmentId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "body": "Hello doc", "createdAt": "2026-02-12 12:07:10", "seenAt": null } }` |
| POST | `/api/chat/upload` | **form:** `appointmentId`, `role`, `actorId`, `file` | `multipart/form-data` | `{ "message": { "id": "66a2...", "appointmentId": "65c1e6...", "senderRole": "patient", "senderId": "patient_1", "fileUrl": "/uploads/1700000000-abc.jpg", "fileName": "scan.jpg", "fileType": "image/jpeg", "createdAt": "2026-02-12 12:08:00", "seenAt": null }, "publicUrl": "http://localhost:4000/uploads/1700000000-abc.jpg" }` |
| POST | `/api/chat/read` | **body:** `appointmentId`, `role`, `actorId` | `{ "appointmentId": "65c1e6...", "role": "therapist", "actorId": "therapist_10", "lastReadMessageId": "66a1..." }` | `{ "ok": true, "reads": { "appointmentId": "65c1e6...", "unreadCount": 0, "lastSeenAt": "2026-02-12 12:09:00", "updatedCount": 2 } }` |
| GET | `/api/chat/read` | **query:** `appointmentId`, `role`, `actorId` | `GET /api/chat/read?appointmentId=65c1e6...&role=therapist&actorId=therapist_10` | `{ "reads": { "appointmentId": "65c1e6...", "unreadCount": 1, "lastSeenAt": "2026-02-12 12:09:00" } }` |

### Examples

#### List appointments (sidebar)

Therapist:

```bash
curl "http://localhost:4000/api/appointments?role=therapist&actorId=10"
```

Patient:

```bash
curl "http://localhost:4000/api/appointments?role=patient&actorId=1"
```

#### Create appointment

```bash
curl -X POST http://localhost:4000/api/appointments \
  -H 'Content-Type: application/json' \
  -d '{
    "appointmentId":"<mongo-appointment-id>",
    "patientId":"patient_1",
    "patientName":"John Cruz",
    "therapistId":"therapist_10",
    "therapistName":"Dr. Reyes",
    "startsAt":"2026-02-12 12:06:42",
    "appointmentDateTime":"2026-02-12T12:06:42.879Z"
  }'
```

#### Update appointment status

```bash
curl -X PATCH http://localhost:4000/api/appointments/status \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId":"<mongo-appointment-id>","status":"completed"}'
```

#### Load messages

```bash
curl "http://localhost:4000/api/chat/messages?appointmentId=<appointmentId>&role=therapist&actorId=10"
```

#### Send message

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId":"<appointmentId>","role":"patient","actorId":1,"body":"Hello doc"}'
```

#### Upload file

```bash
curl -X POST http://localhost:4000/api/chat/upload \
  -F appointmentId=<appointmentId> \
  -F role=patient \
  -F actorId=1 \
  -F file=@/path/to/image.jpg
```

#### Mark messages as read

```bash
curl -X POST http://localhost:4000/api/chat/read \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId":"<appointmentId>","role":"therapist","actorId":"therapist_10","lastReadMessageId":"<messageId>"}'
```

#### Get read summary

```bash
curl "http://localhost:4000/api/chat/read?appointmentId=<appointmentId>&role=therapist&actorId=therapist_10"
```

## 5) Socket.IO events

Client emits:
- `join` `{ appointmentId, role, actorId }`

Server emits:
- `joined` `{ appointmentId }`
- `message:new` `{ message }`
- `read:updated` `{ appointmentId, reads }`
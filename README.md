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

### Endpoints table

| Method | Path | Required params | Notes |
| --- | --- | --- | --- |
| GET | `/health` | none | Health check |
| GET | `/api/appointments` | **query:** `role`, `actorId` | List appointments (sidebar). `role=patient\|therapist`. |
| POST | `/api/appointments` | **body:** `patientId`, `patientName`, `therapistId`, `therapistName`, `startsAt` | Optional: `appointmentId`, `appointmentDateTime` |
| PATCH | `/api/appointments/status` | **body:** `appointmentId`, `status` | `status` allowed: `booked, completed, cancelled, canceled, no_show, noshow` |
| GET | `/api/chat/messages` | **query:** `appointmentId`, `role`, `actorId` | Load messages for a thread |
| POST | `/api/chat/message` | **body:** `appointmentId`, `role`, `actorId`, `body` | Send text message |
| POST | `/api/chat/upload` | **form:** `appointmentId`, `role`, `actorId`, `file` | Upload file message (multipart/form-data) |
| POST | `/api/chat/read` | **body:** `appointmentId`, `role`, `actorId` | Optional: `lastReadMessageId` |
| GET | `/api/chat/read` | **query:** `appointmentId`, `role`, `actorId` | Read summary (unread count) |

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
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
  db/ (legacy MySQL files, unused)
    schema.sql
    seed.sql
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

> Note: `appointmentId` is now a MongoDB ObjectId string.

### List appointments (sidebar)

Therapist:

```bash
curl "http://localhost:4000/api/appointments?role=therapist&actorId=10"
```

Patient:

```bash
curl "http://localhost:4000/api/appointments?role=patient&actorId=1"
```

### Load messages

```bash
curl "http://localhost:4000/api/chat/messages?appointmentId=<appointmentId>&role=therapist&actorId=10"
```

### Send message

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId":"<appointmentId>","role":"patient","actorId":1,"body":"Hello doc"}'
```

### Upload file

```bash
curl -X POST http://localhost:4000/api/chat/upload \
  -F appointmentId=<appointmentId> \
  -F role=patient \
  -F actorId=1 \
  -F file=@/path/to/image.jpg
```

## 5) Socket.IO events

Client emits:
- `join` `{ appointmentId, role, actorId }`

Server emits:
- `joined` `{ appointmentId }`
- `message:new` `{ message }`
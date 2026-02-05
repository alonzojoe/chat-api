# chat-api (prototype)

Prototype 1:1 **appointment chat** (patient ↔ therapist) with **files**.

- Node.js + Express
- MySQL (XAMPP)
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
  db/
    schema.sql
    seed.sql
  uploads/
  .env.example
  package.json
```

## 1) Setup DB (XAMPP)

1. Start **Apache** + **MySQL** in XAMPP
2. Create DB: `chat_db`
3. Run SQL in `db/schema.sql`
4. (Optional) Seed demo data with `db/seed.sql`

> Note: appointments now store `patient_name` and `therapist_name` for fast sidebar display in this prototype.

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
curl "http://localhost:4000/api/chat/messages?appointmentId=1&role=therapist&actorId=10"
```

### Send message

```bash
curl -X POST http://localhost:4000/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId":1,"role":"patient","actorId":1,"body":"Hello doc"}'
```

### Upload file

```bash
curl -X POST http://localhost:4000/api/chat/upload \
  -F appointmentId=1 \
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

## Next step

When you're ready, we replace the prototype actor parsing with JWT auth and remove `role/actorId` from client input.

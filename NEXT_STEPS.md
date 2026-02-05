# NEXT_STEPS (Backend) — chat-api

## TODO** (tomorrow)

### TODO** 1) Appointment insertion endpoint improvements
- [ ] Ensure `POST /api/appointments` is aligned with your real system flow.
  - Currently it accepts: `patientId, patientName, therapistId, therapistName, startsAt`.
  - Decide the real source of names (from your main DB) and when we denormalize into appointments.
- [ ] Add validation rules (prototype-level):
  - `startsAt` format check
  - prevent empty names
  - status enum list
- [ ] Optional: add `GET /api/appointments/:id` for testing.

### TODO** 2) Seen / Unseen (Read receipts) per appointment
Goal: show "Seen" and enable unread badge counts (future frontend pill badges).

Recommended data model (since it’s strictly 1v1 per appointment):
- [ ] Add table `chat_reads` with one row per appointment:
  - `appointment_id`
  - `patient_last_read_message_id`, `patient_last_read_at`
  - `therapist_last_read_message_id`, `therapist_last_read_at`

API + socket:
- [ ] Add `POST /api/chat/read`
  - body: `{ appointmentId, role, actorId, lastReadMessageId }`
  - updates the correct read cursor
  - emits socket event: `read:updated`
- [ ] Optionally add `GET /api/chat/read?appointmentId=...&role=...&actorId=...`

### TODO** 3) Unread counts in appointments list
- [ ] Modify `GET /api/appointments` to return unreadCount for the current actor:
  - Therapist unread = count(messages from patient where id > therapist_last_read_message_id)
  - Patient unread = count(messages from therapist where id > patient_last_read_message_id)
- [ ] Keep existing `lastMessage` + `lastMessageAt` fields.

### TODO** 4) Security hardening (later, not prototype)
- [ ] Replace `role/actorId` from client with JWT/session auth.
- [ ] Secure file downloads (no public `/uploads`), use authenticated download endpoint.

## Notes
- Chat scope is **per appointment** (appointmentId == thread).
- This simplifies authorization and ensures 1v1 only.

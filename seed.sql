-- Root convenience copy. Canonical: db/seed.sql

insert into appointments (patient_id, patient_name, therapist_id, therapist_name, starts_at, status)
values
  (1, 'John Cruz', 10, 'Dr. Reyes', date_add(now(), interval 1 day), 'booked'),
  (2, 'Ana Santos', 10, 'Dr. Reyes', date_add(now(), interval 2 day), 'booked');

insert into chat_messages (appointment_id, sender_role, sender_id, body)
values
  (1, 'patient', 1, 'Hi doc. Can we chat here instead of calling?'),
  (1, 'therapist', 10, 'Yes. You can message and upload files here.'),
  (2, 'patient', 2, 'Hello doc. I have a question before the appointment.');

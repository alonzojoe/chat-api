-- Canonical: db/seed.sql

insert into appointments (appointment_id, patient_id, patient_name, therapist_id, therapist_name, starts_at, appointment_date_time, status)
values
  ('65c1e6a1b2c3d4e5f6071829', 'patient_1', 'John Cruz', 'therapist_10', 'Dr. Reyes', date_add(now(), interval 1 day), now(), 'booked'),
  ('65c1e6a1b2c3d4e5f6071830', 'patient_2', 'Ana Santos', 'therapist_10', 'Dr. Reyes', date_add(now(), interval 2 day), now(), 'booked');

-- initialize read cursors
insert into chat_reads (appointment_id) values (1), (2);

insert into chat_messages (appointment_id, sender_role, sender_id, body)
values
  (1, 'patient', 'patient_1', 'Hi doc. Can we chat here instead of calling?'),
  (1, 'therapist', 'therapist_10', 'Yes. You can message and upload files here.'),
  (2, 'patient', 'patient_2', 'Hello doc. I have a question before the appointment.');

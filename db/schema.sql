-- Create DB first (XAMPP phpMyAdmin): create database chat_db;
create table if not exists appointments (
  id bigint primary key auto_increment,
  -- MongoDB ids (ObjectId as string)
  appointment_id varchar(120) null,
  patient_id varchar(120) not null,
  patient_name varchar(160) not null,
  therapist_id varchar(120) not null,
  therapist_name varchar(160) not null,
  starts_at datetime not null,
  appointment_date_time datetime null,
  status varchar(20) not null default '',
  created_at datetime not null default current_timestamp,
  index idx_appt_actor_patient (patient_id),
  index idx_appt_actor_therapist (therapist_id),
  index idx_appt_external (appointment_id)
);
create table if not exists chat_messages (
  id bigint primary key auto_increment,
  appointment_id bigint not null,
  sender_role enum('patient', 'therapist') not null,
  sender_id varchar(120) not null,
  body text null,
  file_url varchar(512) null,
  file_name varchar(255) null,
  file_type varchar(120) null,
  created_at datetime not null default current_timestamp,
  index idx_appointment_created (appointment_id, created_at),
  constraint fk_msg_appt foreign key (appointment_id) references appointments(id) on delete cascade
);
-- 1 row per appointment; keeps the "read cursor" for each side (simple 1v1 model)
create table if not exists chat_reads (
  appointment_id bigint primary key,
  patient_last_read_message_id bigint null,
  patient_last_read_at datetime null,
  therapist_last_read_message_id bigint null,
  therapist_last_read_at datetime null,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  constraint fk_reads_appt foreign key (appointment_id) references appointments(id) on delete cascade
);
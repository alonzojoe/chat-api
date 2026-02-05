-- Create DB first (XAMPP phpMyAdmin): create database chat_db;

create table if not exists appointments (
  id bigint primary key auto_increment,
  patient_id bigint not null,
  patient_name varchar(160) not null,
  therapist_id bigint not null,
  therapist_name varchar(160) not null,
  starts_at datetime not null,
  status varchar(20) not null default 'booked',
  created_at datetime not null default current_timestamp
);

create table if not exists chat_messages (
  id bigint primary key auto_increment,
  appointment_id bigint not null,
  sender_role enum('patient','therapist') not null,
  sender_id bigint not null,
  body text null,
  file_url varchar(512) null,
  file_name varchar(255) null,
  file_type varchar(120) null,
  created_at datetime not null default current_timestamp,
  index idx_appointment_created (appointment_id, created_at),
  constraint fk_msg_appt foreign key (appointment_id) references appointments(id) on delete cascade
);

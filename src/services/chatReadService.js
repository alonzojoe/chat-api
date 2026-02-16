import { query } from "../config/db.js";

export async function getReadsByAppointmentId(appointmentId) {
  const rows = await query(
    `select
      appointment_id as appointmentId,
      patient_last_read_message_id as patientLastReadMessageId,
      date_format(patient_last_read_at, '%Y-%m-%d %H:%i:%s') as patientLastReadAt,
      therapist_last_read_message_id as therapistLastReadMessageId,
      date_format(therapist_last_read_at, '%Y-%m-%d %H:%i:%s') as therapistLastReadAt
     from chat_reads
     where appointment_id=:appointmentId`,
    { appointmentId }
  );
  return rows[0] || null;
}

export async function updateLastRead({ appointmentId, role, lastReadMessageId }) {
  const colId = role === "patient" ? "patient_last_read_message_id" : "therapist_last_read_message_id";
  const colAt = role === "patient" ? "patient_last_read_at" : "therapist_last_read_at";

  // Ensure row exists + only move cursor forward.
  await query(
    `insert into chat_reads (appointment_id, ${colId}, ${colAt})
     values (:appointmentId, :lastReadMessageId, now())
     on duplicate key update
       ${colId} = greatest(coalesce(${colId}, 0), values(${colId})),
       ${colAt} = now()`,
    { appointmentId, lastReadMessageId }
  );

  return getReadsByAppointmentId(appointmentId);
}

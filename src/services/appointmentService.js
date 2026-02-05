import { query } from "../config/db.js";

export async function getAppointmentById(appointmentId) {
  const rows = await query(`select * from appointments where id=:appointmentId`, { appointmentId });
  return rows[0] || null;
}

export async function assertActorInAppointment({ appointmentId, role, actorId }) {
  const appt = await getAppointmentById(appointmentId);
  if (!appt) return { ok: false, status: 404, error: "Appointment not found" };

  const allowed =
    (role === "patient" && Number(appt.patient_id) === actorId) ||
    (role === "therapist" && Number(appt.therapist_id) === actorId);

  if (!allowed) return { ok: false, status: 403, error: "Not allowed for this appointment" };
  return { ok: true, appointment: appt };
}

export async function listAppointmentsForActor({ role, actorId }) {
  const where = role === "therapist" ? "therapist_id=:actorId" : "patient_id=:actorId";

  return query(
    `select
      a.id as appointmentId,
      a.patient_id as patientId,
      a.patient_name as patientName,
      a.therapist_id as therapistId,
      a.therapist_name as therapistName,
      a.starts_at as startsAt,
      a.status as status,
      (
        select
          case
            when m.body is not null then left(m.body, 80)
            when m.file_url is not null and m.file_type like 'image/%' then '[Image]'
            when m.file_url is not null then '[Attachment]'
            else ''
          end
        from chat_messages m
        where m.appointment_id=a.id
        order by m.created_at desc
        limit 1
      ) as lastMessage,
      (
        select date_format(m.created_at, '%Y-%m-%d %H:%i:%s')
        from chat_messages m
        where m.appointment_id=a.id
        order by m.created_at desc
        limit 1
      ) as lastMessageAt
    from appointments a
    where ${where}
    order by coalesce(lastMessageAt, date_format(a.created_at, '%Y-%m-%d %H:%i:%s')) desc`,
    { actorId }
  );
}

export async function createAppointment({ patientId, patientName, therapistId, therapistName, startsAt }) {
  const result = await query(
    `insert into appointments (patient_id, patient_name, therapist_id, therapist_name, starts_at, status)
     values (:patientId, :patientName, :therapistId, :therapistName, :startsAt, 'booked')`,
    { patientId, patientName, therapistId, therapistName, startsAt }
  );
  return { insertId: result.insertId };
}

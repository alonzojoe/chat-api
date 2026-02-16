import { Appointment } from "../models/Appointment.js";
import { Message } from "../models/Message.js";

function formatDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function getAppointmentById(appointmentId) {
  return Appointment.findOne({ appointmentId }).lean();
}

export async function assertActorInAppointment({ appointmentId, role, actorId }) {
  const appt = await getAppointmentById(appointmentId);
  if (!appt) return { ok: false, status: 404, error: "Appointment not found" };

  const allowed =
    (role === "patient" && (appt.patient_id || "").toString() === actorId) ||
    (role === "therapist" && (appt.therapist_id || "").toString() === actorId);

  if (!allowed) return { ok: false, status: 403, error: "Not allowed for this appointment" };
  return { ok: true, appointment: appt };
}

export async function listAppointmentsForActor({ role, actorId }) {
  const where = role === "therapist" ? "a.therapist_id=:actorId" : "a.patient_id=:actorId";

  // Unread logic:
  // - Therapist unread: messages from patient where id > therapist_last_read_message_id (or all if null)
  // - Patient unread: messages from therapist where id > patient_last_read_message_id (or all if null)
  const unreadExpr =
    role === "therapist"
      ? `(
          select count(*)
          from chat_messages m
          where m.appointment_id=a.id
            and m.sender_role='patient'
            and (r.therapist_last_read_message_id is null or m.id > r.therapist_last_read_message_id)
        )`
      : `(
          select count(*)
          from chat_messages m
          where m.appointment_id=a.id
            and m.sender_role='therapist'
            and (r.patient_last_read_message_id is null or m.id > r.patient_last_read_message_id)
        )`;

  return query(
    `select
      a.id as appointmentId,
      a.appointment_id as mongoAppointmentId,
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
      ) as lastMessageAt,
      ${unreadExpr} as unreadCount
    from appointments a
    left join chat_reads r on r.appointment_id=a.id
    where ${where}
    order by coalesce(lastMessageAt, date_format(a.created_at, '%Y-%m-%d %H:%i:%s')) desc`,
    { actorId }
  );
}

export async function updateAppointmentStatusByMongoId({ appointmentMongoId, status }) {
  const result = await query(
    `update appointments
     set status=:status
     where appointment_id=:appointmentMongoId`,
    { appointmentMongoId, status }
  );
  return { affectedRows: result.affectedRows };
}

export async function createAppointment({ appointmentMongoId, patientId, patientName, therapistId, therapistName, startsAt }) {
  const result = await query(
    `insert into appointments (appointment_id, patient_id, patient_name, therapist_id, therapist_name, starts_at, status)
     values (:appointmentMongoId, :patientId, :patientName, :therapistId, :therapistName, :startsAt, 'booked')`,
    { appointmentMongoId: appointmentMongoId || null, patientId, patientName, therapistId, therapistName, startsAt }
  );

  // initialize read cursor row (1 per appointment)
  await query(`insert into chat_reads (appointment_id) values (:appointmentId)`, { appointmentId: result.insertId });

  return { insertId: result.insertId };
}

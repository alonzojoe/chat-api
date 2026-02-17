import { Appointment } from "../models/Appointment.js";
import { Message } from "../models/Message.js";

function formatDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function lastMessagePreview(message) {
  if (!message) return "";
  if (message.body) return message.body.slice(0, 80);
  if (message.fileUrl && message.fileType?.startsWith("image/")) return "[Image]";
  if (message.fileUrl) return "[Attachment]";
  return "";
}

export async function getAppointmentById(appointmentId) {
  return Appointment.findOne({ appointmentId }).lean();
}

export async function assertActorInAppointment({ appointmentId, role, actorId }) {
  const appt = await getAppointmentById(appointmentId);
  if (!appt) return { ok: false, status: 404, error: "Appointment not found" };

  const allowed =
    (role === "patient" && (appt.patientId || "").toString() === actorId) ||
    (role === "therapist" && (appt.therapistId || "").toString() === actorId);

  if (!allowed) return { ok: false, status: 403, error: "Not allowed for this appointment" };
  return { ok: true, appointment: appt };
}

export async function listAppointmentsForActor({ role, actorId }) {
  const filter = role === "therapist" ? { therapistId: actorId } : { patientId: actorId };

  const appointments = await Appointment.find(filter).sort({ updatedAt: -1 }).lean();

  const rows = await Promise.all(
    appointments.map(async (appt) => {
      const lastMessage = await Message.findOne({ appointmentId: appt.appointmentId })
        .sort({ createdAt: -1 })
        .lean();

      const otherRole = role === "therapist" ? "patient" : "therapist";
      const unreadCount = await Message.countDocuments({
        appointmentId: appt.appointmentId,
        senderRole: otherRole,
        seenAt: null,
      });

      return {
        appointmentId: appt.appointmentId,
        patientId: appt.patientId,
        patientName: appt.patientName,
        therapistId: appt.therapistId,
        therapistName: appt.therapistName,
        startsAt: appt.startsAt,
        appointmentDateTime: appt.appointmentDateTime || null,
        status: appt.status || "booked",
        lastMessage: lastMessagePreview(lastMessage),
        lastMessageAt: formatDate(lastMessage?.createdAt),
        unreadCount,
      };
    })
  );

  return rows.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.startsAt).getTime();
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.startsAt).getTime();
    return bTime - aTime;
  });
}

export async function updateAppointmentStatusByMongoId({ appointmentMongoId, status }) {
  const result = await Appointment.updateOne({ appointmentId: appointmentMongoId }, { $set: { status } });
  return { affectedRows: result.matchedCount || 0 };
}

export async function createAppointment({
  appointmentMongoId,
  patientId,
  patientName,
  therapistId,
  therapistName,
  startsAt,
  appointmentDateTime,
}) {
  const created = await Appointment.create({
    appointmentId: appointmentMongoId || undefined,
    patientId,
    patientName,
    therapistId,
    therapistName,
    startsAt,
    appointmentDateTime: appointmentDateTime || null,
    status: "booked",
  });

  return { insertId: created._id.toString() };
}

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
    (role === "patient" && appt.patientId === actorId) ||
    (role === "therapist" && appt.therapistId === actorId);

  if (!allowed) return { ok: false, status: 403, error: "Not allowed for this appointment" };
  return { ok: true, appointment: appt };
}

export async function listAppointmentsForActor({ role, actorId }) {
  const match = role === "therapist" ? { therapistId: actorId } : { patientId: actorId };

  const rows = await Appointment.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "messages",
        let: { appointmentId: "$appointmentId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$appointmentId", "$$appointmentId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { body: 1, fileUrl: 1, fileType: 1, createdAt: 1 } },
        ],
        as: "lastMessageDoc",
      },
    },
    { $addFields: { lastMessageDoc: { $arrayElemAt: ["$lastMessageDoc", 0] } } },
  ]);

  return rows
    .map((row) => {
      const last = row.lastMessageDoc;
      let lastMessage = "";
      if (last?.body) lastMessage = last.body.slice(0, 80);
      else if (last?.fileUrl && (last?.fileType || "").startsWith("image/")) lastMessage = "[Image]";
      else if (last?.fileUrl) lastMessage = "[Attachment]";

      return {
        appointmentId: row.appointmentId,
        patientId: row.patientId?.toString() || "",
        patientName: row.patientName,
        therapistId: row.therapistId?.toString() || "",
        therapistName: row.therapistName,
        startsAt: formatDate(row.startsAt),
        status: row.status,
        lastMessage,
        lastMessageAt: formatDate(last?.createdAt),
        createdAt: formatDate(row.createdAt),
      };
    })
    .sort((a, b) => {
      const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
}

export async function createAppointment({ appointmentId, patientId, patientName, therapistId, therapistName, startsAt }) {
  const appointment = await Appointment.create({
    appointmentId: appointmentId.toString(),
    patientId: patientId.toString(),
    patientName,
    therapistId: therapistId.toString(),
    therapistName,
    startsAt: new Date(startsAt),
    status: "booked",
  });
  return { appointmentId: appointment.appointmentId };
}

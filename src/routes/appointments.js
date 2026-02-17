import { Router } from "express";
import { parseActor } from "../utils/actor.js";
import { createAppointment, listAppointmentsForActor, updateAppointmentStatusByMongoId } from "../services/appointmentService.js";

export const appointmentsRouter = Router();

// GET /api/appointments?role=therapist&actorId=10
appointmentsRouter.get("/", async (req, res) => {
  const actor = parseActor(req);
  if (!actor.ok) return res.status(400).json({ error: actor.error });

  const appointments = await listAppointmentsForActor({ role: actor.role, actorId: actor.actorId });
  res.json({ appointments });
});

// POST /api/appointments
// { appointmentId?, patientId, patientName, therapistId, therapistName, startsAt, appointmentDateTime? }
// - appointmentId: optional MongoDB appointment id (stored in appointments.appointment_id)
appointmentsRouter.post("/", async (req, res) => {
  const appointmentMongoId = (req.body.appointmentId || "").toString() || null;
  const patientId = (req.body.patientId || "").toString();
  const patientName = (req.body.patientName || "").toString();
  const therapistId = (req.body.therapistId || "").toString();
  const therapistName = (req.body.therapistName || "").toString();
  const startsAt = req.body.startsAt; // 'YYYY-MM-DD HH:mm:ss'
  const appointmentDateTime = req.body.appointmentDateTime; // ISO string

  if (!patientId.trim()) return res.status(400).json({ error: "patientId required" });
  if (!patientName.trim()) return res.status(400).json({ error: "patientName required" });
  if (!therapistId.trim()) return res.status(400).json({ error: "therapistId required" });
  if (!therapistName.trim()) return res.status(400).json({ error: "therapistName required" });
  if (!startsAt) return res.status(400).json({ error: "startsAt required" });

  const result = await createAppointment({
    appointmentMongoId,
    patientId: patientId.trim(),
    patientName: patientName.trim(),
    therapistId: therapistId.trim(),
    therapistName: therapistName.trim(),
    startsAt,
    appointmentDateTime,
  });

  res.json({ ok: true, ...result });
});

// PATCH /api/appointments/status
// body: { appointmentId, status }
// appointmentId = MongoDB appointment id stored in appointments.appointment_id
appointmentsRouter.patch("/status", async (req, res) => {
  const appointmentMongoId = (req.body.appointmentId || "").toString();
  const status = (req.body.status || "").toString();

  if (!appointmentMongoId.trim()) return res.status(400).json({ error: "appointmentId required" });
  if (!status.trim()) return res.status(400).json({ error: "status required" });

  // keep it simple: allow a small set (extend anytime)
  const allowed = ["booked", "completed", "cancelled", "canceled", "no_show", "noshow"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `invalid status. allowed: ${allowed.join(", ")}` });
  }

  const result = await updateAppointmentStatusByMongoId({ appointmentMongoId: appointmentMongoId.trim(), status });
  if (!result.affectedRows) return res.status(404).json({ error: "appointment not found" });

  res.json({ ok: true });
});

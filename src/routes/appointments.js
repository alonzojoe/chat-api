import { Router } from "express";
import { parseActor } from "../utils/actor.js";
import { createAppointment, listAppointmentsForActor } from "../services/appointmentService.js";

export const appointmentsRouter = Router();

// GET /api/appointments?role=therapist&actorId=10
appointmentsRouter.get("/", async (req, res) => {
  const actor = parseActor(req);
  if (!actor.ok) return res.status(400).json({ error: actor.error });

  const appointments = await listAppointmentsForActor({ role: actor.role, actorId: actor.actorId });
  res.json({ appointments });
});

// POST /api/appointments
// { appointmentId, patientId, patientName, therapistId, therapistName, startsAt }
appointmentsRouter.post("/", async (req, res) => {
  const appointmentId = (req.body.appointmentId || "").toString();
  const patientId = (req.body.patientId || "").toString();
  const patientName = (req.body.patientName || "").toString();
  const therapistId = (req.body.therapistId || "").toString();
  const therapistName = (req.body.therapistName || "").toString();
  const startsAt = req.body.startsAt; // 'YYYY-MM-DD HH:mm:ss'

  if (!appointmentId.trim()) return res.status(400).json({ error: "appointmentId required" });
  if (!patientId.trim()) return res.status(400).json({ error: "patientId required" });
  if (!patientName.trim()) return res.status(400).json({ error: "patientName required" });
  if (!therapistId.trim()) return res.status(400).json({ error: "therapistId required" });
  if (!therapistName.trim()) return res.status(400).json({ error: "therapistName required" });
  if (!startsAt) return res.status(400).json({ error: "startsAt required" });

  const result = await createAppointment({ appointmentId, patientId, patientName: patientName.trim(), therapistId, therapistName: therapistName.trim(), startsAt });
  res.json({ ok: true, ...result });
});

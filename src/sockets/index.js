import { assertActorInAppointment } from "../services/appointmentService.js";

export function appointmentRoom(appointmentId) {
  return `appointment:${appointmentId}`;
}

export function actorRoom({ role, actorId }) {
  return `actor:${role}:${actorId}`;
}

export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join", async ({ appointmentId, role, actorId }) => {
      const id = (appointmentId || "").toString();
      const actorRole = (role || "").toString();
      const actorStr = (actorId || "").toString();
      if (!id || !["patient", "therapist"].includes(actorRole) || !actorStr.trim()) return;

      const allowed = await assertActorInAppointment({ appointmentId: id, role: actorRole, actorId: actorStr.trim() });
      if (!allowed.ok) return;

      socket.join(appointmentRoom(id));
      socket.join(actorRoom({ role: actorRole, actorId: actorStr.trim() }));
      socket.emit("joined", { appointmentId: id });
    });
  });
}

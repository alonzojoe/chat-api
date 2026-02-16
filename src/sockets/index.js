import { assertActorInAppointment } from "../services/appointmentService.js";

export function appointmentRoom(appointmentId) {
  return `appointment:${appointmentId}`;
}

export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join", async ({ appointmentId, role, actorId }) => {
      const id = (appointmentId || "").toString();
      const actorRole = (role || "").toString();
      const actorNum = Number(actorId);
      if (!id || !["patient", "therapist"].includes(actorRole) || !actorNum) return;

      const allowed = await assertActorInAppointment({ appointmentId: id, role: actorRole, actorId: actorNum });
      if (!allowed.ok) return;

      socket.join(appointmentRoom(id));
      socket.emit("joined", { appointmentId: id });
    });
  });
}

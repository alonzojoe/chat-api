/**
 * PROTOTYPE ONLY (no middleware yet)
 * Parse actor identity from query/body.
 * role: 'patient' | 'therapist'
 * actorId: number
 */
export function parseActor(req) {
  const role = (req.query.role || req.body.role || "").toString();
  const actorId = Number(req.query.actorId || req.body.actorId);
  if (!role || !["patient", "therapist"].includes(role)) {
    return { ok: false, error: "role must be patient|therapist" };
  }
  if (!actorId) {
    return { ok: false, error: "actorId required" };
  }
  return { ok: true, role, actorId };
}

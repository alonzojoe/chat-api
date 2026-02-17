import { Message } from "../models/Message.js";

function formatDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getOtherRole(role) {
  return role === "patient" ? "therapist" : "patient";
}

export async function getReadSummary({ appointmentId, role }) {
  const otherRole = getOtherRole(role);
  const unreadCount = await Message.countDocuments({ appointmentId, senderRole: otherRole, seenAt: null });

  const lastSeen = await Message.findOne({ appointmentId, senderRole: otherRole, seenAt: { $ne: null } })
    .sort({ seenAt: -1 })
    .lean();

  return {
    appointmentId: appointmentId.toString(),
    unreadCount,
    lastSeenAt: formatDate(lastSeen?.seenAt),
  };
}

export async function markMessagesSeen({ appointmentId, role, lastReadMessageId }) {
  const otherRole = getOtherRole(role);
  const filter = {
    appointmentId,
    senderRole: otherRole,
    seenAt: null,
  };

  if (lastReadMessageId) {
    const lastRead = await Message.findById(lastReadMessageId).lean();
    if (lastRead?.createdAt) {
      filter.createdAt = { $lte: lastRead.createdAt };
    }
  }

  const result = await Message.updateMany(filter, { $set: { seenAt: new Date() } });

  const summary = await getReadSummary({ appointmentId, role });
  return {
    ...summary,
    updatedCount: result?.modifiedCount ?? result?.nModified ?? 0,
  };
}

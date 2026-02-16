import mongoose from "mongoose";
import { Message } from "../models/Message.js";

function formatDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toMessageDto(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    appointmentId: doc.appointmentId.toString(),
    senderRole: doc.senderRole,
    senderId: doc.senderId?.toString() || "",
    body: doc.body,
    fileUrl: doc.fileUrl,
    fileName: doc.fileName,
    fileType: doc.fileType,
    createdAt: formatDate(doc.createdAt),
  };
}

export async function listMessages({ appointmentId }) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) return [];
  const rows = await Message.find({ appointmentId })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();
  return rows.map(toMessageDto);
}

export async function getMessageById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await Message.findById(id).lean();
  return toMessageDto(row);
}

export async function createTextMessage({ appointmentId, senderRole, senderId, body }) {
  const message = await Message.create({
    appointmentId,
    senderRole,
    senderId: senderId.toString(),
    body,
  });
  return getMessageById(message._id.toString());
}

export async function createFileMessage({ appointmentId, senderRole, senderId, fileUrl, fileName, fileType }) {
  const message = await Message.create({
    appointmentId,
    senderRole,
    senderId: senderId.toString(),
    fileUrl,
    fileName,
    fileType,
  });
  return getMessageById(message._id.toString());
}

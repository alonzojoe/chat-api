import { query } from "../config/db.js";

export async function listMessages({ appointmentId }) {
  return query(
    `select
      id,
      appointment_id as appointmentId,
      sender_role as senderRole,
      sender_id as senderId,
      body,
      file_url as fileUrl,
      file_name as fileName,
      file_type as fileType,
      date_format(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
    from chat_messages
    where appointment_id=:appointmentId
    order by created_at asc
    limit 500`,
    { appointmentId }
  );
}

export async function getMessageById(id) {
  const rows = await query(
    `select
      id,
      appointment_id as appointmentId,
      sender_role as senderRole,
      sender_id as senderId,
      body,
      file_url as fileUrl,
      file_name as fileName,
      file_type as fileType,
      date_format(created_at, '%Y-%m-%d %H:%i:%s') as createdAt
     from chat_messages where id=:id`,
    { id }
  );
  return rows[0] || null;
}

export async function createTextMessage({ appointmentId, senderRole, senderId, body }) {
  const result = await query(
    `insert into chat_messages (appointment_id, sender_role, sender_id, body)
     values (:appointmentId, :senderRole, :senderId, :body)`,
    { appointmentId, senderRole, senderId, body }
  );
  return getMessageById(result.insertId);
}

export async function createFileMessage({ appointmentId, senderRole, senderId, fileUrl, fileName, fileType }) {
  const result = await query(
    `insert into chat_messages (appointment_id, sender_role, sender_id, body, file_url, file_name, file_type)
     values (:appointmentId, :senderRole, :senderId, null, :fileUrl, :fileName, :fileType)`,
    { appointmentId, senderRole, senderId, fileUrl, fileName, fileType }
  );
  return getMessageById(result.insertId);
}

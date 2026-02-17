import mysql from "mysql2/promise";
import "dotenv/config";
import { connectDb } from "../src/config/db.js";
import { Appointment } from "../src/models/Appointment.js";
import { Message } from "../src/models/Message.js";

const mysqlConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DB || "chat_db",
};

const shouldWipe = process.argv.includes("--wipe");

async function migrate() {
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  await connectDb();

  if (shouldWipe) {
    await Message.deleteMany({});
    await Appointment.deleteMany({});
  }

  const [appointments] = await mysqlConn.execute("select * from appointments");
  const [messages] = await mysqlConn.execute("select * from chat_messages");

  for (const row of appointments) {
    await Appointment.create({
      appointmentId: String(row.id),
      patientId: String(row.patient_id),
      patientName: row.patient_name,
      therapistId: String(row.therapist_id),
      therapistName: row.therapist_name,
      startsAt: row.starts_at,
      appointmentDateTime: row.appointment_date_time || row.created_at || new Date(),
      status: row.status || "booked",
      createdAt: row.created_at || new Date(),
      updatedAt: row.created_at || new Date(),
    });
  }

  let migratedMessages = 0;
  for (const row of messages) {
    await Message.create({
      appointmentId: String(row.appointment_id),
      senderRole: row.sender_role,
      senderId: String(row.sender_id),
      body: row.body,
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileType: row.file_type,
      createdAt: row.created_at || new Date(),
      updatedAt: row.created_at || new Date(),
    });
    migratedMessages += 1;
  }

  await mysqlConn.end();

  console.log(`Migrated appointments: ${appointments.length}`);
  console.log(`Migrated messages: ${migratedMessages}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });

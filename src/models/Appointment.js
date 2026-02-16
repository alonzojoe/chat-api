import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: { type: Number, required: true },
    patientName: { type: String, required: true },
    therapistId: { type: Number, required: true },
    therapistName: { type: String, required: true },
    startsAt: { type: Date, required: true },
    status: { type: String, default: "booked" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export const Appointment = mongoose.model("Appointment", AppointmentSchema);

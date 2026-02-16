import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    senderRole: { type: String, enum: ["patient", "therapist"], required: true },
    senderId: { type: Number, required: true },
    body: { type: String, default: null },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

MessageSchema.index({ appointmentId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", MessageSchema);

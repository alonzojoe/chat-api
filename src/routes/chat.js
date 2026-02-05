import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env.js";
import { parseActor } from "../utils/actor.js";
import { assertActorInAppointment } from "../services/appointmentService.js";
import { createFileMessage, createTextMessage, listMessages } from "../services/chatService.js";

export function createChatRouter({ io }) {
  const router = Router();

  // upload
  const uploadDir = path.resolve(process.cwd(), env.uploads.dir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
      cb(null, name);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: env.uploads.maxFileSizeBytes },
  });

  function roomName(appointmentId) {
    return `appointment:${appointmentId}`;
  }

  // GET /api/chat/messages?appointmentId=1&role=therapist&actorId=10
  router.get("/messages", async (req, res) => {
    const actor = parseActor(req);
    if (!actor.ok) return res.status(400).json({ error: actor.error });

    const appointmentId = Number(req.query.appointmentId);
    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });

    const allowed = await assertActorInAppointment({ appointmentId, role: actor.role, actorId: actor.actorId });
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.error });

    const messages = await listMessages({ appointmentId });
    res.json({ messages });
  });

  // POST /api/chat/message
  router.post("/message", async (req, res) => {
    const actor = parseActor(req);
    if (!actor.ok) return res.status(400).json({ error: actor.error });

    const appointmentId = Number(req.body.appointmentId);
    const body = (req.body.body || "").toString();

    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });
    if (!body.trim()) return res.status(400).json({ error: "body required" });

    const allowed = await assertActorInAppointment({ appointmentId, role: actor.role, actorId: actor.actorId });
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.error });

    const message = await createTextMessage({
      appointmentId,
      senderRole: actor.role,
      senderId: actor.actorId,
      body: body.trim(),
    });

    io.to(roomName(appointmentId)).emit("message:new", { message });
    res.json({ message });
  });

  // POST /api/chat/upload (multipart)
  router.post("/upload", upload.single("file"), async (req, res) => {
    const actor = parseActor(req);
    if (!actor.ok) return res.status(400).json({ error: actor.error });

    const appointmentId = Number(req.body.appointmentId);
    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });
    if (!req.file) return res.status(400).json({ error: "file required" });

    const allowed = await assertActorInAppointment({ appointmentId, role: actor.role, actorId: actor.actorId });
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.error });

    const urlPath = `/uploads/${req.file.filename}`;

    const message = await createFileMessage({
      appointmentId,
      senderRole: actor.role,
      senderId: actor.actorId,
      fileUrl: urlPath,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    io.to(roomName(appointmentId)).emit("message:new", { message });

    const base = env.uploads.publicBaseUrl || `http://localhost:${env.port}`;
    res.json({ message, publicUrl: `${base}${urlPath}` });
  });

  return router;
}

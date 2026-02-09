import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env, isProduction } from "../config/env.js";
import { parseActor } from "../utils/actor.js";
import { assertActorInAppointment } from "../services/appointmentService.js";
import { createFileMessage, createTextMessage, listMessages } from "../services/chatService.js";
import { getReadsByAppointmentId, updateLastRead } from "../services/chatReadService.js";
import { uploadBufferToCloudinary } from "../services/cloudinary.js";

export function createChatRouter({ io }) {
  const router = Router();

  // upload
  const uploadDir = path.resolve(process.cwd(), env.uploads.dir);
  if (!isProduction) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = isProduction
    ? multer.memoryStorage()
    : multer.diskStorage({
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

    let fileUrl = "";
    let publicUrl = "";

    if (isProduction) {
      if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
        return res.status(500).json({ error: "Cloudinary env vars not set" });
      }

      const result = await uploadBufferToCloudinary({
        buffer: req.file.buffer,
        filename: req.file.originalname,
      });

      fileUrl = result.secure_url;
      publicUrl = result.secure_url;
    } else {
      const urlPath = `/uploads/${req.file.filename}`;
      const base = env.uploads.publicBaseUrl || `http://localhost:${env.port}`;
      fileUrl = urlPath;
      publicUrl = `${base}${urlPath}`;
    }

    const message = await createFileMessage({
      appointmentId,
      senderRole: actor.role,
      senderId: actor.actorId,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });

    io.to(roomName(appointmentId)).emit("message:new", { message });

    res.json({ message, publicUrl });
  });

  // POST /api/chat/read
  // body: { appointmentId, lastReadMessageId }
  // role + actorId come from parseActor (prototype)
  router.post("/read", async (req, res) => {
    const actor = parseActor(req);
    if (!actor.ok) return res.status(400).json({ error: actor.error });

    const appointmentId = Number(req.body.appointmentId);
    const lastReadMessageId = Number(req.body.lastReadMessageId);

    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });
    if (!lastReadMessageId) return res.status(400).json({ error: "lastReadMessageId required" });

    const allowed = await assertActorInAppointment({ appointmentId, role: actor.role, actorId: actor.actorId });
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.error });

    const reads = await updateLastRead({ appointmentId, role: actor.role, lastReadMessageId });

    io.to(roomName(appointmentId)).emit("read:updated", { appointmentId, reads });
    res.json({ ok: true, reads });
  });

  // GET /api/chat/read?appointmentId=1&role=therapist&actorId=... (optional helper)
  router.get("/read", async (req, res) => {
    const actor = parseActor(req);
    if (!actor.ok) return res.status(400).json({ error: actor.error });

    const appointmentId = Number(req.query.appointmentId);
    if (!appointmentId) return res.status(400).json({ error: "appointmentId required" });

    const allowed = await assertActorInAppointment({ appointmentId, role: actor.role, actorId: actor.actorId });
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.error });

    const reads = await getReadsByAppointmentId(appointmentId);
    res.json({ reads });
  });

  return router;
}

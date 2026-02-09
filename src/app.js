import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env, isProduction } from "./config/env.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { createChatRouter } from "./routes/chat.js";

export function createApp({ io }) {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  if (!isProduction) {
    // uploads static (dev only)
    const uploadDir = path.resolve(process.cwd(), env.uploads.dir);
    fs.mkdirSync(uploadDir, { recursive: true });
    app.use("/uploads", express.static(uploadDir));
  }

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/appointments", appointmentsRouter);
  app.use("/api/chat", createChatRouter({ io }));

  return app;
}

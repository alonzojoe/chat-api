import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env } from "./config/env.js";
import { conversationsRouter } from "./routes/conversations.js";
import { createChatRouter } from "./routes/chat.js";

export function createApp({ io }) {
  const app = express();

  const corsOrigins = (env.corsOrigin || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser tools
        if (corsOrigins.includes("*")) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS blocked"));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  // uploads static
  const uploadDir = path.resolve(process.cwd(), env.uploads.dir);
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/conversations", conversationsRouter);
  app.use("/api/chat", createChatRouter({ io }));

  return app;
}

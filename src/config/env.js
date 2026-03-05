import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  enableCors: (process.env.ENABLE_CORS || 'true').toLowerCase() === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  authKey: process.env.AUTH_KEY || '',

  mongo: {
    uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chat_db",
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || "uploads",
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
    maxFileSizeBytes: 15 * 1024 * 1024,
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
  },
};
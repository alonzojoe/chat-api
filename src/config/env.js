import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  mongo: {
    uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chat_db",
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || "uploads",
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
    maxFileSizeBytes: 15 * 1024 * 1024,
  },
};

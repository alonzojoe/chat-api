import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "chat_db",
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || "uploads",
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, ""),
    maxFileSizeBytes: 15 * 1024 * 1024,
  },
};

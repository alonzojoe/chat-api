import mongoose from "mongoose";
import { env } from "./env.js";

let connected = false;

export async function connectDb() {
  if (connected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongo.uri, {
    autoIndex: true,
  });
  connected = true;
}

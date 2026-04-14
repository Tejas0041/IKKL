import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";

export async function seedAdmin() {
  const existing = await Admin.findOne({ email: "admin@ikkl" });
  if (existing) return;
  const passwordHash = await bcrypt.hash("ikkl", 12);
  await Admin.create({ email: "admin@ikkl", passwordHash });
  console.log("Admin seeded");
}

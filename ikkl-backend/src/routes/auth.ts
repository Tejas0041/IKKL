import { Router } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";

const router = Router();
const SECRET = process.env.JWT_SECRET || "ikkl_secret_change_in_prod";

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await admin.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: admin._id, email: admin.email }, SECRET, { expiresIn: "7d" });
  res.json({ token });
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), SECRET) as { email: string };
    res.json({ email: payload.email });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

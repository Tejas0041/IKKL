import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ikkl.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ikkl@admin2026";
const JWT_SECRET = process.env.JWT_SECRET || "ikkl_secret_2026";

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ ok: true, payload });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

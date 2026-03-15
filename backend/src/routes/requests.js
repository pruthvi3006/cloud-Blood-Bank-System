import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// POST /api/requests
router.post("/", async (req, res) => {
  try {
    const { blood_bank_id, blood_group, required_units } = req.body;
    if (!blood_bank_id || !blood_group || !required_units) {
      return res.status(400).json({ message: "blood_bank_id, blood_group and required_units are required" });
    }

    await query(
      `INSERT INTO blood_requests
       (user_id, blood_bank_id, blood_group, required_units, status, created_at, updated_at)
       VALUES (?,?,?,?, 'PENDING', NOW(), NOW())`,
      [req.user.id, blood_bank_id, blood_group, required_units]
    );

    const result = await query("SELECT * FROM blood_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [req.user.id]);

    res.status(201).json(result[0]);
  } catch (err) {
    console.error("Create request error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/requests
router.get("/", async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id,
              r.blood_group,
              r.required_units,
              r.status,
              r.created_at,
              bb.name as blood_bank_name,
              bb.city as blood_bank_city
       FROM blood_requests r
       JOIN blood_banks bb ON bb.id = r.blood_bank_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result);
  } catch (err) {
    console.error("List user requests error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


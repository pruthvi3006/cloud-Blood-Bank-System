import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { getMedicalReportDownloadUrl } from "../s3/s3Client.js";

const router = express.Router();

router.use(authMiddleware);

// POST /api/requests
router.post("/", async (req, res) => {
  try {
    const { blood_bank_id, blood_group, required_units } = req.body;
    if (!blood_bank_id || !blood_group || !required_units) {
      return res.status(400).json({ message: "blood_bank_id, blood_group and required_units are required" });
    }

    const userRows = await query(
      "SELECT medical_report_s3_key FROM users WHERE id = ?",
      [req.user.id]
    );
    const medicalReportKey = userRows[0]?.medical_report_s3_key;
    if (!medicalReportKey) {
      return res.status(400).json({
        message: "Upload a medical report on your profile before sending a request to a blood bank.",
      });
    }

    await query(
      `INSERT INTO blood_requests
       (user_id, blood_bank_id, blood_group, required_units, status, created_at, updated_at, medical_report_s3_key)
       VALUES (?,?,?,?, 'PENDING', NOW(), NOW(), ?)`,
      [req.user.id, blood_bank_id, blood_group, required_units, medicalReportKey]
    );

    const result = await query("SELECT * FROM blood_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [req.user.id]);

    res.status(201).json(result[0]);
  } catch (err) {
    console.error("Create request error", err);
    if (err.errno === 1054 || err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message:
          "Database is missing columns for blood requests. Run the SQL in backend/migrations/002_blood_request_attachments.sql on your MySQL database, then try again.",
      });
    }
    if (err.errno === 1452 || err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "Invalid blood bank or user reference. Refresh the page and try again.",
      });
    }
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
              r.bank_message,
              bb.name as blood_bank_name,
              bb.city as blood_bank_city,
              IF(r.fitness_certificate_s3_key IS NOT NULL, 1, 0) as has_fitness_certificate,
              IF(r.medical_report_s3_key IS NOT NULL, 1, 0) as has_medical_report
       FROM blood_requests r
       JOIN blood_banks bb ON bb.id = r.blood_bank_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result);
  } catch (err) {
    console.error("List user requests error", err);
    if (err.errno === 1054 || err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message:
          "Database is missing columns for blood requests. Run backend/migrations/002_blood_request_attachments.sql, then try again.",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/requests/:id/fitness-certificate — presigned download (accepted requests only)
router.get("/:id/fitness-certificate", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const rows = await query(
      `SELECT fitness_certificate_s3_key, status FROM blood_requests WHERE id = ? AND user_id = ?`,
      [requestId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    const { fitness_certificate_s3_key: key, status } = rows[0];
    if (status !== "ACCEPTED") {
      return res.status(400).json({ message: "Fitness certificate is only available for accepted requests" });
    }
    if (!key) {
      return res.status(404).json({ message: "No fitness certificate on file" });
    }

    const downloadUrl = await getMedicalReportDownloadUrl({ key });
    res.json({ downloadUrl });
  } catch (err) {
    console.error("User fitness certificate download error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { getMedicalReportUploadUrl, getMedicalReportDownloadUrl } from "../s3/s3Client.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// All routes here require auth
router.use(authMiddleware);

// GET /api/profile
router.get("/", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, phone, address, city, state, pincode,
              latitude, longitude, medical_report_s3_key
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result[0]);
  } catch (err) {
    console.error("Get profile error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/profile
router.put("/", async (req, res) => {
  try {
    const {
      name = null,
      phone = null,
      address = null,
      city = null,
      state = null,
      pincode = null,
      latitude = null,
      longitude = null,
    } = req.body;

    await query(
      `UPDATE users
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           state = COALESCE(?, state),
           pincode = COALESCE(?, pincode),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude)
       WHERE id = ?`,
      [name, phone, address, city, state, pincode, latitude, longitude, req.user.id]
    );

    const result = await query(
      `SELECT id, name, email, role, phone, address, city, state, pincode, latitude, longitude, medical_report_s3_key
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json(result[0]);
  } catch (err) {
    console.error("Update profile error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/profile/medical-report/upload-url
router.post("/medical-report/upload-url", async (req, res) => {
  try {
    const { contentType } = req.body;
    if (!contentType) {
      return res.status(400).json({ message: "contentType is required" });
    }

    const key = `medical-reports/${req.user.id}/${uuidv4()}`;
    const uploadUrl = await getMedicalReportUploadUrl({ key, contentType });

    await query("UPDATE users SET medical_report_s3_key = ? WHERE id = ?", [key, req.user.id]);

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("Medical report upload-url error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/profile/medical-report/download-url
router.get("/medical-report/download-url", async (req, res) => {
  try {
    const result = await query(
      "SELECT medical_report_s3_key FROM users WHERE id = ?",
      [req.user.id]
    );
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const { medical_report_s3_key: key } = result[0];
    if (!key) {
      return res.status(404).json({ message: "No medical report uploaded" });
    }

    const downloadUrl = await getMedicalReportDownloadUrl({ key });
    res.json({ downloadUrl });
  } catch (err) {
    console.error("Medical report download-url error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


import express from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";
import { extensionForFile, saveBuffer, sendStoredFile } from "../storage/localFiles.js";

const router = express.Router();

router.use(authMiddleware);

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

router.post("/medical-report", uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "file is required" });
    }

    const ext = extensionForFile(req.file.originalname, req.file.mimetype);
    const key = `medical-reports/${req.user.id}/${uuidv4()}${ext}`;
    await saveBuffer({ key, buffer: req.file.buffer });
    await query("UPDATE users SET medical_report_s3_key = ? WHERE id = ?", [key, req.user.id]);

    res.json({ key });
  } catch (err) {
    console.error("Medical report upload error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/medical-report", async (req, res) => {
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

    const sent = await sendStoredFile(res, key, "medical-report");
    if (!sent) {
      return res.status(404).json({ message: "No medical report uploaded" });
    }
  } catch (err) {
    console.error("Medical report download error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

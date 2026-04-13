import express from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/db.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import {
  getMedicalReportDownloadUrl,
  getMedicalReportUploadUrl,
} from "../s3/s3Client.js";

function fitnessCertificateKeyPrefix(requestId) {
  return `fitness-certificates/request-${requestId}/`;
}

function isValidFitnessCertificateKey(requestId, key) {
  return typeof key === "string" && key.startsWith(fitnessCertificateKeyPrefix(requestId));
}

const router = express.Router();

router.use(authMiddleware, requireAdmin);

// Ensure blood bank record exists for admin (called during onboarding or lazily)
router.post("/blood-bank", async (req, res) => {
  try {
    const { name, address, city, state, pincode, contact_phone } =
      req.body;

    const existing = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (existing.length > 0) {
      await query(
        `UPDATE blood_banks
         SET name = COALESCE(?, name),
             address = COALESCE(?, address),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             pincode = COALESCE(?, pincode),
             contact_phone = COALESCE(?, contact_phone)
         WHERE admin_user_id = ?`,
        [
          name,
          address,
          city,
          state,
          pincode,
          contact_phone,
          req.user.id,
        ]
      );
      const updated = await query("SELECT * FROM blood_banks WHERE admin_user_id = ?", [req.user.id]);
      return res.json(updated[0]);
    }

    await query(
      `INSERT INTO blood_banks
       (name, address, city, state, pincode, contact_phone, admin_user_id)
       VALUES (?,?,?,?,?,?,?)`,
      [
        name,
        address,
        city,
        state,
        pincode,
        contact_phone,
        req.user.id,
      ]
    );
    const inserted = await query("SELECT * FROM blood_banks WHERE admin_user_id = ?", [req.user.id]);
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Admin create/update blood bank error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/stock
router.get("/stock", async (req, res) => {
  try {
    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(404).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    const stock = await query(
      "SELECT id, blood_group, units_available FROM blood_stock WHERE blood_bank_id = ?",
      [bankId]
    );
    res.json(stock);
  } catch (err) {
    console.error("Admin get stock error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/admin/stock  (bulk upsert)
router.put("/stock", async (req, res) => {
  try {
    const { items } = req.body; // [{ blood_group, units_available }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(404).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    for (const item of items) {
      const { blood_group, units_available } = item;
      if (!blood_group) continue;
      const existing = await query(
        "SELECT id FROM blood_stock WHERE blood_bank_id = ? AND blood_group = ?",
        [bankId, blood_group]
      );
      if (existing.length > 0) {
        await query(
          "UPDATE blood_stock SET units_available = ? WHERE id = ?",
          [units_available ?? 0, existing[0].id]
        );
      } else {
        await query(
          "INSERT INTO blood_stock (blood_bank_id, blood_group, units_available) VALUES (?,?,?)",
          [bankId, blood_group, units_available ?? 0]
        );
      }
    }

    const stock = await query(
      "SELECT id, blood_group, units_available FROM blood_stock WHERE blood_bank_id = ?",
      [bankId]
    );
    res.json(stock);
  } catch (err) {
    console.error("Admin update stock error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/requests
router.get("/requests", async (req, res) => {
  try {
    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(404).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    const requests = await query(
      `SELECT r.id,
              r.blood_group,
              r.required_units,
              r.status,
              r.created_at,
              u.name as user_name,
              u.phone as user_phone,
              u.city as user_city,
              u.id as user_id,
              IF(COALESCE(r.medical_report_s3_key, u.medical_report_s3_key) IS NOT NULL, 1, 0) as has_medical_report
       FROM blood_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.blood_bank_id = ?
       ORDER BY r.created_at DESC`,
      [bankId]
    );
    res.json(requests);
  } catch (err) {
    console.error("Admin list requests error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/requests/:requestId/medical-report — report snapshot for this request
router.get("/requests/:requestId/medical-report", async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(403).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    const rows = await query(
      `SELECT r.medical_report_s3_key, u.medical_report_s3_key AS user_medical_key
       FROM blood_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ? AND r.blood_bank_id = ?`,
      [requestId, bankId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const key = rows[0].medical_report_s3_key || rows[0].user_medical_key;
    if (!key) {
      return res.status(404).json({ message: "No medical report for this request" });
    }

    const downloadUrl = await getMedicalReportDownloadUrl({ key });
    res.json({ downloadUrl });
  } catch (err) {
    console.error("Admin request medical report download error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/admin/requests/:id/fitness-certificate/upload-url
router.post("/requests/:id/fitness-certificate/upload-url", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const { contentType } = req.body;
    if (!contentType) {
      return res.status(400).json({ message: "contentType is required" });
    }

    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(403).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    const reqRows = await query(
      `SELECT id, status FROM blood_requests WHERE id = ? AND blood_bank_id = ?`,
      [requestId, bankId]
    );
    if (reqRows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (reqRows[0].status !== "PENDING") {
      return res.status(400).json({ message: "Fitness certificate upload is only for pending requests" });
    }

    const key = `${fitnessCertificateKeyPrefix(requestId)}${uuidv4()}`;
    const uploadUrl = await getMedicalReportUploadUrl({ key, contentType });
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("Admin fitness certificate upload-url error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

async function updateRequestStatus(id, status, adminUserId) {
  const bank = await query(
    "SELECT id FROM blood_banks WHERE admin_user_id = ?",
    [adminUserId]
  );
  if (bank.length === 0) {
    throw new Error("Blood bank profile not created");
  }
  const bankId = bank[0].id;

  await query(
    `UPDATE blood_requests
     SET status = ?, updated_at = NOW()
     WHERE id = ? AND blood_bank_id = ?`,
    [status, id, bankId]
  );
  const result = await query("SELECT * FROM blood_requests WHERE id = ?", [id]);
  return result;
}

// POST /api/admin/requests/:id/accept — body: { fitness_certificate_s3_key, bank_message? }
router.post("/requests/:id/accept", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const { fitness_certificate_s3_key, bank_message } = req.body || {};
    if (!fitness_certificate_s3_key || typeof fitness_certificate_s3_key !== "string") {
      return res.status(400).json({
        message: "fitness_certificate_s3_key is required. Upload the certificate first, then accept.",
      });
    }
    if (!isValidFitnessCertificateKey(requestId, fitness_certificate_s3_key)) {
      return res.status(400).json({ message: "Invalid fitness certificate key for this request" });
    }

    const bank = await query(
      "SELECT id FROM blood_banks WHERE admin_user_id = ?",
      [req.user.id]
    );
    if (bank.length === 0) {
      return res.status(400).json({ message: "Blood bank profile not created" });
    }
    const bankId = bank[0].id;

    const existing = await query(
      `SELECT id, status FROM blood_requests WHERE id = ? AND blood_bank_id = ?`,
      [requestId, bankId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (existing[0].status !== "PENDING") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    const message =
      bank_message === undefined || bank_message === null ? "" : String(bank_message);

    await query(
      `UPDATE blood_requests
       SET status = 'ACCEPTED',
           fitness_certificate_s3_key = ?,
           bank_message = ?,
           updated_at = NOW()
       WHERE id = ? AND blood_bank_id = ?`,
      [fitness_certificate_s3_key, message, requestId, bankId]
    );

    const result = await query("SELECT * FROM blood_requests WHERE id = ?", [requestId]);
    res.json(result[0]);
  } catch (err) {
    console.error("Admin accept request error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/admin/requests/:id/reject
router.post("/requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateRequestStatus(id, "REJECTED", req.user.id);
    if (result.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(result[0]);
  } catch (err) {
    console.error("Admin reject request error", err);
    if (err.message.includes("Blood bank profile not created")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


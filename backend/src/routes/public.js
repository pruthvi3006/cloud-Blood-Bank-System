import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// GET /api/public/blood-banks — all registered blood banks (no location filter, no auth)
router.get("/blood-banks", async (req, res) => {
  try {
    const result = await query(
      `SELECT bb.id,
              bb.name,
              bb.address,
              bb.city,
              bb.state,
              bb.pincode,
              bb.contact_phone,
              COALESCE(SUM(bs.units_available), 0) AS total_units
       FROM blood_banks bb
       LEFT JOIN blood_stock bs ON bs.blood_bank_id = bb.id
       GROUP BY bb.id, bb.name, bb.address, bb.city, bb.state, bb.pincode, bb.contact_phone
       ORDER BY bb.name ASC`
    );
    res.json(result);
  } catch (err) {
    console.error("Public list blood banks error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

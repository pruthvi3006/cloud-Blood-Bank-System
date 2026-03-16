import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// GET /api/blood-banks/cities
router.get("/cities", async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT city FROM blood_banks WHERE city IS NOT NULL AND city != '' ORDER BY city ASC`
    );
    const cities = result.map((row) => row.city);
    res.json(cities);
  } catch (err) {
    console.error("Get cities error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/blood-banks/search?bloodGroup=A%2B&city=Mumbai
router.get("/search", async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ message: "bloodGroup is required" });
    }

    if (!city) {
      return res.status(400).json({ message: "city is required" });
    }

    // Query to find blood banks with the specific blood group in stock in the given city
    const result = await query(
      `SELECT DISTINCT bb.id,
              bb.name,
              bb.address,
              bb.city,
              bb.state,
              bb.pincode,
              bb.contact_phone,
              bs.blood_group,
              SUM(bs.units_available) as units_available
       FROM blood_banks bb
       INNER JOIN blood_stock bs ON bs.blood_bank_id = bb.id
       WHERE bs.blood_group = ?
         AND bs.units_available > 0
         AND bb.city = ?
       GROUP BY bb.id, bs.blood_group
       ORDER BY bb.name ASC`,
      [bloodGroup, city]
    );

    res.json(result);
  } catch (err) {
    console.error("Search blood banks error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


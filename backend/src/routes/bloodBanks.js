import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// GET /api/blood-banks/search?bloodGroup=A%2B&lat=..&lng=..&radiusKm=50
router.get("/search", async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radiusKm = 50 } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    if (!bloodGroup || Number.isNaN(userLat) || Number.isNaN(userLng)) {
      return res.status(400).json({ message: "bloodGroup, lat and lng are required" });
    }

    const result = await query(
      `SELECT bb.id,
              bb.name,
              bb.address,
              bb.city,
              bb.state,
              bb.pincode,
              bb.latitude,
              bb.longitude,
              bb.contact_phone,
              bs.blood_group,
              bs.units_available
       FROM blood_banks bb
       JOIN blood_stock bs ON bs.blood_bank_id = bb.id
       WHERE bs.blood_group = ?
         AND bs.units_available > 0`,
      [bloodGroup]
    );

    const banks = result
      .map((row) => {
        if (row.latitude == null || row.longitude == null) {
          return null;
        }
        const distance = haversine(userLat, userLng, parseFloat(row.latitude), parseFloat(row.longitude));
        return { ...row, distance };
      })
      .filter((b) => b && b.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json(banks);
  } catch (err) {
    console.error("Search blood banks error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;


import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const AWS_REGION = process.env.AWS_REGION;
export const MEDICAL_REPORTS_BUCKET = process.env.MEDICAL_REPORTS_BUCKET;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Backend will not be able to access the database.");
}

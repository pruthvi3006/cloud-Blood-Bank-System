import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

function poolOptions() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not set");
  }

  const base = {
    uri,
    waitForConnections: true,
    connectionLimit: Number(process.env.DATABASE_POOL_SIZE || 10),
    queueLimit: 0,
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 15_000),
  };

  // Amazon RDS MySQL: use TLS (set DATABASE_SSL=true in production).
  if (process.env.DATABASE_SSL === "true") {
    base.ssl = {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  return base;
}

const pool = mysql.createPool(poolOptions());

pool.on?.("error", (err) => {
  console.error("Unexpected MySQL client error", err);
  process.exit(1);
});

export async function query(sql, params) {
  const start = Date.now();
  const [rows] = await pool.execute(sql, params);
  const duration = Date.now() - start;

  if (duration > 500) {
    console.log("Slow query", { sql, duration });
  }

  return rows;
}

export async function testConnection() {
  try {
    await pool.execute("SELECT 1");
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

export default pool;

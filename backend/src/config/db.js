import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

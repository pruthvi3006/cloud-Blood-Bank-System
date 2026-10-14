
import express from "express";
import cors from "cors";
import "./config/env.js";
import { PORT } from "./config/env.js";
import { testConnection } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import bloodBankRoutes from "./routes/bloodBanks.js";
import adminRoutes from "./routes/admin.js";
import requestRoutes from "./routes/requests.js";
import publicRoutes from "./routes/public.js";
import dotenv from "dotenv";
import { register, requests, latency } from "./metrics.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);

app.use(express.json());

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Measure application HTTP requests and response times
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    // Do not count Prometheus scraping its own metrics endpoint
    if (req.path === "/metrics") return;

    // Use route templates instead of raw URLs
    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    requests.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });

    latency.observe(
      {
        method: req.method,
        route,
      },
      duration
    );
  });

  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/blood-banks", bloodBankRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: "Internal server error" });
});

(async () => {
  console.log("Starting backend with config:", {
    PORT,
    JWT_SECRET: process.env.JWT_SECRET ? "set" : "not set",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "not set",
  });

  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error("Failed to connect to database. Exiting...");
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend listening on port ${PORT}`);
  });
})();

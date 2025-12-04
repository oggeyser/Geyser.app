import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import vehiclesRoutes from "./routes/vehicles.routes.js";
import routeLogsRoutes from "./routes/routeLogs.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import prisma from "./services/prisma.service.js";
import cron from "node-cron";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

// routes
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/routelogs", routeLogsRoutes);

// basic test
app.get("/", (req, res) => res.send("Backend running"));

// documents cron (reuse pattern)
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID API key not configured");
}

cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);

    const docs = await prisma.document.findMany({
      where: { expirationDate: { lte: in30 } },
      include: { vehicle: true }
    });

    if (!docs.length) return;

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
    let html = "<h3>Documents expiring soon or expired</h3><ul>";
    docs.forEach(d => {
      html += `<li><strong>${d.vehicle.plateNumber}</strong> - ${d.type} expires ${d.expirationDate.toISOString().slice(0,10)} - <a href="${baseUrl}${d.filePath}">View</a></li>`;
    });
    html += "</ul>";

    await sgMail.send({
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `🔔 Documents expiring (${docs.length})`,
      html
    });

    console.log(`Email sent: ${docs.length} docs`);
  } catch (err) {
    console.error("Cron email error:", err);
  }
});

// error handler
app.use(errorHandler);

export default app;

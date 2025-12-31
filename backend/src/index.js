import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import vehicleRoutes from "./routes/vehicles.js";
import routeLogsRoutes from "./routes/routeLogs.routes.js";
import documentRoutes from "./routes/documents.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

/* -----------------------------------------------------
   SENDGRID
----------------------------------------------------- */
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️ SENDGRID_API_KEY inválida o no configurada.");
}

/* -----------------------------------------------------
   CORS
----------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://geyser-app-drqv.vercel.app",
];

// Permite previews de Vercel: *.vercel.app
function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman/curl o requests sin origin
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

console.log("🌍 CORS habilitado. Allowed base origins:", allowedOrigins);

app.use(express.json());

/* -----------------------------------------------------
   RUTAS
----------------------------------------------------- */
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/routelogs", routeLogsRoutes);
app.use("/api/documents", documentRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// Test routelogs
app.get("/api/routelogs/test", (req, res) => {
  res.json({ message: "Ruta routelogs funcionando", timestamp: new Date() });
});

/* -----------------------------------------------------
   UPLOADS LOCALES (si tu documents.routes.js usa /uploads)
----------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadDir));

/* -----------------------------------------------------
   ALERTAS DOCUMENTOS (CRON)
----------------------------------------------------- */
async function sendDocumentsExpirationEmail() {
  try {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);

    const docs = await prisma.document.findMany({
      where: { expirationDate: { lte: in30 } },
      include: { vehicle: true },
    });

    if (!docs.length) {
      console.log("📭 No hay documentos por vencer");
      return;
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";

    let html = "<h3>Documentos por vencer o vencidos</h3><ul>";
    docs.forEach((d) => {
      html += `
        <li>
          <strong>${d.vehicle.plateNumber}</strong> - ${d.type}
          vence el ${d.expirationDate.toISOString().slice(0, 10)}
          - <a href="${baseUrl}${d.filePath}" target="_blank">Ver archivo</a>
        </li>`;
    });
    html += "</ul>";

    if (!process.env.ADMIN_EMAIL || !process.env.SENDER_EMAIL) {
      console.warn("⚠️ Falta ADMIN_EMAIL o SENDER_EMAIL. No se envía correo.");
      return;
    }

    await sgMail.send({
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `🔔 Alerta: Documentos por vencer (${docs.length})`,
      html,
    });

    console.log(`📧 Alerta enviada con ${docs.length} documentos.`);
  } catch (err) {
    console.error("❌ Error en envío de alertas:", err);
  }
}

// Cron interno 08:00 diario
cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Ejecutando cron interno de documentos...");
  await sendDocumentsExpirationEmail();
});

// Endpoint para cron-job.org
app.get("/api/cron/doc-expirations", async (req, res) => {
  await sendDocumentsExpirationEmail();
  res.json({ ok: true });
});

/* -----------------------------------------------------
   START
----------------------------------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor iniciado en http://0.0.0.0:${PORT}`);
});

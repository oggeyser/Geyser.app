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

// si estás detrás de Render / proxy
app.set("trust proxy", 1);

// -----------------------------------------------------
// CONFIG SENDGRID
// -----------------------------------------------------
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️ SENDGRID_API_KEY inválida o no configurada.");
}

// -----------------------------------------------------
// CORS
// - Permite localhost
// - Permite tu dominio Vercel principal
// - Permite previews *.vercel.app
// -----------------------------------------------------
const allowedExact = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://geyser-app-drqv.vercel.app",
]);

function corsOrigin(origin, cb) {
  // requests tipo curl/postman no traen origin
  if (!origin) return cb(null, true);

  if (allowedExact.has(origin)) return cb(null, true);
  if (origin.endsWith(".vercel.app")) return cb(null, true);

  return cb(new Error(`CORS bloqueado para origin: ${origin}`), false);
}

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// -----------------------------------------------------
// RUTAS PRINCIPALES
// -----------------------------------------------------
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/routelogs", routeLogsRoutes);
app.use("/api/documents", documentRoutes);

app.get("/", (req, res) => res.send("Backend funcionando correctamente"));
app.get("/api/health", (req, res) => res.json({ ok: true, at: new Date() }));

// -----------------------------------------------------
// UPLOADS LOCALES (solo si todavía lo usas)
// -----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static(uploadDir));

// -----------------------------------------------------
// CRUD DOCUMENTOS (si lo sigues usando)
// -----------------------------------------------------
app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    const { type, issueDate, expirationDate, vehicleId } = req.body;
    if (!req.file) return res.status(400).json({ error: "Falta el archivo" });

    const document = await prisma.document.create({
      data: {
        type,
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        vehicle: { connect: { id: Number(vehicleId) } },
      },
    });

    res.json(document);
  } catch (err) {
    console.error("❌ Error creando documento:", err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------
// ALERTAS
// -----------------------------------------------------
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

cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Ejecutando cron interno de documentos...");
  await sendDocumentsExpirationEmail();
});

app.get("/api/cron/doc-expirations", async (req, res) => {
  await sendDocumentsExpirationEmail();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor iniciado en http://0.0.0.0:${PORT}`);
});

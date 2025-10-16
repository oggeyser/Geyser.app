import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import vehicleRoutes from "./routes/vehicles.js";
import routeLogsRoutes from "./routes/routeLogs.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Cargar variables de entorno
dotenv.config();

// Inicializar Prisma y SendGrid
const prisma = new PrismaClient();
if (process.env.SENDGRID_API_KEY?.startsWith("SG.")) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️  SENDGRID_API_KEY inválida o no configurada.");
}

const app = express();

// --- Configuración de CORS ---
app.use(cors());
app.use(express.json());

// --- Registrar rutas ---
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/route-logs", routeLogsRoutes);

// --- Ruta raíz de prueba ---
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// --- Configuración de uploads ---
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

// Servir archivos subidos (importante para Render)
app.use("/uploads", express.static(uploadDir));

// --- CRUD para Documentos ---
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

// --- Tarea automática (cron) para alertas de documentos ---
cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);

    const docs = await prisma.document.findMany({
      where: { expirationDate: { lte: in30 } },
      include: { vehicle: true },
    });

    if (!docs.length) return;

    let html = "<h3>Documentos por vencer o vencidos</h3><ul>";
    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";

    docs.forEach((d) => {
      html += `
        <li>
          <strong>${d.vehicle.patente || d.vehicle.plateNumber}</strong> - ${d.type}
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
    console.error("❌ Error en cron job:", err);
  }
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor iniciado en http://0.0.0.0:${PORT}`);
});

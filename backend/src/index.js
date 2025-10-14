import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import vehicleRoutes from "./routes/vehicles.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use("/api/vehicles", vehicleRoutes);

// --- Ruta de prueba ---
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// --- Configuración de uploads con multer ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --- CRUD adicional para vehículos y documentos 
app.post("/api/documents", upload.single("file"), async (req, res) => {
  try {
    const { type, issueDate, expirationDate, vehicleId } = req.body;
    if (!req.file) return res.status(400).json({ error: "Falta el archivo" });

    const doc = await prisma.document.create({
      data: {
        type,
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        vehicle: { connect: { id: Number(vehicleId) } },
      },
    });

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Cron job para alertas ---
cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);

    const docs = await prisma.document.findMany({
      where: { expirationDate: { lte: in30 } },
      include: { vehicle: true },
    });

    if (docs.length === 0) return;

    let html = "<h3>Documentos por vencer / vencidos</h3><ul>";
    docs.forEach((d) => {
      html += `<li><strong>${d.vehicle.plateNumber}</strong> - ${d.type} vence el ${d.expirationDate
        .toISOString()
        .slice(0, 10)} - <a href="${process.env.BACKEND_URL || "http://localhost:4000"}${
        d.filePath
      }" target="_blank">Ver archivo</a></li>`;
    });
    html += "</ul>";

    await sgMail.send({
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `Alerta: Documentos por vencer (${docs.length})`,
      html,
    });

    console.log("Correo de alerta enviado. Documentos:", docs.length);
  } catch (err) {
    console.error("Error en cron job:", err);
  }
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 4000;
app.listen(3000, "0.0.0.0", () => console.log("Servidor iniciado en http://0.0.0.0:3000"));


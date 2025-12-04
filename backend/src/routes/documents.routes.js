import express from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import { dirname } from "path";

const prisma = new PrismaClient();
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({ storage });

/* =====================================
   TIPOS DE DOCUMENTO PERMITIDOS
===================================== */
const ALLOWED_TYPES = [
  "PERMISO",
  "REVISION_TECNICA",
  "SOAP",
  "GASES",
  "OTRO",
];

/* =====================================
   SUBIR DOCUMENTO PARA VEHÍCULO
===================================== */
router.post("/:vehicleId", upload.single("file"), async (req, res) => {
  try {
    const { type, issueDate, expirationDate } = req.body;
    const { vehicleId } = req.params;

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: "Tipo de documento no permitido" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const doc = await prisma.document.create({
      data: {
        type,
        filePath: fileUrl,
        fileName: req.file.originalname,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        vehicleId: Number(vehicleId),
      },
    });

    res.json(doc);
  } catch (err) {
    console.error("❌ Error subiendo documento:", err);
    res.status(500).json({ error: "Error subiendo documento" });
  }
});

/* =====================================
   OBTENER DOCUMENTOS DE UN VEHÍCULO
===================================== */
router.get("/:vehicleId", async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { vehicleId: Number(req.params.vehicleId) },
      orderBy: { expirationDate: "asc" },
    });

    res.json(docs);
  } catch (err) {
    console.error("❌ Error obteniendo documentos:", err);
    res.status(500).json({ error: "Error obteniendo documentos" });
  }
});

/* =====================================
   ELIMINAR DOCUMENTO
===================================== */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.document.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Documento eliminado" });
  } catch (err) {
    console.error("❌ Error eliminando documento:", err);
    res.status(500).json({ error: "Error eliminando documento" });
  }
});

export default router;

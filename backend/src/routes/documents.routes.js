import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { uploadToR2 } from "../services/r2Client.js";

const prisma = new PrismaClient();
const router = express.Router();

// Usaremos memoria, no disco
const storage = multer.memoryStorage();
const upload = multer({ storage });

const ALLOWED_TYPES = [
  "PERMISO",
  "REVISION_TECNICA",
  "SOAP",
  "GASES",
  "OTRO",
];

/* SUBIR DOCUMENTO PARA VEHÍCULO */
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

    // Subir archivo a R2
    const fileUrl = await uploadToR2("documents", req.file);

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

/* OBTENER DOCUMENTOS DE UN VEHÍCULO */
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

/* ELIMINAR DOCUMENTO */
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

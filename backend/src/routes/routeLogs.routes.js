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

// ----------------------
// CONFIGURACIÓN MULTER
// ----------------------
const uploadDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({ storage });

/* =====================================================
   GET TODOS LOS REGISTROS O FILTRADOS POR VEHÍCULO
===================================================== */
router.get("/", async (req, res) => {
  const { vehicleId } = req.query;

  try {
    const where = vehicleId ? { vehicleId: Number(vehicleId) } : {};

    const logs = await prisma.routeLog.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { vehicle: true },
    });

    res.json(logs);
  } catch (err) {
    console.error("❌ GET route logs:", err);
    res.status(500).json({ error: "Error obteniendo los registros" });
  }
});

/* =====================================================
   GET /ACTIVE → ÚLTIMO REGISTRO POR VEHÍCULO
===================================================== */
router.get("/active", async (req, res) => {
  try {
    const lastLogs = await prisma.routeLog.groupBy({
      by: ["vehicleId"],
      _max: { id: true },
    });

    const ids = lastLogs.map((l) => l._max.id);

    const logs = await prisma.routeLog.findMany({
      where: { id: { in: ids } },
      include: { vehicle: true },
      orderBy: { startDate: "desc" },
    });

    res.json(logs);
  } catch (err) {
    console.error("❌ Error obteniendo logs activos:", err);
    res.status(500).json({ error: "Error obteniendo logs activos" });
  }
});

/* =====================================================
   CREAR HOJA DE RUTA (INICIO)
===================================================== */
router.post("/", upload.array("imagesStart", 10), async (req, res) => {
  try {
    const { driverName, startMileage, vehicleId, notesStart } = req.body;

    if (!driverName || !startMileage || !vehicleId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const images = (req.files || []).map(
      (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );

    const newLog = await prisma.routeLog.create({
      data: {
        driverName,
        startMileage: Number(startMileage),
        vehicleId: Number(vehicleId),
        notesStart: notesStart || null,
        imagesStart: images,
        startDate: new Date(),
        status: "ACTIVE",
      },
    });

    res.status(201).json(newLog);
  } catch (err) {
    console.error("❌ POST route log:", err);
    res.status(500).json({ error: "Error creando la hoja de ruta" });
  }
});

/* =====================================================
   TRANSFERENCIA / RECEPCIÓN VEHÍCULO
===================================================== */
router.put("/:id/transfer", upload.array("photos", 10), async (req, res) => {
  const { id } = req.params;
  const { receiverName, endMileage, notesEnd } = req.body;

  if (!receiverName || !endMileage) {
    return res.status(400).json({ error: "Datos de recepción incompletos" });
  }

  try {
    const images = (req.files || []).map(
      (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );

    const previous = await prisma.routeLog.update({
      where: { id: Number(id) },
      data: {
        receiverName,
        endMileage: Number(endMileage),
        notesEnd: notesEnd || null,
        endDate: new Date(),
        imagesEnd: { push: images },
        status: "FINISHED",
      },
    });

    // Crear registro nuevo automáticamente
    const newLog = await prisma.routeLog.create({
      data: {
        driverName: receiverName,
        startMileage: Number(endMileage),
        vehicleId: previous.vehicleId,
        notesStart: "Registro creado automáticamente tras recepción.",
        startDate: new Date(),
        status: "ACTIVE",
      },
    });

    res.json({ previous, newLog });
  } catch (err) {
    console.error("❌ Error procesando recepción:", err);
    res.status(500).json({ error: "Error procesando recepción" });
  }
});

export default router;

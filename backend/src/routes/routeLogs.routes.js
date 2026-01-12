import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { uploadToR2 } from "../services/r2Client.js";

const prisma = new PrismaClient();
const router = express.Router();

// Usamos memoria para que los archivos estén en req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* GET TODOS O POR VEHÍCULO */
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
   console.error("❌ Error procesando recepción:", err);
    res.status(500).json({
      error: "Error procesando recepción",
      detail: err?.message,
      code: err?.code,
    });

  }
});

/* GET /ACTIVE → ÚLTIMO REGISTRO POR VEHÍCULO */
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

/* CREAR HOJA DE RUTA (INICIO) */
router.post("/", upload.array("imagesStart", 10), async (req, res) => {
  try {
    const { driverName, startMileage, vehicleId, notesStart } = req.body;

    if (!driverName || !startMileage || !vehicleId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Subir imágenes de inicio (si existen)
    const images = [];
    for (const file of req.files || []) {
      const url = await uploadToR2("routelogs/start", file);
      images.push(url);
    }

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

/* TRANSFERENCIA / RECEPCIÓN VEHÍCULO */
router.put("/:id/transfer", upload.array("photos", 10), async (req, res) => {
  const { id } = req.params;
  const { receiverName, endMileage, notesEnd } = req.body;

  if (!receiverName || !endMileage) {
    return res.status(400).json({ error: "Datos de recepción incompletos" });
  }

  try {
    // Subir imágenes de recepción (si existen)
    const images = [];
    for (const file of req.files || []) {
      const url = await uploadToR2("routelogs/end", file);
      images.push(url);
    }

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

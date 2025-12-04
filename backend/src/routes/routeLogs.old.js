// backend/src/routes/routeLogs.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: "uploads/" });

// POST /api/routelogs  (Crear hoja de ruta)
router.post("/", upload.none(), async (req, res) => {
  try {
    const { driverName, startMileage, vehicleId, notes } = req.body;

    const log = await prisma.routeLog.create({
      data: {
        driverName,
        startMileage: Number(startMileage),
        startDate: new Date(),
        vehicleId: Number(vehicleId),
        notes: notes || "",
        status: "IN_USE"
      },
    });

    // actualizar vehículo como EN USO
    await prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data: { status: "IN_USE" }
    });

    res.json({ message: "Hoja de ruta creada correctamente", log });
  } catch (error) {
    console.error("❌ Error creando route log:", error);
    res.status(500).json({ error: "Error creando route log" });
  }
});

// GET /api/routelogs (todos)
router.get("/", async (req, res) => {
  try {
    const logs = await prisma.routeLog.findMany({
      include: { vehicle: true },
      orderBy: { id: "desc" },
    });
    res.json(logs);
  } catch (error) {
    console.error("❌ ERROR en GET /api/routelogs:", error);
    res.status(500).json({ error: "Error obteniendo route logs" });
  }
});

// GET /api/routelogs/vehicle/:vehicleId  (Historial por vehículo)
router.get("/vehicle/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const logs = await prisma.routeLog.findMany({
      where: { vehicleId: Number(vehicleId) },
      orderBy: { id: "desc" },
    });
    res.json(logs);
  } catch (error) {
    console.error("❌ ERROR obteniendo historial:", error);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
});

// PUT /api/routelogs/:id/transfer  (Transferencia)
// Operación en transacción: actualizar antiguo (solo endMileage, endDate, transferTo, status, notes)
// crear nuevo log con driverName = receivedBy y startMileage = endMileage antiguo
router.put("/:id/transfer", upload.none(), async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedBy, endMileage, notes } = req.body;

    const oldLog = await prisma.routeLog.findUnique({ where: { id: Number(id) } });
    if (!oldLog) return res.status(404).json({ error: "Registro no encontrado" });

    const endKm = Number(endMileage);

    const [updatedOld, newLog, updatedVehicle] = await prisma.$transaction([
      prisma.routeLog.update({
        where: { id: Number(id) },
        data: {
          endMileage: endKm,
          endDate: new Date(),
          transferTo: receivedBy,
          status: "TRANSFERRED",
          notes: `${oldLog.notes || ""}\n[Transferencia] ${notes || ""}`.trim()
        }
      }),

      prisma.routeLog.create({
        data: {
          driverName: receivedBy,
          startMileage: endKm,
          startDate: new Date(),
          notes: "",
          vehicleId: oldLog.vehicleId,
          status: "IN_USE"
        }
      }),

      prisma.vehicle.update({
        where: { id: oldLog.vehicleId },
        data: { status: "IN_USE" }
      })
    ]);

    res.json({
      message: "Vehículo traspasado con éxito",
      transferFrom: updatedOld,
      transferTo: newLog,
      vehicle: updatedVehicle
    });

  } catch (error) {
    console.error("❌ ERROR en /transfer:", error);
    res.status(500).json({ error: "Error al traspasar vehículo" });
  }
});

// PUT /api/routelogs/:id/finish  (Entrega final)
router.put("/:id/finish", upload.none(), async (req, res) => {
  try {
    const { id } = req.params;
    const { endMileage, endDate, notes } = req.body;

    const log = await prisma.routeLog.update({
      where: { id: Number(id) },
      data: {
        endMileage: endMileage ? Number(endMileage) : undefined,
        endDate: endDate ? new Date(endDate) : new Date(),
        notes: notes ? notes : undefined,
        status: "RETURNED",
      },
    });

    await prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: "AVAILABLE" }
    });

    res.json(log);
  } catch (error) {
    console.error("❌ ERROR al finalizar route log:", error);
    res.status(500).json({ error: "Error actualizando route log" });
  }
});

export default router;

// backend/src/routes/vehicles.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ======================================================
// GET /api/vehicles  -> lista de vehículos + documentos
// ======================================================
router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { id: "asc" },
      include: {
        documents: true, // 👈 para poder ver documentos en el frontend
      },
    });
    res.json(vehicles);
  } catch (error) {
    console.error("❌ Error obteniendo vehicles:", error);
    res.status(500).json({ error: "Error obteniendo vehicles" });
  }
});

// ======================================================
// POST /api/vehicles -> crear vehículo
// body: { plateNumber, circulationPermitDate, technicalReviewDate, insuranceDate, gasesReviewDate }
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      plateNumber,
      circulationPermitDate,
      technicalReviewDate,
      insuranceDate,
      gasesReviewDate,
    } = req.body;

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber,
        circulationPermitDate: new Date(circulationPermitDate),
        technicalReviewDate: new Date(technicalReviewDate),
        insuranceDate: new Date(insuranceDate),
        gasesReviewDate: new Date(gasesReviewDate),
      },
    });

    res.json(vehicle);
  } catch (error) {
    console.error("❌ Error creando vehicle:", error);
    res.status(500).json({ error: "Error creando vehicle" });
  }
});

// ======================================================
// PUT /api/vehicles/:id/status  -> cambiar SOLO estado
// body: { status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "TRANSFERRED" }
// ======================================================
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["AVAILABLE", "IN_USE", "MAINTENANCE", "TRANSFERRED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json(vehicle);
  } catch (error) {
    console.error("❌ Error actualizando estado de vehicle:", error);
    res.status(500).json({ error: "Error actualizando estado" });
  }
});

// ======================================================
// PUT /api/vehicles/:id  -> actualizar datos del vehículo
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plateNumber,
      circulationPermitDate,
      technicalReviewDate,
      insuranceDate,
      gasesReviewDate,
    } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: {
        plateNumber,
        circulationPermitDate: new Date(circulationPermitDate),
        technicalReviewDate: new Date(technicalReviewDate),
        insuranceDate: new Date(insuranceDate),
        gasesReviewDate: new Date(gasesReviewDate),
      },
    });

    res.json(vehicle);
  } catch (error) {
    console.error("❌ Error actualizando vehicle:", error);
    res.status(500).json({ error: "Error actualizando vehicle" });
  }
});

// ======================================================
// DELETE /api/vehicles/:id -> eliminar vehículo
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.vehicle.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando vehicle:", error);
    res.status(500).json({ error: "Error eliminando vehicle" });
  }
});

export default router;

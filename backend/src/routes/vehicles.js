// backend/src/routes/vehicles.js
import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPrismaKnownError(e) {
  return e instanceof Prisma.PrismaClientKnownRequestError;
}

// ======================================================
// GET /api/vehicles  -> lista de vehículos + documentos
// ======================================================
router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { id: "asc" },
      include: { documents: true },
    });
    return res.json(vehicles);
  } catch (error) {
    console.error("❌ Error obteniendo vehicles:", error);
    return res.status(500).json({ error: "Error obteniendo vehicles" });
  }
});

// ======================================================
// POST /api/vehicles -> crear vehículo
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

    const plate = (plateNumber || "").trim().toUpperCase();
    if (!plate) return res.status(400).json({ error: "plateNumber es obligatorio" });

    const circulation = toDateOrNull(circulationPermitDate);
    const technical = toDateOrNull(technicalReviewDate);
    const insurance = toDateOrNull(insuranceDate);
    const gases = toDateOrNull(gasesReviewDate);

    // Si quieres obligar fechas, cambia a "return 400" cuando falte alguna.
    // Por ahora: si viene inválida -> 400 claro.
    if (circulationPermitDate && !circulation) return res.status(400).json({ error: "circulationPermitDate inválida" });
    if (technicalReviewDate && !technical) return res.status(400).json({ error: "technicalReviewDate inválida" });
    if (insuranceDate && !insurance) return res.status(400).json({ error: "insuranceDate inválida" });
    if (gasesReviewDate && !gases) return res.status(400).json({ error: "gasesReviewDate inválida" });

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: plate,
        circulationPermitDate: circulation,
        technicalReviewDate: technical,
        insuranceDate: insurance,
        gasesReviewDate: gases,
      },
      include: { documents: true },
    });

    return res.status(201).json(vehicle);
  } catch (error) {
    // ✅ Patente duplicada → 409 (no 500)
    if (isPrismaKnownError(error) && error.code === "P2002") {
      return res.status(409).json({ error: "La patente ya existe" });
    }

    console.error("❌ Error creando vehicle:", error);
    return res.status(500).json({ error: "Error creando vehicle" });
  }
});

// ======================================================
// PUT /api/vehicles/:id/status  -> cambiar SOLO estado
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
      include: { documents: true },
    });

    return res.json(vehicle);
  } catch (error) {
    console.error("❌ Error actualizando estado de vehicle:", error);
    return res.status(500).json({ error: "Error actualizando estado" });
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

    const plate = (plateNumber || "").trim().toUpperCase();
    if (!plate) return res.status(400).json({ error: "plateNumber es obligatorio" });

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: {
        plateNumber: plate,
        circulationPermitDate: toDateOrNull(circulationPermitDate),
        technicalReviewDate: toDateOrNull(technicalReviewDate),
        insuranceDate: toDateOrNull(insuranceDate),
        gasesReviewDate: toDateOrNull(gasesReviewDate),
      },
      include: { documents: true },
    });

    return res.json(vehicle);
  } catch (error) {
    if (isPrismaKnownError(error) && error.code === "P2002") {
      return res.status(409).json({ error: "La patente ya existe" });
    }
    console.error("❌ Error actualizando vehicle:", error);
    return res.status(500).json({ error: "Error actualizando vehicle" });
  }
});

// ======================================================
// DELETE /api/vehicles/:id -> eliminar vehículo
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.vehicle.delete({ where: { id: Number(id) } });
    return res.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando vehicle:", error);
    return res.status(500).json({ error: "Error eliminando vehicle" });
  }
});

export default router;

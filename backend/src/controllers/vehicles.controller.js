import prisma from "../services/prisma.service.js";

/**
 * GET /api/vehicles
 */
export const listVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehicles/:id
 */
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (err) {
    console.error("❌ Prisma error en getVehicles:", err);
    res.status(500).json({ error: "Error al obtener vehículos", details: err.message });
  }
};


/**
 * POST /api/vehicles
 */
export const createVehicle = async (req, res, next) => {
  try {
    const {
      plateNumber,
      circulationPermitDate,
      technicalReviewDate,
      insuranceDate,
      gasesReviewDate,
      brand,
      model,
      year,
    } = req.body;

    if (!plateNumber) return res.status(400).json({ error: "plateNumber is required" });

    const created = await prisma.vehicle.create({
      data: {
        plateNumber,
        circulationPermitDate: circulationPermitDate ? new Date(circulationPermitDate) : new Date(),
        technicalReviewDate: technicalReviewDate ? new Date(technicalReviewDate) : new Date(),
        insuranceDate: insuranceDate ? new Date(insuranceDate) : new Date(),
        gasesReviewDate: gasesReviewDate ? new Date(gasesReviewDate) : new Date(),
        // optional fields
        ...(brand ? { brand } : {}),
        ...(model ? { model } : {}),
        ...(year ? { year: Number(year) } : {}),
      }
    });

    res.status(201).json(created);
  } catch (err) {
    // possible unique constraint error on plateNumber
    next(err);
  }
};

/**
 * PUT /api/vehicles/:id
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    // normalize dates if present
    const toUpdate = {};
    if (payload.plateNumber) toUpdate.plateNumber = payload.plateNumber;
    if (payload.circulationPermitDate) toUpdate.circulationPermitDate = new Date(payload.circulationPermitDate);
    if (payload.technicalReviewDate) toUpdate.technicalReviewDate = new Date(payload.technicalReviewDate);
    if (payload.insuranceDate) toUpdate.insuranceDate = new Date(payload.insuranceDate);
    if (payload.gasesReviewDate) toUpdate.gasesReviewDate = new Date(payload.gasesReviewDate);
    if (payload.brand) toUpdate.brand = payload.brand;
    if (payload.model) toUpdate.model = payload.model;
    if (payload.year) toUpdate.year = Number(payload.year);

    const updated = await prisma.vehicle.update({
      where: { id },
      data: toUpdate,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/vehicles/:id
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

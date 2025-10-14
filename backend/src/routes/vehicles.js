import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();


// ejemplo GET de todos los vehículos
router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener vehículos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        patente: req.body.patente, // <--- cambiar aquí
        permisoCirculacion: new Date(req.body.permisoCirculacion),
        revisionTecnica: new Date(req.body.revisionTecnica),
        seguroObligatorio: new Date(req.body.seguroObligatorio),
        revisionGases: new Date(req.body.revisionGases),
        // opcional: brand, model, year si lo agregas al schema
      },
    });
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creando vehículo");
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: {
        patente: req.body.patente, // <--- también aquí
        permisoCirculacion: new Date(req.body.permisoCirculacion),
        revisionTecnica: new Date(req.body.revisionTecnica),
        seguroObligatorio: new Date(req.body.seguroObligatorio),
        revisionGases: new Date(req.body.revisionGases),
      },
    });
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error actualizando vehículo");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Vehículo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando vehículo");
  }
});

export default router;

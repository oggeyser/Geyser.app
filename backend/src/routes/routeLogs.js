import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// Obtener todos los registros de rutas
router.get('/', async (req, res) => {
  try {
    const logs = await prisma.routeLog.findMany({
      include: { vehicle: true },
      orderBy: { id: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo registro
router.post('/', async (req, res) => {
  try {
    const { driverName, vehicleId, origin, destination, distanceKm, notes } = req.body;
    const log = await prisma.routeLog.create({
      data: { driverName, vehicleId: Number(vehicleId), origin, destination, distanceKm, notes },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un registro
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.routeLog.delete({ where: { id } });
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

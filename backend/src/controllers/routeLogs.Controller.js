// backend/src/controllers/routeLogs.controller.js
import { PrismaClient, RouteLogStatus } from "@prisma/client";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

// -------------------------
// Upload setup
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads/routeLogs"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

export const uploadRouteImages = multer({ storage });

/**
 * Crear nuevo registro de ruta (inicio de uso)
 * body: vehicleId, driverName, startMileage, notesStart
 */
export const startRouteLog = async (req, res) => {
  try {
    const { vehicleId, driverName, startMileage, notesStart } = req.body;

    if (!vehicleId || !driverName || !startMileage) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Imágenes iniciales (si hubiese)
    const imagesStart = req.files?.map((f) => `/uploads/routeLogs/${f.filename}`) || [];

    // Creamos el log activo
    const newLog = await prisma.routeLog.create({
      data: {
        vehicle: { connect: { id: Number(vehicleId) } },
        driverName,
        startMileage: Number(startMileage),
        notesStart: notesStart || "",
        imagesStart,
        startDate: new Date(),
        status: RouteLogStatus.ACTIVE,
      },
      include: { vehicle: true },
    });

    // Vehículo pasa a EN USO
    await prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data: {
        status: "IN_USE",
        activeRouteLogId: newLog.id,
      },
    });

    res.json(newLog);
  } catch (err) {
    console.error("❌ Error startRouteLog:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cierre definitivo (vehículo vuelve a disponible / mantenimiento externo)
 * body: endMileage, notesEnd, receiverName
 */
export const endRouteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { endMileage, notesEnd, receiverName } = req.body;

    if (!endMileage) {
      return res.status(400).json({ error: "Kilometraje final requerido" });
    }

    const log = await prisma.routeLog.findUnique({ where: { id: Number(id) } });
    if (!log) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    const kmEnd = Number(endMileage);
    if (kmEnd < log.startMileage) {
      return res.status(400).json({ error: "El KM final no puede ser menor que el inicial." });
    }

    const incomingImages = req.files?.map((f) => `/uploads/routeLogs/${f.filename}`) || [];
    const mergedImages = [...(log.imagesEnd || []), ...incomingImages];

    const updated = await prisma.routeLog.update({
      where: { id: log.id },
      data: {
        endMileage: kmEnd,
        endDate: new Date(),
        notesEnd: notesEnd || "",
        receiverName: receiverName || "",
        imagesEnd: mergedImages,
        status: RouteLogStatus.FINISHED,
        transferTo: null,
      },
    });

    // Vehículo queda disponible (y sin activeRouteLog)
    await prisma.vehicle.update({
      where: { id: log.vehicleId },
      data: {
        status: "AVAILABLE",
        activeRouteLogId: null,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Error endRouteLog:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Transferencia: Conductor A -> Conductor B (vehículo sigue en uso)
 * body: newDriverName, endMileage, notesEnd
 * files: imagesEnd
 */
export const transferRouteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDriverName, endMileage, notesEnd } = req.body;

    if (!newDriverName || !endMileage) {
      return res
        .status(400)
        .json({ error: "Debes indicar nuevo conductor y kilometraje final." });
    }

    const log = await prisma.routeLog.findUnique({ where: { id: Number(id) } });
    if (!log) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    const kmEnd = Number(endMileage);
    if (kmEnd < log.startMileage) {
      return res.status(400).json({ error: "El KM final no puede ser menor que el inicial." });
    }

    const incomingImages = req.files?.map((f) => `/uploads/routeLogs/${f.filename}`) || [];
    const mergedImages = [...(log.imagesEnd || []), ...incomingImages];

    // Transacción: cerrar log viejo + crear log nuevo + actualizar vehículo
    const result = await prisma.$transaction(async (tx) => {
      // 1) cerrar registro ACTUAL (conductor A)
      const oldLog = await tx.routeLog.update({
        where: { id: log.id },
        data: {
          endMileage: kmEnd,
          endDate: new Date(),
          notesEnd: notesEnd || "",
          imagesEnd: mergedImages,
          receiverName: newDriverName,
          status: RouteLogStatus.TRANSFERRED,
          transferTo: newDriverName,
        },
      });

      // 2) crear NUEVO registro activo (conductor B)
      const newLog = await tx.routeLog.create({
        data: {
          vehicleId: oldLog.vehicleId,
          driverName: newDriverName,
          startMileage: kmEnd,
          startDate: new Date(),
          notesStart: "",
          imagesStart: [],
          status: RouteLogStatus.ACTIVE,
        },
      });

      // 3) vehículo sigue EN USO y apunta al nuevo log activo
      await tx.vehicle.update({
        where: { id: oldLog.vehicleId },
        data: {
          status: "IN_USE",
          activeRouteLogId: newLog.id,
        },
      });

      return { oldLog, newLog };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Error transferRouteLog:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Obtener registro ACTIVO actual por vehículo
 */
export const getActiveRouteLog = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Intento 1: usar activeRouteLogId
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(vehicleId) },
      include: { activeRouteLog: true },
    });

    if (vehicle?.activeRouteLog && vehicle.activeRouteLog.status === "ACTIVE") {
      return res.json(vehicle.activeRouteLog);
    }

    // Intento 2: buscar por status ACTIVE
    const log = await prisma.routeLog.findFirst({
      where: {
        vehicleId: Number(vehicleId),
        status: RouteLogStatus.ACTIVE,
      },
      orderBy: { startDate: "desc" },
    });

    if (!log) {
      return res.status(404).json({ error: "No hay registro activo" });
    }

    res.json(log);
  } catch (err) {
    console.error("❌ Error getActiveRouteLog:", err);
    res.status(500).json({ error: err.message });
  }
};

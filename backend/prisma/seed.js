import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Verificamos si ya existe un vehículo con esta patente
  const existing = await prisma.vehicle.findUnique({
    where: { plateNumber: "ABCD-123" },
  });

  if (!existing) {
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: "ABCD-123",
        brand: "Toyota",
        model: "Hilux",
        year: 2022,
        documents: {
          create: [
            {
              name: "Permiso de Circulación",
              expiryDate: new Date("2026-03-31"),
              fileUrl: "uploads/permiso_circulacion.pdf",
            },
            {
              name: "Seguro Obligatorio",
              expiryDate: new Date("2025-12-31"),
              fileUrl: "uploads/seguro_obligatorio.pdf",
            },
          ],
        },
      },
      include: { documents: true },
    });

    console.log("Vehículo y documentos creados:", vehicle);
  } else {
    console.log("Ya existe un vehículo con esa patente, no se agregó otro.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Error al ejecutar seed:", e);
    prisma.$disconnect();
  });

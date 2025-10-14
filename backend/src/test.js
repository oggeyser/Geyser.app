import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: "ABCD-123",
      brand: "Toyota",
      model: "Hilux",
      year: 2022
    }
  });

  console.log("Vehículo creado:", vehicle);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });

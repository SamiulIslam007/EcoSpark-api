import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      { name: "Energy" },
      { name: "Waste" },
      { name: "Transportation" },
      { name: "Water" },
      { name: "Agriculture" },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded categories");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing finished goods inventory transactions and inventory records...');

  // Remove finished goods transactions
  await prisma.$executeRaw`DELETE FROM inventory_txn WHERE product_id IS NOT NULL`;

  // Remove finished goods inventory records
  await prisma.$executeRaw`
    DELETE FROM inventory
    WHERE product_id IS NOT NULL
  `;

  console.log('Finished goods history cleared.');
}

main()
  .catch((error) => {
    console.error('Failed to clear finished goods history:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


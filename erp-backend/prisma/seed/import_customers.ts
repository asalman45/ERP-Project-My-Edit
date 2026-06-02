import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importCustomers() {
  const csvFilePath = path.resolve(__dirname, '../../customers_master.csv');
  const results: any[] = [];

  console.log(`📖 Reading CSV from: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    process.exit(1);
  }

  fs.createReadStream(csvFilePath)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`✅ Read ${results.length} rows from CSV.`);

      for (const row of results) {
        const { name, ntn_number, gst_number, address, email, phone } = row;

        if (!name) {
          console.warn(`⚠️ Skipping row with missing name: ${JSON.stringify(row)}`);
          continue;
        }

        try {
          // Check if customer already exists by name
          const existingCustomer = await prisma.customer.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
          });

          if (existingCustomer) {
            console.log(`ℹ️ Customer "${name}" already exists. Updating records...`);
            await prisma.customer.update({
              where: { customer_id: existingCustomer.customer_id },
              data: {
                ntn: ntn_number || null,
                strn: gst_number || null,
                address: address || null,
                email: email || null,
                phone: phone || null,
              }
            });
            console.log(`✅ Updated: ${name}`);
          } else {
            const newCustomer = await prisma.customer.create({
              data: {
                name: name,
                ntn: ntn_number || null,
                strn: gst_number || null,
                address: address || null,
                email: email || null,
                phone: phone || null,
                // Generate a code if required, but schema says it's optional
                customer_code: name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
              }
            });
            console.log(`✨ Created: ${name} (ID: ${newCustomer.customer_id})`);
          }
        } catch (error) {
          console.error(`❌ Failed to process customer "${name}":`, error);
        }
      }

      await prisma.$disconnect();
      console.log('🏁 Customer import completed.');
    });
}

importCustomers().catch((e) => {
  console.error('💥 Fatal error during customer import:', e);
  process.exit(1);
});

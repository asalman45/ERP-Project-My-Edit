
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SR Tank 2 Master Data...');

  // 1. UOMs
  const pcs = await prisma.uOM.upsert({
    where: { code: 'PCS' },
    update: {},
    create: { code: 'PCS', name: 'Pieces' }
  });

  const kg = await prisma.uOM.upsert({
    where: { code: 'KG' },
    update: {},
    create: { code: 'KG', name: 'Kilograms' }
  });

  // 2. OEM & Model
  const oem = await prisma.oEM.upsert({
    where: { oem_name: 'Toyota Indus' },
    update: {},
    create: { oem_name: 'Toyota Indus' }
  });

  const model = await prisma.model.upsert({
    where: { oem_id_model_name: { oem_id: oem.oem_id, model_name: 'Hilux' } },
    update: {},
    create: { oem_id: oem.oem_id, model_name: 'Hilux', model_year: '2024' }
  });

  // 3. Customer
  const customer = await prisma.$queryRaw`
    INSERT INTO customer (customer_id, customer_code, code, company_name, contact_person, email)
    VALUES (gen_random_uuid(), 'IMC-001', 'IMC-001', 'Indus Motor Company', 'Mr. Ali', 'ali@toyota-indus.com')
    ON CONFLICT (customer_code) DO UPDATE SET company_name = EXCLUDED.company_name
    RETURNING customer_id;
  `;
  const customerId = customer[0].customer_id;

  // 4. Product "SR Tank 2" (Already exists but let's ensure it's linked)
  const product = await prisma.product.update({
    where: { product_code: '421' },
    data: {
      oem_id: oem.oem_id,
      model_id: model.model_id,
      uom_id: pcs.uom_id,
      description: 'Fuel Tank for Hilux SR'
    }
  });

  // 5. Materials
  const materialsData = [
    { code: 'HRC-2.0MM', name: 'HRC Steel Sheet 2.0mm', sub: 'Main Shell', qty: 5.5, uom: kg.uom_id },
    { code: 'TUBE-8MM', name: 'Steel Tube 8mm', sub: 'Filler Neck', qty: 0.8, uom: kg.uom_id },
    { code: 'GASKET-RUB', name: 'Rubber Gasket', sub: 'Sender Gasket', qty: 1, uom: pcs.uom_id },
    { code: 'SENDER-UNIT', name: 'Fuel Level Sender', sub: 'Level Sensor', qty: 1, uom: pcs.uom_id },
    { code: 'BAFFLE-PLT', name: 'Baffle Plate', sub: 'Internal Baffles', qty: 2, uom: pcs.uom_id },
    { code: 'BOLT-M6', name: 'M6 Flange Bolt', sub: 'Fasteners', qty: 6, uom: pcs.uom_id },
    { code: 'PAINT-BLK', name: 'Anti-rust Black Paint', sub: 'Coating', qty: 0.5, uom: kg.uom_id }
  ];

  const seededMaterials = [];

  for (const m of materialsData) {
    const material = await prisma.material.upsert({
      where: { material_code: m.code },
      update: {},
      create: {
        material_code: m.code,
        name: m.name,
        category: 'RAW_MATERIAL',
        uom_id: m.uom
      }
    });
    seededMaterials.push({ ...m, id: material.material_id });

    // 6. Inventory (Only stock HRC and Paint initially so MRP triggers for the rest)
    if (m.code === 'HRC-2.0MM' || m.code === 'PAINT-BLK') {
      await prisma.inventory.upsert({
        where: { inventory_id: `initial-inv-${m.code}` },
        update: { quantity: 5000 },
        create: {
          inventory_id: `initial-inv-${m.code}`,
          material_id: material.material_id,
          quantity: 5000,
          status: 'AVAILABLE'
        }
      });
    }

    // 7. BOM
    await prisma.bOM.upsert({
      where: { product_id_material_id_sub_assembly_name: { product_id: product.product_id, material_id: material.material_id, sub_assembly_name: m.sub } },
      update: { quantity: m.qty },
      create: {
        product_id: product.product_id,
        material_id: material.material_id,
        quantity: m.qty,
        sub_assembly_name: m.sub
      }
    });
  }

  // 8. Routing
  await prisma.routing.upsert({
    where: { product_id_step_no: { product_id: product.product_id, step_no: 1 } },
    update: {},
    create: { product_id: product.product_id, step_no: 1, operation: 'Cutting', work_center: 'CUT-001' }
  });

  await prisma.routing.upsert({
    where: { product_id_step_no: { product_id: product.product_id, step_no: 2 } },
    update: {},
    create: { product_id: product.product_id, step_no: 2, operation: 'Welding', work_center: 'WELD-001' }
  });

  await prisma.routing.upsert({
    where: { product_id_step_no: { product_id: product.product_id, step_no: 3 } },
    update: {},
    create: { product_id: product.product_id, step_no: 3, operation: 'Painting', work_center: 'PAINT-001' }
  });

  console.log('✅ SR Tank 2 Master Data Seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

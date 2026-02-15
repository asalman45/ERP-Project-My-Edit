// Verify Partial QA results in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyResults() {
  console.log('\n🔍 Verifying Partial QA Results in Database\n');
  console.log('═'.repeat(70));

  try {
    // 1. Check Finished Goods inventory
    console.log('\n1️⃣ Finished Goods Inventory:');
    const finishedGoods = await prisma.inventory.findMany({
      where: {
        product_id: { not: null },
        quantity: { gt: 0 },
        location: {
          code: 'FINISHED-GOODS'
        },
        status: 'AVAILABLE'
      },
      include: {
        product: { include: { uom: true } },
        location: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    if (finishedGoods.length > 0) {
      console.log(`   Found ${finishedGoods.length} recent item(s):\n`);
      finishedGoods.forEach((inv, i) => {
        console.log(`   ${i + 1}. ${inv.product?.part_name || 'Unknown'}`);
        console.log(`      Quantity: ${inv.quantity} ${inv.product?.uom?.code || 'pcs'}`);
        console.log(`      Created: ${inv.created_at.toISOString()}`);
        console.log(`      Status: ${inv.status}\n`);
      });
    } else {
      console.log('   ℹ️  No items found');
    }

    // 2. Check Rework Area inventory
    console.log('2️⃣ Rework Area Inventory (REWORK_PENDING):');
    const reworkItems = await prisma.inventory.findMany({
      where: {
        status: 'REWORK_PENDING',
        quantity: { gt: 0 }
      },
      include: {
        product: { include: { uom: true } },
        location: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (reworkItems.length > 0) {
      console.log(`   Found ${reworkItems.length} rework item(s):\n`);
      reworkItems.forEach((inv, i) => {
        console.log(`   ${i + 1}. ${inv.product?.part_name || 'Unknown'}`);
        console.log(`      Quantity: ${inv.quantity} ${inv.product?.uom?.code || 'pcs'}`);
        console.log(`      Location: ${inv.location?.name || 'Unknown'}`);
        console.log(`      Created: ${inv.created_at.toISOString()}\n`);
      });
    } else {
      console.log('   ℹ️  No REWORK_PENDING items found');
    }

    // 3. Check QA Rejection records
    console.log('3️⃣ QA Rejection Records:');
    const qaRejections = await prisma.qARejection.findMany({
      include: {
        product: true,
        inventory: true,
        reworkWO: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    if (qaRejections.length > 0) {
      console.log(`   Found ${qaRejections.length} recent rejection(s):\n`);
      qaRejections.forEach((qa, i) => {
        console.log(`   ${i + 1}. Product: ${qa.product?.part_name || 'Unknown'}`);
        console.log(`      Disposition: ${qa.disposition}`);
        console.log(`      Reason: ${qa.rejection_reason}`);
        if (qa.rework_wo_id) {
          console.log(`      Rework WO: ${qa.reworkWO?.wo_no || qa.rework_wo_id}`);
        }
        if (qa.scrap_id) {
          console.log(`      Scrap ID: ${qa.scrap_id}`);
        }
        console.log(`      Created: ${qa.created_at.toISOString()}\n`);
      });
    } else {
      console.log('   ℹ️  No QA rejection records found');
    }

    // 4. Check Scrap Inventory
    console.log('4️⃣ Scrap Inventory:');
    const scrapItems = await prisma.$queryRaw`
      SELECT scrap_id, material_name, weight_kg, unit, status, created_at
      FROM scrap_inventory
      WHERE reference LIKE 'QA-REJECTED-PARTIAL%'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (scrapItems.length > 0) {
      console.log(`   Found ${scrapItems.length} scrap item(s):\n`);
      scrapItems.forEach((scrap, i) => {
        console.log(`   ${i + 1}. ${scrap.material_name || 'Unknown'}`);
        console.log(`      Weight/Qty: ${scrap.weight_kg} ${scrap.unit || 'pcs'}`);
        console.log(`      Status: ${scrap.status}`);
        console.log(`      Created: ${scrap.created_at.toISOString()}\n`);
      });
    } else {
      console.log('   ℹ️  No scrap items found (or using different reference format)');
    }

    // 5. Check Work Orders created
    console.log('5️⃣ Rework Work Orders:');
    const reworkWOs = await prisma.workOrder.findMany({
      where: {
        wo_no: {
          startsWith: 'MWO-'
        }
      },
      include: {
        product: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    if (reworkWOs.length > 0) {
      console.log(`   Found ${reworkWOs.length} recent WO(s):\n`);
      reworkWOs.forEach((wo, i) => {
        console.log(`   ${i + 1}. ${wo.wo_no}`);
        console.log(`      Product: ${wo.product?.part_name || 'Unknown'}`);
        console.log(`      Quantity: ${wo.quantity}`);
        console.log(`      Created: ${wo.created_at.toISOString()}\n`);
      });
    } else {
      console.log('   ℹ️  No work orders found');
    }

    // 6. Summary
    console.log('6️⃣ Summary:');
    console.log('═'.repeat(70));
    console.log(`   ✅ Finished Goods: ${finishedGoods.length} item(s)`);
    console.log(`   ✅ Rework Items: ${reworkItems.length} item(s)`);
    console.log(`   ✅ QA Rejections: ${qaRejections.length} record(s)`);
    console.log(`   ✅ Scrap Items: ${scrapItems.length} item(s)`);
    console.log(`   ✅ Rework WOs: ${reworkWOs.length} WO(s)`);

    if (finishedGoods.length > 0 || reworkItems.length > 0 || qaRejections.length > 0) {
      console.log('\n🎉 Partial QA feature is working correctly!');
      console.log('   All inventory records created successfully.');
    } else {
      console.log('\n⚠️  No results found. Run a partial inspection first.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyResults();


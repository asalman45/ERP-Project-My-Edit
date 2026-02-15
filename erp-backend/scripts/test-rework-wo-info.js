// Test script to check if rework WO gets original WO info
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReworkWOInfo() {
  console.log('\n🧪 Testing Rework WO Info Fetch\n');
  console.log('═'.repeat(70));

  try {
    // 1. Find a recent rework WO
    console.log('\n1️⃣ Finding recent Rework Work Orders...');
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

    if (reworkWOs.length === 0) {
      console.log('❌ No work orders found');
      return;
    }

    console.log(`✅ Found ${reworkWOs.length} recent WO(s):\n`);
    reworkWOs.forEach((wo, i) => {
      console.log(`   ${i + 1}. ${wo.wo_no}`);
      console.log(`      Product: ${wo.product?.part_name || 'Unknown'}`);
      console.log(`      Customer: ${wo.customer || 'N/A'}`);
      console.log(`      Sales Order: ${wo.sales_order_ref || 'N/A'}`);
      console.log(`      Purchase Order: ${wo.purchase_order_ref || 'N/A'}`);
      console.log(`      Created: ${wo.created_at.toISOString()}\n`);
    });

    // 2. Find QA rejections with rework WO
    console.log('2️⃣ Finding QA Rejections with Rework WO...');
    const qaRejections = await prisma.qARejection.findMany({
      where: {
        disposition: 'REWORK',
        rework_wo_id: { not: null }
      },
      include: {
        product: true,
        reworkWO: {
          include: {
            product: true
          }
        },
        inventory: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    if (qaRejections.length > 0) {
      console.log(`✅ Found ${qaRejections.length} rework rejection(s):\n`);
      
      for (const qa of qaRejections) {
        console.log(`   Product: ${qa.product?.part_name || 'Unknown'}`);
        console.log(`   Rework WO: ${qa.reworkWO?.wo_no || qa.rework_wo_id}`);
        console.log(`   Rework WO Customer: ${qa.reworkWO?.customer || 'N/A'}`);
        console.log(`   Rework WO Sales Order: ${qa.reworkWO?.sales_order_ref || 'N/A'}`);
        console.log(`   Rework WO Purchase Order: ${qa.reworkWO?.purchase_order_ref || 'N/A'}`);
        console.log(`   Inventory ID: ${qa.inventory_id}\n`);

        // Try to find original WO
        console.log(`   🔍 Looking for original WO...`);
        
        // Method 1: Via ProductionOrder
        const productionOrder = await prisma.productionOrder.findFirst({
          where: {
            produced_inventory_id: qa.inventory_id
          },
          include: {
            product: true
          }
        });

        if (productionOrder) {
          console.log(`   ✅ Found via ProductionOrder: ${productionOrder.po_no}`);
        } else {
          console.log(`   ❌ Not found via ProductionOrder`);
        }

        // Method 2: Via InventoryTxn (RECEIVE transaction)
        const inventoryTxn = await prisma.inventoryTxn.findFirst({
          where: {
            inventory_id: qa.inventory_id,
            txn_type: 'RECEIVE',  // ✅ Changed to RECEIVE
            wo_id: { not: null }
          },
          include: {
            workOrder: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });

        if (inventoryTxn?.workOrder) {
          console.log(`   ✅ Found via InventoryTxn:`);
          console.log(`      Original WO: ${inventoryTxn.workOrder.wo_no}`);
          console.log(`      Customer: ${inventoryTxn.workOrder.customer || 'N/A'}`);
          console.log(`      Sales Order: ${inventoryTxn.workOrder.sales_order_ref || 'N/A'}`);
          console.log(`      Purchase Order: ${inventoryTxn.workOrder.purchase_order_ref || 'N/A'}`);
          
          // Compare
          console.log(`\n   📊 Comparison:`);
          console.log(`      Original WO Customer: ${inventoryTxn.workOrder.customer || 'N/A'}`);
          console.log(`      Rework WO Customer: ${qa.reworkWO?.customer || 'N/A'}`);
          console.log(`      Match: ${inventoryTxn.workOrder.customer === qa.reworkWO?.customer ? '✅' : '❌'}`);
        } else {
          console.log(`   ❌ Not found via InventoryTxn`);
        }

        console.log('\n');
      }
    } else {
      console.log('ℹ️  No rework rejections found');
    }

    // 3. Check inventory transactions for the inventory
    console.log('3️⃣ Checking Inventory Transactions...');
    if (qaRejections.length > 0) {
      const testInventoryId = qaRejections[0].inventory_id;
      const allTxns = await prisma.inventoryTxn.findMany({
        where: {
          inventory_id: testInventoryId
        },
        include: {
          workOrder: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`   Found ${allTxns.length} transaction(s) for inventory ${testInventoryId}:`);
      allTxns.forEach((txn, i) => {
        console.log(`   ${i + 1}. Type: ${txn.txn_type}, WO: ${txn.workOrder?.wo_no || 'N/A'}, Date: ${txn.created_at.toISOString()}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testReworkWOInfo();


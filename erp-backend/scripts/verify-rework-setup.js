// Script to verify REWORK area setup and inventory tracking
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyReworkSetup() {
  console.log('\n🔍 Verifying REWORK Area Setup...\n');

  try {
    // 1. Check if REWORK-AREA location exists
    console.log('1. Checking REWORK-AREA location...');
    const reworkLocation = await prisma.location.findUnique({
      where: { code: 'REWORK-AREA' }
    });
    
    if (reworkLocation) {
      console.log('✅ REWORK-AREA location found:');
      console.log(`   ID: ${reworkLocation.location_id}`);
      console.log(`   Name: ${reworkLocation.name}`);
      console.log(`   Type: ${reworkLocation.type}`);
    } else {
      console.log('⚠️  REWORK-AREA location not found (will be created on first rejection)');
    }

    // 2. Check for any REWORK_PENDING inventory
    console.log('\n2. Checking REWORK_PENDING inventory...');
    const reworkInventory = await prisma.inventory.findMany({
      where: { 
        status: 'REWORK_PENDING'
      },
      include: {
        product: {
          include: {
            uom: true
          }
        },
        location: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (reworkInventory.length > 0) {
      console.log(`✅ Found ${reworkInventory.length} REWORK_PENDING item(s):\n`);
      
      reworkInventory.forEach((inv, index) => {
        console.log(`   ${index + 1}. ${inv.product?.part_name || 'Unknown Product'}`);
        console.log(`      Quantity: ${inv.quantity} ${inv.product?.uom?.code || ''}`);
        console.log(`      Location: ${inv.location?.name || 'Unknown'} (${inv.location?.code || ''})`);
        console.log(`      Batch: ${inv.batch_no || 'N/A'}`);
        console.log(`      Rework WO: ${inv.reference_wo_id || 'Not linked'}`);
        console.log(`      Created: ${inv.created_at.toISOString()}\n`);
      });
    } else {
      console.log('ℹ️  No REWORK_PENDING inventory found (none rejected yet)');
    }

    // 3. Check QA inspection records with REJECTED status
    console.log('\n3. Checking recent QA rejection records...');
    const qaRejections = await prisma.qARejection.findMany({
      where: {
        disposition: {
          in: ['REWORK', 'SCRAP', 'DISPOSAL']
        }
      },
      include: {
        inventory: {
          include: {
            product: true,
            location: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    if (qaRejections.length > 0) {
      console.log(`✅ Found ${qaRejections.length} recent rejection(s):\n`);
      
      qaRejections.forEach((qa, index) => {
        console.log(`   ${index + 1}. Product: ${qa.inventory?.product?.part_name || 'Unknown'}`);
        console.log(`      Disposition: ${qa.disposition || 'Not set'}`);
        console.log(`      Quantity: ${qa.inventory?.quantity || 0}`);
        console.log(`      Location: ${qa.inventory?.location?.name || 'Unknown'}`);
        console.log(`      Rejected by: ${qa.rejected_by || 'Unknown'}`);
        console.log(`      Date: ${qa.created_at?.toISOString() || 'N/A'}\n`);
      });
    } else {
      console.log('ℹ️  No rejection records found yet');
    }

    // 4. Summary of all inventory statuses
    console.log('\n4. Inventory Status Summary:');
    const statusCounts = await prisma.inventory.groupBy({
      by: ['status'],
      _count: {
        inventory_id: true
      },
      _sum: {
        quantity: true
      }
    });

    statusCounts.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.inventory_id} record(s), Total Qty: ${stat._sum.quantity || 0}`);
    });

    // 5. Location inventory summary
    console.log('\n5. Inventory by Location:');
    const locationInventory = await prisma.inventory.groupBy({
      by: ['location_id'],
      where: {
        quantity: {
          gt: 0
        }
      },
      _count: {
        inventory_id: true
      },
      _sum: {
        quantity: true
      }
    });

    for (const locInv of locationInventory) {
      const location = await prisma.location.findUnique({
        where: { location_id: locInv.location_id }
      });
      console.log(`   ${location?.name || 'Unknown'} (${location?.code || ''}): ${locInv._count.inventory_id} item(s), Total Qty: ${locInv._sum.quantity || 0}`);
    }

    console.log('\n✅ Verification complete!\n');
    console.log('📋 Summary:');
    console.log('   - REWORK-AREA location: ' + (reworkLocation ? '✅ Ready' : '⚠️ Will be created on first use'));
    console.log('   - REWORK_PENDING inventory: ' + (reworkInventory.length > 0 ? `✅ ${reworkInventory.length} item(s)` : 'ℹ️ None yet'));
    console.log('   - QA rejections: ' + (qaRejections.length > 0 ? `✅ ${qaRejections.length} record(s)` : 'ℹ️ None yet'));

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyReworkSetup();


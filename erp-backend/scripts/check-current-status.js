// Check current database and code status without making changes
import pkg from 'pg';
const { Client } = pkg;
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  console.log('🔍 Checking Current Status (No Changes)\n');

  try {
    // 1. Check database enum
    console.log('1. Database InventoryStatus Enum Values:');
    const enumResult = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'InventoryStatus'
      ORDER BY e.enumsortorder;
    `;
    
    const hasReworkPending = enumResult.some(r => r.enumlabel === 'REWORK_PENDING');
    enumResult.forEach((row, index) => {
      const marker = row.enumlabel === 'REWORK_PENDING' ? ' ⬅️ NEW' : '';
      console.log(`   ${index + 1}. ${row.enumlabel}${marker}`);
    });
    console.log(`   Database has REWORK_PENDING: ${hasReworkPending ? '✅ YES' : '❌ NO'}\n`);

    // 2. Check schema.prisma
    console.log('2. Checking schema.prisma file...');
    const { readFileSync } = await import('fs');
    const schemaContent = readFileSync('prisma/schema.prisma', 'utf-8');
    const schemaHasReworkPending = schemaContent.includes('REWORK_PENDING');
    console.log(`   Schema has REWORK_PENDING: ${schemaHasReworkPending ? '✅ YES' : '❌ NO'}\n`);

    // 3. Check controller code
    console.log('3. Checking qualityAssurance.controller.js...');
    const controllerContent = readFileSync('src/controllers/api/qualityAssurance.controller.js', 'utf-8');
    const codeUsesReworkPending = controllerContent.includes("status: 'REWORK_PENDING'");
    const codeUsesReworkArea = controllerContent.includes("'REWORK-AREA'");
    console.log(`   Code uses REWORK_PENDING status: ${codeUsesReworkPending ? '✅ YES' : '❌ NO'}`);
    console.log(`   Code uses REWORK-AREA location: ${codeUsesReworkArea ? '✅ YES' : '❌ NO'}\n`);

    // 4. Check existing inventory with QUARANTINE status
    console.log('4. Checking existing QUARANTINE inventory (alternative status)...');
    const quarantineCount = await prisma.inventory.count({
      where: { status: 'QUARANTINE' }
    });
    console.log(`   Records with QUARANTINE status: ${quarantineCount}\n`);

    // 5. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:\n');
    
    if (hasReworkPending && schemaHasReworkPending && codeUsesReworkPending) {
      console.log('✅ Everything is aligned - REWORK_PENDING is ready to use');
    } else if (!hasReworkPending && !schemaHasReworkPending && !codeUsesReworkPending) {
      console.log('ℹ️  System uses existing statuses only (no REWORK_PENDING)');
      console.log('   Current approach: Use QUARANTINE for rejected items');
    } else {
      console.log('⚠️  MISMATCH DETECTED:\n');
      console.log(`   Database has REWORK_PENDING: ${hasReworkPending ? '✅' : '❌'}`);
      console.log(`   Schema has REWORK_PENDING: ${schemaHasReworkPending ? '✅' : '❌'}`);
      console.log(`   Code uses REWORK_PENDING: ${codeUsesReworkPending ? '✅' : '❌'}\n`);
      
      if (codeUsesReworkPending && !schemaHasReworkPending) {
        console.log('🔧 SOLUTION OPTIONS:\n');
        console.log('   Option 1: Use existing QUARANTINE status instead');
        console.log('   Option 2: Add REWORK_PENDING to schema and database');
        console.log('\n   Recommendation: Option 1 (simpler, no schema changes)');
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();


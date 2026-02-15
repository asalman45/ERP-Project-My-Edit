import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  await prisma.stockLedger.deleteMany();
  await prisma.scrapTransaction.deleteMany();
  await prisma.scrapInventory.deleteMany();
  await prisma.blankSpec.deleteMany();
  await prisma.productionMaterialUsage.deleteMany();
  await prisma.productionStep.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.wastage.deleteMany();
  await prisma.workOrderStep.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.inventoryTxn.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.bOM.deleteMany();
  await prisma.routing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.material.deleteMany();
  await prisma.model.deleteMany();
  await prisma.oEM.deleteMany();
  await prisma.uOM.deleteMany();
  await prisma.location.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.operation.deleteMany();

  // 1. Create UOMs
  console.log('📏 Creating UOMs...');
  const uomPieces = await prisma.uOM.create({
    data: { code: 'PCS', name: 'Pieces' }
  });
  const uomKg = await prisma.uOM.create({
    data: { code: 'KG', name: 'Kilograms' }
  });
  const uomMm = await prisma.uOM.create({
    data: { code: 'MM', name: 'Millimeters' }
  });
  const uomInch = await prisma.uOM.create({
    data: { code: 'INCH', name: 'Inches' }
  });

  // 2. Create OEM
  console.log('🏭 Creating OEM...');
  const ghandharaOem = await prisma.oEM.create({
      data: {
      oem_name: 'Ghandhara Industries Ltd'
    }
  });

  // 3. Create Models
  console.log('🚗 Creating Models...');
  const nmrModel = await prisma.model.create({
      data: {
      oem_id: ghandharaOem.oem_id,
      model_name: 'NMR',
      model_year: '2024'
    }
  });
  const nlrModel = await prisma.model.create({
      data: {
      oem_id: ghandharaOem.oem_id,
      model_name: 'NLR',
      model_year: '2024'
    }
  });
  const nprModel = await prisma.model.create({
      data: {
      oem_id: ghandharaOem.oem_id,
      model_name: 'NPR 71',
      model_year: '2024'
    }
  });
  const fxzModel = await prisma.model.create({
      data: {
      oem_id: ghandharaOem.oem_id,
      model_name: 'FXZ',
      model_year: '2024'
    }
  });

  // 4. Create Materials
  console.log('🔧 Creating Materials...');
  const steelSheet = await prisma.material.create({
      data: {
      material_code: 'STEEL-4X8',
      name: 'Steel Sheet 4x8',
      description: '4x8 Steel Sheet',
        category: 'RAW_MATERIAL',
      uom_id: uomMm.uom_id
      }
  });
  const rubberSheet = await prisma.material.create({
      data: {
      material_code: 'RUBBER-SHEET',
      name: 'Rubber Sheet',
      description: 'Rubber Sheet Material',
        category: 'RAW_MATERIAL',
      uom_id: uomInch.uom_id
      }
  });
  const symentex = await prisma.material.create({
      data: {
      material_code: 'SYMENTEX',
      name: 'Symentex Material',
      description: 'Symentex Composite Material',
        category: 'RAW_MATERIAL',
      uom_id: uomMm.uom_id
    }
  });

  // 5. Create Products (Parts)
  console.log('📦 Creating Products...');
  const bktFuelTank = await prisma.product.create({
      data: {
      product_code: '897384-060M',
      part_name: 'Bkt Fuel Tank',
      description: 'Bucket Fuel Tank Assembly',
      category: 'FINISHED_GOOD',
      oem_id: ghandharaOem.oem_id,
      model_id: nmrModel.model_id,
      uom_id: uomPieces.uom_id,
      standard_cost: 1500.00
    }
  });

  const basePlate = await prisma.product.create({
      data: {
      product_code: '898062-73NM',
      part_name: 'Base Plate',
      description: 'Base Plate Assembly',
      category: 'FINISHED_GOOD',
      oem_id: ghandharaOem.oem_id,
      model_id: nmrModel.model_id,
      uom_id: uomPieces.uom_id,
      standard_cost: 2000.00
    }
  });

  // 6. Create Locations
  console.log('📍 Creating Locations...');
  const rawMaterialStore = await prisma.location.create({
    data: { code: 'RMS', name: 'Raw Material Store', type: 'STORAGE' }
  });
  const productionFloor = await prisma.location.create({
    data: { code: 'PF', name: 'Production Floor', type: 'PRODUCTION' }
  });
  const finishedGoodsStore = await prisma.location.create({
    data: { code: 'FGS', name: 'Finished Goods Store', type: 'STORAGE' }
  });
  const scrapYard = await prisma.location.create({
    data: { code: 'SY', name: 'Scrap Yard', type: 'SCRAP' }
  });

  // 7. Create Work Centers
  console.log('🏭 Creating Work Centers...');
  const cuttingCenter = await prisma.workCenter.create({
    data: { code: 'CUT-001', name: 'Cutting Center', description: 'Shearing and Cutting Operations' }
  });
  const formingCenter = await prisma.workCenter.create({
    data: { code: 'FORM-001', name: 'Forming Center', description: 'Metal Forming Operations' }
  });
  const drillingCenter = await prisma.workCenter.create({
    data: { code: 'DRILL-001', name: 'Drilling Center', description: 'Drilling and Piercing Operations' }
  });
  const cleaningCenter = await prisma.workCenter.create({
    data: { code: 'CLEAN-001', name: 'Cleaning Center', description: 'Cleaning and Preparation' }
  });
  const paintingCenter = await prisma.workCenter.create({
    data: { code: 'PAINT-001', name: 'Painting Center', description: 'Painting Operations' }
  });
  const assemblyCenter = await prisma.workCenter.create({
    data: { code: 'ASSY-001', name: 'Assembly Center', description: 'Final Assembly Operations' }
  });

  // 8. Create Operations
  console.log('⚙️ Creating Operations...');
  const operations = [
    { code: 'CUT', name: 'Cutting/Shearing', description: 'Cutting and shearing operations' },
    { code: 'FORM', name: 'Forming', description: 'Metal forming operations' },
    { code: 'DRILL1', name: 'Piercing 1', description: 'Initial piercing operations' },
    { code: 'DRILL2', name: 'Piercing 2', description: 'Secondary piercing operations' },
    { code: 'CLEAN', name: 'Cleaning', description: 'Cleaning and preparation' },
    { code: 'PAINT', name: 'Painting', description: 'Painting operations' },
    { code: 'ASSY', name: 'Assembly', description: 'Assembly operations' },
    { code: 'WELD', name: 'Welding', description: 'Welding operations' },
    { code: 'RUBBER', name: 'Rubber Assembly', description: 'Rubber component assembly' }
  ];

  const createdOperations = {};
  for (const op of operations) {
    const operation = await prisma.operation.create({ data: op });
    createdOperations[op.code] = operation;
  }

  // 9. Create Routings (Process Flow)
  console.log('🔄 Creating Routings...');
  
  // Bkt Fuel Tank Routing
  const bktFuelTankRouting = [
    { step_no: 1, operation: 'Cutting/Shearing', work_center: cuttingCenter.code, duration: 30 },
    { step_no: 2, operation: 'Forming', work_center: formingCenter.code, duration: 45 },
    { step_no: 3, operation: 'Piercing 1', work_center: drillingCenter.code, duration: 20 },
    { step_no: 4, operation: 'Piercing 2', work_center: drillingCenter.code, duration: 25 },
    { step_no: 5, operation: 'Cleaning', work_center: cleaningCenter.code, duration: 15 },
    { step_no: 6, operation: 'Welding', work_center: assemblyCenter.code, duration: 35 },
    { step_no: 7, operation: 'Painting', work_center: paintingCenter.code, duration: 40 },
    { step_no: 8, operation: 'Assembly', work_center: assemblyCenter.code, duration: 30 },
    { step_no: 9, operation: 'Painting', work_center: paintingCenter.code, duration: 25 },
    { step_no: 10, operation: 'Rubber Assembly', work_center: assemblyCenter.code, duration: 20 },
    { step_no: 11, operation: 'Assembly', work_center: assemblyCenter.code, duration: 15 }
  ];

  for (const routing of bktFuelTankRouting) {
    await prisma.routing.create({
      data: {
        product_id: bktFuelTank.product_id,
        step_no: routing.step_no,
        operation: routing.operation,
        work_center: routing.work_center,
        duration: routing.duration,
        cost_rate: 50.00
      }
    });
  }

  // Base Plate Routing
  const basePlateRouting = [
    { step_no: 1, operation: 'Cutting/Shearing', work_center: cuttingCenter.code, duration: 35 },
    { step_no: 2, operation: 'Forming', work_center: formingCenter.code, duration: 50 },
    { step_no: 3, operation: 'Piercing 1', work_center: drillingCenter.code, duration: 25 },
    { step_no: 4, operation: 'Piercing 2', work_center: drillingCenter.code, duration: 30 },
    { step_no: 5, operation: 'Cleaning', work_center: cleaningCenter.code, duration: 20 },
    { step_no: 6, operation: 'Welding', work_center: assemblyCenter.code, duration: 40 },
    { step_no: 7, operation: 'Painting', work_center: paintingCenter.code, duration: 45 },
    { step_no: 8, operation: 'Assembly', work_center: assemblyCenter.code, duration: 35 },
    { step_no: 9, operation: 'Painting', work_center: paintingCenter.code, duration: 30 },
    { step_no: 10, operation: 'Rubber Assembly', work_center: assemblyCenter.code, duration: 25 },
    { step_no: 11, operation: 'Assembly', work_center: assemblyCenter.code, duration: 20 }
  ];

  for (const routing of basePlateRouting) {
    await prisma.routing.create({
      data: {
        product_id: basePlate.product_id,
        step_no: routing.step_no,
        operation: routing.operation,
        work_center: routing.work_center,
        duration: routing.duration,
        cost_rate: 50.00
      }
    });
  }

  // 10. Create BOMs (Bill of Materials)
  console.log('📋 Creating BOMs...');
  
  // Bkt Fuel Tank BOM
  await prisma.bOM.create({
      data: {
      product_id: bktFuelTank.product_id,
      material_id: steelSheet.material_id,
      quantity: 2.54 // Weight from image
    }
  });

  // Base Plate BOM
  await prisma.bOM.create({
      data: {
      product_id: basePlate.product_id,
      material_id: steelSheet.material_id,
      quantity: 3.81 // Weight from image
    }
  });

  // 11. Create Blank Specifications
  console.log('📐 Creating Blank Specifications...');
  
  // Bkt Fuel Tank Blank Spec
  await prisma.blankSpec.create({
      data: {
      product_id: bktFuelTank.product_id,
      width_mm: 170,
      length_mm: 760,
      thickness_mm: 3,
      blank_weight_kg: 2.54,
      pcs_per_sheet: 21,
      sheet_util_pct: 91,
      sheet_type: '4x8',
      sheet_weight_kg: 58.42,
      created_by: 'system'
    }
  });

  // Base Plate Main Blank Spec
  await prisma.blankSpec.create({
      data: {
      product_id: basePlate.product_id,
      width_mm: 240,
      length_mm: 1010,
      thickness_mm: 2,
      blank_weight_kg: 3.81,
      pcs_per_sheet: 11,
      sheet_util_pct: 90,
      sheet_type: '4x8',
      sheet_weight_kg: 46.74,
      created_by: 'system'
    }
  });

  // Base Plate Sides Blank Spec
  await prisma.blankSpec.create({
      data: {
      product_id: basePlate.product_id,
      width_mm: 90,
      length_mm: 90,
      thickness_mm: 3,
      blank_weight_kg: 0.19,
      pcs_per_sheet: 351,
      sheet_util_pct: 96,
      sheet_type: '4x8',
      sheet_weight_kg: 70.10,
      created_by: 'system'
    }
  });

  // 12. Create Initial Inventory
  console.log('📦 Creating Initial Inventory...');
  
  // Steel Sheet Inventory
  await prisma.inventory.create({
      data: {
      material_id: steelSheet.material_id,
      quantity: 100, // 100 sheets
      location_id: rawMaterialStore.location_id,
      batch_no: 'STEEL-001',
      uom_id: uomPieces.uom_id,
      status: 'AVAILABLE'
    }
  });

  // Rubber Sheet Inventory
  await prisma.inventory.create({
      data: {
      material_id: rubberSheet.material_id,
      quantity: 50, // 50 sheets
      location_id: rawMaterialStore.location_id,
      batch_no: 'RUBBER-001',
      uom_id: uomPieces.uom_id,
      status: 'AVAILABLE'
    }
  });

  // 13. Create Work Orders
  console.log('📋 Creating Work Orders...');
  
  const workOrder1 = await prisma.workOrder.create({
      data: {
      wo_no: 'WO-2024-001',
      product_id: bktFuelTank.product_id,
      quantity: 53, // Total blanks from image
      uom_id: uomPieces.uom_id,
        priority: 1,
        status: 'PLANNED',
        created_by: 'system'
      }
  });

  const workOrder2 = await prisma.workOrder.create({
      data: {
      wo_no: 'WO-2024-002',
      product_id: basePlate.product_id,
      quantity: 42, // Total blanks from image
      uom_id: uomPieces.uom_id,
      priority: 1,
        status: 'PLANNED',
        created_by: 'system'
      }
  });

  // 14. Create Work Order Steps
  console.log('⚙️ Creating Work Order Steps...');
  
  // Work Order 1 Steps
  const bktRoutingSteps = await prisma.routing.findMany({
    where: { product_id: bktFuelTank.product_id },
    orderBy: { step_no: 'asc' }
  });

  for (const routing of bktRoutingSteps) {
    await prisma.workOrderStep.create({
      data: {
        wo_id: workOrder1.wo_id,
        step_no: routing.step_no,
        routing_id: routing.routing_id,
        operation: routing.operation,
        work_center: routing.work_center,
        planned_qty: 53,
        status: 'PENDING'
      }
    });
  }

  // Work Order 2 Steps
  const baseRoutingSteps = await prisma.routing.findMany({
    where: { product_id: basePlate.product_id },
    orderBy: { step_no: 'asc' }
  });

  for (const routing of baseRoutingSteps) {
    await prisma.workOrderStep.create({
      data: {
        wo_id: workOrder2.wo_id,
        step_no: routing.step_no,
        routing_id: routing.routing_id,
        operation: routing.operation,
        work_center: routing.work_center,
        planned_qty: 42,
        status: 'PENDING'
      }
    });
  }

  // 15. Create Production Orders
  console.log('🏭 Creating Production Orders...');
  
  const productionOrder1 = await prisma.productionOrder.create({
      data: {
      po_no: 'PO-2024-001',
      product_id: bktFuelTank.product_id,
      qty_ordered: 53,
      uom_id: uomPieces.uom_id,
      priority: 1,
      status: 'PLANNED',
        created_by: 'system'
      }
  });

  const productionOrder2 = await prisma.productionOrder.create({
      data: {
      po_no: 'PO-2024-002',
      product_id: basePlate.product_id,
      qty_ordered: 42,
      uom_id: uomPieces.uom_id,
        priority: 1,
        status: 'PLANNED',
        created_by: 'system'
      }
  });

  // 16. Create Production Steps
  console.log('⚙️ Creating Production Steps...');

  for (const routing of bktRoutingSteps) {
    await prisma.productionStep.create({
      data: {
        production_id: productionOrder1.po_id,
        step_no: routing.step_no,
        operation: routing.operation,
        planned_qty: 53,
        status: 'PENDING'
      }
    });
  }

  for (const routing of baseRoutingSteps) {
    await prisma.productionStep.create({
      data: {
        production_id: productionOrder2.po_id,
        step_no: routing.step_no,
        operation: routing.operation,
        planned_qty: 42,
        status: 'PENDING'
      }
    });
  }

  // 17. Create Production Material Usage
  console.log('🔧 Creating Production Material Usage...');
  
  await prisma.productionMaterialUsage.create({
      data: {
      production_id: productionOrder1.po_id,
      material_id: steelSheet.material_id,
      qty_required: 134.62, // 53 * 2.54
      uom_id: uomKg.uom_id
    }
  });

  await prisma.productionMaterialUsage.create({
      data: {
      production_id: productionOrder2.po_id,
      material_id: steelSheet.material_id,
      qty_required: 160.02, // 42 * 3.81
      uom_id: uomKg.uom_id
    }
  });

  // 18. Create Sample Scrap Inventory (from manufacturing process)
  console.log('♻️ Creating Scrap Inventory...');
  
  await prisma.scrapInventory.create({
      data: {
      blank_id: (await prisma.blankSpec.findFirst({ where: { product_id: bktFuelTank.product_id } })).blank_id,
      material_id: steelSheet.material_id,
      width_mm: 50,
      length_mm: 100,
      thickness_mm: 3,
      weight_kg: 1.2,
      location_id: scrapYard.location_id,
      status: 'AVAILABLE',
      reference: 'WO-2024-001',
        created_by: 'system'
      }
  });

  await prisma.scrapInventory.create({
      data: {
      blank_id: (await prisma.blankSpec.findFirst({ where: { product_id: basePlate.product_id } })).blank_id,
      material_id: steelSheet.material_id,
      width_mm: 30,
      length_mm: 80,
      thickness_mm: 2,
      weight_kg: 0.8,
      location_id: scrapYard.location_id,
      status: 'AVAILABLE',
      reference: 'WO-2024-002',
        created_by: 'system'
      }
  });

  // 19. Create Sample Wastage Records
  console.log('⚠️ Creating Wastage Records...');
  
  const firstStep1 = await prisma.workOrderStep.findFirst({ 
    where: { wo_id: workOrder1.wo_id },
    orderBy: { step_no: 'asc' }
  });

  const firstStep2 = await prisma.workOrderStep.findFirst({ 
    where: { wo_id: workOrder2.wo_id },
    orderBy: { step_no: 'asc' }
  });

  await prisma.wastage.create({
    data: {
      wo_id: workOrder1.wo_id,
      step_id: firstStep1.step_id,
      material_id: steelSheet.material_id,
      quantity: 0.5,
      uom_id: uomKg.uom_id,
      location_id: productionFloor.location_id,
      reason: 'Cutting waste during shearing operation'
    }
  });

  await prisma.wastage.create({
    data: {
      wo_id: workOrder2.wo_id,
      step_id: firstStep2.step_id,
      material_id: steelSheet.material_id,
      quantity: 0.3,
      uom_id: uomKg.uom_id,
      location_id: productionFloor.location_id,
      reason: 'Forming waste during bending operation'
    }
  });

  console.log('✅ Seed process completed successfully!');
  console.log('\n📊 Summary of created data:');
  console.log('- OEMs: 1 (Ghandhara Industries Ltd)');
  console.log('- Models: 4 (NMR, NLR, NPR 71, FXZ)');
  console.log('- Products: 2 (Bkt Fuel Tank, Base Plate)');
  console.log('- Materials: 3 (Steel Sheet, Rubber Sheet, Symentex)');
  console.log('- Locations: 4 (Raw Material Store, Production Floor, etc.)');
  console.log('- Work Centers: 6 (Cutting, Forming, Drilling, etc.)');
  console.log('- Operations: 9 (Cutting/Shearing, Forming, etc.)');
  console.log('- Routings: 22 steps (11 per product)');
  console.log('- Work Orders: 2');
  console.log('- Production Orders: 2');
  console.log('- Blank Specifications: 3');
  console.log('- Scrap Inventory: 2 items');
  console.log('- Wastage Records: 2');
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
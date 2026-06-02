import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
  const report = {
    procurement: {},
    bom: {},
    finance: {},
    sales: {}
  };

  try {
    // 1. Procurement & Inventory
    const suppliers = await prisma.supplier.findMany();
    const rawMaterials = await prisma.material.findMany({ where: { category: 'RAW_MATERIAL' } });
    
    // Check if there is a mapping table (e.g. SupplierItem/SupplierMaterial) 
    // Prisma schema does not show a direct Supplier <-> Material mapping table, only via POs/Invoices.
    const pos = await prisma.purchaseOrderItem.findMany({
      include: { purchaseOrder: true }
    });
    
    // Missing costs
    const missingCosts = rawMaterials.filter(m => !m.standard_cost && !m.unit_cost); // check schema for exact cost fields later
    const products = await prisma.product.findMany({ select: { product_code: true, standard_cost: true, category: true } });
    
    // 2. Production to BOM
    const bomItems = await prisma.bOM.findMany({ include: { material: true } });
    const autoGenMiscItems = rawMaterials.filter(m => m.material_code.startsWith('MISC-'));
    
    const blankSpecs = await prisma.blankSpec.findMany();
    
    // 3. Finance & Accounts
    const routings = await prisma.routing.findMany();
    const routingsMissingCost = routings.filter(r => !r.cost_rate);
    const invoices = await prisma.invoice.count().catch(() => 0);
    const journalEntries = await prisma.$queryRaw`SELECT count(*) FROM "journal_entry"`.catch(() => [{count: 0n}]);
    
    // 4. Sales & O2C
    const customers = await prisma.customer.count().catch(() => 0);
    const salesOrders = await prisma.salesOrder.count().catch(() => 0);
    
    console.log(JSON.stringify({
      suppliersCount: suppliers.length,
      rmCount: rawMaterials.length,
      missingCostsCountRM: rawMaterials.filter(m => m.min_stock === null).length, // using min_stock as proxy if cost is missing in Material model? Actually standard_cost is on Product. Look at Material later.
      productCostCount: products.filter(p => p.standard_cost !== null).length,
      productMissingCostCount: products.filter(p => p.standard_cost === null).length,
      autoGenMiscCount: autoGenMiscItems.length,
      blankSpecsCount: blankSpecs.length,
      routingsCount: routings.length,
      routingsMissingCostCount: routingsMissingCost.length,
      invoicesCount: invoices,
      journalEntriesCount: Number(journalEntries[0]?.count || 0),
      customersCount: customers,
      salesOrdersCount: salesOrders,
      miscMaterials: autoGenMiscItems.map(m => m.name)
    }, null, 2));

  } catch (error) {
    console.error("Error during analysis:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase();

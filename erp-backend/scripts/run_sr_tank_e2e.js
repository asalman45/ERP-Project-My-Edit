
import db from '../src/utils/db.js';
import { logger } from '../src/utils/logger.js';
import * as salesOrderModel from '../src/models/salesOrder.model.js';
import * as productionService from '../src/services/productionExecutionService.js';
import * as dispatchController from '../src/controllers/dispatch.controller.js';
import { v4 as uuidv4 } from 'uuid';

async function runFlow() {
  console.log('🚀 Starting SR Tank 2 End-to-End ERP Flow...');

  try {
    // 0. Cleanup existing data to start fresh
    console.log('🧹 Cleaning up old test data...');
    await db.query("DELETE FROM sales_order WHERE reference_number LIKE 'PO-SR-TANK-%'");
    await db.query("DELETE FROM work_order WHERE sales_order_ref LIKE 'SO-%-PO-SR-TANK-%'");
    await db.query("DELETE FROM dispatch_order WHERE dispatch_no LIKE 'DISP-%'");

    // 1. Get Product and Customer
    const productResult = await db.query("SELECT product_id, product_code FROM product WHERE part_name = 'sr tank2' LIMIT 1");
    if (productResult.rows.length === 0) throw new Error('Product "sr tank2" not found. Run seed first.');
    const product = productResult.rows[0];

    const customerResult = await db.query("SELECT customer_id FROM customer WHERE company_name = 'Indus Motor Company' LIMIT 1");
    if (customerResult.rows.length === 0) throw new Error('Customer "Indus Motor Company" not found. Run seed first.');
    const customer = customerResult.rows[0];

    // 2. Create Sales Order (Stage 1 & 2)
    const poNum = `PO-SR-TANK-${Date.now().toString().slice(-6)}`;
    console.log(`📝 Creating Sales Order with PO: ${poNum}...`);
    const soData = {
      customer_id: customer.customer_id,
      reference_number: poNum,
      required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [{
        item_code: product.product_code,
        item_name: 'sr tank2',
        quantity: 10,
        unit_price: 25000,
        production_required: true
      }]
    };
    const salesOrder = await salesOrderModel.createSalesOrder(soData);
    const soId = salesOrder.sales_order_id;
    console.log(`✅ Sales Order Created: ${salesOrder.order_number} (ID: ${soId})`);

    // 3. Approve Sales Order (Stage 3)
    console.log('👍 Approving Sales Order...');
    await salesOrderModel.updateSalesOrderStatus(soId, 'APPROVED', 'system');
    console.log('✅ Sales Order Approved (Inventory Auto-Allocated/Shortage Tracked)');

    // 4. Procurement Flow (PR -> PO -> GRN) for out-of-stock materials
    console.log('🛒 Checking Material Shortages & Executing Procurement...');
    const bomResult = await db.query(
      `SELECT b.material_id, m.material_code, b.quantity 
       FROM bom b JOIN material m ON b.material_id = m.material_id 
       WHERE b.product_id = $1`, [product.product_id]
    );
    const bomMaterials = bomResult.rows;

    for (const b of bomMaterials) {
      const neededQty = b.quantity * 10;
      const invCheck = await db.query(`SELECT quantity FROM inventory WHERE material_id = $1`, [b.material_id]);

      if (invCheck.rows.length === 0 || invCheck.rows[0].quantity < neededQty) {
        console.log(`   - Shortage detected for ${b.material_code}. Originating Procurement...`);
        const deficit = neededQty - (invCheck.rows.length > 0 ? invCheck.rows[0].quantity : 0);

        // 4a. Create PR
        const prId = uuidv4();
        await db.query(`
          INSERT INTO purchase_requisition (pr_id, pr_no, status, requested_by) 
          VALUES ($1, $2, 'OPEN', 'system')
        `, [prId, `PR-${Date.now().toString().slice(-5)}`]);

        await db.query(`
          INSERT INTO purchase_requisition_item (id, pr_id, material_id, qty_requested) 
          VALUES (gen_random_uuid(), $1, $2, $3)
        `, [prId, b.material_id, deficit + 100]); // order a bit extra

        // 4b. Create PO
        const targetQ = deficit + 100;
        const poId = uuidv4();

        const supplierResult = await db.query("SELECT supplier_id FROM supplier LIMIT 1");
        let supplierId = supplierResult.rows.length > 0 ? supplierResult.rows[0].supplier_id : null;
        if (!supplierId) {
          supplierId = uuidv4();
          await db.query("INSERT INTO supplier (supplier_id, code, name) VALUES ($1, $2, 'Dummy Supplier')", [supplierId, 'SUP-001']);
        }

        await db.query(`
          INSERT INTO purchase_order (po_id, po_no, supplier_id, status, order_date, expected_date, created_by)
          VALUES ($1, $2, $3, 'OPEN', CURRENT_DATE, CURRENT_DATE + interval '3 days', 'system')
        `, [poId, `PO-SUP-${Date.now().toString().slice(-4)}`, supplierId]);

        await db.query(`
          INSERT INTO purchase_order_item (po_item_id, po_id, material_id, quantity, unit_price)
          VALUES (gen_random_uuid(), $1, $2, $3, 100)
        `, [poId, b.material_id, targetQ]);

        // 4c. Goods Receipt (GRN) / Stock-In + Stock Ledger (Finance)
        console.log(`     -> Receiving Goods for ${b.material_code}...`);

        const invCheckExisting = await db.query(`SELECT inventory_id, quantity FROM inventory WHERE material_id = $1 AND status = 'AVAILABLE' LIMIT 1`, [b.material_id]);

        let invId;
        if (invCheckExisting.rows.length > 0) {
          invId = invCheckExisting.rows[0].inventory_id;
          await db.query(`UPDATE inventory SET quantity = quantity + $1 WHERE inventory_id = $2`, [targetQ, invId]);
        } else {
          invId = uuidv4();
          await db.query(`
            INSERT INTO inventory (inventory_id, material_id, quantity, status, updated_at)
            VALUES ($1, $2, $3, 'AVAILABLE', CURRENT_TIMESTAMP)
          `, [invId, b.material_id, targetQ]);
        }

        // Finance: Stock Ledger Entry (inventory_txn)
        await db.query(`
          INSERT INTO inventory_txn (txn_id, inventory_id, material_id, txn_type, quantity, po_id, created_by)
          VALUES (gen_random_uuid(), $1, $2, 'RECEIVE', $3, $4, 'system')
        `, [invId, b.material_id, targetQ, poId]);
      }
    }
    console.log('✅ Procurement Complete. All materials in stock.');

    // 5. Convert to Work Orders (Stage 4)
    console.log('🔄 Converting to Work Orders...');
    await salesOrderModel.convertSalesOrderToWorkOrders(soId, 'system');

    // Fetch the WO ID from the DB
    const woDbResult = await db.query("SELECT wo_id, wo_no FROM work_order WHERE sales_order_ref = $1 LIMIT 1", [salesOrder.order_number]);
    if (woDbResult.rows.length === 0) throw new Error("No work order was created for this sales order!");
    const woId = woDbResult.rows[0].wo_id;
    console.log(`✅ Work Order Created: ${woDbResult.rows[0].wo_no} (ID: ${woId})`);

    // 6. Issue FULL BOM Materials (Stage 6)
    console.log('🔧 Issuing Full BOM Materials...');
    const issuePayload = bomMaterials.map(b => ({
      material_id: b.material_id,
      quantity_issued: b.quantity * 10, // 10 units
      material_type: 'COMPONENT',
      unit_cost: 100
    }));

    await productionService.issueMaterialToWorkOrder({
      workOrderId: woId,
      materials: issuePayload,
      issuedBy: 'system'
    });
    console.log('✅ All 7 Materials Issued to Work Order (Inventory Deducted)');

    // 7. Record Production Output (Stage 7 & 8)
    console.log('🏭 Recording Production Output...');
    await productionService.recordProductionOutput({
      workOrderId: woId,
      itemId: product.product_id,
      itemType: 'FINISHED_GOOD',
      itemName: 'sr tank2',
      quantityPlanned: 10,
      quantityGood: 10,
      recordedBy: 'system'
    });
    console.log('✅ Production Output Recorded (Finished Goods added to Inventory)');

    // 8. Complete Work Order (Stage 9)
    console.log('🏁 Completing Work Order...');
    await productionService.completeWorkOrderOperation(woId, 'system');
    console.log('✅ Work Order Completed (Sales Order should now be READY_FOR_DISPATCH)');

    // 9. Create Dispatch (Stage 10)
    console.log('🚚 Creating Dispatch...');
    const dispatchId = uuidv4();
    const dispatchNo = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;

    const client = await db.connect();
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO dispatch_order (dispatch_id, dispatch_no, sales_order_id, customer_id, status, dispatch_date, created_by)
      VALUES ($1, $2, $3, $4, 'DISPATCHED', CURRENT_TIMESTAMP, 'system')
    `, [dispatchId, dispatchNo, String(soId), customer.customer_id]);

    await client.query(`
      INSERT INTO dispatch_item (di_id, dispatch_id, product_id, qty)
      VALUES (gen_random_uuid(), $1, $2, $3)
    `, [dispatchId, product.product_id, 10]);

    await client.query(`UPDATE sales_order_item SET qty_shipped = 10 WHERE sales_order_id = $1`, [soId]);
    await client.query(`UPDATE sales_order SET status = 'DISPATCHED' WHERE sales_order_id = $1`, [soId]);

    await client.query('COMMIT');
    client.release();
    console.log(`✅ Dispatch Record Created: ${dispatchNo}`);

    // 10. Update Dispatch Status to DELIVERED
    console.log('🏁 Updating Dispatch to DELIVERED...');
    const finalClient = await db.connect();
    await finalClient.query('BEGIN');
    await finalClient.query(`UPDATE dispatch_order SET status = 'DELIVERED' WHERE dispatch_id = $1`, [dispatchId]);
    await finalClient.query(`UPDATE sales_order SET status = 'COMPLETED' WHERE sales_order_id = $1`, [soId]);
    await finalClient.query('COMMIT');
    finalClient.release();
    console.log('✅ Dispatch DELIVERED. Sales Order status: COMPLETED');

    // 11. Finance: Create Customer Invoice
    console.log('💰 Generating Customer Invoice and Receivable Ledger...');
    const invoiceId = uuidv4();
    const invoiceNo = `INV-TNK-${Date.now().toString().slice(-6)}`;
    const lineTotal = 10 * 25000;
    const tax = lineTotal * 0.18;
    const grandTotal = lineTotal + tax;

    await db.query(`
      INSERT INTO customer_invoice (
        invoice_id, invoice_no, so_id, dispatch_id, customer_id,
        customer_name, subtotal, tax_amount, total_amount,
        invoice_date, due_date, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, CURRENT_DATE + interval '30 days', 'ACTIVE', 'PENDING')
    `, [invoiceId, invoiceNo, soId, dispatchId, customer.customer_id, 'Indus Motor Company', lineTotal, tax, grandTotal]);

    console.log(`✅ Customer Invoice Created: ${invoiceNo} for PKR ${grandTotal.toLocaleString()}`);

    console.log('\n✨ TRUE End-to-End ERP Flow successfully simulated for SR Tank 2!');
    console.log('You can now check the Tracking, Invoice, and Inventory modules in the UI.');

  } catch (error) {
    console.error('❌ Flow Execution Failed:', error);
  } finally {
    process.exit(0);
  }
}

runFlow();

# COMPLETE SALES ORDER TO DISPATCH WORKFLOW

## Overview
This document describes the complete end-to-end workflow from Sales Order creation to final Dispatch and Delivery.

---

## WORKFLOW STAGES

### **STAGE 1: SALES ORDER CREATION (DRAFT)**

**Step 1.1: Create Customer** (if new)
- **API**: `POST /api/sales-orders/customers`
- **Action**: Register new customer in system
- **Fields**: `code`, `name`, `address`, `phone`, `email`
- **Database**: `customer` table

**Step 1.2: Create Sales Order**
- **API**: `POST /api/sales-orders`
- **Initial Status**: `DRAFT`
- **Required Fields**:
  - `customer_id` - Customer who ordered
  - `items[]` - Array of products/services
    - `item_name` - Product name
    - `quantity` - Quantity ordered
    - `unit_price` - Price per unit
    - `production_required` - Boolean (true if needs production)
    - `delivery_date` - Required delivery date
  - `order_date` - Order date
  - `required_date` - Expected completion date
  - `delivery_date` - Delivery date
  - `shipping_method` - Shipping method
  - `shipping_address` - Delivery address
  
**Database**: 
- Inserts into `sales_order` table
- Inserts into `sales_order_item` table

**Code Location**: `erp-backend/src/models/salesOrder.model.js` (lines 18-142)

---

### **STAGE 2: SALES ORDER APPROVAL**

**Step 2.1: Review Sales Order**
- User reviews the sales order
- Checks items, quantities, pricing
- Validates customer details

**Step 2.2: Update Status to APPROVED**
- **API**: `PATCH /api/sales-orders/:id/status`
- **Body**: `{ "status": "APPROVED", "updated_by": "user", "reason": "Approved by manager" }`
- **Status Flow**: `DRAFT` → `PENDING` → `APPROVED`
- **Database**: Updates `sales_order.status` to `APPROVED`
- **Validation**: 
  - Order must exist
  - Valid status transition

**Code Location**: `erp-backend/src/controllers/salesOrder.controller.js` (lines 148-195)

---

### **STAGE 3: CONVERT TO WORK ORDERS (IN_PRODUCTION)**

**Step 3.1: Convert Sales Order to Work Orders**
- **API**: `POST /api/sales-orders/:id/convert-to-work-orders`
- **Body**: `{ "created_by": "user" }`
- **Prerequisites**: 
  - Sales Order status must be `APPROVED`
  - Items must have `production_required = true`

**Step 3.2: Work Order Creation Process**
- For each production item in the sales order:
  1. Generate Work Order number: `WO-000001`, `WO-000002`, etc.
  2. Create Work Order with:
     - `wo_no` - Auto-generated sequential number
     - `product_id` - Product to be manufactured
     - `quantity` - Quantity to produce
     - `scheduled_start` - Start date
     - `scheduled_end` - Completion date
     - `status` = `PLANNED`
     - `priority` - Default 5
  3. Link Work Order to Sales Order via `sales_order_work_order` junction table:
     - `sales_order_id` - Links to original sales order
     - `sales_order_item_id` - Links to specific item
     - `work_order_id` - Links to created work order
     - `quantity` - Quantity for this work order

**Step 3.3: Update Sales Order Status**
- Status changes to `IN_PRODUCTION`
- Reason recorded: "Converted to work orders"

**Database Changes**:
- Inserts into `work_order` table
- Inserts into `sales_order_work_order` junction table
- Updates `sales_order.status` to `IN_PRODUCTION`
- Inserts status history into `sales_order_status_history`

**Code Location**: `erp-backend/src/models/salesOrder.model.js` (lines 498-690)

---

### **STAGE 4: MATERIAL RESERVATION**

**Step 4.1: Explode BOM (Bill of Materials)**
- For each Work Order, get the BOM for the product
- Calculate required materials based on quantity
- Check material availability

**Step 4.2: Reserve Materials**
- **API**: `POST /api/hierarchical-work-order/reserve-materials`
- **Process**:
  1. For each material required:
     - Check available stock in `inventory` table
     - Check already reserved quantity
     - Calculate available: `stock - reserved`
  2. Create Material Reservation:
     - `work_order_id` - Links to work order
     - `material_id` - Material to reserve
     - `quantity` - Quantity to reserve
     - `priority` - NORMAL/HIGH/LOW
     - `status` = `RESERVED`
     - `created_by` - User creating reservation
  3. Inventory is NOT deducted yet (only reserved)
  4. Record in `inventory_txn` with type `RESERVATION`

**Database Tables**:
- `material_reservation` - Stores reservations
- `inventory` - Shows available stock (not deducted)
- `inventory_txn` - Logs reservation transactions

**Code Location**: `erp-backend/src/services/workOrderIntegration.service.js` (lines 16-189)

---

### **STAGE 5: MATERIAL ISSUANCE TO WORK ORDER**

**Step 5.1: Issue Materials to Shop Floor**
- **API**: `POST /api/production-execution/issue-materials`
- **Body**:
```json
{
  "workOrderId": "wo-id",
  "materials": [
    {
      "material_id": "material-id",
      "quantity_planned": 100,
      "quantity_issued": 100,
      "unit_cost": 50.00
    }
  ],
  "issuedBy": "user"
}
```

**Step 5.2: Material Issuance Process**
- For each material:
  1. Create `work_order_material_issue` record:
     - `work_order_id`
     - `material_id`
     - `quantity_planned`
     - `quantity_issued`
     - `unit_cost`
     - `total_cost`
     - `issued_by`
     - `status` = `ISSUED`
  
  2. **Deduct from Inventory**:
     - Update `inventory.quantity` by subtracting issued quantity
     - Checks: `available_quantity >= quantity_issued`
  
  3. Create Inventory Transaction:
     - `material_id`
     - `wo_id` - Work order reference
     - `txn_type` = `ISSUE`
     - `quantity` = negative value (deduction)
     - `reference` = Work order number
  
  4. Update Work Order Status:
     - Status changes to `IN_PROGRESS`
     - `scheduled_start` = current timestamp

**Database Changes**:
- Inserts into `work_order_material_issue`
- Updates `inventory.quantity` (reduces)
- Inserts into `inventory_txn`
- Updates `work_order.status` to `IN_PROGRESS`

**Code Location**: `erp-backend/src/services/productionExecutionService.js` (lines 16-118)

---

### **STAGE 6: PRODUCTION EXECUTION**

**Step 6.1: Production Steps/Routing**
- Work Order may have multiple operations/routing steps
- Each step has:
  - `step_no` - Sequence number
  - `operation` - Operation name
  - `work_center` - Production area
  - `assigned_to` - Operator
  - `status` - PENDING/IN_PROGRESS/COMPLETED

**Step 6.2: Execute Operations**
- Operators record progress for each operation:
  - Start operation
  - Record quantities processed
  - Record quality metrics
  - Mark as completed

**Step 6.3: Material Consumption**
- As production progresses:
  - Materials are consumed from issued quantities
  - Consumption tracked in `production_material_consumption`
  - Actual consumption vs planned consumption tracked
  - Scrap generated is recorded separately

**Code Location**: `erp-backend/src/controllers/productionTracking.controller.js` (lines 240-333)

---

### **STAGE 7: PRODUCTION OUTPUT / FINISHED GOODS**

**Step 7.1: Record Production Output**
- **API**: `POST /api/production-execution/record-output`
- **Body**:
```json
{
  "workOrderId": "wo-id",
  "itemId": "product-id",
  "itemType": "FINISHED_GOOD",
  "quantityGood": 95,
  "quantityRejected": 5,
  "recordedBy": "user"
}
```

**Step 7.2: Finished Goods Receipt Process**
- For good quality output:
  1. Create `work_order_output` record:
     - `work_order_id`
     - `item_id` - Product produced
     - `quantity_good`
     - `quantity_rejected`
     - `recorded_by`
  
  2. **Add to Inventory** (finished goods):
     - Check if product exists in `inventory` table
     - If exists: `UPDATE inventory SET quantity = quantity + quantityGood`
     - If not exists: `INSERT INTO inventory` (new record)
     - `status` = `AVAILABLE`
  
  3. Create Inventory Transaction:
     - `product_id` - Finished product
     - `wo_id` - Work order reference
     - `txn_type` = `RECEIPT`
     - `quantity` = positive value (addition)
     - `reference` = Work order number
  
  4. Update Material Issue Status:
     - `work_order_material_issue.status` = `CONSUMED`
     - `quantity_consumed` = `quantity_issued`

**Database Changes**:
- Inserts into `work_order_output`
- Updates/Creates in `inventory` table (increases quantity)
- Inserts into `inventory_txn`
- Updates `work_order_material_issue.status`

**Code Location**: `erp-backend/src/services/productionExecutionService.js` (lines 135-280)

**Step 7.3: Scrap Management**
- For rejected/scrap material:
  1. Record scrap in `scrap_inventory` table
  2. Track scrap by work order
  3. Scrap can be:
     - Available for reuse in future orders
     - Disposed
     - Sold

**Code Location**: `erp-backend/src/services/productionExecutionService.js` (lines 291-442)

---

### **STAGE 8: WORK ORDER COMPLETION**

**Step 8.1: Complete All Operations**
- When all operations are complete:
  - Check that all steps have `status = COMPLETED`
  - Update work order status

**Step 8.2: Complete Work Order**
- **API**: `POST /api/production-execution/complete-operation/:woId`
- **Process**:
  1. Update `work_order.status` = `COMPLETED`
  2. Set `work_order.scheduled_end` = current timestamp
  3. Check for dependent work orders
  4. Update dependent work orders: `dependency_status = READY`

**Database Changes**:
- Updates `work_order.status` to `COMPLETED`
- Sets `scheduled_end` timestamp

**Code Location**: `erp-backend/src/services/productionExecutionService.js` (lines 450-489)

---

### **STAGE 9: CHECK ALL WORK ORDERS COMPLETED**

**Step 9.1: Monitor Work Orders**
- System checks: Are ALL work orders for this sales order completed?
- Query: Get all work orders linked to sales order via `sales_order_work_order`
- Check status of each work order

**Step 9.2: Update Sales Order Status**
- When ALL work orders are `COMPLETED`:
  - **Manual or Automatic**: Update sales order status
  - **API**: `PATCH /api/sales-orders/:id/status`
  - **Body**: `{ "status": "READY_FOR_DISPATCH" }`
  - Status changes: `IN_PRODUCTION` → `READY_FOR_DISPATCH`
  - Reason: "All work orders completed, goods ready for dispatch"

**Database Changes**:
- Updates `sales_order.status` to `READY_FOR_DISPATCH`
- Records status history

**Important Note**: This step may require manual intervention to verify quality and inventory availability

---

### **STAGE 10: DISPATCH CREATION**

**Step 10.1: Create Dispatch Order**
- **API**: `POST /api/dispatch`
- **Body**:
```json
{
  "so_id": "sales-order-id",
  "so_number": "SO-001",
  "customer_name": "Customer Name",
  "product_id": "product-id",
  "product_name": "Product Name",
  "quantity": 100,
  "dispatch_method": "Ground Shipping",
  "tracking_number": "TRACK123",
  "dispatched_by": "user",
  "notes": "Fragile items"
}
```

**Step 10.2: Dispatch Process**
- For each product/item:
  1. Create `dispatch_order` record:
     - `dispatch_no` - Auto-generated (e.g., `DISP-123456`)
     - `so_id` - Links to sales order
     - `customer_id` - Customer info
     - `location_id` - Source warehouse
     - `vehicle_no` - Shipping vehicle
     - `driver_name` - Driver name
     - `dispatch_date` - Dispatch timestamp
     - `status` = `DISPATCHED`
  
  2. Create `dispatch_item` records:
     - `dispatch_id` - Links to dispatch order
     - `product_id` - Product being dispatched
     - `qty` - Quantity dispatched
     - `uom_id` - Unit of measure

  3. **Deduct from Finished Goods Inventory**:
     - `UPDATE inventory SET quantity = quantity - dispatch_qty WHERE product_id = X`
     - Creates `inventory_txn` with type `ISSUE`
  
  4. Update Sales Order:
     - Update `sales_order.status` = `DISPATCHED`
     - Update `sales_order_item.qty_shipped` - Tracks shipped quantity

**Database Changes**:
- Inserts into `dispatch_order`
- Inserts into `dispatch_item`
- Updates `inventory.quantity` (reduces finished goods)
- Inserts into `inventory_txn`
- Updates `sales_order.status` to `DISPATCHED`
- Updates `sales_order_item.qty_shipped`

**Code Location**: `erp-backend/src/controllers/dispatch.controller.js` (lines 11-77)

---

### **STAGE 11: DELIVERY & COMPLETION**

**Step 11.1: Delivery Confirmation**
- When goods are delivered to customer:
  - **API**: Update dispatch order status
  - Update `dispatch_order.status` = `DELIVERED`
  - Record delivery date

**Step 11.2: Complete Sales Order**
- **API**: `PATCH /api/sales-orders/:id/status`
- **Body**: `{ "status": "COMPLETED" }`
- Status changes: `DISPATCHED` → `DELIVERED` → `COMPLETED`
- All items have been shipped and delivered

**Database Changes**:
- Updates `dispatch_order.status` to `DELIVERED`
- Updates `sales_order.status` to `COMPLETED`
- Records final status history

---

## DATABASE TABLES INVOLVED

### Sales Order Tables:
1. `customer` - Customer master data
2. `sales_order` - Sales order header
3. `sales_order_item` - Line items
4. `sales_order_status_history` - Status change audit

### Production Tables:
5. `work_order` - Work orders for production
6. `work_order_step` - Production operations/routing
7. `work_order_item` - Work order items
8. `work_order_output` - Production output records
9. `sales_order_work_order` - Junction table linking SO to WO

### Material Management Tables:
10. `material_reservation` - Material reservations
11. `material_consumption` - Material consumption tracking
12. `work_order_material_issue` - Material issuance records
13. `inventory` - Current stock levels
14. `inventory_txn` - All inventory transactions

### Dispatch Tables:
15. `dispatch_order` - Dispatch header
16. `dispatch_item` - Dispatch line items

---

## KEY STATUS FLOWS

### Sales Order Status Flow:
```
DRAFT → PENDING → APPROVED → IN_PRODUCTION → READY_FOR_DISPATCH → DISPATCHED → DELIVERED → COMPLETED
                                       ↑                                                         
                              (Convert to WO)                                       (Delivery)
```

### Work Order Status Flow:
```
PLANNED → IN_PROGRESS → COMPLETED
          ↑
   (Material Issued)
```

### Inventory Transaction Types:
- `ISSUE` - Negative (reduce stock)
- `RECEIVE` - Positive (add stock)
- `RESERVATION` - Reserve without deducting
- `ADJUSTMENT` - Stock adjustments

---

## CRITICAL VALIDATIONS

1. **Material Availability**: Check before reservation and issuance
2. **Quantity Validation**: Ensure sufficient inventory
3. **Status Transitions**: Only valid status changes allowed
4. **Dependencies**: Work orders must be created before production
5. **Inventory Sync**: All inventory movements must be in `inventory_txn`
6. **Quantity Matching**: Shipped quantity cannot exceed ordered quantity

---

## SUMMARY OF TRANSACTIONS

| Stage | Inventory Change | Transaction Type | Reference |
|-------|-----------------|------------------|-----------|
| Material Reservation | None | RESERVATION | WO |
| Material Issue | Reduce | ISSUE | WO |
| Production Output | Increase (Finished Goods) | RECEIPT | WO |
| Dispatch | Reduce (Finished Goods) | ISSUE | SO |
| Final Status | No change | N/A | SO Complete |

---

## END OF WORKFLOW

**Final State**:
- Sales Order: `COMPLETED`
- All Work Orders: `COMPLETED`
- All Materials: `CONSUMED`
- Finished Goods: Shipped to Customer
- Dispatch: `DELIVERED`
- Inventory: Updated with all movements

The complete cycle from order to delivery is now complete!



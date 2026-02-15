# How "Other Parts" (BOUGHT_OUT Items) are Fetched from Inventory for Child Work Orders

## Overview
This document explains the complete flow of how BOUGHT_OUT items (like rod, Plastic Cap 1/4, Plastic Cap 3/8, Paint) are fetched from inventory when issuing materials to a child work order, based on the BOM and Sales Order quantity.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Click "Issue Material" for Child Work Order    │
│    - Child WO: ASSEMBLY operation                              │
│    - Parent WO: 50 units (from Sales Order)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GET PARENT QUANTITY                                          │
│    - Check if WO has parent_wo_id                               │
│    - Find parent WO from workOrders state                       │
│    - Extract parentQuantity = 50 (finished products)            │
│    - This is the quantity from Sales Order                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. FETCH BOM DATA                                                │
│    API: GET /api/bom-api/production-recipe/{product_id}         │
│                                                                  │
│    Returns: Array of BOM items including:                        │
│    - item_type: 'BOUGHT_OUT', 'CUT_PART', 'CONSUMABLE'          │
│    - material_id: UUID of the material                          │
│    - quantity: Qty/Unit (e.g., rod = 14, Paint = 0.1)         │
│    - sub_assembly_name: 'Shaft', 'Paint', 'Assembly', etc.     │
│    - operation_code: 'ASSEMBLY', 'FORMING', etc.               │
│    - material_name: 'Shaft Ø28 rod', 'PC-1 Plastic Cap 1/4'    │
│    - uom_code: 'PCS', 'KG', 'L', etc.                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. FILTER BOM ITEMS BY OPERATION TYPE                           │
│                                                                  │
│    For ASSEMBLY operation:                                      │
│    - Include ALL items where item_type === 'BOUGHT_OUT'         │
│    - Also match by sub_assembly_name containing 'assembly'       │
│    - Also match by operation_code containing 'assembly'         │
│                                                                  │
│    For other operations (FORMING, WELDING, etc.):               │
│    - Match by operation_code                                     │
│    - Match by sub_assembly_name                                  │
│    - Exclude CUT_PART items (those are for CUTTING only)        │
│                                                                  │
│    Example filtered items for ASSEMBLY:                         │
│    - rod (Qty/Unit: 14, Sub-Assembly: Shaft)                   │
│    - Plastic Cap 1/4 (Qty/Unit: 3)                              │
│    - Plastic Cap 3/8 (Qty/Unit: 11)                              │
│    - Paint (Qty/Unit: 0.1)                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CALCULATE REQUIRED QUANTITIES                                 │
│                                                                  │
│    For each matching BOM item:                                  │
│    Total Required = Qty/Unit × Parent Quantity                  │
│                                                                  │
│    Example calculations (Parent Qty = 50):                     │
│    - rod: 14 × 50 = 700 pieces                                  │
│    - Plastic Cap 1/4: 3 × 50 = 150 pieces                      │
│    - Plastic Cap 3/8: 11 × 50 = 550 pieces                     │
│    - Paint: 0.1 × 50 = 5 units (KG/L)                            │
│                                                                  │
│    Group by material_id to combine if same material appears      │
│    multiple times in BOM                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. FETCH INVENTORY AVAILABILITY                                 │
│    API: GET /api/inventory/current-stock/all?                  │
│          item_type=material&limit=1000                          │
│                                                                  │
│    Returns: Array of inventory records with:                    │
│    - material_id: UUID                                          │
│    - quantity: Available quantity                               │
│    - material: { material_id, name, code }                      │
│                                                                  │
│    This fetches ALL material inventory in one call              │
│    (more efficient than multiple individual calls)            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. MATCH MATERIALS WITH INVENTORY                               │
│                                                                  │
│    For each calculated material requirement:                    │
│    - Find matching inventory record by material_id              │
│    - Extract available_quantity                               │
│    - Compare: available_quantity < suggested_qty?               │
│    - Set has_shortage flag if insufficient                      │
│                                                                  │
│    Example:                                                     │
│    - rod: Required 700, Available 500 → has_shortage = true     │
│    - Plastic Cap 1/4: Required 150, Available 200 → OK         │
│    - Paint: Required 5, Available 0 → has_shortage = true        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. DISPLAY IN ISSUE MATERIAL MODAL                              │
│                                                                  │
│    Table shows:                                                 │
│    - Material Name (with ⚠️ icon if shortage)                  │
│    - Required Qty (in red if shortage)                          │
│    - Available Qty (below required)                             │
│    - Shortage amount (if applicable)                            │
│    - UOM (PCS, KG, L, etc.)                                      │
│                                                                  │
│    Warning Alert (if any shortages):                            │
│    - Lists all materials with insufficient stock                │
│    - Shows required vs available                                │
│    - Shows shortage amount                                      │
│                                                                  │
│    "Issue Material" Button:                                      │
│    - DISABLED if any material has shortage                      │
│    - DISABLED if no materials in plan                            │
│    - ENABLED only when all materials have sufficient stock     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. USER ISSUES MATERIALS                                        │
│    API: POST /api/work-orders/{wo_id}/issue-materials           │
│                                                                  │
│    Body: {                                                      │
│      materials: [                                               │
│        { material_id: "...", quantity: 700 },                    │
│        { material_id: "...", quantity: 150 },                   │
│        ...                                                       │
│      ]                                                          │
│    }                                                            │
│                                                                  │
│    Backend deducts from inventory                              │
│    Creates material issue transaction                           │
└─────────────────────────────────────────────────────────────────┘
```

## Key Code Locations

### Frontend: Material Calculation
**File:** `erp-frontend/src/pages/WorkOrders/WorkOrderManagement.tsx`

**Function:** `openIssueMaterial(wo: WorkOrder)` (Line ~155)

```typescript
// 1. Get parent quantity
let parentQuantity = wo.quantity;
if (wo.parent_wo_id) {
  const parentWO = workOrders.find(w => w.wo_id === wo.parent_wo_id);
  if (parentWO) {
    parentQuantity = parentWO.quantity; // Sales Order quantity
  }
}

// 2. Fetch BOM data
const res = await fetch(`/api/bom-api/production-recipe/${wo.product_id}`);
const items = Array.isArray(result?.data) ? result.data : [];

// 3. Filter and calculate for non-CUTTING operations
if (wo.operation_type !== 'CUTTING') {
  const matchingItems = items.filter((it: any) => {
    // Match by operation_code, sub_assembly_name, or item_type
    if (operationLower === 'assembly' && it.item_type === 'BOUGHT_OUT') {
      return true; // Include all bought-out items for ASSEMBLY
    }
    // ... other matching logic
  });
  
  // Calculate quantities
  matchingItems.forEach((it: any) => {
    const qtyPerUnit = Number(it.quantity) || 1; // From BOM
    const totalQty = qtyPerUnit * parentQuantity; // × Sales Order Qty
    // ... add to plans array
  });
}

// 4. Check inventory availability
const stockResponse = await fetch('/api/inventory/current-stock/all?item_type=material&limit=1000');
// Match materials with inventory and set has_shortage flag
```

### Backend: BOM Data Retrieval
**File:** `erp-backend/src/services/bomService.js`

**Function:** `getProductionRecipeBOM(productId)` (Line ~201)

```sql
SELECT 
  b.*,
  m.material_id,
  m.name as material_name,
  m.material_code,
  b.quantity,  -- This is Qty/Unit from BOM
  b.item_type,  -- 'BOUGHT_OUT', 'CUT_PART', etc.
  b.sub_assembly_name,
  b.operation_code,
  u.code as uom_code
FROM bom b
LEFT JOIN material m ON b.material_id = m.material_id
LEFT JOIN uom u ON b.uom_id = u.uom_id
WHERE b.product_id = $1
```

### Backend: Inventory Check
**File:** `erp-backend/src/controllers/api/inventory/current-stock.controller.js`

**Endpoint:** `GET /api/inventory/current-stock/all`

Returns all material inventory records with:
- `material_id`
- `quantity` (available stock)
- `material` object (name, code, etc.)

## Example Calculation

### Input:
- **Sales Order Quantity:** 50 units
- **BOM Items:**
  - rod: Qty/Unit = 14, Sub-Assembly = "Shaft"
  - Plastic Cap 1/4: Qty/Unit = 3
  - Plastic Cap 3/8: Qty/Unit = 11
  - Paint: Qty/Unit = 0.1

### Process:
1. **Parent Quantity:** 50 (from Sales Order)
2. **Filter BOM Items:** All BOUGHT_OUT items for ASSEMBLY operation
3. **Calculate:**
   - rod: 14 × 50 = **700 pieces**
   - Plastic Cap 1/4: 3 × 50 = **150 pieces**
   - Plastic Cap 3/8: 11 × 50 = **550 pieces**
   - Paint: 0.1 × 50 = **5 units**
4. **Check Inventory:**
   - rod: Available 500 → **Shortage: 200**
   - Plastic Cap 1/4: Available 200 → **OK**
   - Plastic Cap 3/8: Available 600 → **OK**
   - Paint: Available 0 → **Shortage: 5**

### Output:
- Material plans array with `suggested_qty`, `available_qty`, `has_shortage`
- Warning alert showing rod and Paint shortages
- "Issue Material" button **DISABLED** (due to shortages)

## Important Notes

1. **Parent Quantity Source:** Always uses the parent work order quantity, which comes from the Sales Order or Planned Production quantity.

2. **BOM Qty/Unit:** The `quantity` field in the BOM table represents "quantity per unit of finished product". This is multiplied by the parent quantity to get total requirements.

3. **Operation Matching:** For ASSEMBLY operations, ALL BOUGHT_OUT items are included. For other operations, matching is done by `operation_code` or `sub_assembly_name`.

4. **Material Grouping:** If the same `material_id` appears multiple times in the BOM, quantities are summed together.

5. **Inventory Check:** Done in bulk (one API call) for efficiency, then matched by `material_id`.

6. **Safety:** If inventory check fails, the system assumes shortage (`has_shortage = true`) to prevent issuing materials when stock is unknown.


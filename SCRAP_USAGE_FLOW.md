# Scrap Inventory Usage in Production - Complete Flow

## 📋 Overview
Yeh document explain karta hai ke **Scrap Inventory** ko production mein kaise use kiya jata hai.

---

## 🔄 Complete Flow (Step by Step)

### **STEP 1: Scrap Inventory Creation**
Scrap kaise create hota hai:

**Sources:**
1. **Production se automatically** - Cutting operation ke baad leftover pieces
2. **Manual entry** - User manually scrap add karta hai
3. **Blank Spec se** - Blank spec create karte waqt auto-calculate

**Database Table:** `scrap_inventory`
- `scrap_id` - Unique ID
- `material_id` - Material ka ID (can be NULL)
- `weight_kg` - Weight in kilograms
- `width_mm`, `length_mm`, `thickness_mm` - Dimensions
- `status` - AVAILABLE, CONSUMED, SOLD, QUARANTINED
- `reference` - Reference number (e.g., "BOM-898035-8253")

---

### **STEP 2: Material Issuance Dialog Open**
Jab user Work Order ke liye "Issue Material" click karta hai:

**Frontend Flow:**
```typescript
// 1. Work Order select karo
openIssueMaterial(wo: WorkOrder)

// 2. BOM items fetch karo
fetchBOMData(productId)

// 3. Material plans prepare karo
prepareMaterialPlans(items, operationType, parentQuantity)

// 4. Scrap inventory fetch karo (har material ke liye)
fetchScrapInventory(materialIds)
```

**API Call:**
```
GET /api/scrap-inventory?material_id={materialId}&status=AVAILABLE
```

**Response:**
```json
{
  "data": [
    {
      "scrap_id": "abc-123",
      "material_id": "mat-456",
      "weight_kg": 10.5,
      "width_mm": 146,
      "length_mm": 292,
      "thickness_mm": 3,
      "status": "AVAILABLE",
      "reference": "BOM-898035-8253"
    }
  ]
}
```

---

### **STEP 3: UI Display - Material Plans Table**
Frontend mein table dikhata hai:

**Columns:**
- **Material** - Material name
- **Qty** - Required quantity + Available quantity + Shortage
- **Source** - Dropdown (Regular Inventory ya Scrap)
- **UOM** - Unit of Measure

**Logic:**
```typescript
// Har material ke liye scrap check karo
const availableScrap = scrapInventory[material_id] || [];
const totalScrapQty = availableScrap.reduce((sum, s) => sum + s.weight_kg, 0);

// Agar scrap available hai, dropdown dikhao
if (totalScrapQty > 0) {
  // Show dropdown with options:
  // - Regular Inventory (available_qty)
  // - Scrap: 10.5kg (BOM-898035-8253)
  // - Scrap: 5.2kg (BOM-88486-0580)
}
```

---

### **STEP 4: User Scrap Select Karta Hai**
User dropdown se scrap select karta hai:

**User Actions:**
1. Dropdown se "Scrap: 10.5kg" select karo
2. Weight input field mein quantity enter karo (e.g., "10" kg)
3. System automatically convert karta hai: `10kg → material units`

**Frontend State Update:**
```typescript
materialPlans = [
  {
    material_id: "mat-123",
    material_name: "rod",
    suggested_qty: 70000,  // Required in units
    available_qty: 0,      // Regular inventory
    scrap_id: "scrap-456", // Selected scrap ID
    scrap_quantity: 10,   // Weight in kg
    unit_weight_kg: 0.5,  // Conversion factor
    material_uom: "unit"   // Material UOM
  }
]
```

---

### **STEP 5: Conversion Logic (Kg → Material UOM)**
Scrap weight ko material quantity mein convert karna:

**Conversion Priority:**
1. **Agar UOM = kg** → Direct conversion (1:1)
2. **Agar `unit_weight_kg` available** → `scrap_kg / unit_weight_kg = units`
3. **Agar dimensions available** → Complex calculation (not implemented)
4. **Otherwise** → 0 (conversion not possible)

**Example:**
```
Material: rod
UOM: unit
unit_weight_kg: 0.5 kg/unit
Scrap selected: 10 kg

Conversion: 10 kg ÷ 0.5 kg/unit = 20 units
Available: 0 (regular) + 20 (scrap) = 20 units
Required: 70000 units
Shortage: 70000 - 20 = 69980 units
```

**Frontend Function:**
```typescript
convertScrapWeightToMaterialQty(scrapWeightKg, materialPlan, scrap) {
  if (UOM === 'kg') return scrapWeightKg;
  if (unit_weight_kg) return scrapWeightKg / unit_weight_kg;
  return 0; // Cannot convert
}
```

---

### **STEP 6: Submit Issue - API Call**
Jab user "Issue Material" button click karta hai:

**Frontend Request:**
```typescript
POST /api/inventory/stock-out/bulk
{
  wo_id: "wo-123",
  materials: [
    {
      material_id: "mat-123",
      quantity: 70000,        // Required quantity
      scrap_id: "scrap-456",  // ⭐ Scrap ID (if selected)
      scrap_quantity: 10      // ⭐ Scrap weight in kg (if scrap selected)
    }
  ]
}
```

**Backend Logic (stock-out.controller.js):**
```javascript
// Check if scrap_id exists
if (material.scrap_id) {
  // Use productionExecutionService for scrap deduction
  await productionService.issueMaterialToWorkOrder({
    workOrderId: wo_id,
    materials: [{
      material_id: material.material_id,
      scrap_id: material.scrap_id,
      quantity_issued: material.scrap_quantity  // Weight in kg
    }]
  });
} else {
  // Regular inventory deduction
  await inventoryService.stockOut(
    material.material_id,
    material.quantity,
    location_id
  );
}
```

---

### **STEP 7: Scrap Deduction (Backend)**
`productionExecutionService.issueMaterialToWorkOrder()` mein:

**Process:**
1. **Scrap record check karo:**
   ```sql
   SELECT scrap_id, weight_kg, status, material_id
   FROM scrap_inventory
   WHERE scrap_id = $1 AND status = 'AVAILABLE'
   ```

2. **Validation:**
   - Scrap available hai?
   - Sufficient weight hai? (`scrap.weight_kg >= quantity_issued`)

3. **Deduct scrap:**
   ```sql
   UPDATE scrap_inventory SET
     weight_kg = weight_kg - $1,  -- Reduce weight
     status = CASE 
       WHEN (weight_kg - $1) <= 0 THEN 'CONSUMED'
       ELSE 'AVAILABLE'
     END
   WHERE scrap_id = $2
   ```

4. **Create transaction records:**
   - `scrap_transaction` - Scrap usage record
   - `scrap_movement` - Audit trail
   - `work_order_material_issue` - Material issue record

---

## 🎯 Key Points

### **1. Scrap vs Regular Inventory**
- **Regular Inventory:** `inventory` table se deduct hota hai
- **Scrap Inventory:** `scrap_inventory` table se deduct hota hai
- **Both** material issue record create karte hain

### **2. Conversion Required**
- Scrap **always** weight mein store hota hai (kg)
- Material **UOM** different ho sakta hai (unit, pcs, kg, etc.)
- **Conversion mandatory** hai agar UOM different hai

### **3. Material ID Required**
- Scrap record mein `material_id` **should be set**
- Agar NULL hai, to "Unknown Material" dikhata hai
- Conversion ke liye bhi `material_id` chahiye

### **4. Quantity Flow**
```
User Input: 10 kg (scrap weight)
↓
Conversion: 10 kg ÷ 0.5 kg/unit = 20 units
↓
Available: 0 (regular) + 20 (scrap) = 20 units
↓
Required: 70000 units
↓
Shortage: 69980 units
```

---

## 🔧 Current Implementation Status

### ✅ **Working:**
1. Scrap inventory fetch
2. Scrap display in dropdown
3. Scrap selection UI
4. Scrap deduction backend logic

### ❌ **Missing/Issues:**
1. **Frontend:** `submitIssue()` mein `scrap_id` pass nahi ho raha
2. **Backend:** `bulkStockOut` mein scrap check nahi hai
3. **Conversion:** `unit_weight_kg` missing ho sakta hai
4. **Material ID:** Scrap records mein `material_id` NULL ho sakta hai

---

## 🚀 Recommended Implementation

### **Frontend Fix:**
```typescript
const submitIssue = async () => {
  const body = {
    wo_id: issueSelectedWO.wo_id,
    materials: materialPlans.map(m => {
      // If scrap selected, use scrap_quantity and scrap_id
      if (m.scrap_id && m.scrap_id !== 'regular') {
        return {
          material_id: m.material_id,
          quantity: m.scrap_quantity,  // Weight in kg
          scrap_id: m.scrap_id         // Scrap ID
        };
      }
      // Otherwise use regular inventory
      return {
        material_id: m.material_id,
        quantity: m.suggested_qty      // Regular quantity
      };
    })
  };
  
  await fetch('/api/inventory/stock-out/bulk', {
    method: 'POST',
    body: JSON.stringify(body)
  });
};
```

### **Backend Fix:**
```javascript
// In bulkStockOut controller
for (const material of materials) {
  if (material.scrap_id) {
    // Use productionExecutionService for scrap
    await productionService.issueMaterialToWorkOrder({
      workOrderId: wo_id,
      materials: [{
        material_id: material.material_id,
        scrap_id: material.scrap_id,
        quantity_issued: material.quantity  // Weight in kg
      }]
    });
  } else {
    // Regular inventory deduction
    await inventoryService.stockOut(...);
  }
}
```

---

## 📊 Database Tables Involved

1. **scrap_inventory** - Scrap records
2. **inventory** - Regular inventory
3. **work_order_material_issue** - Material issue records
4. **scrap_transaction** - Scrap usage transactions
5. **scrap_movement** - Scrap audit trail
6. **inventory_txn** - Inventory transactions

---

## 💡 Best Practices

1. **Always set material_id** when creating scrap
2. **Set unit_weight_kg** in material table for conversion
3. **Validate scrap availability** before allowing selection
4. **Show conversion result** in UI (e.g., "10kg = 20 units")
5. **Handle partial consumption** (if scrap weight > required)

---

## ❓ Common Questions

**Q: Scrap ko regular inventory mein convert kaise karein?**
A: Use "Restore to Inventory" feature - creates new material with "_leftover" suffix

**Q: Scrap ka weight kg mein hai, material UOM different hai?**
A: Use `unit_weight_kg` for conversion, otherwise show warning

**Q: Multiple scrap items kaise use karein?**
A: Currently one scrap per material, can be enhanced to allow multiple

**Q: Scrap kaise create hota hai?**
A: Automatically from production, or manually via Scrap Management page
















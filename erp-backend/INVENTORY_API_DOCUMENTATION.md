# Comprehensive Inventory Management API

## Overview

This document describes the complete inventory management system with business logic, atomic transactions, and proper validation. The system handles the full manufacturing workflow from raw material procurement to finished goods delivery.

## Architecture

### Core Components

1. **Inventory Service** (`src/services/inventory.service.js`)
   - Core business logic with atomic transactions
   - Stock adjustments with validation
   - Comprehensive error handling

2. **API Controllers** (`src/controllers/api/inventory/`)
   - RESTful endpoints for each inventory operation
   - Input validation and business rule enforcement
   - Proper HTTP response codes

3. **Route Structure** (`src/routes/api/inventory/`)
   - Modular route organization
   - Clear API versioning and structure

## API Endpoints

### Base URL
```
/api/inventory
```

### 1. Stock In Operations
**Base:** `/api/inventory/stock-in`

#### POST `/api/inventory/stock-in`
Add inventory (Raw Material Purchase)

**Request Body:**
```json
{
  "material_id": "uuid",
  "quantity": 100,
  "location_id": "uuid",
  "po_id": "uuid", // optional
  "batch_no": "BATCH001", // optional
  "unit_cost": 25.50, // optional
  "reference": "PO-2024-001", // optional
  "created_by": "user_id" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock added successfully",
  "data": {
    "inventory": { ... },
    "transaction": { ... },
    "new_quantity": 150
  }
}
```

#### GET `/api/inventory/stock-in/history`
Get stock in history

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)
- `material_id`
- `location_id`
- `start_date`
- `end_date`

### 2. Stock Out Operations
**Base:** `/api/inventory/stock-out`

#### POST `/api/inventory/stock-out`
Reduce inventory (Production Consumption)

**Request Body:**
```json
{
  "material_id": "uuid",
  "quantity": 50,
  "location_id": "uuid",
  "wo_id": "uuid", // optional
  "reference": "WO-2024-001", // optional
  "created_by": "user_id" // optional
}
```

#### POST `/api/inventory/stock-out/bulk`
Bulk stock out for multiple materials

**Request Body:**
```json
{
  "wo_id": "uuid",
  "materials": [
    {
      "material_id": "uuid",
      "quantity": 50
    },
    {
      "material_id": "uuid",
      "quantity": 25
    }
  ],
  "location_id": "uuid",
  "reference": "WO-2024-001",
  "created_by": "user_id"
}
```

### 3. Wastage Management
**Base:** `/api/inventory/wastage`

#### POST `/api/inventory/wastage`
Record material wastage

**Request Body:**
```json
{
  "material_id": "uuid",
  "quantity": 5,
  "location_id": "uuid",
  "wo_id": "uuid",
  "step_id": "uuid", // optional
  "reason": "Cutting waste", // optional
  "created_by": "user_id" // optional
}
```

#### POST `/api/inventory/wastage/reentry`
Re-entry wastage back to inventory

**Request Body:**
```json
{
  "wastage_id": "uuid",
  "quantity": 3,
  "location_id": "uuid",
  "reason": "Wastage re-entry", // optional
  "created_by": "user_id" // optional
}
```

#### GET `/api/inventory/wastage`
Get wastage records

**Query Parameters:**
- `limit`, `offset`
- `material_id`, `wo_id`, `location_id`
- `start_date`, `end_date`

#### GET `/api/inventory/wastage/summary`
Get wastage summary

**Query Parameters:**
- `group_by`: "material" or "work_order"
- `wo_id`, `material_id`

### 4. Finished Goods Management
**Base:** `/api/inventory/finished-goods`

#### POST `/api/inventory/finished-goods`
Receive finished goods from production

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 10,
  "location_id": "uuid",
  "wo_id": "uuid", // optional
  "batch_no": "FG-2024-001", // optional
  "unit_cost": 150.00, // optional
  "created_by": "user_id" // optional
}
```

#### POST `/api/inventory/finished-goods/bulk`
Bulk receive finished goods

**Request Body:**
```json
{
  "wo_id": "uuid",
  "products": [
    {
      "product_id": "uuid",
      "quantity": 10,
      "batch_no": "FG-2024-001",
      "unit_cost": 150.00
    }
  ],
  "location_id": "uuid",
  "created_by": "user_id"
}
```

### 5. Re-entry Operations
**Base:** `/api/inventory/reentry`

#### POST `/api/inventory/reentry`
Re-entry wastage back to inventory

#### POST `/api/inventory/reentry/bulk`
Bulk re-entry multiple wastage records

#### GET `/api/inventory/reentry/available`
Get available wastage for re-entry

#### GET `/api/inventory/reentry/history`
Get re-entry history

### 6. Current Stock Operations
**Base:** `/api/inventory/current-stock`

#### GET `/api/inventory/current-stock`
Get current stock for specific item

**Query Parameters:**
- `item_id`: Material or Product ID
- `item_type`: "material" or "product"
- `location_id`

#### GET `/api/inventory/current-stock/all`
Get all current stock levels

#### GET `/api/inventory/current-stock/summary`
Get inventory summary by location

#### GET `/api/inventory/current-stock/low-stock`
Get low stock items

#### GET `/api/inventory/current-stock/zero-stock`
Get zero stock items

## Business Logic Rules

### 1. Stock In (Raw Material Purchase)
- ✅ Quantity must be positive
- ✅ Creates new inventory record if none exists
- ✅ Updates existing inventory if record exists
- ✅ Records transaction with type 'RECEIVE'
- ✅ Links to purchase order if provided

### 2. Stock Out (Production Consumption)
- ✅ Quantity must be positive (converted to negative internally)
- ✅ Validates sufficient stock availability
- ✅ Prevents negative stock (throws error if insufficient)
- ✅ Records transaction with type 'ISSUE'
- ✅ Links to work order if provided

### 3. Wastage Recording
- ✅ Records wastage in Wastage table
- ✅ Reduces inventory quantity
- ✅ Creates inventory transaction with type 'ADJUSTMENT'
- ✅ Links to work order and step

### 4. Wastage Re-entry
- ✅ Validates available wastage quantity
- ✅ Cannot re-enter more than available
- ✅ Updates wastage record (reduces quantity)
- ✅ Adds back to inventory
- ✅ Creates transaction with 'REENTRY' reference

### 5. Finished Goods
- ✅ Quantity must be positive
- ✅ Creates or updates product inventory
- ✅ Records transaction with type 'RECEIVE'
- ✅ Links to work order if provided

## Atomic Transactions

All inventory operations use Prisma's `$transaction` to ensure data consistency:

```javascript
await prisma.$transaction(async (tx) => {
  // 1. Update inventory
  // 2. Create transaction record
  // 3. Update related records
  // All operations succeed or all fail
});
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Validation Rules

### Input Validation
- Required fields validation
- Data type validation
- Business rule validation
- Quantity validation (positive values)

### Business Validation
- Stock availability checks
- Wastage quantity limits
- Location existence validation
- Material/Product existence validation

## Database Models Used

### Core Models
- `Inventory`: Current stock levels
- `InventoryTxn`: All inventory transactions
- `Wastage`: Material wastage records
- `Material`: Raw materials
- `Product`: Finished goods
- `Location`: Storage locations
- `WorkOrder`: Production orders
- `PurchaseOrder`: Purchase orders

### Relationships
- Inventory → Material/Product
- Inventory → Location
- InventoryTxn → Inventory
- InventoryTxn → WorkOrder/PurchaseOrder
- Wastage → WorkOrder
- Wastage → Material

## Usage Examples

### Complete Manufacturing Flow

1. **Raw Material Purchase**
```bash
POST /api/inventory/stock-in
{
  "material_id": "steel-sheet-id",
  "quantity": 100,
  "location_id": "raw-material-store-id",
  "po_id": "po-2024-001"
}
```

2. **Issue Materials for Production**
```bash
POST /api/inventory/stock-out
{
  "material_id": "steel-sheet-id",
  "quantity": 50,
  "location_id": "raw-material-store-id",
  "wo_id": "wo-2024-001"
}
```

3. **Record Wastage**
```bash
POST /api/inventory/wastage
{
  "material_id": "steel-sheet-id",
  "quantity": 5,
  "location_id": "production-floor-id",
  "wo_id": "wo-2024-001",
  "reason": "Cutting waste"
}
```

4. **Receive Finished Goods**
```bash
POST /api/inventory/finished-goods
{
  "product_id": "engine-block-id",
  "quantity": 10,
  "location_id": "finished-goods-store-id",
  "wo_id": "wo-2024-001"
}
```

5. **Re-entry Wastage (if applicable)**
```bash
POST /api/inventory/wastage/reentry
{
  "wastage_id": "wastage-id",
  "quantity": 2,
  "location_id": "raw-material-store-id"
}
```

## Health Check

### GET `/api/inventory/health`
Returns API health status and available endpoints.

```json
{
  "success": true,
  "message": "Inventory API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": {
    "stockIn": "/api/inventory/stock-in",
    "stockOut": "/api/inventory/stock-out",
    "wastage": "/api/inventory/wastage",
    "finishedGoods": "/api/inventory/finished-goods",
    "reentry": "/api/inventory/reentry",
    "currentStock": "/api/inventory/current-stock"
  }
}
```

## Testing

### Test the API
```bash
# Health check
curl http://localhost:4000/api/inventory/health

# Stock in
curl -X POST http://localhost:4000/api/inventory/stock-in \
  -H "Content-Type: application/json" \
  -d '{"material_id":"uuid","quantity":100,"location_id":"uuid"}'

# Current stock
curl "http://localhost:4000/api/inventory/current-stock?item_id=uuid&item_type=material&location_id=uuid"
```

This comprehensive inventory management system provides complete traceability, atomic transactions, and proper business logic validation for your manufacturing ERP system.

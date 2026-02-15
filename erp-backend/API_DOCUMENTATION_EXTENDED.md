# ERP Backend API Documentation - Extended Features

This document describes the extended ERP backend APIs for tracking material wastage, reusing scrap, and updating stock levels automatically.

## Table of Contents

1. [Scrap Management API](#scrap-management-api)
2. [Wastage Tracking API](#wastage-tracking-api)
3. [Scrap Reuse API](#scrap-reuse-api)
4. [Stock Adjustment API](#stock-adjustment-api)
5. [Production Tracking API](#production-tracking-api)
6. [Reports API](#reports-api)

---

## Scrap Management API

Base URL: `/api/scrap`

### Endpoints

#### 1. Create Scrap Inventory
- **POST** `/api/scrap`
- **Description**: Record new scrap inventory
- **Body**:
```json
{
  "blank_id": "uuid (optional)",
  "material_id": "uuid (optional)",
  "width_mm": 100.5,
  "length_mm": 200.0,
  "thickness_mm": 2.5,
  "weight_kg": 5.2,
  "location_id": "uuid (optional)",
  "status": "AVAILABLE",
  "reference": "WO-2023-001",
  "consumed_by_po": "PO-2023-001"
}
```

#### 2. Get All Scrap Inventory
- **GET** `/api/scrap`
- **Query Parameters**:
  - `status`: Filter by status (AVAILABLE, CONSUMED, SOLD, QUARANTINED)
  - `location_id`: Filter by location
  - `material_id`: Filter by material
  - `limit`: Number of records (default: 50)
  - `offset`: Offset for pagination (default: 0)

#### 3. Get Scrap by ID
- **GET** `/api/scrap/:id`
- **Description**: Get detailed scrap information including transactions

#### 4. Update Scrap Status
- **PATCH** `/api/scrap/:id/status`
- **Body**:
```json
{
  "status": "CONSUMED"
}
```

#### 5. Create Scrap Transaction
- **POST** `/api/scrap/transactions`
- **Body**:
```json
{
  "scrap_id": "uuid",
  "txn_type": "REUSED",
  "qty_used": 2.5,
  "weight_kg": 2.5,
  "reference": "INVENTORY_TXN_123"
}
```

#### 6. Get Scrap Transactions
- **GET** `/api/scrap/transactions/list`
- **Query Parameters**: `scrap_id`, `txn_type`, `limit`, `offset`

#### 7. Get Scrap by Location
- **GET** `/api/scrap/location/:locationId`

#### 8. Get Scrap by Material
- **GET** `/api/scrap/material/:materialId`

---

## Wastage Tracking API

Base URL: `/api/wastage`

### Endpoints

#### 1. Record Wastage
- **POST** `/api/wastage`
- **Body**:
```json
{
  "wo_id": "uuid",
  "step_id": "uuid (optional)",
  "material_id": "uuid",
  "quantity": 2.5,
  "uom_id": "uuid (optional)",
  "location_id": "uuid (optional)",
  "reason": "Machine malfunction"
}
```

#### 2. Get All Wastage Records
- **GET** `/api/wastage`
- **Query Parameters**: `wo_id`, `material_id`, `location_id`, `limit`, `offset`

#### 3. Get Wastage by ID
- **GET** `/api/wastage/:id`

#### 4. Update Wastage Record
- **PATCH** `/api/wastage/:id`
- **Body**:
```json
{
  "quantity": 3.0,
  "reason": "Updated reason"
}
```

#### 5. Get Wastage by Work Order
- **GET** `/api/wastage/work-order/:woId`

#### 6. Get Wastage by Material
- **GET** `/api/wastage/material/:materialId`

#### 7. Get Wastage Summary
- **GET** `/api/wastage/summary`
- **Query Parameters**: `start_date`, `end_date`, `material_id`, `wo_id`

---

## Scrap Reuse API

Base URL: `/api/scrap-reuse`

### Endpoints

#### 1. Reuse Scrap into Stock
- **POST** `/api/scrap-reuse/reuse`
- **Description**: Re-enter scrap back into inventory with automatic stock updates
- **Body**:
```json
{
  "scrap_id": "uuid",
  "quantity_to_reuse": 2.5,
  "location_id": "uuid (optional)",
  "reference": "REUSE_2023_001"
}
```

#### 2. Get Reusable Scrap
- **GET** `/api/scrap-reuse/reusable/:materialId`
- **GET** `/api/scrap-reuse/reusable/:materialId/:locationId`
- **Description**: Get available scrap for reuse (FIFO order)

#### 3. Get Scrap Reuse History
- **GET** `/api/scrap-reuse/history`
- **Query Parameters**: `material_id`, `location_id`, `start_date`, `end_date`, `limit`, `offset`

#### 4. Get Scrap Reuse Savings
- **GET** `/api/scrap-reuse/savings`
- **Query Parameters**: `start_date`, `end_date`, `material_id`
- **Description**: Calculate cost savings from scrap reuse

---

## Stock Adjustment API

Base URL: `/api/stock-adjustment`

### Endpoints

#### 1. Adjust Stock
- **POST** `/api/stock-adjustment/adjust`
- **Description**: Adjust stock levels with automatic inventory and ledger updates
- **Body**:
```json
{
  "product_id": "uuid (optional)",
  "material_id": "uuid (optional)",
  "quantity": 10.0,
  "adjustment_type": "INCREASE",
  "reason": "Physical count adjustment",
  "location_id": "uuid (optional)",
  "reference": "ADJ_2023_001"
}
```

#### 2. Get Stock Adjustment History
- **GET** `/api/stock-adjustment/history`
- **Query Parameters**: `product_id`, `material_id`, `location_id`, `start_date`, `end_date`, `limit`, `offset`

#### 3. Get Stock Levels
- **GET** `/api/stock-adjustment/levels`
- **Query Parameters**: `product_id`, `material_id`, `location_id`, `low_stock_only`
- **Description**: Get current stock levels with low stock indicators

#### 4. Get Stock Movement Report
- **GET** `/api/stock-adjustment/movement-report`
- **Query Parameters**: `product_id`, `material_id`, `location_id`, `start_date`, `end_date`

---

## Production Tracking API

Base URL: `/api/production-tracking`

### Endpoints

#### 1. Record Material Usage
- **POST** `/api/production-tracking/material-usage`
- **Description**: Record material consumption during production
- **Body**:
```json
{
  "production_id": "uuid",
  "material_id": "uuid (optional)",
  "scrap_id": "uuid (optional)",
  "qty_issued": 5.0,
  "uom_id": "uuid (optional)"
}
```

#### 2. Update Production Step
- **PATCH** `/api/production-tracking/steps/:stepId`
- **Body**:
```json
{
  "completed_qty": 10,
  "status": "COMPLETED",
  "start_time": "2023-12-01T08:00:00Z",
  "end_time": "2023-12-01T17:00:00Z",
  "remarks": "Step completed successfully"
}
```

#### 3. Get Production Progress
- **GET** `/api/production-tracking/:productionId/progress`
- **Description**: Get detailed production progress with metrics

#### 4. Get Production Orders
- **GET** `/api/production-tracking/orders`
- **Query Parameters**: `status`, `product_id`, `start_date`, `end_date`, `limit`, `offset`

#### 5. Get Production Efficiency
- **GET** `/api/production-tracking/efficiency`
- **Query Parameters**: `start_date`, `end_date`, `product_id`
- **Description**: Generate production efficiency report

---

## Reports API

Base URL: `/api/reports`

### Endpoints

#### 1. Generate Wastage Report
- **GET** `/api/reports/wastage`
- **Query Parameters**: `start_date`, `end_date`, `material_id`, `wo_id`, `location_id`, `limit`, `offset`
- **Description**: Comprehensive wastage analysis with summary statistics

#### 2. Generate Scrap Report
- **GET** `/api/reports/scrap`
- **Query Parameters**: `start_date`, `end_date`, `material_id`, `location_id`, `status`, `limit`, `offset`
- **Description**: Scrap inventory analysis and status tracking

#### 3. Generate Inventory Report
- **GET** `/api/reports/inventory`
- **Query Parameters**: `product_id`, `material_id`, `location_id`, `low_stock_only`
- **Description**: Current inventory levels with low stock alerts

#### 4. Generate Production Report
- **GET** `/api/reports/production`
- **Query Parameters**: `start_date`, `end_date`, `product_id`, `status`, `limit`, `offset`
- **Description**: Production order analysis and completion tracking

#### 5. Generate Cost Analysis Report
- **GET** `/api/reports/cost-analysis`
- **Query Parameters**: `start_date`, `end_date`, `product_id`, `material_id`
- **Description**: Material cost analysis including wastage costs and efficiency metrics

---

## Response Format

All APIs return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message or array of validation errors"
}
```

---

## Key Features

### 1. Prisma Transactions
- All multi-step operations use Prisma transactions for data consistency
- Automatic rollback on any failure
- Atomic operations for inventory updates

### 2. Automatic Stock Updates
- Scrap reuse automatically updates inventory levels
- Stock adjustments create inventory transactions and ledger entries
- Material usage tracking with real-time inventory updates

### 3. Comprehensive Validation
- Joi schema validation for all inputs
- Business logic validation (e.g., sufficient scrap quantity)
- Referential integrity checks

### 4. Detailed Logging
- All operations are logged with relevant context
- Error tracking with detailed information
- Audit trail for all transactions

### 5. Flexible Reporting
- Multiple report types with filtering options
- Summary statistics and detailed breakdowns
- Cost analysis and efficiency metrics

---

## Usage Examples

### Example 1: Record Wastage and Reuse Scrap
```bash
# 1. Record wastage during production
curl -X POST http://localhost:4000/api/wastage \
  -H "Content-Type: application/json" \
  -d '{
    "wo_id": "wo-uuid",
    "material_id": "material-uuid",
    "quantity": 2.5,
    "reason": "Machine malfunction"
  }'

# 2. Create scrap inventory from wastage
curl -X POST http://localhost:4000/api/scrap \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "material-uuid",
    "weight_kg": 2.5,
    "reference": "WASTAGE_001"
  }'

# 3. Reuse scrap back into stock
curl -X POST http://localhost:4000/api/scrap-reuse/reuse \
  -H "Content-Type: application/json" \
  -d '{
    "scrap_id": "scrap-uuid",
    "quantity_to_reuse": 2.0,
    "reference": "REUSE_001"
  }'
```

### Example 2: Generate Reports
```bash
# Generate wastage report for last month
curl "http://localhost:4000/api/reports/wastage?start_date=2023-11-01&end_date=2023-11-30"

# Generate inventory report with low stock alerts
curl "http://localhost:4000/api/reports/inventory?low_stock_only=true"

# Generate cost analysis report
curl "http://localhost:4000/api/reports/cost-analysis?start_date=2023-11-01&end_date=2023-11-30"
```

---

## Database Schema Requirements

The APIs require the following models in your Prisma schema:
- `ScrapInventory`
- `ScrapTransaction`
- `Wastage`
- `InventoryTxn`
- `StockLedger`
- `ProductionOrder`
- `ProductionMaterialUsage`
- `ProductionStep`

All relations and constraints should be properly defined for optimal performance and data integrity.

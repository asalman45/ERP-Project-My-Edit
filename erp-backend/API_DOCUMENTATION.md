# ERP Backend API Documentation

This document provides a comprehensive overview of all available API endpoints in the ERP backend system.

## Base URL
All API endpoints are prefixed with `/api`

## Response Format
All API responses follow the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "error": "Error message or array of validation errors"
}
```

## API Endpoints

### 1. Products API (`/api/products`)
- `GET /api/products` - List all products with OEM, Model, UOM relations
- `GET /api/products/:id` - Get product by ID with relations
- `POST /api/products` - Create new product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### 2. Materials API (`/api/materials`)
- `GET /api/materials` - List all materials with UOM relations
- `GET /api/materials/:id` - Get material by ID with UOM relation
- `POST /api/materials` - Create new material
- `PATCH /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### 3. BOM (Bill of Materials) API (`/api/bom`)
- `GET /api/bom/:productId` - Get BOM for a product (list materials)
- `POST /api/bom` - Add material to product BOM
- `DELETE /api/bom/:productId/:materialId` - Remove material from BOM
- `PATCH /api/bom/:productId/:materialId` - Update material quantity in BOM

### 4. Inventory API (`/api/inventory`)
- `GET /api/inventory` - List inventory with product/material + location info
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PATCH /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

#### Inventory Transactions
- `GET /api/inventory/transactions/list` - List all inventory transactions
- `POST /api/inventory/transactions` - Create inventory transaction (issue, receive, transfer, adjustment)
- `GET /api/inventory/:inventoryId/transactions` - Get transactions for specific inventory item

### 5. Suppliers API (`/api/suppliers`)
- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create new supplier
- `PATCH /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### 6. Purchase Orders API (`/api/purchase-orders`)
- `GET /api/purchase-orders` - List purchase orders with supplier info
- `GET /api/purchase-orders/:id` - Get purchase order by ID
- `POST /api/purchase-orders` - Create new purchase order
- `PATCH /api/purchase-orders/:id` - Update purchase order
- `DELETE /api/purchase-orders/:id` - Delete purchase order
- `PATCH /api/purchase-orders/:id/status` - Update PO status (OPEN → PARTIALLY_RECEIVED → RECEIVED → CLOSED)

#### Purchase Order Items
- `GET /api/purchase-orders/:poId/items` - Get items for a purchase order
- `POST /api/purchase-orders/:poId/items` - Add item to purchase order
- `PATCH /api/purchase-orders/items/:itemId` - Update purchase order item
- `DELETE /api/purchase-orders/items/:itemId` - Remove item from purchase order

### 7. Work Orders API (`/api/work-orders`)
- `GET /api/work-orders` - List work orders with product info
- `GET /api/work-orders/:id` - Get work order by ID
- `POST /api/work-orders` - Create new work order
- `PATCH /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order
- `PATCH /api/work-orders/:id/status` - Update WO status (PLANNED → IN_PROGRESS → COMPLETED)

#### Work Order Steps
- `GET /api/work-orders/:woId/steps` - Get steps for a work order
- `POST /api/work-orders/:woId/steps` - Add step to work order
- `PATCH /api/work-orders/steps/:stepId` - Update work order step
- `PATCH /api/work-orders/steps/:stepId/status` - Update step status (PENDING → IN_PROGRESS → COMPLETED)
- `DELETE /api/work-orders/steps/:stepId` - Remove step from work order

### 8. Locations API (`/api/locations`)
- `GET /api/locations` - List all locations
- `GET /api/locations/:id` - Get location by ID
- `POST /api/locations` - Create new location
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

## Query Parameters

### Pagination
Most list endpoints support pagination:
- `limit` - Number of items per page (default: 50)
- `offset` - Number of items to skip (default: 0)

### Filtering
Some endpoints support filtering:
- Inventory: `product_id`, `material_id`, `location_id`
- Purchase Orders: `supplier_id`, `status`
- Work Orders: `status`, `product_id`
- Inventory Transactions: `product_id`, `material_id`, `txn_type`, `wo_id`, `po_id`

## Data Models

### Product
```json
{
  "product_id": "uuid",
  "product_code": "string",
  "part_name": "string",
  "standard_cost": "number",
  "category": "RAW_MATERIAL|SEMI_FINISHED|FINISHED_GOOD",
  "oem_id": "uuid",
  "model_id": "uuid",
  "uom_id": "uuid",
  "created_at": "datetime"
}
```

### Material
```json
{
  "material_id": "uuid",
  "material_code": "string",
  "name": "string",
  "category": "RAW_MATERIAL|SEMI_FINISHED|FINISHED_GOOD",
  "uom_id": "uuid"
}
```

### Inventory
```json
{
  "inventory_id": "uuid",
  "product_id": "uuid",
  "material_id": "uuid",
  "quantity": "number",
  "location_id": "uuid",
  "batch_no": "string",
  "uom_id": "uuid",
  "status": "AVAILABLE|RESERVED|ISSUED|DAMAGED|QUARANTINE",
  "updated_at": "datetime"
}
```

### Purchase Order
```json
{
  "po_id": "uuid",
  "po_no": "string",
  "supplier_id": "uuid",
  "order_date": "datetime",
  "expected_date": "datetime",
  "status": "OPEN|PARTIALLY_RECEIVED|RECEIVED|CLOSED|CANCELLED",
  "created_by": "string",
  "created_at": "datetime"
}
```

### Work Order
```json
{
  "wo_id": "uuid",
  "wo_no": "string",
  "product_id": "uuid",
  "quantity": "number",
  "uom_id": "uuid",
  "priority": "number",
  "scheduled_start": "datetime",
  "scheduled_end": "datetime",
  "status": "PLANNED|IN_PROGRESS|COMPLETED|ON_HOLD|CANCELLED",
  "created_by": "string",
  "created_at": "datetime"
}
```

## Error Handling

The API uses consistent error handling:
- **400 Bad Request**: Validation errors or malformed requests
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate key violations (e.g., duplicate codes)
- **500 Internal Server Error**: Server-side errors

All errors include descriptive messages to help with debugging and user feedback.

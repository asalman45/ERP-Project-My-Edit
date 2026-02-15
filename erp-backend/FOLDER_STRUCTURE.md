# Inventory Management System - Folder Structure

## Complete API Structure

```
erp-backend/
├── src/
│   ├── services/
│   │   └── inventory.service.js          # Core business logic & atomic transactions
│   │
│   ├── controllers/
│   │   └── api/
│   │       └── inventory/
│   │           ├── stock-in.controller.js      # Raw material purchases
│   │           ├── stock-out.controller.js     # Production consumption
│   │           ├── wastage.controller.js       # Material wastage management
│   │           ├── finished-goods.controller.js # Finished goods production
│   │           ├── reentry.controller.js       # Wastage re-entry
│   │           └── current-stock.controller.js # Stock inquiries
│   │
│   ├── routes/
│   │   └── api/
│   │       ├── index.js                        # Main API router
│   │       └── inventory/
│   │           ├── index.js                    # Inventory API router
│   │           ├── stock-in.routes.js          # Stock in routes
│   │           ├── stock-out.routes.js         # Stock out routes
│   │           ├── wastage.routes.js           # Wastage routes
│   │           ├── finished-goods.routes.js    # Finished goods routes
│   │           ├── reentry.routes.js           # Re-entry routes
│   │           └── current-stock.routes.js     # Current stock routes
│   │
│   └── index.js                               # Main app with API routes
│
├── prisma/
│   ├── schema.prisma                          # Database models
│   └── seed.js                                # Sample data
│
├── INVENTORY_API_DOCUMENTATION.md             # Complete API documentation
└── FOLDER_STRUCTURE.md                        # This file
```

## API Endpoints Structure

```
/api/inventory/
├── health                                      # Health check
├── stock-in/
│   ├── /                                      # POST - Add inventory
│   └── /history                               # GET - Stock in history
├── stock-out/
│   ├── /                                      # POST - Reduce inventory
│   ├── /bulk                                  # POST - Bulk stock out
│   └── /history                               # GET - Stock out history
├── wastage/
│   ├── /                                      # POST - Record wastage
│   ├── /reentry                               # POST - Re-entry wastage
│   ├── /                                      # GET - Wastage records
│   └── /summary                               # GET - Wastage summary
├── finished-goods/
│   ├── /                                      # POST - Receive finished goods
│   ├── /bulk                                  # POST - Bulk receive
│   ├── /                                      # GET - Finished goods inventory
│   └── /history                               # GET - Receive history
├── reentry/
│   ├── /                                      # POST - Re-entry wastage
│   ├── /bulk                                  # POST - Bulk re-entry
│   ├── /history                               # GET - Re-entry history
│   └── /available                             # GET - Available wastage
└── current-stock/
    ├── /                                      # GET - Current stock (specific)
    ├── /all                                   # GET - All stock levels
    ├── /summary                               # GET - Inventory summary
    ├── /low-stock                             # GET - Low stock items
    └── /zero-stock                            # GET - Zero stock items
```

## Business Logic Flow

```
Manufacturing Process:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Raw Material   │───▶│  Production      │───▶│  Finished Goods │
│  Purchase       │    │  Consumption     │    │  Production     │
│  (Stock In)     │    │  (Stock Out)     │    │  (Receive)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │     Wastage      │             │
         │              │    Recording     │             │
         │              └──────────────────┘             │
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Wastage        │             │
         │              │   Re-entry       │             │
         │              │  (Optional)      │             │
         │              └──────────────────┘             │
         │                       │                       │
         │                       └───────────────────────┘
         │                                 │
         └─────────────────────────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │  Current Stock   │
                 │   Monitoring     │
                 └──────────────────┘
```

## Database Models Integration

```
Inventory Management Models:
├── Inventory                    # Current stock levels
├── InventoryTxn                 # All transactions
├── Wastage                      # Material wastage
├── Material                     # Raw materials
├── Product                      # Finished goods
├── Location                     # Storage locations
├── WorkOrder                    # Production orders
├── PurchaseOrder                # Purchase orders
└── UOM                          # Units of measure

Relationships:
Inventory ──┬── Material
            └── Product
            └── Location
            └── UOM

InventoryTxn ──┬── Inventory
               ├── Material/Product
               ├── WorkOrder/PurchaseOrder
               └── Location

Wastage ──┬── WorkOrder
          ├── Material
          ├── Location
          └── UOM
```

## Key Features

### ✅ Atomic Transactions
- All operations use Prisma `$transaction`
- Data consistency guaranteed
- Rollback on any failure

### ✅ Business Logic Validation
- Stock availability checks
- Negative stock prevention
- Quantity validation
- Location validation

### ✅ Complete Traceability
- Every operation logged
- Work order integration
- Purchase order integration
- Audit trail maintained

### ✅ Manufacturing Workflow Integration
- Raw material procurement
- Production consumption
- Wastage tracking
- Finished goods production
- Scrap re-entry

### ✅ RESTful API Design
- Clear endpoint structure
- Proper HTTP methods
- Consistent response format
- Error handling

This structure provides a complete, production-ready inventory management system with proper separation of concerns, atomic transactions, and comprehensive business logic validation.

<!-- b6cc83ce-84ae-49e7-a66f-738e2443c07b 80eb696b-eb03-459f-a2cc-f3c57c654621 -->
# Sales Order Enhancements Plan

## 1. Hierarchical Work Orders from Sales Order Items

**Current State**: `convertSalesOrderToWorkOrders` creates simple work orders (one per item)
**Target**: Each sales order item creates a hierarchical work order (master + child work orders from process flow)

**Changes Required**:

- Modify `erp-backend/src/models/salesOrder.model.js` → `convertSalesOrderToWorkOrders()` function (lines 564-741)
- Replace simple work order creation with hierarchical work order generation
- Call `createMasterWorkOrder()` from `hierarchicalWorkOrderService.js` for each item
- Then call `generateHierarchicalWOs()` or create child work orders based on process flow
- Update work order creation to include `sales_order_ref` and `customer` fields

## 2. Sales Order Number Format with Customer PO

**Current State**: Sales order number format is `SO-YYYYMMDD-timestamp-random`
**Target**: Format should be `SO
<!-- b6cc83ce-84ae-49e7-a66f-738e2443c07b 0bf85a3d-c571-4c95-b8a6-3f3478b7c629 -->
# Enhance Planned Production MRP and Sales Order Linking

## Problem Analysis

### Issue 1: MRP Not Calculating Purchase Inventory

- Current "MRP-Based" forecast only calculates finished goods production quantity
- Does not calculate raw material requirements from BOM
- Does not check raw material inventory levels
- Does not generate purchase requisitions for shortages

### Issue 2: Sales Order Linking Not Visible

- Backend matching logic exists but UI doesn't show linked sales orders
- No column to display linked sales order number
- No manual linking option in UI
- No visual indicators when plan is reserved/linked

## Solution

### 1. Enhance MRP-Based Forecast to Calculate Material Requirements

**Backend Changes:**

- Modify `forecastService.js` - `calculateMRPForecast()` to:
- Call existing MRP service (`mrpService.js` or `mrpApi.controller.js`) to calculate material requirements
- Check raw material inventory levels
- Include material shortage information in forecast response
- Optionally auto-generate purchase requisitions for critical shortages

**Files to Modify:**

- `erp-backend/src/services/forecastService.js` - Enhance `calculateMRPForecast()` function
- `erp-backend/src/models/plannedProduction.model.js` - Store material requirements in `forecast_data` JSONB field

**New API Endpoint:**

- `GET /api/planned-production/:id/material-requirements` - Get material requirements for a planned production

### 2. Add Material Requirements Display in UI

**Frontend Changes:**

- Add "Material Requirements" section in CreatePlannedProductionModal when MRP method is selected
- Show material shortages and available quantities
- Add button to "Generate Purchase Requisitions" from shortages
- Display material requirements in planned production details view

**Files to Modify:**

- `erp-frontend/src/pages/PlannedProduction/components/CreatePlannedProductionModal.tsx`
- `erp-frontend/src/pages/PlannedProduction/types.ts` - Add material requirements types

### 3. Improve Sales Order Linking Visibility

**Backend Changes:**

- Ensure `linked_sales_order_id` and `linked_sales_order_number` are returned in GET queries
- Add endpoint to manually link/unlink sales orders: `POST /api/planned-production/:id/link-sales-order`

**Frontend Changes:**

- Add "Linked Sales Order" column to Planned Productions table
- Show sales order number badge when linked
- Add "Link Sales Order" button in actions column
- Add modal to search and link sales orders manually
- Show reserved quantity breakdown (if partially reserved)

**Files to Modify:**

- `erp-frontend/src/pages/PlannedProduction/index.tsx` - Add column and linking UI
- `erp-frontend/src/pages/PlannedProduction/components/LinkSalesOrderModal.tsx` - New component
- `erp-frontend/src/pages/PlannedProduction/api.ts` - Add link/unlink endpoints
- `erp-backend/src/controllers/plannedProduction.controller.js` - Add manual link endpoint
- `erp-backend/src/models/plannedProduction.model.js` - Ensure sales order number is joined in queries

## Implementation Steps

1. Enhance MRP forecast calculation to include material requirements
2. Add material requirements display in create modal
3. Add purchase requisition generation from material shortages
4. Add sales order number column to table
5. Add manual sales order linking UI
6. Add material requirements API endpoint
7. Update types and API service

### To-dos

- [x] Create database migration for planned_production table with start_date (required), end_date (nullable, auto-set), delivery_date (nullable, auto-set)
- [x] Create plannedProduction.model.js with CRUD functions and markProductionCompleted()/markDelivered() functions
- [x] Create forecastService.js for forecast calculations with start_date suggestions
- [x] Create plannedProductionMatching.service.js for SO matching logic
- [x] Create plannedProduction.controller.js with all API endpoints (end_date and delivery_date not user-editable)
- [x] Create plannedProduction.routes.js and register in index.js
- [x] Create frontend types and API service for planned production
- [x] Create PlannedProduction list page with start_date, end_date, delivery_date columns
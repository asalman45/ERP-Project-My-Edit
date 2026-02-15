# Enhanced BOM (Bill of Materials) System Documentation

## Overview

This document describes the enhanced BOM system implemented to handle the complex manufacturing requirements shown in the Ghandhara Industries Ltd spreadsheet. The system supports sub-assemblies, blank specifications, material consumption calculations, process flows, and scrap/reusable material management.

## Key Features

### 1. Sub-Assembly Management
- **Hierarchical BOM Structure**: Support for multiple sub-assemblies per product (Main, Sides, Rubber, Strip, Clamp1, Clamp2, etc.)
- **Step Sequencing**: Order of operations for manufacturing processes
- **Optional Components**: Mark components as optional in the BOM

### 2. Blank Specifications
- **Detailed Dimensions**: Width, Length, Thickness in mm
- **Material Consumption**: Sheet utilization percentages, pieces per sheet
- **Weight Calculations**: Automatic weight calculation based on dimensions and material density
- **Sheet Optimization**: Support for different sheet sizes (4x8, 5x10, 6x12 feet)

### 3. Material Consumption Tracking
- **Sheet Utilization**: Calculate optimal cutting patterns
- **Waste Analysis**: Track material waste and consumption efficiency
- **Cost Optimization**: Identify cost-saving opportunities through better material usage

### 4. Process Flow Management
- **Manufacturing Steps**: Define complete production workflows
- **Alternative Paths**: Support for different manufacturing routes
- **Work Center Assignment**: Link operations to specific work centers
- **Duration and Cost Tracking**: Estimate production time and costs

### 5. Scrap/Reusable Material Integration
- **Scrap Inventory**: Track leftover materials from production
- **Reusability Analysis**: Identify scrap that can be reused for other products
- **Cost Savings**: Calculate savings from using scrap materials
- **Waste Reduction**: Optimize material usage to minimize waste

## Database Schema Enhancements

### Enhanced BOM Table
```sql
ALTER TABLE bom ADD COLUMN sub_assembly_name VARCHAR(255);
ALTER TABLE bom ADD COLUMN step_sequence INTEGER;
ALTER TABLE bom ADD COLUMN is_optional BOOLEAN DEFAULT FALSE;
ALTER TABLE bom ADD COLUMN uom_id VARCHAR(255);
```

### Enhanced BlankSpec Table
```sql
ALTER TABLE blank_spec ADD COLUMN sub_assembly_name VARCHAR(255);
ALTER TABLE blank_spec ADD COLUMN quantity INTEGER DEFAULT 1;
ALTER TABLE blank_spec ADD COLUMN sheet_type VARCHAR(50);
ALTER TABLE blank_spec ADD COLUMN total_blanks DECIMAL(10,2);
ALTER TABLE blank_spec ADD COLUMN consumption_pct DECIMAL(5,2);
ALTER TABLE blank_spec ADD COLUMN material_density DECIMAL(10,2);
```

### New MaterialConsumption Table
```sql
CREATE TABLE material_consumption (
  consumption_id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) NOT NULL,
  sub_assembly_name VARCHAR(255),
  sheet_type VARCHAR(50) NOT NULL,
  sheet_width_mm DECIMAL(10,2),
  sheet_length_mm DECIMAL(10,2),
  sheet_weight_kg DECIMAL(10,2),
  blank_width_mm DECIMAL(10,2),
  blank_length_mm DECIMAL(10,2),
  blank_thickness_mm DECIMAL(10,2),
  blank_weight_kg DECIMAL(10,2),
  pieces_per_sheet INTEGER,
  utilization_pct DECIMAL(5,2),
  total_blanks DECIMAL(10,2),
  consumption_pct DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Enhanced Routing Table
```sql
ALTER TABLE routing ADD COLUMN is_primary_path BOOLEAN DEFAULT TRUE;
ALTER TABLE routing ADD COLUMN alternative_path_id VARCHAR(255);
ALTER TABLE routing ADD COLUMN description TEXT;
```

## API Endpoints

### BOM Management
- `GET /api/bom/:productId/sub-assemblies` - Get BOM with sub-assembly breakdown
- `POST /api/bom/:productId/sub-assemblies` - Add sub-assembly to BOM
- `POST /api/bom/:productId/calculate-consumption` - Calculate material consumption
- `GET /api/bom/:productId/process-flow` - Get manufacturing process flow
- `GET /api/bom/:productId/reusable-materials` - Get reusable materials for product
- `POST /api/bom/:productId/optimize-usage` - Optimize material usage

### Blank Specifications
- `GET /api/blank-specs/product/:productId` - Get blank specifications for product
- `POST /api/blank-specs/` - Create blank specification
- `POST /api/blank-specs/product/:productId/calculate-utilization` - Calculate sheet utilization
- `POST /api/blank-specs/product/:productId/optimize-cutting` - Optimize cutting patterns
- `POST /api/blank-specs/:blankId/generate-scrap` - Generate scrap from production

### Process Flow Management
- `GET /api/process-flows/product/:productId` - Get process flow for product
- `POST /api/process-flows/product/:productId` - Create process flow
- `POST /api/process-flows/product/:productId/alternative` - Create alternative path
- `GET /api/process-flows/product/:productId/with-materials` - Get process flow with materials
- `GET /api/process-flows/product/:productId/validate` - Validate process flow
- `GET /api/process-flows/product/:productId/statistics` - Get process flow statistics

### Scrap Inventory Management
- `GET /api/scrap-inventory/` - Get scrap inventory
- `POST /api/scrap-inventory/` - Create scrap item
- `GET /api/scrap-inventory/available` - Get available scrap
- `POST /api/scrap-inventory/find-matching` - Find matching scrap for dimensions
- `PATCH /api/scrap-inventory/:scrapId/consume` - Mark scrap as consumed
- `GET /api/scrap-inventory/summary` - Get scrap summary

### Import/Export
- `POST /api/bom-import/import` - Import BOM from Excel
- `POST /api/bom-import/validate` - Validate import data
- `GET /api/bom-import/export/:productId` - Export BOM to Excel

## Usage Examples

### 1. Creating a BOM with Sub-Assemblies

```javascript
// Add sub-assembly to BOM
const response = await fetch('/api/bom/PRODUCT_ID/sub-assemblies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    material_id: 'MATERIAL_ID',
    sub_assembly_name: 'Main',
    quantity: 1,
    step_sequence: 1,
    is_optional: false,
    uom_id: 'UOM_ID'
  })
});
```

### 2. Creating Blank Specifications

```javascript
// Create blank specification
const response = await fetch('/api/blank-specs/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 'PRODUCT_ID',
    sub_assembly_name: 'Main',
    width_mm: 170,
    length_mm: 760,
    thickness_mm: 3,
    quantity: 1,
    sheet_type: '4x8',
    material_density: 7850, // kg/m³ for steel
    created_by: 'user_id'
  })
});
```

### 3. Calculating Material Consumption

```javascript
// Calculate material consumption
const response = await fetch('/api/bom/PRODUCT_ID/calculate-consumption', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sheetType: '4x8',
    sheetWidth: 1219, // mm
    sheetLength: 2438  // mm
  })
});
```

### 4. Optimizing Material Usage

```javascript
// Optimize material usage with scrap
const response = await fetch('/api/bom/PRODUCT_ID/optimize-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prioritizeScrap: true,
    sheetType: '4x8'
  })
});
```

### 5. Creating Process Flow

```javascript
// Create process flow
const response = await fetch('/api/process-flows/product/PRODUCT_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    steps: [
      { step_no: 1, operation: 'Calling/Shearing', work_center: 'Cutting', duration: 30 },
      { step_no: 2, operation: 'Forming', work_center: 'Forming', duration: 45 },
      { step_no: 3, operation: 'Piercing 1', work_center: 'Piercing', duration: 20 },
      { step_no: 4, operation: 'Piercing 2', work_center: 'Piercing', duration: 20 },
      { step_no: 5, operation: 'Cleaning', work_center: 'Cleaning', duration: 15 },
      { step_no: 6, operation: 'Paint', work_center: 'Painting', duration: 30 },
      { step_no: 7, operation: 'Dispatch', work_center: 'Dispatch', duration: 10 }
    ],
    isPrimary: true
  })
});
```

## Excel Import/Export

### Import Format
The system supports importing data from Excel spreadsheets with the following columns:
- Part No / Part Number
- Part Description
- Mode
- Sub Assemblies
- W / Width
- L / Length
- t / Thickness
- Qty / Quantity
- Weight of the blank
- 4x8 Sheet Consumpti (%)
- 4x8 Sheet Weight
- No of Pcs/She
- Total Blanks

### Export Format
The system can export BOM data to Excel with all the enhanced fields including:
- Sub-assembly breakdown
- Blank specifications
- Material consumption data
- Process flow information

## Integration with Existing Systems

### Inventory Management
- **Material Reservation**: Reserve materials based on BOM requirements
- **Stock Level Alerts**: Monitor material availability for production
- **Batch Tracking**: Track material consumption by work order

### Production Planning
- **Work Order Integration**: Auto-generate material requirements from BOM
- **Process Flow Execution**: Track progress through manufacturing steps
- **Quality Control**: Link process steps to quality checkpoints

### Procurement
- **Material Planning**: Generate purchase requisitions based on BOM consumption
- **Supplier Management**: Link materials to preferred suppliers
- **Cost Analysis**: Track material costs and consumption efficiency

## Benefits

1. **Improved Material Utilization**: Better sheet cutting patterns and waste reduction
2. **Cost Optimization**: Use of scrap materials and optimized material consumption
3. **Production Efficiency**: Clear process flows and material requirements
4. **Data Accuracy**: Comprehensive tracking of all material movements
5. **Scalability**: Support for complex manufacturing processes with multiple sub-assemblies

## Future Enhancements

1. **AI-Powered Optimization**: Machine learning algorithms for cutting pattern optimization
2. **Real-Time Monitoring**: Live tracking of material consumption during production
3. **Predictive Analytics**: Forecast material requirements based on production schedules
4. **Mobile Support**: Mobile apps for shop floor material tracking
5. **Integration with CAD**: Direct import from CAD systems for blank specifications

## Conclusion

The enhanced BOM system provides a comprehensive solution for managing complex manufacturing processes with detailed material consumption tracking, process flow management, and scrap/reusable material integration. This system addresses all the requirements shown in the Ghandhara Industries Ltd spreadsheet while maintaining compatibility with the existing ERP structure.

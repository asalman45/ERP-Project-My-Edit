# Testing Raw Materials Import Functionality

## Prerequisites

1. **Backend server running** on `http://localhost:4000`
2. **Frontend server running** on `http://localhost:5173` (or configured port)
3. **Database connected** and UOM codes exist (KG, PC, MTR, etc.)

## Test Files Created

- `test-raw-materials-import.csv` - Sample CSV file with test data
- `test-raw-material-import.ps1` - PowerShell test script
- `test-raw-material-import.sh` - Bash test script

## Method 1: Manual Testing via UI (Recommended)

### Steps:

1. **Start Backend Server**
   ```bash
   cd erp-backend
   npm run dev
   ```
   Should be running on `http://localhost:4000`

2. **Start Frontend Server**
   ```bash
   cd erp-frontend
   npm run dev
   ```
   Should be running on `http://localhost:5173` (or configured port)

3. **Navigate to Raw Materials Page**
   - Open browser: `http://localhost:5173`
   - Navigate to: **Raw Materials** page
   - Click the **"Import"** button

4. **Test Import**
   - Click **"Download Template"** to see the expected format
   - Use the provided `test-raw-materials-import.csv` file
   - Click **"Choose File"** and select `test-raw-materials-import.csv`
   - Click **"Import Data"**
   - Verify success message and imported count

5. **Verify Results**
   - Check that imported materials appear in the Raw Materials list
   - Verify all fields are populated correctly (material_code, name, description, UOM)

## Method 2: API Testing via PowerShell

### Windows PowerShell:

```powershell
# Navigate to project root
cd D:\EmpclERP

# Run test script
.\test-raw-material-import.ps1
```

### Manual PowerShell Test:

```powerscript
$csvFile = "test-raw-materials-import.csv"
$formData = @{
    file = Get-Item -Path $csvFile
}

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/raw-materials/import" `
    -Method Post `
    -Form $formData

$response | ConvertTo-Json -Depth 10
```

## Method 3: API Testing via cURL

### Windows (using Git Bash or WSL):

```bash
curl -X POST http://localhost:4000/api/raw-materials/import \
  -F "file=@test-raw-materials-import.csv" \
  -H "Content-Type: multipart/form-data"
```

### Using Postman:

1. **Method**: POST
2. **URL**: `http://localhost:4000/api/raw-materials/import`
3. **Body**: 
   - Select `form-data`
   - Key: `file` (type: File)
   - Value: Select `test-raw-materials-import.csv`
4. **Send** request

## Expected Response

### Success Response:
```json
{
  "success": true,
  "message": "Successfully imported 5 raw materials",
  "data": {
    "imported": 5,
    "total": 5,
    "errors": 0,
    "errorDetails": []
  }
}
```

### Error Response (if UOM codes don't exist):
```json
{
  "success": true,
  "message": "Successfully imported 3 raw materials",
  "data": {
    "imported": 3,
    "total": 5,
    "errors": 2,
    "errorDetails": [
      "Row 3: UOM code 'MTR' not found",
      "Row 4: UOM code 'PC' not found"
    ]
  }
}
```

## Test Scenarios

### Scenario 1: Valid Import
- **File**: `test-raw-materials-import.csv`
- **Expected**: All 5 materials imported successfully
- **Prerequisite**: UOM codes (KG, PC, MTR) must exist in database

### Scenario 2: Duplicate Material Code
- **Action**: Import same file twice
- **Expected**: Second import should skip duplicates with error message
- **Response**: `"Material code 'STEEL-001' already exists"`

### Scenario 3: Missing Required Fields
- **File**: Create CSV with missing `material_code` or `name`
- **Expected**: Row should be skipped with error message
- **Response**: `"Row X: material_code and name are required"`

### Scenario 4: Invalid UOM Code
- **File**: Use non-existent UOM code (e.g., `INVALID-UOM`)
- **Expected**: Row should be skipped with error message
- **Response**: `"Row X: UOM code 'INVALID-UOM' not found"`

### Scenario 5: Excel File Import
- **File**: Convert CSV to Excel (.xlsx)
- **Expected**: Should work the same as CSV import

## Troubleshooting

### Issue: "No file uploaded"
- **Cause**: File not attached correctly
- **Solution**: Ensure file is selected and FormData is sent correctly

### Issue: "CSV file is empty"
- **Cause**: File has no data rows
- **Solution**: Check CSV file has data rows (not just headers)

### Issue: "UOM code not found"
- **Cause**: UOM codes don't exist in database
- **Solution**: Create UOM codes first:
  ```sql
  INSERT INTO uom (uom_id, code, name) VALUES 
  (gen_random_uuid(), 'KG', 'Kilogram'),
  (gen_random_uuid(), 'PC', 'Piece'),
  (gen_random_uuid(), 'MTR', 'Meter');
  ```

### Issue: "Material code already exists"
- **Cause**: Material code already in database
- **Solution**: Use different material codes or delete existing ones

### Issue: CORS Error
- **Cause**: Frontend and backend on different origins
- **Solution**: Check backend CORS configuration allows frontend origin

## Verification Checklist

- [ ] Backend server running on port 4000
- [ ] Frontend server running
- [ ] Test CSV file exists
- [ ] UOM codes exist in database (KG, PC, MTR)
- [ ] Import button visible on Raw Materials page
- [ ] File upload works
- [ ] Import completes successfully
- [ ] Materials appear in list after import
- [ ] Error handling works (test with invalid data)
- [ ] Template download works

## Next Steps After Testing

1. **Verify Data**: Check imported materials in database:
   ```sql
   SELECT rm.*, u.code as uom_code 
   FROM raw_material rm 
   LEFT JOIN uom u ON rm.uom_id = u.uom_id 
   WHERE rm.material_code LIKE 'TEST-%';
   ```

2. **Clean Up**: Remove test data if needed:
   ```sql
   DELETE FROM raw_material WHERE material_code LIKE 'TEST-%';
   ```

3. **Production Ready**: Once tested, the import feature is ready for production use!


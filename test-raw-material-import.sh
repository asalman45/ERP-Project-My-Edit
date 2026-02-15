#!/bin/bash

# Test Raw Materials Import API
# Make sure backend is running on http://localhost:4000

echo "Testing Raw Materials Import API..."
echo "=================================="
echo ""

# Test 1: Check if endpoint exists
echo "Test 1: Checking endpoint availability..."
curl -X POST http://localhost:4000/api/raw-materials/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-raw-materials-import.csv" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received (may not be JSON)"

echo ""
echo "=================================="
echo "Test completed!"
echo ""
echo "Expected response format:"
echo '{
  "success": true,
  "message": "Successfully imported X raw materials",
  "data": {
    "imported": X,
    "total": X,
    "errors": 0,
    "errorDetails": []
  }
}'


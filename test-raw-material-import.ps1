# PowerShell script to test Raw Materials Import API
# Make sure backend is running on http://localhost:4000

Write-Host "Testing Raw Materials Import API..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Import CSV file
Write-Host "Test 1: Importing CSV file..." -ForegroundColor Yellow

$csvFile = "test-raw-materials-import.csv"
if (-not (Test-Path $csvFile)) {
    Write-Host "Error: Test CSV file not found: $csvFile" -ForegroundColor Red
    exit 1
}

try {
    $formData = @{
        file = Get-Item -Path $csvFile
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/raw-materials/import" `
        -Method Post `
        -Form $formData `
        -ErrorAction Stop
    
    Write-Host "Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "Imported: $($response.data.imported) materials" -ForegroundColor Green
    Write-Host "Total: $($response.data.total)" -ForegroundColor Green
    Write-Host "Errors: $($response.data.errors)" -ForegroundColor $(if ($response.data.errors -eq 0) { "Green" } else { "Yellow" })
    
    if ($response.data.errorDetails.Count -gt 0) {
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        $response.data.errorDetails | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test completed!" -ForegroundColor Cyan


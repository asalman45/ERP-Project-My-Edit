# PowerShell script to test Raw Materials Import with HS Code
$csvFile = "test-raw-materials-hs.csv"
Write-Host "Importing $csvFile..." -ForegroundColor Yellow

$formData = @{
    file = Get-Item -Path $csvFile
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/raw-materials/import" -Method Post -Form $formData
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

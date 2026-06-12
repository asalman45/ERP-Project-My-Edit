# =============================================================================
# EMPCL ERP — Local Database Sync Script (Windows PowerShell)
# File: sync-db-local.ps1 (Project Root)
# Usage: .\sync-db-local.ps1
# =============================================================================

$SERVER_IP = "143.110.183.65"
$SERVER_PATH = "/root/empcl-erp/erp_prod_db.sql"
$LOCAL_FILE = "erp_prod_db.sql"

Write-Host ">>> Connecting to server ($SERVER_IP) to generate a fresh database dump..." -ForegroundColor Cyan
ssh root@$SERVER_IP "docker exec empcl-erp-postgres pg_dump -U empcl_user erp_db > $SERVER_PATH"

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Database dump generated successfully on the server." -ForegroundColor Green
} else {
    Write-Error "Failed to generate database dump on the server!"
    exit 1
}

Write-Host ">>> Downloading database dump to local machine..." -ForegroundColor Cyan
scp root@$($SERVER_IP):$SERVER_PATH ./$LOCAL_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Database dump downloaded successfully: $LOCAL_FILE" -ForegroundColor Green
} else {
    Write-Error "Failed to download database dump!"
    exit 1
}

Write-Host ">>> Importing database dump into local PostgreSQL..." -ForegroundColor Cyan
if (Test-Path "import-db-local.ps1") {
    .\import-db-local.ps1 ./$LOCAL_FILE
} else {
    Write-Error "import-db-local.ps1 script not found!"
    exit 1
}

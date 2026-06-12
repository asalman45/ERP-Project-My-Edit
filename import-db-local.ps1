# =============================================================================
# EMPCL ERP — Local Database Import Script (Windows PowerShell)
# File: import-db-local.ps1 (Project Root)
# Usage: .\import-db-local.ps1 <path_to_sql_dump>
# =============================================================================

param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$DumpFile
)

# Load .env.local variables
if (Test-Path ".env.local") {
    Get-Content .env.local | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value)
    }
} else {
    Write-Error ".env.local file not found in root directory!"
    exit 1
}

$DB_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "empcl_user" }
$DB_NAME = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "erp_db" }
$CONTAINER_NAME = "empcl-local-postgres"

if (!(Test-Path $DumpFile)) {
    Write-Error "Database dump file '$DumpFile' not found!"
    exit 1
}

Write-Host ">>> Verifying local database container ($CONTAINER_NAME) is running..." -ForegroundColor Cyan
$runningContainers = docker ps --format '{{.Names}}'
if ($runningContainers -split "`n" | Where-Object { $_.Trim() -eq $CONTAINER_NAME } | Measure-Object | Select-Object -ExpandProperty Count -eq 0) {
    if ($runningContainers -notmatch $CONTAINER_NAME) {
        Write-Error "Container '$CONTAINER_NAME' is not running!"
        Write-Host "Please start local services first: docker compose -f docker-compose.local.yml --env-file .env.local up -d" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ">>> Wiping existing schema in local database ($DB_NAME)..." -ForegroundColor Yellow
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

Write-Host ">>> Importing database dump from '$DumpFile'..." -ForegroundColor Yellow
Get-Content $DumpFile -Raw | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Database imported successfully!" -ForegroundColor Green
} else {
    Write-Error "Database import failed!"
}

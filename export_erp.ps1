# =============================================================================
# EMPCL ERP — Export Migration Script (Windows PowerShell)
# File: export_erp.ps1 (Project Root)
# =============================================================================

# 1. Configuration (Values identified from environment)
$TRANSFER_DIR = "EMPCL-GoogleDrive-Transfer"
$DB_CONTAINER = "empcl-erp-postgres"
$BACKEND_CONTAINER = "empcl-erp-backend"
$FRONTEND_CONTAINER = "empcl-erp-frontend"
$BACKUP_FILE = "empcl_db_backup.sql"
$BACKEND_IMAGE = "empcl-erp-backend"
$FRONTEND_IMAGE = "empcl-erp-frontend"
$POSTGRES_IMAGE = "postgres:15"
$COMPOSE_FILE = "docker-compose.production.yml"
$ENV_FILE = ".env.production"
$DB_USER = "empcl_user"
$DB_NAME = "erp_db"

Write-Host ">>> Starting ERP Migration Export..." -ForegroundColor Cyan

# 2. Create the transfer directory
if (!(Test-Path $TRANSFER_DIR)) {
    Write-Host ">>> Creating directory: $TRANSFER_DIR"
    New-Item -ItemType Directory -Path $TRANSFER_DIR
} else {
    Write-Host ">>> Directory $TRANSFER_DIR already exists."
}

# 3. Export PostgreSQL database
Write-Host ">>> Exporting database data ($DB_NAME)..." -ForegroundColor Yellow
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$TRANSFER_DIR\$BACKUP_FILE"
if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Database exported successfully: $BACKUP_FILE" -ForegroundColor Green
} else {
    Write-Host ">>> [ERROR] Database export failed!" -ForegroundColor Red
    exit 1
}

# 4. Export Docker images
Write-Host ">>> Saving Docker images into .tar files (this may take a few minutes)..." -ForegroundColor Yellow

Write-Host ">>> Saving $BACKEND_IMAGE..."
docker save $BACKEND_IMAGE -o "$TRANSFER_DIR\backend_image.tar"

Write-Host ">>> Saving $FRONTEND_IMAGE..."
docker save $FRONTEND_IMAGE -o "$TRANSFER_DIR\frontend_image.tar"

Write-Host ">>> Saving $POSTGRES_IMAGE..."
docker save $POSTGRES_IMAGE -o "$TRANSFER_DIR\postgres_image.tar"

Write-Host ">>> Docker images saved successfully." -ForegroundColor Green

# 5. Copy orchestration files
Write-Host ">>> Copying Docker Compose and .env files..." -ForegroundColor Yellow
Copy-Item $COMPOSE_FILE "$TRANSFER_DIR\$COMPOSE_FILE"
Copy-Item $ENV_FILE "$TRANSFER_DIR\$ENV_FILE"

# 6. Generate the import_erp.ps1 script
Write-Host ">>> Generating import_erp.ps1 for the destination PC..." -ForegroundColor Yellow

$IMPORT_SCRIPT_CONTENT = @"
# =============================================================================
# EMPCL ERP — Import Migration Script (Windows PowerShell)
# File: EMPCL-GoogleDrive-Transfer/import_erp.ps1
# =============================================================================

Write-Host ">>> Starting ERP Migration Import..." -ForegroundColor Cyan

# 1. Load Docker images from .tar files
Write-Host ">>> Loading Docker images (this may take a few minutes)..." -ForegroundColor Yellow
docker load -i backend_image.tar
docker load -i frontend_image.tar
docker load -i postgres_image.tar

# 2. Start the containers
Write-Host ">>> Starting containers using Docker Compose..." -ForegroundColor Yellow
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# 3. Wait for the database to initialize
Write-Host ">>> Waiting 15 seconds for the database to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 4. Restore database data
Write-Host ">>> Restoring database data from backup..." -ForegroundColor Yellow
Get-Content $BACKUP_FILE | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
if (`$LASTEXITCODE -eq 0) {
    Write-Host ">>> Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host ">>> [ERROR] Database restoration failed!" -ForegroundColor Red
}

Write-Host ">>> ERP Migration Import Complete!" -ForegroundColor Green
"@

Set-Content -Path "$TRANSFER_DIR\import_erp.ps1" -Value $IMPORT_SCRIPT_CONTENT

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ">>> DONE! Migration folder is ready: $TRANSFER_DIR" -ForegroundColor Green
Write-Host ">>> ACTION: Simply upload the '$TRANSFER_DIR' folder to Google Drive."
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

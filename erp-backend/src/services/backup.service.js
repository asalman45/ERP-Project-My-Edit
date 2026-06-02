import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');

// Retention policy: delete backups older than 30 days
const RETENTION_DAYS = 30;

/**
 * Ensure the backups directory exists
 */
function ensureBackupsDir() {
    if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
}

/**
 * Format a Date to YYYY-MM-DD_HH-MM
 */
function formatTimestamp(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

/**
 * Execute the PostgreSQL pg_dump command
 */
export function runBackup() {
    return new Promise((resolve, reject) => {
        ensureBackupsDir();

        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || '5432';
        const dbUser = process.env.DB_USER || 'empcl_user';
        const dbPassword = process.env.DB_PASSWORD || 'empcl_pass123';
        const dbName = process.env.DB_NAME || 'erp_db';

        const timestamp = formatTimestamp(new Date());
        const fileName = `empcl_backup_${timestamp}.sql`;
        const filePath = path.join(BACKUPS_DIR, fileName);

        // Use PGPASSWORD env var for non-interactive auth
        const env = { ...process.env, PGPASSWORD: dbPassword };
        const cmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filePath}"`;

        logger.info({ cmd: `pg_dump -> ${fileName}` }, 'Starting database backup...');

        exec(cmd, { env, timeout: 300000 }, (error, stdout, stderr) => {
            if (error) {
                logger.error({ error: error.message, stderr }, 'Database backup FAILED');
                reject(error);
                return;
            }

            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            logger.info({ file: fileName, sizeMB }, 'Database backup completed successfully');
            resolve({ fileName, filePath, sizeMB });
        });
    });
}

/**
 * Clean up backup files older than RETENTION_DAYS
 */
export function cleanOldBackups() {
    ensureBackupsDir();

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(BACKUPS_DIR);
    let deletedCount = 0;

    for (const file of files) {
        if (!file.startsWith('empcl_backup_') || !file.endsWith('.sql')) continue;

        const fullPath = path.join(BACKUPS_DIR, file);
        const stat = fs.statSync(fullPath);

        if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(fullPath);
            deletedCount++;
            logger.info({ file }, 'Deleted old backup (retention policy)');
        }
    }

    if (deletedCount > 0) {
        logger.info({ deletedCount }, `Retention cleanup: removed ${deletedCount} old backup(s)`);
    }
}

/**
 * Initialize the backup cron job — runs every night at 2:00 AM
 * Call this from the main server startup.
 */
export async function initBackupCron() {
    try {
        // Dynamic import of node-cron since it may not be installed yet
        const cron = await import('node-cron');

        // Schedule: "At 02:00 every day"
        cron.default.schedule('0 2 * * *', async () => {
            logger.info('Cron triggered: nightly database backup');
            try {
                // Clean old backups first
                cleanOldBackups();
                // Run backup
                await runBackup();
            } catch (err) {
                logger.error({ error: err.message }, 'Scheduled backup failed');
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Karachi', // Pakistan Standard Time
        });

        logger.info('Backup cron job initialized — schedule: every day at 02:00 AM PKT');
    } catch (err) {
        logger.warn({ error: err.message }, 'node-cron not available — backup cron job NOT started. Install with: npm install node-cron');
    }
}

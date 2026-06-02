import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * POST /api/upload
 * Upload a single file. Returns the file metadata.
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file provided.' });
        }

        const { originalname, mimetype, filename, size } = req.file;
        // Build a relative path for storage and URL access
        const subDir = mimetype.startsWith('image/') ? 'images' : 'documents';
        const filePath = `/uploads/${subDir}/${filename}`;

        res.json({
            success: true,
            data: {
                file_name: originalname,
                file_path: filePath,
                file_type: mimetype,
                file_size: size,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'File upload failed.' });
    }
};

/**
 * POST /api/attachments
 * Create an attachment record linking a file to a transaction.
 * Body: { file_name, file_path, file_type, purchase_order_id?, grn_id?, sales_invoice_id?, ap_invoice_id?, journal_entry_id? }
 */
export const createAttachment = async (req, res) => {
    try {
        const {
            file_name,
            file_path,
            file_type,
            purchase_order_id,
            grn_id,
            sales_invoice_id,
            ap_invoice_id,
            journal_entry_id,
        } = req.body;

        if (!file_name || !file_path || !file_type) {
            return res.status(400).json({ success: false, error: 'file_name, file_path, and file_type are required.' });
        }

        const attachment = await prisma.attachment.create({
            data: {
                file_name,
                file_path,
                file_type,
                uploaded_by: req.user?.userId || req.user?.user_id || null,
                purchase_order_id: purchase_order_id || null,
                grn_id: grn_id || null,
                sales_invoice_id: sales_invoice_id || null,
                ap_invoice_id: ap_invoice_id || null,
                journal_entry_id: journal_entry_id || null,
            },
        });

        res.status(201).json({ success: true, data: attachment });
    } catch (error) {
        console.error('Create attachment error:', error);
        res.status(500).json({ success: false, error: 'Failed to create attachment.' });
    }
};

/**
 * GET /api/attachments
 * List attachments filtered by transaction FK.
 * Query params: purchase_order_id, grn_id, sales_invoice_id, ap_invoice_id, journal_entry_id
 */
export const listAttachments = async (req, res) => {
    try {
        const { purchase_order_id, grn_id, sales_invoice_id, ap_invoice_id, journal_entry_id } = req.query;

        const where = {};
        if (purchase_order_id) where.purchase_order_id = purchase_order_id;
        if (grn_id) where.grn_id = grn_id;
        if (sales_invoice_id) where.sales_invoice_id = sales_invoice_id;
        if (ap_invoice_id) where.ap_invoice_id = ap_invoice_id;
        if (journal_entry_id) where.journal_entry_id = journal_entry_id;

        const attachments = await prisma.attachment.findMany({
            where,
            include: {
                uploader: {
                    select: { user_id: true, name: true, username: true },
                },
            },
            orderBy: { uploaded_at: 'desc' },
        });

        res.json({ success: true, data: attachments });
    } catch (error) {
        console.error('List attachments error:', error);
        res.status(500).json({ success: false, error: 'Failed to list attachments.' });
    }
};

/**
 * DELETE /api/attachments/:id
 * Remove an attachment record and its file from disk.
 */
export const deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({ where: { id } });
        if (!attachment) {
            return res.status(404).json({ success: false, error: 'Attachment not found.' });
        }

        // Delete file from disk
        const ROOT_DIR = path.resolve(__dirname, '..', '..');
        const fullPath = path.join(ROOT_DIR, attachment.file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Delete DB record
        await prisma.attachment.delete({ where: { id } });

        res.json({ success: true, message: 'Attachment deleted successfully.' });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete attachment.' });
    }
};

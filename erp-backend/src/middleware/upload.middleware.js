import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Ensure upload directories exist
const IMAGES_DIR = path.join(ROOT_DIR, 'uploads', 'images');
const DOCUMENTS_DIR = path.join(ROOT_DIR, 'uploads', 'documents');

fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });

// MIME types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES];

// Dynamic storage: images go to /uploads/images, docs go to /uploads/documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = IMAGE_TYPES.includes(file.mimetype) ? IMAGES_DIR : DOCUMENTS_DIR;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_TYPES.join(', ')}`), false);
    }
};

// General upload (single file)
export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file');

// Multiple files upload (up to 5)
export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).array('files', 5);

export { IMAGE_TYPES, DOCUMENT_TYPES, ALLOWED_TYPES };

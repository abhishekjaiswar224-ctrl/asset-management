import express from 'express';
import multer from 'multer';
import { uploadFile, getUploadHistory, getFileUrl } from '../controllers/fileController.js';
import { verifyToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', verifyToken, authorizeRole(['admin', 'employee']), upload.single('file'), uploadFile);
router.get('/history', verifyToken, authorizeRole(['admin', 'employee']), getUploadHistory);
router.get('/url/:id', verifyToken, authorizeRole(['admin', 'employee']), getFileUrl);

export default router;

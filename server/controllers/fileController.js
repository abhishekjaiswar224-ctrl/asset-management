import pool from '../db.js';
import { uploadToS3, getPresignedUrl } from '../utils/s3.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const empId = req.user.emp_id; // From authMiddleware

    // Validate file type (Excel)
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only Excel files are allowed' });
    }

    const fileExtension = path.extname(file.originalname);
    const s3Key = `uploads/${uuidv4()}${fileExtension}`;

    // Upload to S3
    await uploadToS3(file.buffer, s3Key, file.mimetype);

    // Ensure table exists (for robust deployment)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(255) NOT NULL,
        uploaded_by VARCHAR(50) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Store metadata in DB
    const [result] = await pool.query(
      'INSERT INTO file_uploads (file_name, s3_key, uploaded_by) VALUES (?, ?, ?)',
      [file.originalname, s3Key, empId]
    );

    logger.info('File uploaded successfully', { fileName: file.originalname, empId });

    res.status(201).json({ 
      message: 'File uploaded successfully',
      fileId: result.insertId,
      fileName: file.originalname
    });
  } catch (error) {
    logger.error('Error uploading file', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
};

export const getUploadHistory = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    
    let query = 'SELECT * FROM file_uploads WHERE 1=1';
    const queryParams = [];

    if (startDate) {
      query += ' AND DATE(upload_date) >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(upload_date) <= ?';
      queryParams.push(endDate);
    }

    if (search) {
      query += ' AND (file_name LIKE ? OR uploaded_by LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY upload_date DESC';

    const [rows] = await pool.query(query, queryParams);
    
    res.json(rows);
  } catch (error) {
    logger.error('Error fetching upload history', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch upload history' });
  }
};

export const getFileUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query('SELECT s3_key, file_name FROM file_uploads WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const { s3_key, file_name } = rows[0];
    const url = await getPresignedUrl(s3_key);
    
    logger.info('Generated presigned URL', { fileId: id, empId: req.user.emp_id });

    res.json({ url, fileName: file_name });
  } catch (error) {
    logger.error('Error generating file URL', { error: error.message });
    res.status(500).json({ message: 'Failed to generate file URL' });
  }
};

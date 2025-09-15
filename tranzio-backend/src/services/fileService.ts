import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import multer from 'multer';

// Configure local storage directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Create subdirectories by date for better organization
    const today = new Date();
    const datePath = path.join(
      UPLOAD_DIR,
      today.getFullYear().toString(),
      (today.getMonth() + 1).toString().padStart(2, '0'),
      today.getDate().toString().padStart(2, '0')
    );
    
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath, { recursive: true });
    }
    
    cb(null, datePath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter for allowed types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed',
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Max 5 files per upload
  }
});

// Upload single file
export const uploadSingle = upload.single('file');

// Upload multiple files
export const uploadMultiple = upload.array('files', 5);

// Upload file and return file info
export const uploadFile = async (file: Express.Multer.File) => {
  try {
    // Generate public URL for the file
    const relativePath = path.relative(UPLOAD_DIR, file.path);
    const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
    
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

// Delete file from storage
export const deleteFile = async (fileUrl: string) => {
  try {
    // Convert URL to file path
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOAD_DIR, relativePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Try to remove empty directories
      const dirPath = path.dirname(filePath);
      if (fs.readdirSync(dirPath).length === 0) {
        fs.rmdirSync(dirPath);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info
export const getFileInfo = (fileUrl: string) => {
  try {
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOAD_DIR, relativePath);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { exists: false };
  }
};

// Clean up old files (older than 30 days)
export const cleanupOldFiles = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cleanupDirectory = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          cleanupDirectory(itemPath);
          
          // Remove empty directory
          if (fs.readdirSync(itemPath).length === 0) {
            fs.rmdirSync(itemPath);
          }
        } else if (stats.isFile() && stats.mtime < thirtyDaysAgo) {
          // Delete old file
          fs.unlinkSync(itemPath);
        }
      }
    };
    
    cleanupDirectory(UPLOAD_DIR);
    console.log('File cleanup completed');
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
};

// Schedule cleanup every 24 hours
setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFile,
  deleteFile,
  getFileInfo,
  cleanupOldFiles
};

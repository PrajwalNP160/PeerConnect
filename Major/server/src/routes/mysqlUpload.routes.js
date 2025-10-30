import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  upload,
  uploadResourceMySQL,
  uploadCertificateMySQL,
  uploadAvatarMySQL,
  getFile,
  downloadFile,
  getUserFiles,
  deleteFile,
} from "../controllers/mysqlUpload.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/file/:fileId", getFile);
router.get("/download/:fileId", downloadFile);

// Apply authentication middleware to protected routes
router.use(clerkAuthMiddleware, requireAuth());

// Upload routes
router.post("/resource", upload.single("resource"), uploadResourceMySQL);
router.post("/certificate", upload.single("certificate"), uploadCertificateMySQL);
router.post("/avatar", upload.single("avatar"), uploadAvatarMySQL);

// File management routes
router.get("/user-files", getUserFiles);
router.delete("/file/:fileId", deleteFile);

// Error handling middleware
router.use((error, req, res, next) => {
  if (error) {
    console.error("MySQL upload error:", error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large",
        error: "File size exceeds the 50MB limit"
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: "Unexpected file field",
        error: "File field name does not match expected field"
      });
    }
    
    return res.status(400).json({
      message: "Upload failed",
      error: error.message
    });
  }
  
  next();
});

export default router;

import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  uploadCertificate as uploadCertificateMulter,
  uploadResource as uploadResourceMulter,
  uploadAvatar as uploadAvatarMulter,
  uploadProject as uploadProjectMulter,
} from "../config/cloudinary.js";
import {
  uploadCertificate,
  uploadResource,
  uploadAvatar,
  uploadProject,
  deleteFile,
  getFileInfo,
  bulkUpload,
} from "../controllers/upload.controller.js";
import { runCloudinaryTests } from "../utils/cloudinaryTest.js";

const router = express.Router();

// Test endpoint (no authentication required)
router.get("/test-cloudinary", async (req, res) => {
  try {
    const results = await runCloudinaryTests();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply authentication middleware to all other routes
router.use(clerkAuthMiddleware, requireAuth());

// Certificate upload
router.post("/certificate", uploadCertificateMulter.single("certificate"), uploadCertificate);

// Resource upload
router.post("/resource", uploadResourceMulter.single("resource"), uploadResource);

// Avatar upload
router.post("/avatar", uploadAvatarMulter.single("avatar"), uploadAvatar);

// Project file upload
router.post("/project", uploadProjectMulter.single("project"), uploadProject);

// Bulk upload (multiple files)
router.post("/bulk", uploadResourceMulter.array("files", 10), bulkUpload);

// File operations
router.delete("/file/:publicId", deleteFile);
router.get("/file/:publicId", getFileInfo);


// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error) {
    console.error("Upload error:", error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large",
        error: "File size exceeds the allowed limit"
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: "Too many files",
        error: "Number of files exceeds the allowed limit"
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

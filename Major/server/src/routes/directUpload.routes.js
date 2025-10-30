import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  upload,
  uploadResourceDirect,
  uploadCertificateDirect,
  uploadAvatarDirect,
} from "../controllers/directUpload.controller.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(clerkAuthMiddleware, requireAuth());

// Direct upload routes (using Cloudinary API directly)
router.post("/resource", upload.single("resource"), uploadResourceDirect);
router.post("/certificate", upload.single("certificate"), uploadCertificateDirect);
router.post("/avatar", upload.single("avatar"), uploadAvatarDirect);

// Error handling middleware
router.use((error, req, res, next) => {
  if (error) {
    console.error("Direct upload error:", error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large",
        error: "File size exceeds the 50MB limit"
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

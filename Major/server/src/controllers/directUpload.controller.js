import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all common file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Direct upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto',
      folder: 'skillswap/resources',
      use_filename: true,
      unique_filename: true,
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Upload resource with direct Cloudinary API
export const uploadResourceDirect = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, description, type = "document" } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'skillswap/resources',
      public_id: `${req.file.originalname.split('.')[0]}_${Date.now()}`,
      resource_type: 'auto'
    });

    const fileData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: req.file.originalname,
      title: title || req.file.originalname,
      description: description || "",
      type: type,
      size: req.file.size,
      format: uploadResult.format,
      uploadedBy: user._id,
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      message: "Resource uploaded successfully",
      file: fileData,
      downloadUrl: uploadResult.secure_url,
      previewUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error("Direct upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload resource",
      error: error.message 
    });
  }
};

// Upload certificate with direct Cloudinary API
export const uploadCertificateDirect = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'skillswap/certificates',
      public_id: `cert_${req.file.originalname.split('.')[0]}_${Date.now()}`,
      resource_type: 'auto'
    });

    const fileData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
      format: uploadResult.format,
      uploadedAt: new Date(),
    };

    // Add to user's certificates array
    user.certificates.push(uploadResult.secure_url);
    await user.save();

    return res.status(200).json({
      message: "Certificate uploaded successfully",
      file: fileData,
      downloadUrl: uploadResult.secure_url,
      previewUrl: uploadResult.secure_url
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload certificate",
      error: error.message 
    });
  }
};

// Upload avatar with direct Cloudinary API
export const uploadAvatarDirect = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      try {
        const publicId = user.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`skillswap/avatars/${publicId}`);
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }

    // Upload to Cloudinary with transformation
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'skillswap/avatars',
      public_id: `avatar_${user._id}_${Date.now()}`,
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', format: 'auto' }
      ]
    });

    // Update user avatar
    user.avatar = uploadResult.secure_url;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: uploadResult.secure_url,
      file: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: req.file.originalname,
      }
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload avatar",
      error: error.message 
    });
  }
};

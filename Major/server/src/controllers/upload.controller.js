import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, getCloudinaryUrl, transformations } from "../config/cloudinary.js";

// Upload certificate
export const uploadCertificate = async (req, res) => {
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

    // File uploaded successfully to Cloudinary
    const fileData = {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      format: req.file.format,
      uploadedAt: new Date(),
    };

    // Add to user's certificates array
    user.certificates.push(fileData.url);
    await user.save();

    return res.status(200).json({
      message: "Certificate uploaded successfully",
      file: fileData,
      downloadUrl: fileData.url, // Direct Cloudinary URL
      previewUrl: fileData.url // Use direct URL for preview too
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload certificate",
      error: error.message 
    });
  }
};

// Upload resource file
export const uploadResource = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, description, type = "other" } = req.body;
    
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

    const fileData = {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      title: title || req.file.originalname,
      description: description || "",
      type: type,
      size: req.file.size,
      format: req.file.format,
      uploadedBy: user._id,
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      message: "Resource uploaded successfully",
      file: fileData,
      downloadUrl: fileData.url,
      previewUrl: fileData.url
    });
  } catch (error) {
    console.error("Resource upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload resource",
      error: error.message 
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
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
        await deleteFromCloudinary(`skillswap/avatars/${publicId}`);
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }

    const avatarUrl = getCloudinaryUrl(req.file.filename, transformations.avatar);
    
    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl,
      file: {
        url: req.file.path,
        publicId: req.file.filename,
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

// Upload project file
export const uploadProject = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { projectName, description } = req.body;
    
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

    const fileData = {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      projectName: projectName || req.file.originalname,
      description: description || "",
      size: req.file.size,
      format: req.file.format,
      uploadedBy: user._id,
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      message: "Project file uploaded successfully",
      file: fileData,
      downloadUrl: fileData.url,
      previewUrl: req.file.format === 'pdf' ? fileData.url : getCloudinaryUrl(fileData.publicId, transformations.preview)
    });
  } catch (error) {
    console.error("Project upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload project file",
      error: error.message 
    });
  }
};

// Delete file from Cloudinary
export const deleteFile = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { publicId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(publicId);
    
    if (result.result === 'ok') {
      return res.status(200).json({
        message: "File deleted successfully",
        result: result
      });
    } else {
      return res.status(400).json({
        message: "Failed to delete file",
        result: result
      });
    }
  } catch (error) {
    console.error("File deletion error:", error);
    return res.status(500).json({ 
      message: "Failed to delete file",
      error: error.message 
    });
  }
};

// Get file info and generate signed URL for secure access
export const getFileInfo = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { transformation } = req.query;
    
    let transformOptions = {};
    if (transformation && transformations[transformation]) {
      transformOptions = transformations[transformation];
    }

    const url = getCloudinaryUrl(publicId, transformOptions);
    
    return res.status(200).json({
      url: url,
      publicId: publicId,
      transformation: transformation || 'original'
    });
  } catch (error) {
    console.error("Get file info error:", error);
    return res.status(500).json({ 
      message: "Failed to get file info",
      error: error.message 
    });
  }
};

// Bulk upload handler
export const bulkUpload = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedFiles = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      format: file.format,
      uploadedAt: new Date(),
    }));

    return res.status(200).json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload files",
      error: error.message 
    });
  }
};

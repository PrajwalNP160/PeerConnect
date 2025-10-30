import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import File from "../models/file.model.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
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

// Generate unique filename
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}_${Date.now()}_${uuidv4()}${ext}`;
};

// Upload resource to MySQL
export const uploadResourceMySQL = async (req, res) => {
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

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'resource',
      title: title || req.file.originalname,
      description: description || "",
      uploadedBy: user._id.toString(),
      isPublic: true,
    });

    const fileData = {
      id: savedFile.id,
      url: `/api/mysql-upload/file/${savedFile.id}`,
      fileName: savedFile.fileName,
      originalName: savedFile.originalName,
      title: savedFile.title,
      description: savedFile.description,
      type: type,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      uploadedBy: user._id,
      uploadedAt: savedFile.createdAt,
    };

    return res.status(200).json({
      message: "Resource uploaded successfully",
      file: fileData,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`
    });
  } catch (error) {
    console.error("MySQL upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload resource",
      error: error.message 
    });
  }
};

// Upload certificate to MySQL
export const uploadCertificateMySQL = async (req, res) => {
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

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'certificate',
      title: req.file.originalname,
      uploadedBy: user._id.toString(),
      isPublic: true,
    });

    const fileUrl = `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`;

    // Add to user's certificates array
    user.certificates.push(fileUrl);
    await user.save();

    const fileData = {
      id: savedFile.id,
      url: `/api/mysql-upload/file/${savedFile.id}`,
      fileName: savedFile.fileName,
      originalName: savedFile.originalName,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      uploadedAt: savedFile.createdAt,
    };

    return res.status(200).json({
      message: "Certificate uploaded successfully",
      file: fileData,
      downloadUrl: fileUrl,
      previewUrl: fileUrl
    });
  } catch (error) {
    console.error("Certificate upload error:", error);
    return res.status(500).json({ 
      message: "Failed to upload certificate",
      error: error.message 
    });
  }
};

// Upload avatar to MySQL
export const uploadAvatarMySQL = async (req, res) => {
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
    if (user.avatar && user.avatar.includes('/api/mysql-upload/file/')) {
      try {
        const oldFileId = user.avatar.split('/').pop();
        await File.destroy({ where: { id: oldFileId } });
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError);
      }
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Save file to MySQL
    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      fileType: 'avatar',
      title: 'Profile Avatar',
      uploadedBy: user._id.toString(),
      isPublic: true,
    });

    const avatarUrl = `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${savedFile.id}`;

    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: avatarUrl,
      file: {
        id: savedFile.id,
        url: `/api/mysql-upload/file/${savedFile.id}`,
        fileName: savedFile.fileName,
        originalName: savedFile.originalName,
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

// Get file by ID
export const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Increment download count
    await file.increment('downloadCount');

    // Set appropriate headers
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    // Send file data
    res.send(file.fileData);
  } catch (error) {
    console.error("Get file error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve file",
      error: error.message 
    });
  }
};

// Download file (force download)
export const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Increment download count
    await file.increment('downloadCount');

    // Set headers for download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': file.size,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
    });

    // Send file data
    res.send(file.fileData);
  } catch (error) {
    console.error("Download file error:", error);
    return res.status(500).json({ 
      message: "Failed to download file",
      error: error.message 
    });
  }
};

// Get user's files
export const getUserFiles = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { type } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const whereClause = { uploadedBy: user._id.toString() };
    if (type) {
      whereClause.fileType = type;
    }

    const files = await File.findAll({
      where: whereClause,
      attributes: ['id', 'originalName', 'fileName', 'mimeType', 'size', 'fileType', 'title', 'description', 'downloadCount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const filesWithUrls = files.map(file => ({
      ...file.toJSON(),
      url: `/api/mysql-upload/file/${file.id}`,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      previewUrl: `${req.protocol}://${req.get('host')}/api/mysql-upload/file/${file.id}`,
      uploadedAt: file.createdAt,
      format: file.mimeType.split('/')[1] || 'unknown'
    }));

    return res.status(200).json({
      files: filesWithUrls,
      count: filesWithUrls.length
    });
  } catch (error) {
    console.error("Get user files error:", error);
    return res.status(500).json({ 
      message: "Failed to retrieve files",
      error: error.message 
    });
  }
};

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { fileId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        uploadedBy: user._id.toString()
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found or unauthorized" });
    }

    await file.destroy();

    return res.status(200).json({
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return res.status(500).json({ 
      message: "Failed to delete file",
      error: error.message 
    });
  }
};

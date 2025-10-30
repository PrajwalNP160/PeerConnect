import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS
});

// Verify configuration
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET'
});

// Upload presets for different file types (create these in Cloudinary dashboard)
export const uploadPresets = {
  certificate: 'skillswap_certificates',
  resource: 'skillswap_resources', 
  avatar: 'skillswap_avatars',
  project: 'skillswap_projects'
};

// Configure Cloudinary storage for different file types
const createCloudinaryStorage = (folder, allowedFormats = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'], uploadPreset = null) => {
  const params = {
    folder: `skillswap/${folder}`,
    allowed_formats: allowedFormats,
    resource_type: 'auto', // Automatically detect file type
    public_id: (req, file) => {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `${originalName}_${timestamp}`;
    },
  };

  // Add upload preset if provided
  if (uploadPreset) {
    params.upload_preset = uploadPreset;
  }

  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: params,
  });
};

// Storage configurations for different use cases
export const certificateStorage = createCloudinaryStorage('certificates', ['pdf', 'jpg', 'jpeg', 'png']);
export const resourceStorage = createCloudinaryStorage('resources', ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']);
export const avatarStorage = createCloudinaryStorage('avatars', ['jpg', 'jpeg', 'png', 'gif']);
export const projectStorage = createCloudinaryStorage('projects', ['pdf', 'jpg', 'jpeg', 'png', 'zip']);

// Multer configurations
export const uploadCertificate = multer({ 
  storage: certificateStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
    }
  }
});

export const uploadResource = multer({ 
  storage: resourceStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for resources
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and TXT files are allowed.'), false);
    }
  }
});

export const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed.'), false);
    }
  }
});

export const uploadProject = multer({ 
  storage: projectStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for project files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/zip',
      'application/x-zip-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and ZIP files are allowed.'), false);
    }
  }
});

// Utility functions
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: false, // Don't sign URLs for public access
    type: 'upload',
    ...options
  });
};

// Generate signed URL for secure access
export const getSignedCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: 'upload',
    ...options
  });
};

// Transform options for different use cases
export const transformations = {
  avatar: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  },
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  preview: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'auto'
  }
};

export default cloudinary;

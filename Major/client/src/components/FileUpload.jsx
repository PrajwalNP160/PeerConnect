import React, { useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Trash2
} from "lucide-react";

const FileUpload = ({ 
  type = "resource", 
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 25,
  multiple = false,
  onUploadSuccess,
  onUploadError,
  className = "",
  title = "Upload File",
  description = "Drag and drop your file here, or click to browse"
}) => {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");

  const getEndpoint = () => {
    switch (type) {
      case "certificate": return "/mysql-upload/certificate";
      case "resource": return "/mysql-upload/resource";
      case "avatar": return "/mysql-upload/avatar";
      case "project": return "/mysql-upload/resource"; // Use resource endpoint for projects
      default: return "/mysql-upload/resource";
    }
  };

  const getAcceptedTypes = () => {
    switch (type) {
      case "certificate": return ".pdf,.jpg,.jpeg,.png";
      case "avatar": return ".jpg,.jpeg,.png,.gif";
      case "project": return ".pdf,.jpg,.jpeg,.png,.zip";
      default: return accept;
    }
  };

  const validateFile = (file) => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    const allowedTypes = getAcceptedTypes().split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    
    if (!multiple && fileList.length > 1) {
      setError("Only one file is allowed");
      return;
    }

    // Validate each file
    for (const file of fileList) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    uploadFiles(fileList);
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setError("");

    try {
      const token = await getToken();
      const uploadPromises = files.map(file => uploadSingleFile(file, token));
      
      const results = await Promise.all(uploadPromises);
      
      setUploadedFiles(prev => [...prev, ...results]);
      
      if (onUploadSuccess) {
        onUploadSuccess(multiple ? results : results[0]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Upload failed";
      setError(errorMessage);
      
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (file, token) => {
    const formData = new FormData();
    
    if (type === "certificate") {
      formData.append("certificate", file);
    } else if (type === "avatar") {
      formData.append("avatar", file);
    } else if (type === "project") {
      formData.append("project", file);
      formData.append("projectName", file.name);
    } else {
      formData.append("resource", file);
      formData.append("title", file.name);
      formData.append("type", "document");
    }

    const response = await axiosInstance.post(getEndpoint(), formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      ...response.data.file,
      originalFile: file,
      downloadUrl: response.data.downloadUrl || response.data.file.url,
      previewUrl: response.data.previewUrl,
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {description}
              </p>
              <p className="text-xs text-gray-500">
                Max size: {maxSize}MB • Accepted: {getAcceptedTypes()}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.format?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                
                {file.previewUrl && (
                  <a
                    href={file.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                )}
                
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

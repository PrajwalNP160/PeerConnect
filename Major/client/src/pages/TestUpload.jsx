import React from "react";
import FileUpload from "../components/FileUpload";

const TestUpload = () => {
  const handleUploadSuccess = (file) => {
    console.log("Upload successful:", file);
    alert(`File uploaded successfully!\nURL: ${file.url}\nPublic ID: ${file.publicId}`);
  };

  const handleUploadError = (error) => {
    console.error("Upload failed:", error);
    alert(`Upload failed: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Cloudinary Upload Test
        </h1>

        <div className="space-y-8">
          {/* Certificate Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <FileUpload
              type="certificate"
              title="Test Certificate Upload"
              description="Upload PDF, JPG, or PNG certificates"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Resource Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <FileUpload
              type="resource"
              title="Test Resource Upload"
              description="Upload documents, presentations, or other resources"
              multiple={true}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Avatar Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <FileUpload
              type="avatar"
              title="Test Avatar Upload"
              description="Upload profile picture (JPG, PNG, GIF)"
              maxSize={5}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Project Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <FileUpload
              type="project"
              title="Test Project Upload"
              description="Upload project files (PDF, images, ZIP)"
              maxSize={50}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUpload;

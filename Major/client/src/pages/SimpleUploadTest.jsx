import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";

const SimpleUploadTest = () => {
  const { getToken } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("resource", file);
      formData.append("title", file.name);
      formData.append("description", "Test upload");

      const response = await axiosInstance.post("/mysql-upload/resource", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
      console.log("Upload successful:", response.data);
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          MySQL Upload Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-md">
                <h3 className="font-semibold mb-2">Upload Successful!</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>File:</strong> {result.file.originalName}</div>
                  <div><strong>Size:</strong> {Math.round(result.file.size / 1024)} KB</div>
                  <div><strong>Format:</strong> {result.file.format}</div>
                  <div>
                    <strong>URL:</strong> 
                    <a 
                      href={result.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {result.downloadUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleUploadTest;

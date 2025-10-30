import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import FileUpload from "../components/FileUpload";
import { 
  BookOpen, 
  Upload, 
  Download, 
  Eye, 
  Filter,
  Search,
  Plus,
  FileText,
  Image,
  Archive
} from "lucide-react";

const Resources = () => {
  const { isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [uploadedResources, setUploadedResources] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Load user files from MySQL
  const loadUserFiles = async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axiosInstance.get("/mysql-upload/user-files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setUploadedResources(response.data.files || []);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load files on component mount and when signed in
  useEffect(() => {
    if (isSignedIn) {
      loadUserFiles();
    }
  }, [isSignedIn]);

  const handleUploadSuccess = (file) => {
    setUploadedResources(prev => [file, ...prev]);
    alert("Resource uploaded successfully!");
    // Reload files to get the latest data
    loadUserFiles();
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
    alert("Failed to upload resource. Please try again.");
  };

  const getFileIcon = (format) => {
    if (!format) return <FileText className="h-5 w-5" />;
    
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif'];
    const archiveFormats = ['zip', 'rar', '7z'];
    const formatLower = format.toLowerCase();
    
    if (imageFormats.includes(formatLower)) {
      return <Image className="h-5 w-5" />;
    } else if (archiveFormats.includes(formatLower)) {
      return <Archive className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  const filteredResources = uploadedResources.filter(resource => {
    const originalName = resource.originalName || '';
    const title = resource.title || '';
    const matchesSearch = originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    
    const format = resource.format?.toLowerCase() || '';
    switch (filter) {
      case "documents":
        return matchesSearch && ['pdf', 'doc', 'docx', 'txt'].includes(format);
      case "images":
        return matchesSearch && ['jpg', 'jpeg', 'png', 'gif'].includes(format);
      case "archives":
        return matchesSearch && ['zip', 'rar', '7z'].includes(format);
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Resources
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and manage your learning resources
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-teal-600" />
            </div>
          </div>

          {/* Tabs */}
          {isSignedIn && (
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("browse")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "browse"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                My Resources ({uploadedResources.length})
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Upload New
              </button>
            </div>
          )}
        </div>

        {!isSignedIn ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sign in to access resources
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Upload and manage your learning materials
            </p>
          </div>
        ) : (
          <>
            {activeTab === "upload" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <FileUpload
                  type="resource"
                  title="Upload Learning Resource"
                  description="Upload documents, PDFs, presentations, or other learning materials"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  maxSize={25}
                  multiple={true}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </div>
            )}

            {activeTab === "browse" && (
              <>
                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Types</option>
                        <option value="documents">Documents</option>
                        <option value="images">Images</option>
                        <option value="archives">Archives</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Resources Grid */}
                {filteredResources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="text-gray-500">
                              {getFileIcon(resource.format)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                {resource.title || resource.originalName || 'Untitled'}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {resource.format?.toUpperCase() || 'UNKNOWN'} • {Math.round((resource.size || 0) / 1024)} KB
                              </p>
                            </div>
                          </div>

                          {resource.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {resource.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {resource.uploadedAt ? new Date(resource.uploadedAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {resource.previewUrl && (
                                <a
                                  href={resource.previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Preview"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              )}
                              
                              {resource.downloadUrl && (
                                <a
                                  href={resource.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-teal-600 hover:text-teal-700 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {searchTerm || filter !== "all" ? (
                      <>
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No resources found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Try adjusting your search or filter criteria
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilter("all");
                          }}
                          className="text-teal-600 hover:text-teal-700"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No resources yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Upload your first learning resource to get started
                        </p>
                        <button
                          onClick={() => setActiveTab("upload")}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Upload Resource
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Resources;

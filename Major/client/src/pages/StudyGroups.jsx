import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance";
import { 
  Users, 
  Clock, 
  Calendar, 
  Filter, 
  Search,
  Plus,
  ChevronRight,
  MapPin,
  Star,
  BookOpen
} from "lucide-react";

const StudyGroups = () => {
  const { getToken, isSignedIn } = useAuth();
  const [studyGroups, setStudyGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skill: "",
    difficulty: "",
    search: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [activeTab, setActiveTab] = useState("browse");

  // Fetch public study groups
  const fetchStudyGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.skill) params.append("skill", filters.skill);
      if (filters.difficulty) params.append("difficulty", filters.difficulty);
      if (filters.search) params.append("search", filters.search);
      params.append("page", filters.page);
      params.append("limit", "12");

      const response = await axiosInstance.get(`/study-groups?${params}`);
      setStudyGroups(response.data.studyGroups);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch study groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's study groups
  const fetchUserGroups = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const response = await axiosInstance.get("/study-groups/user/my-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserGroups(response.data.studyGroups);
    } catch (error) {
      console.error("Failed to fetch user groups:", error);
    }
  };

  useEffect(() => {
    fetchStudyGroups();
    if (isSignedIn) {
      fetchUserGroups();
    }
  }, [filters, isSignedIn]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const formatMeetingSchedule = (schedule) => {
    if (!schedule?.meetingDays?.length) return "No schedule set";
    
    const days = schedule.meetingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1, 3)
    ).join(", ");
    
    const time = schedule.meetingTime || "Time TBD";
    return `${days} at ${time}`;
  };

  if (loading && studyGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Study Groups
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join or create study groups to learn together
              </p>
            </div>
            
            {isSignedIn && (
              <Link
                to="/study-groups/create"
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Group
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("browse")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "browse"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Browse Groups
            </button>
            {isSignedIn && (
              <button
                onClick={() => setActiveTab("my-groups")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "my-groups"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                My Groups ({userGroups.length})
              </button>
            )}
          </div>
        </div>

        {activeTab === "browse" && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Filter by skill..."
                  value={filters.skill}
                  onChange={(e) => handleFilterChange("skill", e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />

                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange("difficulty", e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <button
                  onClick={() => setFilters({ skill: "", difficulty: "", search: "", page: 1 })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Study Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {studyGroups.map((group) => (
                <div
                  key={group._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {group.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                        {group.skill}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(group.difficulty)}`}>
                        {group.difficulty}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(group.status)}`}>
                        {group.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {group.currentMembers}/{group.maxMembers} members
                          {group.isFull && <span className="text-red-500 ml-1">(Full)</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatMeetingSchedule(group.schedule)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Created by {group.creator.firstName} {group.creator.lastName}</span>
                      </div>
                    </div>

                    <Link
                      to={`/study-groups/${group._id}`}
                      className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {studyGroups.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No study groups found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {filters.skill || filters.difficulty || filters.search
                    ? "Try adjusting your filters"
                    : "Be the first to create a study group!"}
                </p>
                {isSignedIn && (
                  <Link
                    to="/study-groups/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Study Group
                  </Link>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange("page", filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {filters.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange("page", filters.page + 1)}
                    disabled={filters.page >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "my-groups" && isSignedIn && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userGroups.map((group) => (
              <div
                key={group._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {group.title}
                        </h3>
                        {group.userRole === "creator" && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-medium rounded">
                            Creator
                          </span>
                        )}
                        {group.userRole === "moderator" && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-xs font-medium rounded">
                            Moderator
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                      {group.skill}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{group.currentMembers}/{group.maxMembers} members</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatMeetingSchedule(group.schedule)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/study-groups/${group._id}`}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Open Group
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}

            {userGroups.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No study groups yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Join or create your first study group to get started
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Browse Groups
                  </button>
                  <Link
                    to="/study-groups/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups;

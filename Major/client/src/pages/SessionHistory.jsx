import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import { Clock, Calendar, Star, User, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const SessionHistory = () => {
  const { getToken, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    skill: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});

  // Fetch session history
  const fetchSessions = async () => {
    if (!isSignedIn) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.skill) params.append("skill", filters.skill);
      params.append("page", filters.page);
      params.append("limit", "10");

      const response = await axiosInstance.get(`/sessions/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSessions(response.data.sessions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch session statistics
  const fetchStats = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const response = await axiosInstance.get("/sessions/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [isSignedIn, filters]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ongoing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Session History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your skill exchange sessions and progress
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Sessions
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.completedSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Time
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatDuration(stats.totalDuration)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Rating
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="ongoing">Ongoing</option>
              <option value="cancelled">Cancelled</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <input
              type="text"
              placeholder="Filter by skill..."
              value={filters.skill}
              onChange={(e) => handleFilterChange("skill", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No sessions found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filters.status || filters.skill
                  ? "Try adjusting your filters"
                  : "Start your first skill exchange to see sessions here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.map((session) => (
                <div key={session._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {session.partner?.firstName} {session.partner?.lastName}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <p><strong>You taught:</strong> {session.mySkill}</p>
                          <p><strong>You learned:</strong> {session.partnerSkill}</p>
                        </div>
                        <div>
                          <p><strong>Date:</strong> {formatDate(session.startTime)}</p>
                          <p><strong>Time:</strong> {formatTime(session.startTime)}</p>
                          {session.duration && (
                            <p><strong>Duration:</strong> {formatDuration(session.duration)}</p>
                          )}
                        </div>
                      </div>

                      {session.feedback && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Feedback:</strong> {session.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {session.rating && (
                      <div className="flex items-center gap-1 ml-4">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} sessions
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Filter, 
  ChevronRight,
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const Assessments = () => {
  const { getToken, isSignedIn } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skill: "",
    difficulty: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});

  // Fetch assessments
  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.skill) params.append("skill", filters.skill);
      if (filters.difficulty) params.append("difficulty", filters.difficulty);
      params.append("page", filters.page);
      params.append("limit", "12");

      const response = await axiosInstance.get(`/assessments?${params}`);
      setAssessments(response.data.assessments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user stats
  const fetchStats = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const response = await axiosInstance.get("/assessments/user/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchAssessments();
    if (isSignedIn) {
      fetchStats();
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  if (loading && assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
            Skill Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your skills and earn verified badges
          </p>
        </div>

        {/* Stats Cards (if signed in) */}
        {isSignedIn && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Attempts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalAttempts || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Passed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.passedAssessments || 0}
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
                    Avg Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.averageScore ? `${Math.round(stats.averageScore)}%` : "N/A"}
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
                    Time Spent
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalTimeSpent ? `${Math.round(stats.totalTimeSpent)}m` : "0m"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>
            
            <input
              type="text"
              placeholder="Search by skill..."
              value={filters.skill}
              onChange={(e) => handleFilterChange("skill", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />

            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange("difficulty", e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {assessments.map((assessment) => (
            <div
              key={assessment._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {assessment.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {assessment.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                    {assessment.skill}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(assessment.difficulty)}`}>
                    {assessment.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{assessment.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{assessment.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>{assessment.passingScore}% to pass</span>
                  </div>
                </div>

                <Link
                  to={`/assessments/${assessment._id}`}
                  className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Assessment
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {assessments.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assessments found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.skill || filters.difficulty
                ? "Try adjusting your filters"
                : "Check back later for new assessments"}
            </p>
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
      </div>
    </div>
  );
};

export default Assessments;

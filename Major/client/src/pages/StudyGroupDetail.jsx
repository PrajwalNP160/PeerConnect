import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen,
  UserPlus,
  UserMinus,
  Settings,
  ArrowLeft
} from "lucide-react";

const StudyGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  
  const [studyGroup, setStudyGroup] = useState(null);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStudyGroup();
  }, [id]);

  const fetchStudyGroup = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/study-groups/${id}`);
      setStudyGroup(response.data.studyGroup);
      setUserMembership(response.data.userMembership);
    } catch (error) {
      console.error("Failed to fetch study group:", error);
      navigate("/study-groups");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!isSignedIn) {
      alert("Please sign in to join the group");
      return;
    }

    try {
      setActionLoading(true);
      const token = await getToken();
      await axiosInstance.post(`/study-groups/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Successfully joined the study group!");
      fetchStudyGroup(); // Refresh data
    } catch (error) {
      console.error("Failed to join group:", error);
      alert("Failed to join group: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this study group?")) return;

    try {
      setActionLoading(true);
      const token = await getToken();
      await axiosInstance.post(`/study-groups/${id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Successfully left the study group");
      navigate("/study-groups");
    } catch (error) {
      console.error("Failed to leave group:", error);
      alert("Failed to leave group: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

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

  const formatMeetingSchedule = (schedule) => {
    if (!schedule?.meetingDays?.length) return "No schedule set";
    
    const days = schedule.meetingDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1, 3)
    ).join(", ");
    
    const time = schedule.meetingTime || "Time TBD";
    return `${days} at ${time}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!studyGroup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Study Group Not Found
          </h1>
          <button
            onClick={() => navigate("/study-groups")}
            className="text-teal-600 hover:text-teal-700"
          >
            Back to Study Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/study-groups")}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Study Groups
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {studyGroup.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {studyGroup.description}
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-sm font-medium rounded">
                  {studyGroup.skill}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded ${getDifficultyColor(studyGroup.difficulty)}`}>
                  {studyGroup.difficulty}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(studyGroup.status)}`}>
                  {studyGroup.status}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              {userMembership ? (
                <>
                  {(userMembership.role === "creator" || userMembership.role === "moderator") && (
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Settings className="h-4 w-4" />
                      Manage
                    </button>
                  )}
                  <button
                    onClick={handleLeaveGroup}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors disabled:opacity-50"
                  >
                    <UserMinus className="h-4 w-4" />
                    Leave Group
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={actionLoading || studyGroup.isFull}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {studyGroup.isFull ? "Group Full" : "Join Group"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Group Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {studyGroup.currentMembers}/{studyGroup.maxMembers} members
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatMeetingSchedule(studyGroup.schedule)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created by {studyGroup.creator.firstName} {studyGroup.creator.lastName}
                  </span>
                </div>
                
                {studyGroup.schedule?.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {studyGroup.schedule.duration} minutes per session
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Goals */}
            {studyGroup.goals && studyGroup.goals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Learning Goals
                </h2>
                <div className="space-y-4">
                  {studyGroup.goals.map((goal, index) => (
                    <div key={index} className="border-l-4 border-teal-500 pl-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                      {goal.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(goal.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {studyGroup.resources && studyGroup.resources.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Shared Resources
                </h2>
                <div className="space-y-3">
                  {studyGroup.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {resource.type} • Added by {resource.addedBy?.firstName}
                        </p>
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 text-sm"
                      >
                        View →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Members ({studyGroup.currentMembers})
              </h2>
              <div className="space-y-3">
                {studyGroup.members
                  .filter(member => member.isActive)
                  .map((member) => (
                    <div key={member._id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        {member.userId.avatar ? (
                          <img
                            src={member.userId.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {member.userId.firstName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.userId.firstName} {member.userId.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tags */}
            {studyGroup.tags && studyGroup.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {studyGroup.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupDetail;

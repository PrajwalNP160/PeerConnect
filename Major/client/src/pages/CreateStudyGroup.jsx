import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance";
import { Save, Plus, Trash2 } from "lucide-react";

const CreateStudyGroup = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill: "",
    difficulty: "beginner",
    maxMembers: 10,
    isPublic: true,
    tags: "",
  });

  const [schedule, setSchedule] = useState({
    meetingDays: [],
    meetingTime: "",
    timezone: "UTC",
    duration: 60,
  });

  const [goals, setGoals] = useState([
    { title: "", description: "", dueDate: "" }
  ]);

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      meetingDays: prev.meetingDays.includes(day)
        ? prev.meetingDays.filter(d => d !== day)
        : [...prev.meetingDays, day]
    }));
  };

  const addGoal = () => {
    setGoals([...goals, { title: "", description: "", dueDate: "" }]);
  };

  const removeGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index, field, value) => {
    const updated = [...goals];
    updated[index][field] = value;
    setGoals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      
      const payload = {
        ...formData,
        schedule: schedule.meetingDays.length > 0 ? schedule : undefined,
        goals: goals.filter(goal => goal.title.trim()),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      };

      const response = await axiosInstance.post("/study-groups/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Study group created successfully!");
      navigate(`/study-groups/${response.data.studyGroup._id}`);
    } catch (error) {
      console.error("Failed to create study group:", error);
      alert("Failed to create study group: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { value: "monday", label: "Mon" },
    { value: "tuesday", label: "Tue" },
    { value: "wednesday", label: "Wed" },
    { value: "thursday", label: "Thu" },
    { value: "friday", label: "Fri" },
    { value: "saturday", label: "Sat" },
    { value: "sunday", label: "Sun" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Study Group
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start a new study group and invite others to learn together
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., JavaScript Study Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill Focus *
                </label>
                <input
                  type="text"
                  name="skill"
                  required
                  value={formData.skill}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., JavaScript, React, Python"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Members
                </label>
                <input
                  type="number"
                  name="maxMembers"
                  min="2"
                  max="50"
                  value={formData.maxMembers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., programming, web-development, frontend"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe what your study group will focus on, learning goals, and expectations..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Make this group public (others can find and join)
                </label>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Meeting Schedule (Optional)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        schedule.meetingDays.includes(day.value)
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Time
                </label>
                <input
                  type="time"
                  name="meetingTime"
                  value={schedule.meetingTime}
                  onChange={handleScheduleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  min="15"
                  max="300"
                  value={schedule.duration}
                  onChange={handleScheduleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Learning Goals (Optional)
              </h2>
              <button
                type="button"
                onClick={addGoal}
                className="flex items-center gap-2 px-3 py-2 text-teal-600 hover:text-teal-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </button>
            </div>

            {goals.map((goal, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Goal {index + 1}
                  </h3>
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Goal title"
                      value={goal.title}
                      onChange={(e) => updateGoal(index, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={goal.dueDate}
                      onChange={(e) => updateGoal(index, "dueDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <textarea
                      rows={2}
                      placeholder="Goal description"
                      value={goal.description}
                      onChange={(e) => updateGoal(index, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/study-groups")}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Study Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStudyGroup;

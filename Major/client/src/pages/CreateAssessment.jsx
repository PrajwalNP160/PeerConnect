import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance";
import { Plus, Trash2, Save } from "lucide-react";

const CreateAssessment = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState({
    title: "",
    description: "",
    skill: "",
    difficulty: "beginner",
    timeLimit: 30,
    passingScore: 70,
    tags: "",
  });

  const [questions, setQuestions] = useState([
    {
      question: "",
      type: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      explanation: "",
      difficulty: "beginner",
      points: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "multiple-choice",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        correctAnswer: "",
        explanation: "",
        difficulty: "beginner",
        points: 1,
      },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options.push({ text: "", isCorrect: false });
    setQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex][field] = value;
    
    // If setting as correct, unset others
    if (field === "isCorrect" && value) {
      updated[questionIndex].options.forEach((opt, i) => {
        if (i !== optionIndex) opt.isCorrect = false;
      });
    }
    
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      
      const payload = {
        ...assessment,
        questions,
        tags: assessment.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      };

      await axiosInstance.post("/assessments/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Assessment created successfully!");
      navigate("/assessments");
    } catch (error) {
      console.error("Failed to create assessment:", error);
      alert("Failed to create assessment: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new skill assessment for learners
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assessment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Assessment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={assessment.title}
                  onChange={(e) => setAssessment({...assessment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., JavaScript Fundamentals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill *
                </label>
                <input
                  type="text"
                  required
                  value={assessment.skill}
                  onChange={(e) => setAssessment({...assessment, skill: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., JavaScript"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={assessment.difficulty}
                  onChange={(e) => setAssessment({...assessment, difficulty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={assessment.timeLimit}
                  onChange={(e) => setAssessment({...assessment, timeLimit: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={assessment.passingScore}
                  onChange={(e) => setAssessment({...assessment, passingScore: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={assessment.tags}
                  onChange={(e) => setAssessment({...assessment, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., programming, web-development"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={assessment.description}
                onChange={(e) => setAssessment({...assessment, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe what this assessment covers..."
              />
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Question {qIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, "type", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="code">Code</option>
                    </select>
                  </div>
                </div>

                {/* Question Options */}
                {question.type === "multiple-choice" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-teal-600 hover:text-teal-700 text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                    
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name={`question-${qIndex}-correct`}
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(qIndex, oIndex, "isCorrect", e.target.checked)}
                          className="text-teal-600"
                        />
                        <input
                          type="text"
                          required
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, "text", e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Option text..."
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === "true-false" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correct Answer
                    </label>
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select correct answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </div>
                )}

                {question.type === "code" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Code Answer
                    </label>
                    <textarea
                      rows={4}
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                      placeholder="Expected code solution..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={question.difficulty}
                      onChange={(e) => updateQuestion(qIndex, "difficulty", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={question.explanation}
                      onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Explain the answer..."
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
              onClick={() => navigate("/assessments")}
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
                  Create Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssessment;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Trophy
} from "lucide-react";

const TakeAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Fetch assessment
  useEffect(() => {
    const fetchAssessment = async () => {
      if (!isSignedIn) {
        navigate("/assessments");
        return;
      }

      try {
        const token = await getToken();
        const response = await axiosInstance.get(`/assessments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAssessment(response.data.assessment);
        setHasAttempted(response.data.hasAttempted);
        
        if (response.data.hasAttempted) {
          setResult(response.data.previousResult);
        } else {
          setTimeLeft(response.data.assessment.timeLimit * 60); // Convert to seconds
          setStartTime(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch assessment:", error);
        navigate("/assessments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, isSignedIn, getToken, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !hasAttempted && !result) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, hasAttempted, result]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      const timeSpent = startTime ? Math.round((new Date() - startTime) / (1000 * 60)) : 0;
      
      const submissionAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await axiosInstance.post(
        `/assessments/${id}/submit`,
        {
          answers: submissionAnswers,
          timeSpent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(response.data.result);
      setHasAttempted(true);
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionProgress = () => {
    const answered = Object.keys(answers).length;
    const total = assessment?.questions?.length || 0;
    return { answered, total };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Assessment Not Found
          </h2>
          <button
            onClick={() => navigate("/assessments")}
            className="text-teal-600 hover:text-teal-700"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // Show results if already attempted
  if (hasAttempted && result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                result.passed 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                {result.passed ? (
                  <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {result.passed ? "Congratulations!" : "Assessment Complete"}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {result.passed 
                  ? "You've successfully passed this assessment!" 
                  : "You can retake this assessment to improve your score."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {result.score}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Final Score
                </div>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {result.totalPoints}/{result.maxPoints}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Points Earned
                </div>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {result.timeSpent}m
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Time Spent
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate("/assessments")}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Assessments
              </button>
              
              <button
                onClick={() => navigate("/sessions")}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                View All Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestion];
  const progress = getQuestionProgress();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {assessment.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {assessment.questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Flag className="h-4 w-4" />
                <span>{progress.answered}/{progress.total} answered</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <Clock className="h-4 w-4" />
                <span className={timeLeft < 300 ? "text-red-600" : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 text-xs font-medium rounded">
                {currentQ.difficulty}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {currentQ.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQ.type === "multiple-choice" && (
              <>
                {currentQ.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ._id}`}
                      value={option.text}
                      checked={answers[currentQ._id] === option.text}
                      onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                      className="mr-3 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                  </label>
                ))}
              </>
            )}

            {currentQ.type === "true-false" && (
              <>
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="true"
                    checked={answers[currentQ._id] === "true"}
                    onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                    className="mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-gray-900 dark:text-white">True</span>
                </label>
                
                <label className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="false"
                    checked={answers[currentQ._id] === "false"}
                    onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                    className="mr-3 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-gray-900 dark:text-white">False</span>
                </label>
              </>
            )}

            {currentQ.type === "code" && (
              <textarea
                value={answers[currentQ._id] || ""}
                onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                placeholder="Enter your code here..."
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={8}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex gap-3">
              {currentQuestion === assessment.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Assessment
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(assessment.questions.length - 1, prev + 1))}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;

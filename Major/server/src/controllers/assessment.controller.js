import { Assessment, AssessmentResult } from "../models/assessment.model.js";
import { User } from "../models/user.model.js";

// Get all available assessments
export const getAssessments = async (req, res) => {
  try {
    const { skill, difficulty, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (skill) query.skill = { $regex: skill, $options: "i" };
    if (difficulty) query.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [assessments, total] = await Promise.all([
      Assessment.find(query)
        .select("-questions.correctAnswer -questions.options.isCorrect") // Hide answers
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Assessment.countDocuments(query),
    ]);

    // Add question count and estimated time
    const formattedAssessments = assessments.map(assessment => ({
      ...assessment,
      questionCount: assessment.questions.length,
      estimatedTime: assessment.timeLimit,
    }));

    return res.status(200).json({
      assessments: formattedAssessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAssessments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get assessment by ID (for taking the test)
export const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const assessment = await Assessment.findById(id)
      .populate("createdBy", "firstName lastName")
      .lean();

    if (!assessment || !assessment.isActive) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user has already taken this assessment
    const existingResult = await AssessmentResult.findOne({
      userId: user._id,
      assessmentId: id,
    }).lean();

    // Remove correct answers from questions
    const questionsWithoutAnswers = assessment.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      options: q.options?.map(opt => ({ text: opt.text })) || [],
      difficulty: q.difficulty,
      points: q.points,
    }));

    return res.status(200).json({
      assessment: {
        ...assessment,
        questions: questionsWithoutAnswers,
      },
      hasAttempted: !!existingResult,
      previousResult: existingResult,
    });
  } catch (error) {
    console.error("getAssessmentById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Submit assessment answers
export const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const assessment = await Assessment.findById(id).lean();
    if (!assessment || !assessment.isActive) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user has already taken this assessment
    const existingResult = await AssessmentResult.findOne({
      userId: user._id,
      assessmentId: id,
    });

    if (existingResult) {
      return res.status(400).json({ message: "Assessment already completed" });
    }

    // Grade the assessment
    let totalPoints = 0;
    let maxPoints = 0;
    const gradedAnswers = [];

    for (const question of assessment.questions) {
      maxPoints += question.points;
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      
      let isCorrect = false;
      let points = 0;

      if (userAnswer) {
        if (question.type === "multiple-choice") {
          const correctOption = question.options.find(opt => opt.isCorrect);
          isCorrect = correctOption && correctOption.text === userAnswer.answer;
        } else if (question.type === "true-false") {
          isCorrect = question.correctAnswer === userAnswer.answer;
        } else if (question.type === "code") {
          // Simple string comparison for code questions
          // In production, you might want more sophisticated code comparison
          isCorrect = question.correctAnswer?.trim().toLowerCase() === 
                     userAnswer.answer?.trim().toLowerCase();
        }

        if (isCorrect) {
          points = question.points;
          totalPoints += points;
        }
      }

      gradedAnswers.push({
        questionId: question._id,
        answer: userAnswer?.answer || "",
        isCorrect,
        points,
      });
    }

    const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    const passed = score >= assessment.passingScore;

    // Save the result
    const result = await AssessmentResult.create({
      userId: user._id,
      assessmentId: id,
      answers: gradedAnswers,
      score,
      totalPoints,
      maxPoints,
      passed,
      timeSpent,
      startedAt: new Date(Date.now() - (timeSpent * 60 * 1000)), // Approximate start time
      completedAt: new Date(),
    });

    // TODO: Update user's skill level if passed
    // if (passed) {
    //   await User.findByIdAndUpdate(user._id, {
    //     $addToSet: {
    //       verifiedSkills: {
    //         skill: assessment.skill,
    //         level: assessment.difficulty,
    //         verifiedAt: new Date(),
    //         assessmentId: id,
    //       }
    //     }
    //   });
    // }

    return res.status(200).json({
      result: {
        score,
        totalPoints,
        maxPoints,
        passed,
        timeSpent,
        answers: gradedAnswers,
      },
    });
  } catch (error) {
    console.error("submitAssessment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's assessment results
export const getUserResults = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      AssessmentResult.find({ userId: user._id })
        .populate({
          path: "assessmentId",
          select: "title skill difficulty passingScore",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AssessmentResult.countDocuments({ userId: user._id }),
    ]);

    return res.status(200).json({
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getUserResults error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new assessment (admin/teacher functionality)
export const createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      skill,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      tags,
    } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    for (const question of questions) {
      if (!question.question || !question.type) {
        return res.status(400).json({ message: "Invalid question format" });
      }

      if (question.type === "multiple-choice") {
        if (!question.options || question.options.length < 2) {
          return res.status(400).json({ 
            message: "Multiple choice questions need at least 2 options" 
          });
        }
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
          return res.status(400).json({ 
            message: "Multiple choice questions need exactly one correct answer" 
          });
        }
      }

      if (question.type === "true-false" && !question.correctAnswer) {
        return res.status(400).json({ 
          message: "True/false questions need a correct answer" 
        });
      }

      if (question.type === "code" && !question.correctAnswer) {
        return res.status(400).json({ 
          message: "Code questions need a correct answer" 
        });
      }
    }

    const assessment = await Assessment.create({
      title,
      description,
      skill,
      difficulty,
      questions,
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      tags: tags || [],
      createdBy: user._id,
    });

    return res.status(201).json({ assessment });
  } catch (error) {
    console.error("createAssessment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get assessment statistics
export const getAssessmentStats = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await AssessmentResult.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          passedAssessments: {
            $sum: { $cond: ["$passed", 1, 0] }
          },
          averageScore: { $avg: "$score" },
          totalTimeSpent: { $sum: "$timeSpent" },
        }
      }
    ]);

    const skillStats = await AssessmentResult.aggregate([
      { $match: { userId: user._id } },
      {
        $lookup: {
          from: "assessments",
          localField: "assessmentId",
          foreignField: "_id",
          as: "assessment"
        }
      },
      { $unwind: "$assessment" },
      {
        $group: {
          _id: "$assessment.skill",
          attempts: { $sum: 1 },
          passed: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    const result = stats[0] || {
      totalAttempts: 0,
      passedAssessments: 0,
      averageScore: 0,
      totalTimeSpent: 0,
    };

    return res.status(200).json({
      stats: result,
      skillStats,
    });
  } catch (error) {
    console.error("getAssessmentStats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update assessment (mentor/admin only)
export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      skill,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      tags,
      isActive,
    } = req.body;
    
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the assessment
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user is the creator or admin
    if (assessment.createdBy.toString() !== user._id.toString() && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this assessment" });
    }

    // Validate questions if provided
    if (questions && questions.length > 0) {
      for (const question of questions) {
        if (!question.question || !question.type) {
          return res.status(400).json({ message: "Invalid question format" });
        }

        if (question.type === "multiple-choice") {
          if (!question.options || question.options.length < 2) {
            return res.status(400).json({ 
              message: "Multiple choice questions need at least 2 options" 
            });
          }
          const correctOptions = question.options.filter(opt => opt.isCorrect);
          if (correctOptions.length !== 1) {
            return res.status(400).json({ 
              message: "Multiple choice questions need exactly one correct answer" 
            });
          }
        }
      }
    }

    // Update assessment
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (skill) updateData.skill = skill;
    if (difficulty) updateData.difficulty = difficulty;
    if (questions) updateData.questions = questions;
    if (timeLimit) updateData.timeLimit = timeLimit;
    if (passingScore) updateData.passingScore = passingScore;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updatedAssessment = await Assessment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.status(200).json({ assessment: updatedAssessment });
  } catch (error) {
    console.error("updateAssessment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete assessment (mentor/admin only)
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the assessment
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Check if user is the creator or admin
    if (assessment.createdBy.toString() !== user._id.toString() && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this assessment" });
    }

    // Soft delete by setting isActive to false (preserve data for reports)
    await Assessment.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("deleteAssessment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get assessment reports (admin only)
export const getAssessmentReports = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get overall statistics
    const [totalAssessments, totalResults, activeAssessments] = await Promise.all([
      Assessment.countDocuments({}),
      AssessmentResult.countDocuments({}),
      Assessment.countDocuments({ isActive: true }),
    ]);

    // Get assessment performance stats
    const performanceStats = await AssessmentResult.aggregate([
      {
        $lookup: {
          from: "assessments",
          localField: "assessmentId",
          foreignField: "_id",
          as: "assessment"
        }
      },
      { $unwind: "$assessment" },
      {
        $group: {
          _id: "$assessmentId",
          title: { $first: "$assessment.title" },
          skill: { $first: "$assessment.skill" },
          difficulty: { $first: "$assessment.difficulty" },
          totalAttempts: { $sum: 1 },
          passedAttempts: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
          averageTime: { $avg: "$timeSpent" },
        }
      },
      {
        $addFields: {
          passRate: { $multiply: [{ $divide: ["$passedAttempts", "$totalAttempts"] }, 100] }
        }
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 20 }
    ]);

    // Get skill-wise statistics
    const skillStats = await AssessmentResult.aggregate([
      {
        $lookup: {
          from: "assessments",
          localField: "assessmentId",
          foreignField: "_id",
          as: "assessment"
        }
      },
      { $unwind: "$assessment" },
      {
        $group: {
          _id: "$assessment.skill",
          totalAttempts: { $sum: 1 },
          passedAttempts: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
          assessmentCount: { $addToSet: "$assessmentId" },
        }
      },
      {
        $addFields: {
          passRate: { $multiply: [{ $divide: ["$passedAttempts", "$totalAttempts"] }, 100] },
          assessmentCount: { $size: "$assessmentCount" }
        }
      },
      { $sort: { totalAttempts: -1 } }
    ]);

    // Get recent activity
    const recentActivity = await AssessmentResult.find({})
      .populate({
        path: "userId",
        select: "firstName lastName"
      })
      .populate({
        path: "assessmentId",
        select: "title skill"
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get top performers
    const topPerformers = await AssessmentResult.aggregate([
      {
        $group: {
          _id: "$userId",
          totalAttempts: { $sum: 1 },
          passedAttempts: { $sum: { $cond: ["$passed", 1, 0] } },
          averageScore: { $avg: "$score" },
          totalTime: { $sum: "$timeSpent" },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $addFields: {
          passRate: { $multiply: [{ $divide: ["$passedAttempts", "$totalAttempts"] }, 100] }
        }
      },
      { $match: { totalAttempts: { $gte: 3 } } }, // At least 3 attempts
      { $sort: { averageScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          totalAttempts: 1,
          passedAttempts: 1,
          averageScore: 1,
          passRate: 1,
          totalTime: 1,
        }
      }
    ]);

    return res.status(200).json({
      overview: {
        totalAssessments,
        activeAssessments,
        totalResults,
        inactiveAssessments: totalAssessments - activeAssessments,
      },
      performanceStats,
      skillStats,
      recentActivity,
      topPerformers,
    });
  } catch (error) {
    console.error("getAssessmentReports error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

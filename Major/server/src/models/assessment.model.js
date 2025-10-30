import mongoose from "mongoose";

// Question Schema
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "code"],
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  correctAnswer: {
    type: String, // For code questions or text answers
  },
  explanation: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  points: {
    type: Number,
    default: 1,
  },
});

// Assessment Schema
const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    questions: [questionSchema],
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    passingScore: {
      type: Number, // percentage
      default: 70,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Assessment Result Schema
const assessmentResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        answer: String,
        isCorrect: Boolean,
        points: Number,
      },
    ],
    score: {
      type: Number, // percentage
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    maxPoints: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeSpent: {
      type: Number, // in minutes
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
assessmentSchema.index({ skill: 1, difficulty: 1, isActive: 1 });
assessmentResultSchema.index({ userId: 1, createdAt: -1 });
assessmentResultSchema.index({ assessmentId: 1 });

export const Assessment = mongoose.model("Assessment", assessmentSchema);
export const AssessmentResult = mongoose.model("AssessmentResult", assessmentResultSchema);

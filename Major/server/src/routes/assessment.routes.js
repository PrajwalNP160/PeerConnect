import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import { requireMentorOrAdmin, requireAdmin } from "../middlewares/roleAuth.js";
import {
  getAssessments,
  getAssessmentById,
  submitAssessment,
  getUserResults,
  createAssessment,
  getAssessmentStats,
  updateAssessment,
  deleteAssessment,
  getAssessmentReports,
} from "../controllers/assessment.controller.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getAssessments); // Browse available assessments

// Protected routes
router.use(clerkAuthMiddleware, requireAuth());

// Get specific assessment for taking
router.get("/:id", getAssessmentById);

// Submit assessment answers
router.post("/:id/submit", submitAssessment);

// Get user's assessment results
router.get("/user/results", getUserResults);

// Get user's assessment statistics
router.get("/user/stats", getAssessmentStats);

// Mentor/Admin routes - Create, edit, evaluate assessments
router.post("/create", requireMentorOrAdmin, createAssessment);
router.put("/:id", requireMentorOrAdmin, updateAssessment);
router.delete("/:id", requireMentorOrAdmin, deleteAssessment);

// Admin routes - Oversee all assessments, manage reports
router.get("/reports", requireAdmin, getAssessmentReports);

export default router;

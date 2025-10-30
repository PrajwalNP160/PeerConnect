import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  getSessionHistory,
  createSession,
  endSession,
  getSessionStats,
} from "../controllers/session.controller.js";

const router = express.Router();

// All routes require authentication
router.use(clerkAuthMiddleware, requireAuth());

// Get user's session history with optional filters
router.get("/history", getSessionHistory);

// Get session statistics
router.get("/stats", getSessionStats);

// Create a new session
router.post("/create", createSession);

// End a session
router.put("/:sessionId/end", endSession);

export default router;

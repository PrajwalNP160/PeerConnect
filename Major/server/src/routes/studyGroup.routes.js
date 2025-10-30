import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  getStudyGroups,
  getStudyGroupById,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  updateStudyGroup,
  getUserStudyGroups,
  addResource,
} from "../controllers/studyGroup.controller.js";

const router = express.Router();

// Public routes
router.get("/", getStudyGroups); // Browse study groups

// Protected routes
router.use(clerkAuthMiddleware, requireAuth());

// User's study groups (must come before /:id route)
router.get("/user/my-groups", getUserStudyGroups);

// Get specific study group (must come after specific routes)
router.get("/:id", getStudyGroupById);

// Create study group
router.post("/create", createStudyGroup);

// Join/leave study group
router.post("/:id/join", joinStudyGroup);
router.post("/:id/leave", leaveStudyGroup);

// Update study group (creator/moderator only)
router.put("/:id", updateStudyGroup);

// Add resources
router.post("/:id/resources", addResource);

export default router;

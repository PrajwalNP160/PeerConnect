import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import { repoVerify } from "../controllers/tools.controller.js";

const router = express.Router();

router.post("/repo-verify", clerkAuthMiddleware, requireAuth(), repoVerify);

export default router;

import { User } from "../models/user.model.js";
import { getAuth } from "@clerk/express";

// Middleware to check if user has required role
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findOne({ clerkId: userId }).lean();
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${user.role}` 
        });
      }

      // Add user info to request for use in controllers
      req.user = user;
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Specific role checkers
export const requireMentor = requireRole(["mentor", "admin"]);
export const requireAdmin = requireRole(["admin"]);
export const requireMentorOrAdmin = requireRole(["mentor", "admin"]);

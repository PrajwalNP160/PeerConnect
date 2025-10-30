// import { clerkMiddleware } from "@clerk/express";

// export const clerkAuthMiddleware = clerkMiddleware();
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();
export const clerkAuthMiddleware = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

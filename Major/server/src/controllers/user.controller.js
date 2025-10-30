import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const saveAuthenticatedUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // fetch user details from Clerk
    const clerkRes = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });
    if (!clerkRes.ok) {
      return res
        .status(clerkRes.status)
        .json({ message: "Failed to fetch user from Clerk" });
    }
    const clerkUser = await clerkRes.json();

    // upsert user (update if exists, create if not)
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email: clerkUser.email_addresses[0]?.email_address,
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
        avatar: clerkUser.image_url,
        $setOnInsert: {
          skills: [],
          certificates: [],
          availability: [],
          projects: [],
          role: "",
          location: "",
          isOnBoarded: false,
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const onboardUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      skills,
      projects,
      location,
      role,
      availability,
      skillsToLearn,
      experience,
      experienceType,
    } = req.body;

    if (!skills || !projects || !location || !role || !availability) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let parsedProjects = [];
    try {
      parsedProjects = JSON.parse(projects);
      if (
        !Array.isArray(parsedProjects) ||
        parsedProjects.some((p) => !p.name || !p.gitHubUrl)
      ) {
        return res
          .status(400)
          .json({ message: "Each project must have a name and a url" });
      }
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Invalid projects format. Must be a JSON array." });
    }

    let certificateUrls = [];
    if (req.files && req.files.length > 0) {
      // Note: Certificate upload now handled by MySQL upload endpoint
      // Use /api/mysql-upload/certificate endpoint instead
      certificateUrls = req.body.certificateUrls || [];
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          skills: skills?.split(",").map((s) => s.trim()) || [],
          skillsToLearn: skillsToLearn?.split(",").map((s) => s.trim()) || [],
          projects: parsedProjects,
          location,
          role,
          experience,
          experienceType,
          availability: availability?.split(",").map((d) => d.trim()) || [],
          isOnBoarded: true,
        },
        $push: {
          certificates: { $each: certificateUrls },
        },
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.status(200).json({
      message: "User onboarded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { userId: authUserId } = getAuth(req);

    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const clerkId = req.params.clerkId || authUserId;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMatchingUsers = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { skill } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const filter = {
      clerkId: { $ne: userId },
    };

    if (skill) {
      filter.skills = { $regex: new RegExp(`^${skill}$`, "i") };
    }

    const users = await User.find(filter).select("-email");

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let {
      skills,
      projects,
      location,
      role,
      availability,
      skillsToLearn,
      experience,
      experienceType,
    } = req.body;

    // 🔹 Handle certificate uploads (now handled by MySQL upload endpoint)
    let certificateUrls = [];
    if (req.files && req.files.length > 0) {
      // Note: Certificate upload now handled by MySQL upload endpoint
      // Use /api/mysql-upload/certificate endpoint instead
      certificateUrls = req.body.certificateUrls || [];
    }

    // 🔹 Normalize helper (accept JSON arrays OR comma-separated strings)
    const parseArray = (input) => {
      if (!input) return [];
      if (Array.isArray(input)) return input.map((s) => s.trim());
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed.map((s) => s.trim()) : [];
      } catch {
        return input.split(",").map((s) => s.trim());
      }
    };

    // 🔹 Parse projects (expects array of objects with name and gitHubUrl)
    const parseProjects = (input) => {
      if (!input) return [];
      
      // If it's already an array of objects, return as is
      if (Array.isArray(input)) {
        return input.map(project => {
          if (typeof project === 'object' && project.name) {
            return {
              name: project.name,
              gitHubUrl: project.gitHubUrl || "",
            };
          } else if (typeof project === 'string') {
            return {
              name: project.trim(),
              gitHubUrl: "",
            };
          }
          return project;
        });
      }
      
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parseProjects(parsed) : [];
      } catch {
        // If it's a simple string, convert to project format
        return input.split(",").map((name) => ({
          name: name.trim(),
          gitHubUrl: "", // Default empty URL
        }));
      }
    };

    // 🔹 Build update object
    const $set = {};
    const $push = {};

    if (location) $set.location = location;
    if (role) $set.role = role;
    if (experience) $set.experience = experience;
    if (experienceType) $set.experienceType = experienceType;
    if (skills) $set.skills = parseArray(skills);
    if (skillsToLearn) $set.skillsToLearn = parseArray(skillsToLearn);
    if (availability) $set.availability = parseArray(availability);
    if (projects) $set.projects = parseProjects(projects);

    if (certificateUrls.length) {
      $push.certificates = { $each: certificateUrls }; // ✅ append mode
    }

    if (!Object.keys($set).length && !Object.keys($push).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($push).length) update.$push = $push;

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      update,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update failed:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

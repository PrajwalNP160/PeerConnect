import StudyGroup from "../models/studyGroup.model.js";
import { User } from "../models/user.model.js";

// Get all study groups with filters
export const getStudyGroups = async (req, res) => {
  try {
    const { skill, difficulty, status = "active", page = 1, limit = 12, search } = req.query;

    const query = { isPublic: true, status };
    
    if (skill) {
      query.skill = { $regex: skill, $options: "i" };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [studyGroups, total] = await Promise.all([
      StudyGroup.find(query)
        .populate("creator", "firstName lastName avatar")
        .populate("members.userId", "firstName lastName avatar")
        .sort({ lastActivity: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StudyGroup.countDocuments(query),
    ]);

    // Format response with additional computed fields
    const formattedGroups = studyGroups.map(group => ({
      ...group,
      isFull: group.currentMembers >= group.maxMembers,
      availableSpots: Math.max(0, group.maxMembers - group.currentMembers),
      activeMembers: group.members.filter(m => m.isActive).length,
    }));

    return res.status(200).json({
      studyGroups: formattedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getStudyGroups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get study group by ID
export const getStudyGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkId = req.auth?.userId;

    const studyGroup = await StudyGroup.findById(id)
      .populate("creator", "firstName lastName avatar email")
      .populate("members.userId", "firstName lastName avatar email")
      .populate("goals.assignedTo", "firstName lastName avatar")
      .populate("resources.addedBy", "firstName lastName avatar")
      .lean();

    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is a member (if authenticated)
    let userMembership = null;
    if (clerkId) {
      const user = await User.findOne({ clerkId }).lean();
      if (user) {
        userMembership = studyGroup.members.find(
          member => member.userId._id.toString() === user._id.toString()
        );
      }
    }

    return res.status(200).json({
      studyGroup: {
        ...studyGroup,
        isFull: studyGroup.currentMembers >= studyGroup.maxMembers,
        availableSpots: Math.max(0, studyGroup.maxMembers - studyGroup.currentMembers),
      },
      userMembership,
    });
  } catch (error) {
    console.error("getStudyGroupById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create new study group
export const createStudyGroup = async (req, res) => {
  try {
    const {
      title,
      description,
      skill,
      difficulty,
      maxMembers,
      schedule,
      goals,
      isPublic,
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

    // Validate required fields
    if (!title || !description || !skill || !difficulty) {
      return res.status(400).json({ 
        message: "Title, description, skill, and difficulty are required" 
      });
    }

    const studyGroup = await StudyGroup.create({
      title,
      description,
      skill,
      difficulty,
      maxMembers: maxMembers || 10,
      creator: user._id,
      members: [
        {
          userId: user._id,
          role: "creator",
          joinedAt: new Date(),
        },
      ],
      schedule: schedule || {},
      goals: goals || [],
      isPublic: isPublic !== false, // Default to true
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t => t.trim()) : []),
    });

    // Populate the created group
    const populatedGroup = await StudyGroup.findById(studyGroup._id)
      .populate("creator", "firstName lastName avatar")
      .populate("members.userId", "firstName lastName avatar")
      .lean();

    return res.status(201).json({ studyGroup: populatedGroup });
  } catch (error) {
    console.error("createStudyGroup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Join study group
export const joinStudyGroup = async (req, res) => {
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

    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if group is full
    if (studyGroup.currentMembers >= studyGroup.maxMembers) {
      return res.status(400).json({ message: "Study group is full" });
    }

    // Check if user is already a member
    const existingMember = studyGroup.members.find(
      member => member.userId.toString() === user._id.toString()
    );

    if (existingMember) {
      if (existingMember.isActive) {
        return res.status(400).json({ message: "You are already a member of this group" });
      } else {
        // Reactivate membership
        existingMember.isActive = true;
        existingMember.joinedAt = new Date();
      }
    } else {
      // Add new member
      studyGroup.members.push({
        userId: user._id,
        role: "member",
        joinedAt: new Date(),
      });
    }

    studyGroup.lastActivity = new Date();
    await studyGroup.save();

    // Return updated group
    const updatedGroup = await StudyGroup.findById(id)
      .populate("creator", "firstName lastName avatar")
      .populate("members.userId", "firstName lastName avatar")
      .lean();

    return res.status(200).json({ 
      message: "Successfully joined the study group",
      studyGroup: updatedGroup 
    });
  } catch (error) {
    console.error("joinStudyGroup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Leave study group
export const leaveStudyGroup = async (req, res) => {
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

    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Find user's membership
    const memberIndex = studyGroup.members.findIndex(
      member => member.userId.toString() === user._id.toString() && member.isActive
    );

    if (memberIndex === -1) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Check if user is the creator
    if (studyGroup.creator.toString() === user._id.toString()) {
      // If creator is leaving, either transfer ownership or delete group
      const activeModerators = studyGroup.members.filter(
        m => m.role === "moderator" && m.isActive && m.userId.toString() !== user._id.toString()
      );

      if (activeModerators.length > 0) {
        // Transfer ownership to first moderator
        studyGroup.creator = activeModerators[0].userId;
        activeModerators[0].role = "creator";
      } else {
        const activeMembers = studyGroup.members.filter(
          m => m.isActive && m.userId.toString() !== user._id.toString()
        );

        if (activeMembers.length > 0) {
          // Transfer ownership to first active member
          studyGroup.creator = activeMembers[0].userId;
          activeMembers[0].role = "creator";
        } else {
          // No other members, mark group as cancelled
          studyGroup.status = "cancelled";
        }
      }
    }

    // Deactivate membership
    studyGroup.members[memberIndex].isActive = false;
    studyGroup.lastActivity = new Date();
    await studyGroup.save();

    return res.status(200).json({ 
      message: "Successfully left the study group" 
    });
  } catch (error) {
    console.error("leaveStudyGroup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update study group
export const updateStudyGroup = async (req, res) => {
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

    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user has permission to update (creator or moderator)
    const userMembership = studyGroup.members.find(
      member => member.userId.toString() === user._id.toString() && member.isActive
    );

    if (!userMembership || !["creator", "moderator"].includes(userMembership.role)) {
      return res.status(403).json({ 
        message: "Only creators and moderators can update the group" 
      });
    }

    const {
      title,
      description,
      maxMembers,
      schedule,
      goals,
      isPublic,
      tags,
      status,
    } = req.body;

    // Update fields
    if (title) studyGroup.title = title;
    if (description) studyGroup.description = description;
    if (maxMembers) studyGroup.maxMembers = maxMembers;
    if (schedule) studyGroup.schedule = { ...studyGroup.schedule, ...schedule };
    if (goals) studyGroup.goals = goals;
    if (typeof isPublic === "boolean") studyGroup.isPublic = isPublic;
    if (tags) studyGroup.tags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
    if (status && ["active", "completed", "paused"].includes(status)) {
      studyGroup.status = status;
    }

    studyGroup.lastActivity = new Date();
    await studyGroup.save();

    // Return updated group
    const updatedGroup = await StudyGroup.findById(id)
      .populate("creator", "firstName lastName avatar")
      .populate("members.userId", "firstName lastName avatar")
      .lean();

    return res.status(200).json({ 
      message: "Study group updated successfully",
      studyGroup: updatedGroup 
    });
  } catch (error) {
    console.error("updateStudyGroup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's study groups
export const getUserStudyGroups = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const studyGroups = await StudyGroup.find({
      "members.userId": user._id,
      "members.isActive": true,
    })
      .populate("creator", "firstName lastName avatar")
      .populate("members.userId", "firstName lastName avatar")
      .sort({ lastActivity: -1 })
      .lean();

    // Add user's role in each group
    const groupsWithRole = studyGroups.map(group => {
      const userMembership = group.members.find(
        member => member.userId._id.toString() === user._id.toString()
      );
      
      return {
        ...group,
        userRole: userMembership?.role,
        isFull: group.currentMembers >= group.maxMembers,
        availableSpots: Math.max(0, group.maxMembers - group.currentMembers),
      };
    });

    return res.status(200).json({ studyGroups: groupsWithRole });
  } catch (error) {
    console.error("getUserStudyGroups error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add resource to study group
export const addResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, type } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const studyGroup = await StudyGroup.findById(id);
    if (!studyGroup) {
      return res.status(404).json({ message: "Study group not found" });
    }

    // Check if user is a member
    const isMember = studyGroup.members.some(
      member => member.userId.toString() === user._id.toString() && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({ message: "Only members can add resources" });
    }

    studyGroup.resources.push({
      title,
      url,
      type: type || "other",
      addedBy: user._id,
    });

    studyGroup.lastActivity = new Date();
    await studyGroup.save();

    return res.status(200).json({ 
      message: "Resource added successfully",
      resource: studyGroup.resources[studyGroup.resources.length - 1]
    });
  } catch (error) {
    console.error("addResource error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import Session from "../models/session.model.js";
import { Exchange } from "../models/exchange.model.js";
import { User } from "../models/user.model.js";

// Get user's session history
export const getSessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, skill } = req.query;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user in database
    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build query
    const query = {
      "participants.userId": user._id,
    };

    if (status) {
      query.status = status;
    }

    if (skill) {
      query["participants.skill"] = { $regex: skill, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with populated data
    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate({
          path: "participants.userId",
          select: "firstName lastName avatar",
        })
        .populate({
          path: "exchangeId",
          select: "participants",
          populate: {
            path: "participants.userId",
            select: "firstName lastName avatar",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Session.countDocuments(query),
    ]);

    // Format sessions for frontend
    const formattedSessions = sessions.map((session) => {
      const currentUserParticipant = session.participants.find(
        (p) => p.userId._id.toString() === user._id.toString()
      );
      const otherParticipant = session.participants.find(
        (p) => p.userId._id.toString() !== user._id.toString()
      );

      return {
        _id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        rating: session.rating,
        feedback: session.feedback,
        notes: session.notes,
        roomId: session.roomId,
        myRole: currentUserParticipant?.role,
        mySkill: currentUserParticipant?.skill,
        partner: otherParticipant?.userId,
        partnerRole: otherParticipant?.role,
        partnerSkill: otherParticipant?.skill,
        createdAt: session.createdAt,
      };
    });

    return res.status(200).json({
      sessions: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getSessionHistory error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new session (when starting a video call)
export const createSession = async (req, res) => {
  try {
    const { exchangeId, roomId } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user and exchange
    const [user, exchange] = await Promise.all([
      User.findOne({ clerkId }).lean(),
      Exchange.findById(exchangeId).populate("participants.userId").lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" });
    }

    // Check if user is part of the exchange
    const isParticipant = exchange.participants.some(
      (p) => p.userId._id.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized for this exchange" });
    }

    // Create session participants
    const sessionParticipants = exchange.participants.map((p) => ({
      userId: p.userId._id,
      role: p.userId._id.toString() === user._id.toString() ? "teacher" : "learner",
      skill: p.teaches, // The skill they're teaching in this session
    }));

    const session = await Session.create({
      exchangeId,
      participants: sessionParticipants,
      startTime: new Date(),
      status: "ongoing",
      roomId,
    });

    return res.status(201).json({ session });
  } catch (error) {
    console.error("createSession error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// End a session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback, notes } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of the session
    const isParticipant = session.participants.some(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized for this session" });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / (1000 * 60)); // in minutes

    // Update session
    session.endTime = endTime;
    session.duration = duration;
    session.status = "completed";

    if (rating) session.rating = rating;
    if (feedback) session.feedback = feedback;
    if (notes) session.notes = notes;

    await session.save();

    return res.status(200).json({ session });
  } catch (error) {
    console.error("endSession error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get session statistics
export const getSessionStats = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await Session.aggregate([
      {
        $match: {
          "participants.userId": user._id,
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalDuration: { $sum: "$duration" },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      completedSessions: 0,
      totalDuration: 0,
      averageRating: 0,
    };

    return res.status(200).json({ stats: result });
  } catch (error) {
    console.error("getSessionStats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { Request } from "../models/request.model.js";
import { Exchange } from "../models/exchange.model.js";

export const sendRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { toUserId, skillToLearn, skillToTeach } = req.body;

    if (!skillToLearn || !skillToTeach) {
      return res.status(400).json({ message: "Skill fields are mandatory" });
    }

    const senderUser = await User.findOne({ clerkId: userId });
    const receiverUser = await User.findById(toUserId);

    if (!senderUser || !receiverUser) {
      return res.status(404).json({ message: "user not found" });
    }

    // Check for existing pending request with same skills
    const existingRequest = await Request.findOne({
      fromUser: senderUser._id,
      toUser: receiverUser._id,
      skillToLearn,
      skillToTeach,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({ 
        message: "You already have a pending request with this user for these skills",
        existingRequest: {
          id: existingRequest._id,
          createdAt: existingRequest.createdAt,
          skillToLearn: existingRequest.skillToLearn,
          skillToTeach: existingRequest.skillToTeach
        }
      });
    }

    // Check for reverse request (they sent you a request for opposite skills)
    const reverseRequest = await Request.findOne({
      fromUser: receiverUser._id,
      toUser: senderUser._id,
      skillToLearn: skillToTeach, // Their skillToLearn is your skillToTeach
      skillToTeach: skillToLearn, // Their skillToTeach is your skillToLearn
      status: "pending",
    });

    if (reverseRequest) {
      return res.status(409).json({ 
        message: "This user has already sent you a request for these skills. Check your pending requests!",
        reverseRequest: {
          id: reverseRequest._id,
          createdAt: reverseRequest.createdAt,
          skillToLearn: reverseRequest.skillToLearn,
          skillToTeach: reverseRequest.skillToTeach
        }
      });
    }

    const newRequest = await Request.create({
      fromUser: senderUser._id,
      toUser: receiverUser._id,
      skillToLearn,
      skillToTeach,
    });

    await newRequest.save();

    return res.status(200).json({ message: "Request send successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const respondRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    ).lean();

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (status === "accepted") {
      const newExchange = await Exchange.create({
        participants: [
          {
            userId: updatedRequest.toUser,
            teaches: updatedRequest.skillToTeach,
            learns: updatedRequest.skillToLearn,
          },
          {
            userId: updatedRequest.fromUser,
            teaches: updatedRequest.skillToLearn,
            learns: updatedRequest.skillToTeach,
          },
        ],
        nextSession: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      await Request.findByIdAndDelete(requestId);

      return res.status(200).json({
        message: "Request accepted and exchange created",
        exchange: newExchange,
      });
    }

    return res
      .status(200)
      .json({ message: `Request ${status}`, updatedRequest });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const requests = await Request.find({
      toUser: currentUser._id,
      status: "pending",
    })
      .populate("fromUser", "firstName avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: "Internal server error" });
  }
};

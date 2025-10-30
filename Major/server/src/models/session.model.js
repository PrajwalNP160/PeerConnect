import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    exchangeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
      required: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["teacher", "learner"],
          required: true,
        },
        skill: {
          type: String,
          required: true,
        },
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
    notes: {
      type: String,
    },
    roomId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
sessionSchema.index({ "participants.userId": 1, createdAt: -1 });
sessionSchema.index({ exchangeId: 1 });
sessionSchema.index({ status: 1 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;

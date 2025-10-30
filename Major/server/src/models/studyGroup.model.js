import mongoose from "mongoose";

const studyGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 50,
    },
    currentMembers: {
      type: Number,
      default: 1,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["creator", "moderator", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    schedule: {
      meetingDays: [
        {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
      ],
      meetingTime: {
        type: String, // Format: "HH:MM"
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      duration: {
        type: Number, // in minutes
        default: 60,
      },
    },
    goals: [
      {
        title: String,
        description: String,
        completed: {
          type: Boolean,
          default: false,
        },
        dueDate: Date,
        assignedTo: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    resources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ["article", "video", "course", "book", "other"],
          default: "other",
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    roomId: {
      type: String, // For video calls
    },
    nextMeeting: {
      type: Date,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
studyGroupSchema.index({ skill: 1, difficulty: 1, status: 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ "members.userId": 1 });
studyGroupSchema.index({ isPublic: 1, status: 1 });
studyGroupSchema.index({ tags: 1 });

// Update currentMembers count when members array changes
studyGroupSchema.pre("save", function (next) {
  this.currentMembers = this.members.filter(member => member.isActive).length;
  next();
});

// Virtual for checking if group is full
studyGroupSchema.virtual("isFull").get(function () {
  return this.currentMembers >= this.maxMembers;
});

// Virtual for available spots
studyGroupSchema.virtual("availableSpots").get(function () {
  return Math.max(0, this.maxMembers - this.currentMembers);
});

const StudyGroup = mongoose.model("StudyGroup", studyGroupSchema);
export default StudyGroup;

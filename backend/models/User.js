const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  RISK_LEVELS,
  INVESTMENT_GOALS,
  INVESTMENT_BUDGETS,
  INVESTMENT_DURATIONS,
  INVESTMENT_TYPES,
  PLATFORMS,
  SECTORS,
} = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by default queries
    },

    // ---- Investment preferences (Profile / AI Advisor inputs) ----
    riskTolerance: {
      type: String,
      enum: RISK_LEVELS,
      default: null,
    },
    investmentGoal: {
      type: String,
      enum: INVESTMENT_GOALS,
      default: null,
    },
    investmentBudget: {
      type: String,
      enum: INVESTMENT_BUDGETS,
      default: null,
    },
    investmentDuration: {
      type: String,
      enum: INVESTMENT_DURATIONS,
      default: null,
    },
    preferredInvestmentTypes: {
      type: [String],
      enum: INVESTMENT_TYPES,
      default: [],
    },
    preferredSectors: {
      type: [String],
      enum: SECTORS,
      default: [],
    },
    preferredPlatform: {
      type: String,
      enum: PLATFORMS,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash the password before saving, only if it was modified.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plaintext password with the stored hash.
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive/internal fields whenever a user document is serialized.
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.RISK_LEVELS = RISK_LEVELS;
module.exports.INVESTMENT_GOALS = INVESTMENT_GOALS;
module.exports.INVESTMENT_BUDGETS = INVESTMENT_BUDGETS;
module.exports.INVESTMENT_DURATIONS = INVESTMENT_DURATIONS;
module.exports.INVESTMENT_TYPES = INVESTMENT_TYPES;
module.exports.PLATFORMS = PLATFORMS;
module.exports.SECTORS = SECTORS;

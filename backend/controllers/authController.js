const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { ApiError, asyncHandler } = require("../middleware/errorHandler");

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    user: user.toSafeObject(),
    token,
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // .select("+password") because the schema excludes it by default
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Logged in successfully",
    user: user.toSafeObject(),
    token,
  });
});

/**
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    user: user.toSafeObject(),
  });
});

/**
 * @route   PUT /api/auth/profile
 * @access  Private
 *
 * Updates the user's basic info and/or investment preferences. Every field
 * is optional so the frontend can send only what changed. Preference
 * fields feed directly into the recommendation engine (services/recommendationService).
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const editableFields = [
    "name",
    "riskTolerance",
    "investmentGoal",
    "investmentBudget",
    "investmentDuration",
    "preferredInvestmentTypes",
    "preferredSectors",
    "preferredPlatform",
  ];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: user.toSafeObject(),
  });
});

module.exports = { register, login, getProfile, updateProfile };

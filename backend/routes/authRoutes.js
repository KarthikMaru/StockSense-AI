const express = require("express");
const { body } = require("express-validator");
const { register, login, getProfile, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  RISK_LEVELS,
  INVESTMENT_GOALS,
  INVESTMENT_BUDGETS,
  INVESTMENT_DURATIONS,
  INVESTMENT_TYPES,
  SECTORS,
  PLATFORMS,
} = require("../models/User");

const router = express.Router();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("riskTolerance")
    .optional()
    .isIn(RISK_LEVELS)
    .withMessage(`riskTolerance must be one of: ${RISK_LEVELS.join(", ")}`),
  body("investmentGoal")
    .optional()
    .isIn(INVESTMENT_GOALS)
    .withMessage(`investmentGoal must be one of: ${INVESTMENT_GOALS.join(", ")}`),
  body("investmentBudget")
    .optional()
    .isIn(INVESTMENT_BUDGETS)
    .withMessage(`investmentBudget must be one of: ${INVESTMENT_BUDGETS.join(", ")}`),
  body("investmentDuration")
    .optional()
    .isIn(INVESTMENT_DURATIONS)
    .withMessage(`investmentDuration must be one of: ${INVESTMENT_DURATIONS.join(", ")}`),
  body("preferredInvestmentTypes")
    .optional()
    .isArray()
    .withMessage("preferredInvestmentTypes must be an array")
    .custom((arr) => arr.every((t) => INVESTMENT_TYPES.includes(t)))
    .withMessage(`preferredInvestmentTypes can only contain: ${INVESTMENT_TYPES.join(", ")}`),
  body("preferredSectors")
    .optional()
    .isArray()
    .withMessage("preferredSectors must be an array")
    .custom((arr) => arr.every((s) => SECTORS.includes(s)))
    .withMessage(`preferredSectors can only contain: ${SECTORS.join(", ")}`),
  body("preferredPlatform")
    .optional()
    .isIn(PLATFORMS)
    .withMessage(`preferredPlatform must be one of: ${PLATFORMS.join(", ")}`),
];

router.post("/register", registerValidation, validateRequest, register);
router.post("/login", loginValidation, validateRequest, login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfileValidation, validateRequest, updateProfile);

module.exports = router;

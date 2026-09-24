const jwt = require("jsonwebtoken");
const { ApiError, asyncHandler } = require("./errorHandler");

/**
 * Protects a route by requiring a valid JWT in the Authorization header:
 *   Authorization: Bearer <token>
 *
 * On success, attaches the decoded payload (at minimum { id }) to req.user.
 * The User model itself is introduced in Phase 2, so this middleware only
 * verifies the token here; controllers load the full user document.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized. No authentication token provided.");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
});

/**
 * Optional auth: attaches req.user if a valid token is present, but does
 * not block the request if it's missing/invalid. Useful for endpoints that
 * behave differently for logged-in vs. anonymous users (e.g. top stocks).
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, optionalAuth };

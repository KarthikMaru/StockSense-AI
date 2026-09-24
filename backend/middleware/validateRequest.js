const { validationResult } = require("express-validator");
const { ApiError } = require("./errorHandler");

/**
 * Runs after an array of express-validator checks on a route. If any
 * validation failed, throws a 400 ApiError with a readable, combined
 * message instead of letting the route handler run with bad input.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    throw new ApiError(400, message);
  }
  next();
}

module.exports = validateRequest;

const express = require('express');
const router = express.Router();


/**
 * mounts proper routers on paths of api router
 * exported from this module
 */
router.use('/users', require('./users'));

/**
 * error-handler (hence the 4 argument signature)
 * router-level middleware,
 * catches ValidationErrors, UnauthorizedErrors,
 * otherwise calls next error handler in stack
 */
router.use(function(err, req, res, next) {
  /**
   * if no error is caught above,
   * then pass below, which then goes
   * to the root app.js error-handler
   * app-level middleware
   */

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "You must be logged in",
      ...err,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json(err);
  }

  if (err.name === "BadRequest") {
    return res.status(400).json(err)
  };
  next(err);
})

module.exports = router;

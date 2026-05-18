const rateLimit = require('express-rate-limit');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skip: (req) => req.path !== '/login',
});

module.exports = { loginRateLimiter };

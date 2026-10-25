import rateLimit from 'express-rate-limit'

// Rate limiting is disabled under the test runner: the suite runs many requests
// in a single long-lived process against one in-memory counter, which would
// otherwise trip the limits and cause false failures.
const skipInTests = () => process.env.NODE_ENV === 'test'

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
}

// General limiter for authenticated write operations (create/update/delete).
export const writeLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: { ok: false, error: 'Too many requests. Please slow down and try again later.' },
})

// Stricter limiter for endpoints that accept file uploads (bounded disk/Cloudinary cost).
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: { ok: false, error: 'Too many uploads. Please try again later.' },
})

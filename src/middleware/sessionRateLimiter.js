import rateLimit from "express-rate-limit";
import { getSessionIdFromCookie } from "../utils/sessionManager.js";

/**
 * Session-based rate limiter for posts
 * Limits users to 5 posts per minute per session ID
 */

export const sessionPostRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 posts per minute
  message: {
    error: "Rate limit exceeded",
    message:
      "Too many posts from this session. Please wait before posting again.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator based on session ID
  keyGenerator: (req) => {
    const sessionId = getSessionIdFromCookie(req);
    return sessionId || req.ip; // Fallback to IP if no session
  },
  // Skip rate limiting for admin requests
  skip: (req) => {
    const adminKey = req.headers["admin-key"];
    return adminKey === process.env.ADMIN_KEY;
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const sessionId = getSessionIdFromCookie(req);
    console.log(
      `Rate limit exceeded for session: ${sessionId || "unknown"} from IP: ${
        req.ip
      }`
    );

    res.status(429).json({
      error: "Rate limit exceeded",
      message:
        "Too many posts from this session. Please wait before posting again.",
      retryAfter: "1 minute",
      sessionId: sessionId || "unknown",
    });
  },
});

/**
 * Session-based rate limiter for comments
 * Limits users to 10 comments per minute per session ID
 */
export const sessionCommentRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 comments per minute
  message: {
    error: "Rate limit exceeded",
    message:
      "Too many comments from this session. Please wait before commenting again.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const sessionId = getSessionIdFromCookie(req);
    return sessionId || req.ip;
  },
  skip: (req) => {
    const adminKey = req.headers["admin-key"];
    return adminKey === process.env.ADMIN_KEY;
  },
});


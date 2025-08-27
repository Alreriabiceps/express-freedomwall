// Rate limiting middleware to prevent spam and abuse

const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastReset > 5 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (maxRequests, windowMs, identifier) => {
  return (req, res, next) => {
    const key = identifier(req);
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 0,
        lastReset: now,
        requests: [],
      });
    }

    const data = rateLimitStore.get(key);

    // Remove old requests outside the window
    data.requests = data.requests.filter((time) => now - time < windowMs);

    // Check if limit exceeded
    if (data.requests.length >= maxRequests) {
      const oldestRequest = data.requests[0];
      const timeUntilReset = windowMs - (now - oldestRequest);

      return res.status(429).json({
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          timeUntilReset / 1000
        )} seconds.`,
        retryAfter: Math.ceil(timeUntilReset / 1000),
      });
    }

    // Add current request
    data.requests.push(now);
    data.count++;

    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": maxRequests,
      "X-RateLimit-Remaining": Math.max(0, maxRequests - data.requests.length),
      "X-RateLimit-Reset": new Date(now + windowMs).toISOString(),
    });

    next();
  };
};

// Rate limiters for different actions
export const postRateLimiter = createRateLimiter(
  5, // 5 posts
  60 * 1000, // per minute
  (req) => `post:${req.body.name || "anonymous"}:${req.ip}`
);

export const commentRateLimiter = createRateLimiter(
  10, // 10 comments
  60 * 1000, // per minute
  (req) => `comment:${req.body.name || "anonymous"}:${req.ip}`
);

export const likeRateLimiter = createRateLimiter(
  30, // 30 likes
  60 * 1000, // per minute
  (req) => `like:${req.body.userId || req.ip}`
);

export const reportRateLimiter = createRateLimiter(
  10, // 10 reports
  60 * 1000, // per minute
  (req) => `report:${req.body.userId || req.ip}`
);

export const contactRateLimiter = createRateLimiter(
  5, // 5 contact messages
  60 * 60 * 1000, // per hour
  (req) => `contact:${req.body.email || req.ip}`
);

// Rate limiter for GET requests (reading posts)
export const getPostsRateLimiter = createRateLimiter(
  100, // 100 requests
  60 * 1000, // per minute
  (req) => `get:${req.ip}`
);

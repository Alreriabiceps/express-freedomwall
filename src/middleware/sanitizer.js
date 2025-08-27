// Input sanitization middleware to prevent XSS and injection attacks

import DOMPurify from "isomorphic-dompurify";

// HTML entities mapping for additional safety
const htmlEntities = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

// Escape HTML entities
const escapeHtml = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/[&<>"'`=]/g, (char) => htmlEntities[char]);
};

// Sanitize text content
const sanitizeText = (text) => {
  if (typeof text !== "string") return text;

  // Remove null bytes and control characters
  let sanitized = text.replace(/[\x00-\x1F\x7F]/g, "");

  // Remove potential script tags and dangerous patterns
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  sanitized = sanitized.replace(/data:/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

// Sanitize request body
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    // Sanitize string fields
    if (req.body.name && req.body.name.trim()) {
      req.body.name = sanitizeText(req.body.name);
    } else {
      req.body.name = "Anonymous"; // Set empty name to "Anonymous" for anonymous posts
    }
    if (req.body.message) {
      req.body.message = sanitizeText(req.body.message);
    }
    if (req.body.reason) {
      req.body.reason = sanitizeText(req.body.reason);
    }

    // Sanitize comment fields
    if (req.body.comments && Array.isArray(req.body.comments)) {
      req.body.comments = req.body.comments.map((comment) => ({
        name: sanitizeText(comment.name),
        message: sanitizeText(comment.message),
      }));
    }
  }

  next();
};

// Sanitize query parameters
export const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        req.query[key] = sanitizeText(value);
      }
    }
  }

  next();
};

// Sanitize URL parameters
export const sanitizeParams = (req, res, next) => {
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === "string") {
        req.params[key] = sanitizeText(value);
      }
    }
  }

  next();
};

// Comprehensive sanitization for all inputs
export const sanitizeAll = (req, res, next) => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};

// Validate and sanitize post content
export const validatePostContent = (req, res, next) => {
  const { name, message } = req.body;

  // Check for required fields
  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  // Check length limits (name is optional)
  if (name && name.length > 100) {
    return res
      .status(400)
      .json({ message: "Name must be 100 characters or less" });
  }

  if (message.length > 1000) {
    return res
      .status(400)
      .json({ message: "Message must be 1000 characters or less" });
  }

  // Check for empty content after sanitization (name is optional)
  if (!message.trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if ((name && pattern.test(name)) || pattern.test(message)) {
      return res
        .status(400)
        .json({ message: "Content contains suspicious patterns" });
    }
  }

  next();
};

// Validate and sanitize comment content
export const validateCommentContent = (req, res, next) => {
  const { name, message } = req.body;

  // Check for required fields
  if (!name || !message) {
    return res.status(400).json({ message: "Name and message are required" });
  }

  // Check length limits
  if (name.length > 100) {
    return res
      .status(400)
      .json({ message: "Name must be 100 characters or less" });
  }

  if (message.length > 200) {
    return res
      .status(400)
      .json({ message: "Comment must be 200 characters or less" });
  }

  // Check for empty content after sanitization
  if (!name.trim() || !message.trim()) {
    return res
      .status(400)
      .json({ message: "Name and message cannot be empty" });
  }

  next();
};

// Validate and sanitize contact form content
export const validateContactContent = (req, res, next) => {
  const { name, email, subject, message } = req.body;

  // Check for required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      message: "Name, email, subject, and message are required",
    });
  }

  // Check length limits
  if (name.length > 100) {
    return res
      .status(400)
      .json({ message: "Name must be 100 characters or less" });
  }

  if (email.length > 100) {
    return res
      .status(400)
      .json({ message: "Email must be 100 characters or less" });
  }

  if (subject.length > 200) {
    return res
      .status(400)
      .json({ message: "Subject must be 200 characters or less" });
  }

  if (message.length > 1000) {
    return res
      .status(400)
      .json({ message: "Message must be 1000 characters or less" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Check for empty content after sanitization
  if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
    return res.status(400).json({ message: "All fields cannot be empty" });
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name) || pattern.test(subject) || pattern.test(message)) {
      return res
        .status(400)
        .json({ message: "Content contains suspicious patterns" });
    }
  }

  next();
};

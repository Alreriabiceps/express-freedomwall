// Input sanitization middleware with Filipino foul language filtering

// Import the Filipino filter functions
import {
  censorFoulLanguage,
  containsFoulLanguage,
} from "../../utils/filipinoFilter.js";

// HTML entities mapping for additional safety - DISABLED
const htmlEntities = {
  // "&": "&amp;",
  // "<": "&lt;",
  // ">": "&gt;",
  // '"': "&quot;",
  // "'": "&#x27;",
  // "`": "&#x60;",
  // "=": "&#x3D;",
};

// Escape HTML entities - DISABLED
const escapeHtml = (text) => {
  if (typeof text !== "string") return text;
  // return text.replace(/[&<>"'`=]/g, (char) => htmlEntities[char]);
  return text; // Return text unchanged
};

// Sanitize text content with Filipino foul language filtering
const sanitizeText = (text) => {
  if (typeof text !== "string") return text;

  // Remove null bytes and control characters only
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

  // Apply Filipino foul language filtering
  const censored = censorFoulLanguage(sanitized);
  sanitized = censored.censoredText;

  // Enhanced censoring for "jeren" and variations
  const jerenPatterns = [
    /j[3e]r[3e]n/gi, // j3ren, jeren, j3r3n, jer3n
    /j[3e]r[3e]+n/gi, // jereeeeeen, j3r3e3n
    /j[3e]+r[3e]+n/gi, // jeeeeeren, j333r3n
    /j[3e]r[3e]*n/gi, // j3ren, jeren, j3r3n
    /j[3e]*r[3e]*n/gi, // j3ren, jeren, j3r3n
    /j[3e]r[3e]n+/gi, // jeren, j3r3n
    /j[3e]+r[3e]+n+/gi, // jeeeeeren, j333r3n
  ];

  // Apply all patterns
  jerenPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "*****");
  });

  // NO HTML entity escaping - return text as is
  // sanitized = escapeHtml(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

// Sanitize request body with Filipino foul language filtering
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    // Set empty name to "Anonymous"
    if (
      req.body.name === "" ||
      req.body.name === null ||
      req.body.name === undefined
    ) {
      req.body.name = "Anonymous";
    }

    // Enhanced censoring for "jeren" and variations in names
    if (req.body.name) {
      const jerenPatterns = [
        /j[3e]r[3e]n/gi, // j3ren, jeren, j3r3n, jer3n
        /j[3e]r[3e]+n/gi, // jereeeeeen, j3r3e3n
        /j[3e]+r[3e]+n/gi, // jeeeeeren, j333r3n
        /j[3e]r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]*r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]r[3e]n+/gi, // jeren, j3r3n
        /j[3e]+r[3e]+n+/gi, // jeeeeeren, j333r3n
      ];

      // Apply all patterns
      jerenPatterns.forEach((pattern) => {
        req.body.name = req.body.name.replace(pattern, "*****");
      });

      // Apply Filipino foul language filtering to names
      const censoredName = censorFoulLanguage(req.body.name);
      req.body.name = censoredName.censoredText;
      req.body.nameWasCensored = censoredName.hasFoulLanguage;

      // NO HTML encoding - keep original text
      // req.body.name = escapeHtml(req.body.name);
    }

    // Enhanced censoring for "jeren" and variations in messages
    if (req.body.message) {
      const jerenPatterns = [
        /j[3e]r[3e]n/gi, // j3ren, jeren, j3r3n, jer3n
        /j[3e]r[3e]+n/gi, // jereeeeeen, j3r3e3n
        /j[3e]+r[3e]+n/gi, // jeeeeeren, j333r3n
        /j[3e]r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]*r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]r[3e]n+/gi, // jeren, j3r3n
        /j[3e]+r[3e]+n+/gi, // jeeeeeren, j333r3n
      ];

      // Apply all patterns to message content
      jerenPatterns.forEach((pattern) => {
        req.body.message = req.body.message.replace(pattern, "*****");
      });

      // Apply Filipino foul language filtering to messages
      const censoredMessage = censorFoulLanguage(req.body.message);
      req.body.message = censoredMessage.censoredText;
      req.body.messageWasCensored = censoredMessage.hasFoulLanguage;
      req.body.censoredWordCount = censoredMessage.censoredCount;

      // Store original message if it was censored
      if (censoredMessage.hasFoulLanguage) {
        req.body.originalMessage = req.body.message;
      }

      // NO HTML encoding - keep original text
      // req.body.message = escapeHtml(req.body.message);
    }

    // Sanitize string fields with enhanced censoring - NO HTML encoding
    if (req.body.name && req.body.name.trim()) {
      // req.body.name = escapeHtml(req.body.name.trim());
      req.body.name = req.body.name.trim();
    }
    if (req.body.message && req.body.message.trim()) {
      // req.body.message = escapeHtml(req.body.message.trim());
      req.body.message = req.body.message.trim();
    }

    // Enhanced censoring for "jeren" and variations in subject field
    if (req.body.subject) {
      const jerenPatterns = [
        /j[3e]r[3e]n/gi, // j3ren, jeren, j3r3n, jer3n
        /j[3e]r[3e]+n/gi, // jereeeeeen, j3r3e3n
        /j[3e]+r[3e]+n/gi, // jeeeeeren, j333r3n
        /j[3e]r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]*r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]r[3e]n+/gi, // jeren, j3r3n
        /j[3e]+r[3e]+n+/gi, // jeeeeeren, j333r3n
      ];

      // Apply all patterns to subject content
      jerenPatterns.forEach((pattern) => {
        req.body.subject = req.body.subject.replace(pattern, "*****");
      });

      // Apply Filipino foul language filtering to subject
      const censoredSubject = censorFoulLanguage(req.body.subject);
      req.body.subject = censoredSubject.censoredText;
      req.body.subjectWasCensored = censoredSubject.hasFoulLanguage;

      // NO HTML encoding - keep original text
      // req.body.subject = escapeHtml(req.body.subject);
    }

    // Sanitize comment fields with enhanced censoring - NO HTML encoding
    if (req.body.comments && Array.isArray(req.body.comments)) {
      const jerenPatterns = [
        /j[3e]r[3e]n/gi, // j3ren, jeren, j3r3n, jer3n
        /j[3e]r[3e]+n/gi, // jereeeeeen, j3r3e3n
        /j[3e]+r[3e]+n/gi, // jeeeeeren, j333r3n
        /j[3e]r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]*r[3e]*n/gi, // j3ren, jeren, j3r3n
        /j[3e]r[3e]n+/gi, // jeren, j3r3n
        /j[3e]+r[3e]+n+/gi, // jeeeeeren, j333r3n
      ];

      req.body.comments = req.body.comments.map((comment) => {
        let censoredName = comment.name;
        // Apply all patterns
        jerenPatterns.forEach((pattern) => {
          censoredName = censoredName.replace(pattern, "*****");
        });

        // Apply Filipino foul language filtering to comment names
        const censoredCommentName = censorFoulLanguage(censoredName);
        censoredName = censoredCommentName.censoredText;

        // Apply Filipino foul language filtering to comment messages
        const censoredCommentMessage = censorFoulLanguage(comment.message);
        const message = censoredCommentMessage.censoredText;

        return {
          name: censoredName, // NO HTML encoding
          message: message, // NO HTML encoding
          createdAt: comment.createdAt, // Keep original createdAt
          wasCensored:
            censoredCommentName.hasFoulLanguage ||
            censoredCommentMessage.hasFoulLanguage,
        };
      });
    }

    // Log censoring statistics for monitoring
    if (req.body.messageWasCensored || req.body.nameWasCensored) {
      console.log(
        `Content censored - Words: ${req.body.censoredWordCount || 0}, Name: ${
          req.body.nameWasCensored
        }, Message: ${req.body.messageWasCensored}`
      );
    }
  }

  next();
};

// Sanitize query parameters - NO HTML encoding
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

// Sanitize URL parameters - NO HTML encoding
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

// Validation for post content - REMOVED LENGTH LIMITS
export const validatePostContent = (req, res, next) => {
  const { message, name } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      message: "Message is required",
    });
  }

  // NO LENGTH LIMITS - complete freedom
  // if (message.length > 1000) {
  //   return res.status(400).json({
  //     message: "Message cannot exceed 1000 characters",
  //   });
  // }

  // if (name && name.length > 100) {
  //   return res.status(400).json({
  //     message: "Name cannot exceed 100 characters",
  //   });
  // }

  next();
};

// Validation for comment content - REMOVED LENGTH LIMITS
export const validateCommentContent = (req, res, next) => {
  const { message, name } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      message: "Comment message is required",
    });
  }

  // NO LENGTH LIMITS - complete freedom
  // if (message.length > 500) {
  //   return res.status(400).json({
  //     message: "Comment cannot exceed 500 characters",
  //   });
  // }

  // if (name && name.length > 100) {
  //   return res.status(400).json({
  //     message: "Name cannot exceed 100 characters",
  //   });
  // }

  next();
};

// Validate and sanitize contact form content - REMOVED LENGTH LIMITS
export const validateContactContent = (req, res, next) => {
  const { name, subject, message } = req.body;

  // Check for required fields
  if (!name || !subject || !message) {
    return res.status(400).json({
      message: "Name, subject, and message are required",
    });
  }

  // NO LENGTH LIMITS - complete freedom
  // if (name.length > 100) {
  //   return res
  //     .json({ message: "Name must be 100 characters or less" });
  // }

  // if (subject.length > 200) {
  //   return res
  //     .json({ message: "Subject must be 200 characters or less" });
  // }

  // if (message.length > 1000) {
  //   return res
  //     .json({ message: "Message must be 1000 characters or less" });
  // }

  // Check for empty content after sanitization
  if (!name.trim() || !subject.trim() || !message.trim()) {
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

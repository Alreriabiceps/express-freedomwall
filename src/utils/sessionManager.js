import crypto from "crypto";

/**
 * Session management utilities for Freedom Wall
 * Handles session ID generation, validation, and cookie management
 */

/**
 * Generate a unique session ID
 * @returns {string} A unique session identifier
 */
export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Extract session ID from cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Session ID if found, null otherwise
 */
export function getSessionIdFromCookie(req) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const sessionCookie = cookies
    .split(";")
    .find((cookie) => cookie.trim().startsWith("freedomwall_session="));

  if (!sessionCookie) return null;

  return sessionCookie.split("=")[1];
}

/**
 * Set session cookie in response
 * @param {Object} res - Express response object
 * @param {string} sessionId - Session ID to set
 */
export function setSessionCookie(res, sessionId) {
  // Set cookie with security options
  res.cookie("freedomwall_session", sessionId, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

/**
 * Get or create session ID for a request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {string} Session ID (either existing or newly created)
 */
export function getOrCreateSessionId(req, res) {
  let sessionId = getSessionIdFromCookie(req);

  if (!sessionId) {
    sessionId = generateSessionId();
    setSessionCookie(res, sessionId);
  }

  return sessionId;
}

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string") return false;
  return /^[a-f0-9]{64}$/.test(sessionId); // 64 character hex string
}


/**
 * Utility functions for handling IP addresses
 * Handles cases where the app is behind a proxy (x-forwarded-for)
 */

/**
 * Get the real IP address from the request
 * @param {Object} req - Express request object
 * @returns {string} The real IP address
 */
export function getRealIP(req) {
  // Check for x-forwarded-for header (when behind proxy)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0];
  }

  // Check for x-real-ip header (some proxies use this)
  if (req.headers["x-real-ip"]) {
    return req.headers["x-real-ip"];
  }

  // Check for cf-connecting-ip (Cloudflare)
  if (req.headers["cf-connecting-ip"]) {
    return req.headers["cf-connecting-ip"];
  }

  // Fallback to connection remote address
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }

  // Fallback to socket remote address
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }

  // Final fallback to request IP
  return req.ip || "unknown";
}

/**
 * Sanitize IP address (remove IPv6 prefix if present)
 * @param {string} ip - Raw IP address
 * @returns {string} Sanitized IP address
 */
export function sanitizeIP(ip) {
  if (!ip || ip === "unknown") {
    return "unknown";
  }

  // Remove IPv6 prefix if present
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
}

/**
 * Get the complete IP information for logging/debugging
 * @param {Object} req - Express request object
 * @returns {Object} IP information object
 */
export function getIPInfo(req) {
  return {
    realIP: getRealIP(req),
    sanitizedIP: sanitizeIP(getRealIP(req)),
    xForwardedFor: req.headers["x-forwarded-for"],
    xRealIP: req.headers["x-real-ip"],
    cfConnectingIP: req.headers["cf-connecting-ip"],
    connectionRemoteAddress: req.connection?.remoteAddress,
    socketRemoteAddress: req.socket?.remoteAddress,
    requestIP: req.ip,
  };
}







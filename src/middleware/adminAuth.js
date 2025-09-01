// Admin authentication middleware using session-based authentication
export const requireAdminAuth = (req, res, next) => {
  // Check if user has admin session
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  // Fallback: check admin key in header
  const adminKeyHeader = req.headers["x-admin-key"];
  if (adminKeyHeader && adminKeyHeader === process.env.ADMIN_KEY) {
    return next();
  }

  return res
    .status(401)
    .json({ message: "Unauthorized - Admin access required" });
};

// Helper function to check admin authentication
export const checkAdminAuth = (req) => {
  // Check session first
  if (req.session && req.session.isAdmin === true) {
    return true;
  }

  // Fallback: check admin key in header
  const adminKeyHeader = req.headers["x-admin-key"];
  if (adminKeyHeader && adminKeyHeader === process.env.ADMIN_KEY) {
    return true;
  }

  return false;
};

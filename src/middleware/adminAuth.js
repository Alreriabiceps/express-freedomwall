// Admin authentication middleware using session-based authentication
export const requireAdminAuth = (req, res, next) => {
  // Check if user has admin session
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res
    .status(401)
    .json({ message: "Unauthorized - Admin access required" });
};

// Helper function to check admin authentication
export const checkAdminAuth = (req) => {
  return req.session && req.session.isAdmin === true;
};

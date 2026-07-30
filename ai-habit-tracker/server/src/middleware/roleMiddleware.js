/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the allowed roles.
 *
 * @param {...string} allowedRoles - List of allowed roles (e.g. 'admin', 'user')
 */
export const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const userRole = req.user.role || (req.user.isAdmin ? "admin" : "user");

    if (allowedRoles.includes(userRole) || (allowedRoles.includes("admin") && req.user.isAdmin)) {
      return next();
    }

    return res.status(403).json({
      message: "Access Denied: You do not have permission to perform this action",
    });
  };
};

export default verifyRole;

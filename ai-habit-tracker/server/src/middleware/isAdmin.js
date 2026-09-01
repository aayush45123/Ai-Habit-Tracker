export default function isAdmin(req, res, next) {
  if (
    !req.user ||
    !(req.user.isAdmin === true || req.user.role === "admin")
  ) {
    return res.status(403).json({ message: "Access Denied: Admin Only" });
  }
  next();
}

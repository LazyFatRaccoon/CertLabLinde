module.exports = function onlySupervisors(req, res, next) {
  if (!req.user || !req.user.roles.includes("supervisor")) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

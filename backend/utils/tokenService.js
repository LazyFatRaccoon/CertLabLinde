const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

function verifyRefreshToken(token, callback) {
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, callback);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
